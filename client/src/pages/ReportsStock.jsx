import { useEffect, useState } from "react";
import AppLayout from "../components/AppLayout";
import { ReportTabs, PeriodFilter, computeRange } from "../components/ReportFilters";
import { Loading } from "../components/ui";
import api from "../api/client";
import { todayISO } from "../utils/format";
import { exportPDF, exportExcel } from "../utils/export";

export default function ReportsStock() {
  const [preset, setPreset] = useState("today");
  const [from, setFrom] = useState(todayISO());
  const [to, setTo] = useState(todayISO());
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const range = computeRange(preset, from, to);

  useEffect(() => {
    setLoading(true);
    api
      .get("/reports/stock", { params: range })
      .then((res) => setData(res.data))
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [preset, from, to]);

  const columns = [
    { label: "Kode", render: (r) => r.code },
    { label: "Produk", render: (r) => r.name },
    { label: "Masuk", render: (r) => r.masuk },
    { label: "Keluar", render: (r) => r.keluar },
    { label: "Penyesuaian", render: (r) => r.penyesuaian },
  ];

  return (
    <AppLayout
      title="Laporan"
      subtitle="Rekap pergerakan stok pada periode terpilih"
      actions={
        data && (
          <div className="flex gap-2">
            <button
              className="btn-secondary"
              onClick={() =>
                exportExcel({ sheetName: "Stok", columns, rows: data.movements, filename: `laporan-stok-${range.from}_${range.to}.xlsx` })
              }
            >
              Excel
            </button>
            <button
              className="btn-primary"
              onClick={() =>
                exportPDF({
                  title: "Laporan Rekap Stok",
                  period: `${range.from} s/d ${range.to}`,
                  columns,
                  rows: data.movements,
                  filename: `laporan-stok-${range.from}_${range.to}.pdf`,
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

      {loading ? (
        <Loading />
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="table-shell">
              <thead>
                <tr>
                  <th>Kode</th>
                  <th>Produk</th>
                  <th>Masuk</th>
                  <th>Keluar</th>
                  <th>Penyesuaian</th>
                </tr>
              </thead>
              <tbody>
                {data.movements.map((m, i) => (
                  <tr key={i}>
                    <td className="text-muted num">{m.code}</td>
                    <td className="font-medium">{m.name}</td>
                    <td className="num text-success">{m.masuk > 0 ? `+${m.masuk}` : m.masuk}</td>
                    <td className="num text-danger">{m.keluar > 0 ? `-${m.keluar}` : m.keluar}</td>
                    <td className="num text-warning">{m.penyesuaian}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </AppLayout>
  );
}
