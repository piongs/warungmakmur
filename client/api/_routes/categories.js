import { Router } from "express";
import { query } from "../_lib/db.js";

const router = Router();

router.get("/", async (_req, res) => {
  const { rows } = await query(
    `select c.*, count(p.id)::int as product_count
     from categories c
     left join products p on p.category_id = c.id
     group by c.id
     order by c.name asc`
  );
  res.json(rows);
});

router.post("/", async (req, res) => {
  const { name } = req.body;
  if (!name?.trim()) return res.status(400).json({ error: "Nama kategori wajib diisi." });
  try {
    const { rows } = await query(
      "insert into categories (name) values ($1) returning *",
      [name.trim()]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    if (err.code === "23505") return res.status(409).json({ error: "Kategori sudah ada." });
    throw err;
  }
});

router.put("/:id", async (req, res) => {
  const { name } = req.body;
  const { rows } = await query(
    "update categories set name = $1, updated_at = now() where id = $2 returning *",
    [name, req.params.id]
  );
  if (!rows[0]) return res.status(404).json({ error: "Kategori tidak ditemukan." });
  res.json(rows[0]);
});

router.delete("/:id", async (req, res) => {
  await query("delete from categories where id = $1", [req.params.id]);
  res.status(204).end();
});

export default router;
