import { Router } from "express";
import { query } from "../_lib/db.js";

const router = Router();

// GET /api/products?search=&category_id=&active=&low_stock=
router.get("/", async (req, res) => {
  const { search, category_id, active, low_stock } = req.query;
  const conditions = [];
  const params = [];

  if (search) {
    params.push(`%${search}%`);
    conditions.push(`(p.name ilike $${params.length} or p.code ilike $${params.length})`);
  }
  if (category_id) {
    params.push(category_id);
    conditions.push(`p.category_id = $${params.length}`);
  }
  if (active !== undefined) {
    params.push(active === "true");
    conditions.push(`p.is_active = $${params.length}`);
  }
  if (low_stock === "true") {
    conditions.push(`p.stock <= p.minimum_stock`);
  }

  const where = conditions.length ? `where ${conditions.join(" and ")}` : "";
  const { rows } = await query(
    `select p.*, c.name as category_name
     from products p
     left join categories c on c.id = p.category_id
     ${where}
     order by p.name asc`,
    params
  );
  res.json(rows);
});

router.get("/:id", async (req, res) => {
  const { rows } = await query(
    `select p.*, c.name as category_name from products p
     left join categories c on c.id = p.category_id
     where p.id = $1`,
    [req.params.id]
  );
  if (!rows[0]) return res.status(404).json({ error: "Produk tidak ditemukan." });
  res.json(rows[0]);
});

router.post("/", async (req, res) => {
  const {
    code,
    name,
    category_id,
    selling_price,
    cost_price = 0,
    stock = 0,
    minimum_stock = 5,
    unit = "pcs",
  } = req.body;

  if (!code?.trim() || !name?.trim() || selling_price === undefined) {
    return res.status(400).json({ error: "Kode, nama dan harga jual wajib diisi." });
  }

  try {
    const { rows } = await query(
      `insert into products (code, name, category_id, selling_price, cost_price, stock, minimum_stock, unit)
       values ($1,$2,$3,$4,$5,$6,$7,$8) returning *`,
      [code.trim(), name.trim(), category_id || null, selling_price, cost_price, stock, minimum_stock, unit]
    );

    if (stock > 0) {
      await query(
        `insert into stock_movements (product_id, type, qty, stock_after, note)
         values ($1, 'IN', $2, $2, 'Stok awal produk baru')`,
        [rows[0].id, stock]
      );
    }

    res.status(201).json(rows[0]);
  } catch (err) {
    if (err.code === "23505") return res.status(409).json({ error: "Kode produk sudah dipakai." });
    throw err;
  }
});

router.put("/:id", async (req, res) => {
  const { code, name, category_id, selling_price, cost_price, minimum_stock, unit, is_active } =
    req.body;
  const { rows } = await query(
    `update products set
       code = coalesce($1, code),
       name = coalesce($2, name),
       category_id = $3,
       selling_price = coalesce($4, selling_price),
       cost_price = coalesce($5, cost_price),
       minimum_stock = coalesce($6, minimum_stock),
       unit = coalesce($7, unit),
       is_active = coalesce($8, is_active),
       updated_at = now()
     where id = $9
     returning *`,
    [code, name, category_id || null, selling_price, cost_price, minimum_stock, unit, is_active, req.params.id]
  );
  if (!rows[0]) return res.status(404).json({ error: "Produk tidak ditemukan." });
  res.json(rows[0]);
});

router.delete("/:id", async (req, res) => {
  await query("update products set is_active = false, updated_at = now() where id = $1", [
    req.params.id,
  ]);
  res.status(204).end();
});

export default router;
