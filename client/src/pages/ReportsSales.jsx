import { useEffect, useState } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import AppLayout from "../components/AppLayout";
import { ReportTabs, PeriodFilter, computeRange } from "../components/ReportFilters";
import { Loading, StatCard } from "../components/ui";
import api from "../api/client";
import { formatRupiah, todayISO } from "../utils/format";
import { exportPDF, exportExcel } from "../utils/export";

export default function ReportsSales() {
  const [preset, setPreset] = useState("today");
  const [from, setFrom] = useState(todayISO());
  const [to, setTo] = useState(todayISO());
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const range = computeRange(preset, from, to);

  useEffect(() => {
    setLoading(true);
    api
      .get("/reports/sales", { params: range })
      .then((res) => setData(res.data))
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [preset, from, to]);

  function handleExportPDF() {
    exportPDF({
      title: "Laporan Penjualan",
      period: `${range.from} s/d ${range.to}`,
      columns: [
        { label: "Tanggal", render: (r) => r.tanggal },
        { label: "Jumlah Transaksi", render: (r) => r.jumlah_transaksi },
        { label: "Omzet", render: (r) => formatRupiah(r.omzet) },
      ],
      rows: data.by_day,
      filename: `laporan-penjualan-${range.from}_${range.to}.pdf`,
    });
  }

  function handleExportExcel() {
    exportExcel({
      sheetName: "Penjualan",
      columns: [
        { label: "Tanggal", render: (r) => r.tanggal },
        { label: "Jumlah Transaksi", render: (r) => r.jumlah_transaksi },
        { label: "Omzet", render: (r) => r.omzet, rawExcel: (r) => r.omzet },
      ],
      rows: data.by_day,
      filename: `laporan-penjualan-${range.from}_${range.to}.xlsx`,
    });
  }

  return (
    <AppLayout
      title="Laporan"
      subtitle="Evaluasi performa penjualan warung"
      actions={
        data && (
          <div className="flex gap-2">
            <button className="btn-secondary" onClick={handleExportExcel}>Excel</button>
            <button className="btn-primary" onClick={handleExportPDF}>Export PDF</button>
          </div>
        )
      }
    >
      <ReportTabs />
      <PeriodFilter preset={preset} setPreset={setPreset} from={from} to={to} setFrom={setFrom} setTo={setTo} />

      {loading ? (
        <Loading />
      ) : (
        <div className="space-y-5">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard label="Jumlah transaksi" value={data.summary.jumlah_transaksi} />
            <StatCard label="Subtotal" value={formatRupiah(data.summary.subtotal)} />
            <StatCard label="Diskon" value={formatRupiah(data.summary.diskon)} />
            <StatCard label="Total bersih" value={formatRupiah(data.summary.total_bersih)} />
          </div>

          <div className="grid lg:grid-cols-2 gap-4">
            <div className="card p-5">
              <p className="font-semibold mb-4">Omzet per hari</p>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data.by_day} margin={{ left: -12 }}>
                    <CartesianGrid vertical={false} stroke="#E7E5E4" />
                    <XAxis dataKey="tanggal" tick={{ fontSize: 10, fill: "#78716C" }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 11, fill: "#78716C" }} axisLine={false} tickLine={false} width={54} tickFormatter={(v) => (v >= 1000 ? `${Math.round(v / 1000)}rb` : v)} />
                    <Tooltip formatter={(v) => formatRupiah(v)} contentStyle={{ borderRadius: 12, borderColor: "#E7E5E4", fontSize: 13 }} />
                    <Bar dataKey="omzet" fill="#C2410C" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="card p-5">
              <p className="font-semibold mb-4">Jam ramai</p>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data.by_hour} margin={{ left: -12 }}>
                    <CartesianGrid vertical={false} stroke="#E7E5E4" />
                    <XAxis dataKey="jam" tickFormatter={(v) => `${v}:00`} tick={{ fontSize: 10, fill: "#78716C" }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 11, fill: "#78716C" }} axisLine={false} tickLine={false} width={30} />
                    <Tooltip labelFormatter={(v) => `Jam ${v}:00`} formatter={(v) => [`${v} transaksi`]} contentStyle={{ borderRadius: 12, borderColor: "#E7E5E4", fontSize: 13 }} />
                    <Bar dataKey="jumlah_transaksi" fill="#7C2D12" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>
      )}
    </AppLayout>
  );
}
