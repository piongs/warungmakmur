import { Router } from "express";
import bcrypt from "bcryptjs";
import { query } from "../_lib/db.js";

const router = Router();

router.get("/", async (_req, res) => {
  const { rows } = await query(
    "select id, name, email, role, is_active, created_at from users order by created_at asc"
  );
  res.json(rows);
});

router.get("/me", async (req, res) => {
  const { rows } = await query(
    "select id, name, email, role from users where id = $1",
    [req.user.id]
  );
  res.json(rows[0]);
});

router.post("/", async (req, res) => {
  const { name, email, password, role = "kasir" } = req.body;
  if (!name || !email || !password) {
    return res.status(400).json({ error: "Nama, email dan password wajib diisi." });
  }
  try {
    const hash = await bcrypt.hash(password, 10);
    const { rows } = await query(
      `insert into users (name, email, password_hash, role)
       values ($1,$2,$3,$4) returning id, name, email, role, is_active, created_at`,
      [name, email, hash, role]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    if (err.code === "23505") return res.status(409).json({ error: "Email sudah dipakai." });
    throw err;
  }
});

router.put("/:id", async (req, res) => {
  const { name, role, is_active } = req.body;
  const { rows } = await query(
    `update users set
       name = coalesce($1, name),
       role = coalesce($2, role),
       is_active = coalesce($3, is_active),
       updated_at = now()
     where id = $4
     returning id, name, email, role, is_active`,
    [name, role, is_active, req.params.id]
  );
  if (!rows[0]) return res.status(404).json({ error: "User tidak ditemukan." });
  res.json(rows[0]);
});

export default router;
