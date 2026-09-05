import { Router } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { OAuth2Client } from "google-auth-library";
import { query } from "../_lib/db.js";

const router = Router();
const googleClient = process.env.GOOGLE_CLIENT_ID
  ? new OAuth2Client(process.env.GOOGLE_CLIENT_ID)
  : null;

function signToken(user) {
  return jwt.sign(
    { id: user.id, name: user.name, email: user.email, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: "12h" }
  );
}

function publicUser(user) {
  const { password_hash, google_id, ...rest } = user;
  return rest;
}

// Daftar user pertama (dipakai sekali untuk membuat akun admin).
router.post("/register", async (req, res) => {
  const { name, email, password, role = "admin" } = req.body;
  if (!name || !email || !password) {
    return res.status(400).json({ error: "Nama, email dan password wajib diisi." });
  }
  const existing = await query("select id from users where email = $1", [email]);
  if (existing.rows.length > 0) {
    return res.status(409).json({ error: "Email sudah terdaftar." });
  }
  const hash = await bcrypt.hash(password, 10);
  const { rows } = await query(
    `insert into users (name, email, password_hash, role)
     values ($1, $2, $3, $4) returning *`,
    [name, email, hash, role]
  );
  const user = rows[0];
  res.status(201).json({ token: signToken(user), user: publicUser(user) });
});

// Login email/password
router.post("/login", async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: "Email dan password wajib diisi." });
  }
  const { rows } = await query("select * from users where email = $1 and is_active = true", [
    email,
  ]);
  const user = rows[0];
  if (!user || !user.password_hash) {
    return res.status(401).json({ error: "Email atau password salah." });
  }
  const valid = await bcrypt.compare(password, user.password_hash);
  if (!valid) {
    return res.status(401).json({ error: "Email atau password salah." });
  }
  res.json({ token: signToken(user), user: publicUser(user) });
});

// Login Google OAuth (frontend mengirim id_token dari Google Sign-In)
router.post("/google", async (req, res) => {
  if (!googleClient) {
    return res
      .status(400)
      .json({ error: "Login Google belum dikonfigurasi. Set GOOGLE_CLIENT_ID di server." });
  }
  const { id_token } = req.body;
  if (!id_token) {
    return res.status(400).json({ error: "id_token wajib dikirim." });
  }
  try {
    const ticket = await googleClient.verifyIdToken({
      idToken: id_token,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    const payload = ticket.getPayload();
    const { sub: googleId, email, name } = payload;

    let { rows } = await query("select * from users where google_id = $1 or email = $2", [
      googleId,
      email,
    ]);
    let user = rows[0];

    if (!user) {
      const inserted = await query(
        `insert into users (name, email, google_id, role)
         values ($1, $2, $3, 'kasir') returning *`,
        [name, email, googleId]
      );
      user = inserted.rows[0];
    } else if (!user.google_id) {
      const updated = await query(
        "update users set google_id = $1, updated_at = now() where id = $2 returning *",
        [googleId, user.id]
      );
      user = updated.rows[0];
    }

    res.json({ token: signToken(user), user: publicUser(user) });
  } catch (err) {
    console.error(err);
    res.status(401).json({ error: "Verifikasi Google gagal." });
  }
});

export default router;
