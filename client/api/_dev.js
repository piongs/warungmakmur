import app from "./_app.js";

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`POS Warung API (dev) berjalan di http://localhost:${PORT}`);
});
