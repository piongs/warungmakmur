-- =====================================================================
-- SKEMA DATABASE - POS KASIR WARUNG
-- Target: Neon Postgres (serverless Postgres)
-- Jalankan file ini sekali di Neon SQL Editor atau via psql:
--   psql "$DATABASE_URL" -f schema.sql
-- =====================================================================

create extension if not exists "pgcrypto"; -- untuk gen_random_uuid()

-- ---------------------------------------------------------------------
-- USERS (Admin/Kasir, Owner opsional)
-- ---------------------------------------------------------------------
create table if not exists users (
  id            uuid primary key default gen_random_uuid(),
  name          text not null,
  email         text not null unique,
  password_hash text,                 -- null jika login via Google saja
  google_id     text unique,
  role          text not null default 'kasir' check (role in ('admin','kasir','owner')),
  is_active     boolean not null default true,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- CATEGORIES
-- ---------------------------------------------------------------------
create table if not exists categories (
  id          uuid primary key default gen_random_uuid(),
  name        text not null unique,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- PRODUCTS  (tanpa kolom gambar, sesuai panduan)
-- ---------------------------------------------------------------------
create table if not exists products (
  id              uuid primary key default gen_random_uuid(),
  code            text not null unique,          -- SKU / kode barang
  name            text not null,
  category_id     uuid references categories(id) on delete set null,
  selling_price   numeric(12,2) not null check (selling_price >= 0),
  cost_price      numeric(12,2) not null default 0 check (cost_price >= 0),
  stock           integer not null default 0,
  minimum_stock   integer not null default 5,
  unit            text not null default 'pcs',
  is_active       boolean not null default true,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index if not exists idx_products_category on products(category_id);
create index if not exists idx_products_active on products(is_active);
create index if not exists idx_products_name on products using gin (to_tsvector('simple', name));

-- ---------------------------------------------------------------------
-- TRANSACTIONS
-- ---------------------------------------------------------------------
create table if not exists transactions (
  id                uuid primary key default gen_random_uuid(),
  invoice_number    text not null unique,          -- INV-20260904-0001
  user_id           uuid references users(id),
  subtotal          numeric(12,2) not null default 0,
  discount          numeric(12,2) not null default 0,
  total             numeric(12,2) not null default 0,
  paid_amount       numeric(12,2) not null default 0,
  change_amount     numeric(12,2) not null default 0,
  status            text not null default 'PENDING'
                      check (status in ('PENDING','PAID','CANCELLED','REFUNDED')),
  note              text,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

create index if not exists idx_tx_created on transactions(created_at);
create index if not exists idx_tx_status on transactions(status);
create index if not exists idx_tx_invoice on transactions(invoice_number);

-- ---------------------------------------------------------------------
-- TRANSACTION ITEMS  (snapshot harga & nama saat transaksi)
-- ---------------------------------------------------------------------
create table if not exists transaction_items (
  id                uuid primary key default gen_random_uuid(),
  transaction_id    uuid not null references transactions(id) on delete cascade,
  product_id        uuid references products(id),
  product_name      text not null,     -- snapshot
  product_code      text not null,     -- snapshot
  price             numeric(12,2) not null,  -- snapshot harga jual saat itu
  qty               integer not null check (qty > 0),
  line_total        numeric(12,2) not null,
  created_at        timestamptz not null default now()
);

create index if not exists idx_tx_items_tx on transaction_items(transaction_id);
create index if not exists idx_tx_items_product on transaction_items(product_id);

-- ---------------------------------------------------------------------
-- PAYMENTS
-- ---------------------------------------------------------------------
create table if not exists payments (
  id                uuid primary key default gen_random_uuid(),
  transaction_id    uuid not null references transactions(id) on delete cascade,
  method            text not null check (method in ('TUNAI','QRIS')),
  amount            numeric(12,2) not null,
  reference_no      text,              -- referensi dari provider QRIS jika ada
  status            text not null default 'PAID'
                      check (status in ('PENDING','PAID','FAILED')),
  paid_at           timestamptz not null default now()
);

create index if not exists idx_payments_tx on payments(transaction_id);

-- ---------------------------------------------------------------------
-- STOCK MOVEMENTS (masuk, keluar transaksi, penyesuaian)
-- ---------------------------------------------------------------------
create table if not exists stock_movements (
  id            uuid primary key default gen_random_uuid(),
  product_id    uuid not null references products(id) on delete cascade,
  type          text not null check (type in ('IN','OUT_SALE','ADJUSTMENT')),
  qty           integer not null,          -- positif = masuk, negatif = keluar
  stock_after   integer not null,
  reference_id  uuid,                      -- transaction_id jika OUT_SALE
  note          text,
  user_id       uuid references users(id),
  created_at    timestamptz not null default now()
);

create index if not exists idx_stock_mov_product on stock_movements(product_id);
create index if not exists idx_stock_mov_created on stock_movements(created_at);

-- ---------------------------------------------------------------------
-- ACTIVITY LOGS
-- ---------------------------------------------------------------------
create table if not exists activity_logs (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid references users(id),
  action      text not null,        -- ex: 'CREATE_PRODUCT', 'CHECKOUT'
  entity      text,                 -- ex: 'product', 'transaction'
  entity_id   uuid,
  detail      jsonb,
  created_at  timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- SEED DATA DASAR (kategori & user admin contoh)
-- Ganti password dengan hash bcrypt asli sebelum dipakai produksi.
-- ---------------------------------------------------------------------
insert into categories (name) values
  ('Minuman'), ('Makanan'), ('Gorengan'), ('Sembako'), ('Rokok'), ('Lainnya')
on conflict (name) do nothing;

-- =====================================================================
-- Selesai. Lanjutkan dengan membuat user admin pertama lewat endpoint
-- POST /api/auth/register (server akan meng-hash password otomatis).
-- =====================================================================
