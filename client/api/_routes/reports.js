import { Router } from "express";
import { query } from "../_lib/db.js";

const router = Router();

// ---------------------------------------------------------------------
// DASHBOARD
// ---------------------------------------------------------------------
router.get("/dashboard", async (_req, res) => {
  const todayStats = await query(
    `select
       coalesce(sum(total),0)::float as omzet_hari_ini,
       count(*)::int as transaksi_hari_ini
     from transactions
     where status = 'PAID' and created_at >= current_date`
  );

  const itemsToday = await query(
    `select coalesce(sum(ti.qty),0)::int as produk_terjual
     from transaction_items ti
     join transactions t on t.id = ti.transaction_id
     where t.status = 'PAID' and t.created_at >= current_date`
  );

  const avgTx = await query(
    `select coalesce(avg(total),0)::float as rata_rata
     from transactions where status = 'PAID' and created_at >= current_date`
  );

  const revenueTrend = await query(
    `select to_char(d.day, 'YYYY-MM-DD') as date,
            coalesce(sum(t.total),0)::float as omzet
     from generate_series(current_date - interval '6 day', current_date, interval '1 day') d(day)
     left join transactions t on t.created_at::date = d.day and t.status = 'PAID'
     group by d.day order by d.day`
  );

  const topProducts = await query(
    `select ti.product_name, sum(ti.qty)::int as qty, sum(ti.line_total)::float as omzet
     from transaction_items ti
     join transactions t on t.id = ti.transaction_id
     where t.status = 'PAID' and t.created_at >= current_date - interval '6 day'
     group by ti.product_name
     order by qty desc
     limit 5`
  );

  const lowStock = await query(
    `select id, code, name, stock, minimum_stock from products
     where is_active = true and stock <= minimum_stock
     order by stock asc limit 10`
  );

  res.json({
    omzet_hari_ini: todayStats.rows[0].omzet_hari_ini,
    transaksi_hari_ini: todayStats.rows[0].transaksi_hari_ini,
    produk_terjual_hari_ini: itemsToday.rows[0].produk_terjual,
    rata_rata_transaksi: avgTx.rows[0].rata_rata,
    revenue_trend: revenueTrend.rows,
    top_products: topProducts.rows,
    low_stock: lowStock.rows,
  });
});

// ---------------------------------------------------------------------
// LAPORAN PENJUALAN
// ---------------------------------------------------------------------
router.get("/sales", async (req, res) => {
  const { from, to } = dateRange(req);
  const summary = await query(
    `select count(*)::int as jumlah_transaksi,
            coalesce(sum(subtotal),0)::float as subtotal,
            coalesce(sum(discount),0)::float as diskon,
            coalesce(sum(total),0)::float as total_bersih
     from transactions
     where status = 'PAID' and created_at between $1 and $2`,
    [from, to]
  );

  const byDay = await query(
    `select to_char(created_at,'YYYY-MM-DD') as tanggal,
            count(*)::int as jumlah_transaksi,
            coalesce(sum(total),0)::float as omzet
     from transactions
     where status = 'PAID' and created_at between $1 and $2
     group by 1 order by 1`,
    [from, to]
  );

  const byHour = await query(
    `select extract(hour from created_at)::int as jam,
            count(*)::int as jumlah_transaksi,
            coalesce(sum(total),0)::float as omzet
     from transactions
     where status = 'PAID' and created_at between $1 and $2
     group by 1 order by 1`,
    [from, to]
  );

  res.json({ summary: summary.rows[0], by_day: byDay.rows, by_hour: byHour.rows });
});

// ---------------------------------------------------------------------
// LAPORAN PRODUK
// ---------------------------------------------------------------------
router.get("/products", async (req, res) => {
  const { from, to } = dateRange(req);
  const { rows } = await query(
    `select ti.product_code, ti.product_name,
            sum(ti.qty)::int as qty_terjual,
            sum(ti.line_total)::float as omzet
     from transaction_items ti
     join transactions t on t.id = ti.transaction_id
     where t.status = 'PAID' and t.created_at between $1 and $2
     group by ti.product_code, ti.product_name
     order by qty_terjual desc`,
    [from, to]
  );
  res.json(rows);
});

// ---------------------------------------------------------------------
// LAPORAN STOK
// ---------------------------------------------------------------------
router.get("/stock", async (req, res) => {
  const { from, to } = dateRange(req);
  const current = await query(
    `select id, code, name, stock, minimum_stock from products
     where is_active = true order by name asc`
  );
  const movements = await query(
    `select
       p.code, p.name,
       coalesce(sum(sm.qty) filter (where sm.type = 'IN'),0)::int as masuk,
       coalesce(abs(sum(sm.qty) filter (where sm.type = 'OUT_SALE')),0)::int as keluar,
       coalesce(sum(sm.qty) filter (where sm.type = 'ADJUSTMENT'),0)::int as penyesuaian
     from products p
     left join stock_movements sm on sm.product_id = p.id and sm.created_at between $1 and $2
     where p.is_active = true
     group by p.code, p.name
     order by p.name asc`,
    [from, to]
  );
  res.json({ current: current.rows, movements: movements.rows });
});

// ---------------------------------------------------------------------
// LAPORAN METODE PEMBAYARAN
// ---------------------------------------------------------------------
router.get("/payments", async (req, res) => {
  const { from, to } = dateRange(req);
  const { rows } = await query(
    `select pay.method,
            count(*)::int as jumlah_transaksi,
            coalesce(sum(pay.amount),0)::float as total
     from payments pay
     join transactions t on t.id = pay.transaction_id
     where t.status = 'PAID' and t.created_at between $1 and $2
     group by pay.method`,
    [from, to]
  );
  res.json(rows);
});

function dateRange(req) {
  const now = new Date();
  const from = req.query.from ? new Date(req.query.from) : new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const to = req.query.to ? new Date(req.query.to) : now;
  // pastikan 'to' mencakup keseluruhan hari
  to.setHours(23, 59, 59, 999);
  return { from: from.toISOString(), to: to.toISOString() };
}

export default router;
