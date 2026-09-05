import { useEffect, useState } from "react";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import AppLayout from "../components/AppLayout";
import { StatCard, Loading, EmptyState } from "../components/ui";
import api from "../api/client";
import { formatRupiah } from "../utils/format";
import { Link } from "react-router-dom";

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get("/reports/dashboard")
      .then((res) => setData(res.data))
      .finally(() => setLoading(false));
  }, []);

  const trend = (data?.revenue_trend || []).map((d) => ({
    ...d,
    label: new Date(d.date).toLocaleDateString("id-ID", { weekday: "short" }),
  }));

  return (
    <AppLayout title="Dashboard" subtitle="Ringkasan aktivitas warung hari ini">
      {loading ? (
        <Loading />
      ) : (
        <div className="space-y-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard label="Omzet hari ini" value={formatRupiah(data.omzet_hari_ini)} />
            <StatCard label="Transaksi hari ini" value={data.transaksi_hari_ini} />
            <StatCard label="Produk terjual" value={data.produk_terjual_hari_ini} />
            <StatCard label="Rata-rata transaksi" value={formatRupiah(data.rata_rata_transaksi)} />
          </div>

          <div className="grid lg:grid-cols-3 gap-4">
            <div className="card p-5 lg:col-span-2">
              <p className="font-semibold mb-1">Omzet 7 hari terakhir</p>
              <p className="text-sm text-muted mb-4">Total penjualan lunas per hari</p>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={trend} margin={{ left: -12, right: 8 }}>
                    <defs>
                      <linearGradient id="omzet" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#C2410C" stopOpacity={0.25} />
                        <stop offset="100%" stopColor="#C2410C" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid vertical={false} stroke="#E7E5E4" />
                    <XAxis dataKey="label" tick={{ fontSize: 12, fill: "#78716C" }} axisLine={false} tickLine={false} />
                    <YAxis
                      tick={{ fontSize: 11, fill: "#78716C" }}
                      axisLine={false}
                      tickLine={false}
                      width={54}
                      tickFormatter={(v) => (v >= 1000 ? `${Math.round(v / 1000)}rb` : v)}
                    />
                    <Tooltip
                      formatter={(v) => formatRupiah(v)}
                      contentStyle={{ borderRadius: 12, borderColor: "#E7E5E4", fontSize: 13 }}
                    />
                    <Area type="monotone" dataKey="omzet" stroke="#C2410C" strokeWidth={2.5} fill="url(#omzet)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="card p-5">
              <p className="font-semibold mb-1">Produk terlaris</p>
              <p className="text-sm text-muted mb-4">7 hari terakhir</p>
              {data.top_products.length === 0 ? (
                <p className="text-sm text-muted">Belum ada penjualan.</p>
              ) : (
                <ul className="space-y-3">
                  {data.top_products.map((p, i) => (
                    <li key={i} className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span className="h-6 w-6 rounded-md bg-primary-soft text-primary-dark text-xs font-bold flex items-center justify-center shrink-0">
                          {i + 1}
                        </span>
                        <span className="text-sm truncate">{p.product_name}</span>
                      </div>
                      <span className="text-sm font-semibold num shrink-0">{p.qty}x</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          <div className="card p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="font-semibold">Stok menipis</p>
                <p className="text-sm text-muted">Produk di bawah atau sama dengan batas minimum</p>
              </div>
              <Link to="/stock" className="text-sm font-semibold text-primary">
                Lihat semua
              </Link>
            </div>
            {data.low_stock.length === 0 ? (
              <EmptyState title="Stok aman" description="Tidak ada produk yang menipis saat ini." />
            ) : (
              <div className="overflow-x-auto">
                <table className="table-shell">
                  <thead>
                    <tr>
                      <th>Kode</th>
                      <th>Nama produk</th>
                      <th>Stok</th>
                      <th>Minimum</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.low_stock.map((p) => (
                      <tr key={p.id}>
                        <td className="text-muted num">{p.code}</td>
                        <td className="font-medium">{p.name}</td>
                        <td className="num text-danger font-semibold">{p.stock}</td>
                        <td className="num text-muted">{p.minimum_stock}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </AppLayout>
  );
}
