import express from "express";
import cors from "cors";
import dotenv from "dotenv";

import { requireAuth } from "./_middleware/auth.js";
import authRoutes from "./_routes/auth.js";
import productRoutes from "./_routes/products.js";
import categoryRoutes from "./_routes/categories.js";
import stockRoutes from "./_routes/stock.js";
import transactionRoutes from "./_routes/transactions.js";
import reportRoutes from "./_routes/reports.js";
import userRoutes from "./_routes/users.js";
import { query } from "./_lib/db.js";

dotenv.config();

const app = express();

// Di produksi (Vercel) frontend & API satu domain jadi CORS tidak berperan,
// tapi tetap berguna saat development lokal (Vite di :5173, API di :4000).
app.use(cors({ origin: process.env.CLIENT_ORIGIN || "*" }));
app.use(express.json());

app.get("/api/health", (_req, res) => res.json({ ok: true, time: new Date().toISOString() }));

// Auth (publik)
app.use("/api/auth", authRoutes);

// Rute berikut wajib login
app.use("/api/products", requireAuth, productRoutes);
app.use("/api/categories", requireAuth, categoryRoutes);
app.use("/api/stock", requireAuth, stockRoutes);
app.use("/api/transactions", requireAuth, transactionRoutes);
app.use("/api/reports", requireAuth, reportRoutes);
app.use("/api/users", requireAuth, userRoutes);

// Nota digital publik (dibuka via QR, tidak wajib login)
app.get("/api/receipts/:invoiceNumber", async (req, res, next) => {
  try {
    const { rows } = await query(
      `select t.invoice_number, t.subtotal, t.discount, t.total, t.paid_amount,
              t.change_amount, t.status, t.created_at, u.name as cashier_name,
              pay.method as payment_method
       from transactions t
       left join users u on u.id = t.user_id
       left join payments pay on pay.transaction_id = t.id
       where t.invoice_number = $1`,
      [req.params.invoiceNumber]
    );
    const tx = rows[0];
    if (!tx) return res.status(404).json({ error: "Nota tidak ditemukan." });
    const { rows: items } = await query(
      "select product_name, price, qty, line_total from transaction_items ti join transactions t on t.id = ti.transaction_id where t.invoice_number = $1",
      [req.params.invoiceNumber]
    );
    res.json({ ...tx, items });
  } catch (err) {
    next(err);
  }
});

app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ error: "Terjadi kesalahan pada server." });
});

export default app;
