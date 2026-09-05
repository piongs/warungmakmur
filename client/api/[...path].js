import app from "./_app.js";

// Vercel memanggil fungsi ini untuk setiap request ke /api/*.
// Express app sudah tahu cara routing dirinya sendiri berdasarkan req.url,
// jadi cukup diteruskan langsung.
export default function handler(req, res) {
  return app(req, res);
}
