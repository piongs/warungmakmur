import { Router } from "express";
import { query, withTransaction } from "../_lib/db.js";
import { generateInvoiceNumber } from "../_lib/invoice.js";

const router = Router();

class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

// GET /api/transactions?from=&to=&status=&search=
router.get("/", async (req, res) => {
  const { from, to, status, search } = req.query;
  const conditions = [];
  const params = [];

  if (from) {
    params.push(from);
    conditions.push(`t.created_at >= $${params.length}`);
  }
  if (to) {
    params.push(to);
    conditions.push(`t.created_at <= $${params.length}`);
  }
  if (status) {
    params.push(status);
    conditions.push(`t.status = $${params.length}`);
  }
  if (search) {
    params.push(`%${search}%`);
    conditions.push(`t.invoice_number ilike $${params.length}`);
  }

  const where = conditions.length ? `where ${conditions.join(" and ")}` : "";
  const { rows } = await query(
    `select t.*, u.name as cashier_name
     from transactions t
     left join users u on u.id = t.user_id
     ${where}
     order by t.created_at desc
     limit 300`,
    params
  );
  res.json(rows);
});

router.get("/:id", async (req, res) => {
  const { rows: txRows } = await query(
    `select t.*, u.name as cashier_name from transactions t
     left join users u on u.id = t.user_id where t.id = $1`,
    [req.params.id]
  );
  const tx = txRows[0];
  if (!tx) return res.status(404).json({ error: "Transaksi tidak ditemukan." });

  const { rows: items } = await query(
    "select * from transaction_items where transaction_id = $1 order by created_at asc",
    [req.params.id]
  );
  const { rows: payments } = await query(
    "select * from payments where transaction_id = $1", [req.params.id]
  );

  res.json({ ...tx, items, payments });
});

router.get("/invoice/:invoiceNumber", async (req, res) => {
  const { rows: txRows } = await query(
    `select t.*, u.name as cashier_name from transactions t
     left join users u on u.id = t.user_id where t.invoice_number = $1`,
    [req.params.invoiceNumber]
  );
  const tx = txRows[0];
  if (!tx) return res.status(404).json({ error: "Nota tidak ditemukan." });

  const { rows: items } = await query(
    "select * from transaction_items where transaction_id = $1 order by created_at asc",
    [tx.id]
  );
  res.json({ ...tx, items });
});

/**
 * POST /api/transactions/checkout
 * body: { items: [{ product_id, qty }], discount, payment: { method, amount } }
 *
 * Semua perhitungan total, validasi harga & stok dilakukan di server -
 * client tidak dipercaya untuk mengirim harga atau total.
 */
