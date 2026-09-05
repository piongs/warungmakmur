# POS Kasir Warung — React + Neon PostgreSQL (all-in-one Vercel)

Aplikasi kasir untuk warung: pilih barang → total & kembalian otomatis → stok
berkurang → nota digital dengan QR → laporan penjualan/produk/stok dengan
export PDF & Excel.

**Arsitektur:** frontend React (Vite) dan backend (Express, dijalankan sebagai
Vercel Serverless Function) di-deploy jadi **satu project Vercel** — tidak
perlu hosting backend terpisah, tidak perlu kartu kredit, tidak perlu setting
CORS/URL API karena satu domain.

## Struktur proyek

```
pos-warung/
├── schema.sql            # Skema database, jalankan ini di Neon
├── seed_products.sql     # 100+ produk contoh warung (opsional, untuk demo)
└── client/                # Satu-satunya project yang di-deploy ke Vercel
    ├── vercel.json         # Rewrite SPA (biar /api/* tidak ketimpa)
    ├── api/                # Backend — jadi Vercel Serverless Functions
    │   ├── index.js          # Entry point produksi (dipanggil Vercel utk semua /api/*)
    │   ├── _dev.js            # Entry point utk development lokal (npm run api:dev)
    │   ├── _app.js            # Express app (semua route dipasang di sini)
    │   ├── _lib/              # db.js (koneksi Neon), invoice.js (nomor nota)
    │   ├── _middleware/       # auth.js (JWT)
    │   └── _routes/           # auth, products, categories, stock, transactions, reports, users
    └── src/                # Frontend React
        ├── pages/            # Login, Dashboard, POS, Products, Categories, Stock,
        │                     # Transactions, TransactionDetail, Receipt, Reports*, Settings
        ├── components/       # AppLayout, Sidebar, Topbar, komponen UI kecil
        ├── context/          # AuthContext (JWT di localStorage)
        └── utils/            # format.js (rupiah/tanggal), export.js (PDF/Excel)
```

> File/folder berawalan underscore (`_app.js`, `_lib/`, dst) di dalam `api/`
> sengaja diberi nama begitu — konvensi Vercel: file berawalan `_` tidak
> dianggap sebagai route publik, hanya `index.js` yang jadi endpoint API.

## 1. Menyiapkan database Neon

1. Buat project di [neon.tech](https://neon.tech) (gratis, tanpa kartu).
2. Di dashboard Neon, klik **Connect** → salin **connection string** (yang
   mengandung `-pooler` di hostname).
3. Buka **SQL Editor** di Neon, tempel isi `schema.sql`, klik **Run**.
4. (Opsional, biar ada data contoh) Tempel isi `seed_products.sql`, **Run**
   lagi — otomatis menambahkan 100+ produk warung siap pakai.

## 2. Development di lokal

Karena backend sekarang tinggal file-file di `client/api/`, jalankan dua
proses di dua terminal terpisah (dari dalam folder `client/`):

```bash
cd client
npm install
cp .env.example .env
# isi DATABASE_URL dan JWT_SECRET di .env

# Terminal 1 — backend
npm run api:dev
# → jalan di http://localhost:4000

# Terminal 2 — frontend
npm run dev
# → jalan di http://localhost:5173, otomatis proxy /api ke :4000
```

Buka `http://localhost:5173`, klik **"Daftar admin"** di halaman login untuk
membuat akun admin pertama.

## 3. Deploy ke Vercel

1. Push project ini ke GitHub (folder `client/` sebagai isi repo, atau repo
   berisi folder `client/` + `schema.sql` seperti struktur di atas).
2. Di [vercel.com](https://vercel.com), **New Project** → import repo GitHub kamu.
3. **Root Directory**: set ke `client` (Settings → Build and Deployment →
   Root Directory → Edit → ketik `client` → Save).
4. **Environment Variables** (Settings → Environment Variables), tambahkan:
   | Key | Value |
   |---|---|
   | `DATABASE_URL` | connection string dari Neon |
   | `JWT_SECRET` | string acak panjang, mis. hasil `openssl rand -hex 32` |
   | `GOOGLE_CLIENT_ID` | (opsional, untuk Login Google) |

   Catatan: variabel ini **tidak** perlu prefix `VITE_` karena hanya dipakai
   oleh serverless function di `api/`, bukan dibundel ke kode frontend.
5. Klik **Deploy**. Selesai — satu domain Vercel menyajikan frontend *dan* API.
6. Buka `https://nama-project-kamu.vercel.app`, klik "Daftar admin" untuk
   membuat akun pertama.

## 4. Login Google (opsional)

1. Buat OAuth Client ID di [Google Cloud Console](https://console.cloud.google.com/apis/credentials)
   (tipe **Web application**).
2. Di **Authorized JavaScript origins**, tambahkan:
   - `http://localhost:5173` (untuk development)
   - `https://nama-project-kamu.vercel.app` (domain produksi)
3. Isi `GOOGLE_CLIENT_ID` di Environment Variables Vercel (langkah 3.4 di atas)
   dan di `client/.env` untuk lokal.
4. Di `client/src/pages/Login.jsx`, ganti tombol "Lanjutkan dengan Google"
   agar memuat Google Identity Services (`accounts.google.com/gsi/client`)
   dan memanggil `loginWithGoogleToken(id_token)` dari `AuthContext` saat
   callback `credential` diterima. Backend (`/api/auth/google`) sudah siap
   menerima `id_token` dan membuat/mencocokkan user secara otomatis.

## 5. QRIS asli (opsional, untuk produksi)

QR pada nota digital **bukan** QRIS — itu hanya tautan ke
`/receipt/:invoiceNumber` agar pelanggan bisa membuka nota. Untuk menerima
pembayaran QRIS sungguhan, daftar ke PJP/provider resmi (Midtrans, Xendit,
dll), lalu simpan `reference_no` dari callback provider ke tabel `payments`.

## 6. Alur inti yang sudah diimplementasikan

- **Checkout server-side**: harga, stok, dan total dihitung ulang di server
  (bukan dipercaya dari client), dibungkus dalam satu database transaction
  (`api/_routes/transactions.js`) — mencegah stok minus atau harga
  dimanipulasi dari browser.
- **Nomor invoice otomatis**: format `INV-YYYYMMDD-XXXX`, di-lock per hari
  agar tidak bentrok saat dua kasir checkout bersamaan (`_lib/invoice.js`).
- **Snapshot harga**: `transaction_items` menyimpan nama & harga saat itu.
- **Stok otomatis**: checkout membuat baris `stock_movements` tipe
  `OUT_SALE`; barang masuk/penyesuaian tercatat sebagai `IN`/`ADJUSTMENT`.
- **Nota digital + QR**: halaman `/receipt/:invoiceNumber` bisa dibuka publik
  (tanpa login) dan dicetak (`window.print()`).
- **Laporan**: penjualan per hari & jam, produk terlaris, rekap stok, dengan
  export ke PDF (`jspdf`) dan Excel (`xlsx`), filter periode.

## 7. Kustomisasi identitas warung

Ganti nama toko & alamat di `client/src/pages/Receipt.jsx` (header nota) dan
di `client/src/components/Sidebar.jsx` / `Login.jsx` (nama brand).
