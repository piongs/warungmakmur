import { Router } from "express";
import { query, withTransaction } from "../_lib/db.js";

const router = Router();

// Riwayat pergerakan stok (bisa difilter per produk)
router.get("/movements", async (req, res) => {
  const { product_id, from, to } = req.query;
  const conditions = [];
  const params = [];

  if (product_id) {
    params.push(product_id);
    conditions.push(`sm.product_id = $${params.length}`);
  }
  if (from) {
    params.push(from);
    conditions.push(`sm.created_at >= $${params.length}`);
  }
  if (to) {
    params.push(to);
    conditions.push(`sm.created_at <= $${params.length}`);
  }

  const where = conditions.length ? `where ${conditions.join(" and ")}` : "";
  const { rows } = await query(
    `select sm.*, p.name as product_name, p.code as product_code, u.name as user_name
     from stock_movements sm
     join products p on p.id = sm.product_id
     left join users u on u.id = sm.user_id
     ${where}
     order by sm.created_at desc
     limit 500`,
    params
  );
  res.json(rows);
});

// Barang masuk / penyesuaian stok manual
router.post("/movements", async (req, res) => {
  const { product_id, type, qty, note } = req.body;
  if (!product_id || !type || !qty) {
    return res.status(400).json({ error: "product_id, type dan qty wajib diisi." });
  }
  if (!["IN", "ADJUSTMENT"].includes(type)) {
    return res.status(400).json({ error: "type harus IN atau ADJUSTMENT." });
  }

  try {
    const result = await withTransaction(async (client) => {
      const { rows: productRows } = await client.query(
        "select * from products where id = $1 for update",
        [product_id]
      );
      const product = productRows[0];
      if (!product) throw new HttpError(404, "Produk tidak ditemukan.");

      const delta = type === "IN" ? Math.abs(qty) : qty; // ADJUSTMENT bisa negatif
      const newStock = product.stock + delta;
      if (newStock < 0) throw new HttpError(400, "Stok tidak boleh menjadi minus.");

      await client.query("update products set stock = $1, updated_at = now() where id = $2", [
        newStock,
        product_id,
      ]);

      const { rows: movementRows } = await client.query(
        `insert into stock_movements (product_id, type, qty, stock_after, note, user_id)
         values ($1,$2,$3,$4,$5,$6) returning *`,
        [product_id, type, delta, newStock, note || null, req.user?.id || null]
      );
      return movementRows[0];
    });
    res.status(201).json(result);
  } catch (err) {
    if (err instanceof HttpError) return res.status(err.status).json({ error: err.message });
    throw err;
  }
});

class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

export default router;