router.post("/checkout", async (req, res) => {
  const { items, discount = 0, payment } = req.body;

  if (!Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: "Keranjang tidak boleh kosong." });
  }
  if (!payment?.method || !["TUNAI", "QRIS"].includes(payment.method)) {
    return res.status(400).json({ error: "Metode pembayaran tidak valid." });
  }

  try {
    const result = await withTransaction(async (client) => {
      let subtotal = 0;
      const lineItems = [];

      for (const item of items) {
        if (!item.product_id || !item.qty || item.qty <= 0) {
          throw new HttpError(400, "Data item keranjang tidak valid.");
        }
        const { rows } = await client.query(
          "select * from products where id = $1 and is_active = true for update",
          [item.product_id]
        );
        const product = rows[0];
        if (!product) throw new HttpError(400, `Produk tidak ditemukan atau nonaktif.`);
        if (product.stock < item.qty) {
          throw new HttpError(400, `Stok ${product.name} tidak cukup (sisa ${product.stock}).`);
        }

        const lineTotal = Number(product.selling_price) * item.qty;
        subtotal += lineTotal;
        lineItems.push({
          product,
          qty: item.qty,
          price: Number(product.selling_price),
          lineTotal,
        });
      }

      const safeDiscount = Math.min(Math.max(Number(discount) || 0, 0), subtotal);
      const total = subtotal - safeDiscount;
      const paidAmount = Number(payment.amount) || 0;

      if (payment.method === "TUNAI" && paidAmount < total) {
        throw new HttpError(400, "Uang bayar kurang dari total.");
      }
      const changeAmount = payment.method === "TUNAI" ? paidAmount - total : 0;

      const invoiceNumber = await generateInvoiceNumber(client);

      const { rows: txRows } = await client.query(
        `insert into transactions
           (invoice_number, user_id, subtotal, discount, total, paid_amount, change_amount, status)
         values ($1,$2,$3,$4,$5,$6,$7,'PAID')
         returning *`,
        [
          invoiceNumber,
          req.user?.id || null,
          subtotal,
          safeDiscount,
          total,
          payment.method === "TUNAI" ? paidAmount : total,
          changeAmount,
        ]
      );
      const tx = txRows[0];

      for (const li of lineItems) {
        await client.query(
          `insert into transaction_items
             (transaction_id, product_id, product_name, product_code, price, qty, line_total)
           values ($1,$2,$3,$4,$5,$6,$7)`,
          [tx.id, li.product.id, li.product.name, li.product.code, li.price, li.qty, li.lineTotal]
        );

        const newStock = li.product.stock - li.qty;
        await client.query("update products set stock = $1, updated_at = now() where id = $2", [
          newStock,
          li.product.id,
        ]);

        await client.query(
          `insert into stock_movements (product_id, type, qty, stock_after, reference_id, user_id, note)
           values ($1,'OUT_SALE',$2,$3,$4,$5,$6)`,
          [li.product.id, -li.qty, newStock, tx.id, req.user?.id || null, `Penjualan ${invoiceNumber}`]
        );
      }

      await client.query(
        `insert into payments (transaction_id, method, amount, status)
         values ($1,$2,$3,'PAID')`,
        [tx.id, payment.method, payment.method === "TUNAI" ? paidAmount : total]
      );

      return { ...tx, items: lineItems.map((li) => ({
        product_id: li.product.id,
        product_name: li.product.name,
        product_code: li.product.code,
        price: li.price,
        qty: li.qty,
        line_total: li.lineTotal,
      })) };
    });

    res.status(201).json(result);
  } catch (err) {
    if (err instanceof HttpError) return res.status(err.status).json({ error: err.message });
    console.error(err);
    res.status(500).json({ error: "Checkout gagal, silakan coba lagi." });
  }
});

router.post("/:id/cancel", async (req, res) => {
  try {
    const result = await withTransaction(async (client) => {
      const { rows } = await client.query("select * from transactions where id = $1 for update", [
        req.params.id,
      ]);
      const tx = rows[0];
      if (!tx) throw new HttpError(404, "Transaksi tidak ditemukan.");
      if (tx.status !== "PAID") throw new HttpError(400, "Hanya transaksi PAID yang bisa dibatalkan.");

      const { rows: items } = await client.query(
        "select * from transaction_items where transaction_id = $1",
        [tx.id]
      );

      for (const item of items) {
        if (!item.product_id) continue;
        const { rows: prodRows } = await client.query(
          "select * from products where id = $1 for update",
          [item.product_id]
        );
        const product = prodRows[0];
        if (!product) continue;
        const newStock = product.stock + item.qty;
        await client.query("update products set stock = $1, updated_at = now() where id = $2", [
          newStock,
          product.id,
        ]);
        await client.query(
          `insert into stock_movements (product_id, type, qty, stock_after, reference_id, note)
           values ($1,'ADJUSTMENT',$2,$3,$4,$5)`,
          [product.id, item.qty, newStock, tx.id, `Pembatalan ${tx.invoice_number}`]
        );
      }

      const { rows: updated } = await client.query(
        "update transactions set status = 'CANCELLED', updated_at = now() where id = $1 returning *",
        [tx.id]
      );
      return updated[0];
    });
    res.json(result);
  } catch (err) {
    if (err instanceof HttpError) return res.status(err.status).json({ error: err.message });
    throw err;
  }
});

export default router;
