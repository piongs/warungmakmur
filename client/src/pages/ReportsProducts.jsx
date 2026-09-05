import { useEffect, useState } from "react";
import AppLayout from "../components/AppLayout";
import { ReportTabs, PeriodFilter, computeRange } from "../components/ReportFilters";
import { Loading, EmptyState } from "../components/ui";
import api from "../api/client";
import { formatRupiah, todayISO } from "../utils/format";
import { exportPDF, exportExcel } from "../utils/export";

export default function ReportsProducts() {
  const [preset, setPreset] = useState("today");
  const [from, setFrom] = useState(todayISO());
  const [to, setTo] = useState(todayISO());
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  const range = computeRange(preset, from, to);

  useEffect(() => {
    setLoading(true);
    api
      .get("/reports/products", { params: range })
      .then((res) => setRows(res.data))
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [preset, from, to]);

  const columns = [
    { label: "Kode", render: (r) => r.product_code },
    { label: "Produk", render: (r) => r.product_name },
    { label: "Qty terjual", render: (r) => r.qty_terjual },
    { label: "Omzet", render: (r) => formatRupiah(r.omzet), rawExcel: (r) => r.omzet },
  ];

  return (
    <AppLayout
      title="Laporan"
      subtitle="Produk terlaris pada periode terpilih"
      actions={
        rows.length > 0 && (
          <div className="flex gap-2">
            <button
              className="btn-secondary"
              onClick={() =>
                exportExcel({ sheetName: "Produk", columns, rows, filename: `laporan-produk-${range.from}_${range.to}.xlsx` })
              }
            >
              Excel
            </button>
            <button
              className="btn-primary"
              onClick={() =>
                exportPDF({
                  title: "Laporan Produk Terlaris",
                  period: `${range.from} s/d ${range.to}`,
                  columns,
                  rows,
                  filename: `laporan-produk-${range.from}_${range.to}.pdf`,
                })
              }
            >
              Export PDF
            </button>
          </div>
        )
      }
    >
      <ReportTabs />
      <PeriodFilter preset={preset} setPreset={setPreset} from={from} to={to} setFrom={setFrom} setTo={setTo} />

      <div className="card overflow-hidden">
        {loading ? (
          <Loading />
        ) : rows.length === 0 ? (
          <EmptyState title="Belum ada penjualan" description="Tidak ada data pada periode ini." />
        ) : (
          <div className="overflow-x-auto">
            <table className="table-shell">
              <thead>
                <tr>
                  <th>Kode</th>
                  <th>Produk</th>
                  <th>Qty terjual</th>
                  <th className="text-right">Omzet</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r, i) => (
                  <tr key={i}>
                    <td className="text-muted num">{r.product_code}</td>
                    <td className="font-medium">{r.product_name}</td>
                    <td className="num">{r.qty_terjual}</td>
                    <td className="num text-right font-semibold">{formatRupiah(r.omzet)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
