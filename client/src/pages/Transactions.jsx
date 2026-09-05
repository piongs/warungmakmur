import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import AppLayout from "../components/AppLayout";
import { Loading, EmptyState, Badge } from "../components/ui";
import api from "../api/client";
import { formatDateTime, formatRupiah, todayISO } from "../utils/format";

export default function Transactions() {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");

  async function load() {
    setLoading(true);
    const { data } = await api.get("/transactions", { params: { search, status } });
    setTransactions(data);
    setLoading(false);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);

  return (
    <AppLayout title="Transaksi" subtitle="Riwayat seluruh transaksi kasir">
      <div className="flex flex-col sm:flex-row gap-2 mb-4">
        <input
          className="input sm:max-w-xs"
          placeholder="Cari no. invoice..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && load()}
        />
        <select className="input sm:max-w-[160px]" value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="">Semua status</option>
          <option value="PAID">Lunas</option>
          <option value="CANCELLED">Dibatalkan</option>
        </select>
        <button className="btn-secondary" onClick={load}>
          Cari
        </button>
      </div>

      <div className="card overflow-hidden">
        {loading ? (
          <Loading />
        ) : transactions.length === 0 ? (
          <EmptyState title="Belum ada transaksi" description="Transaksi akan muncul di sini setelah kasir checkout." />
        ) : (
          <div className="overflow-x-auto">
            <table className="table-shell">
              <thead>
                <tr>
                  <th>No. Invoice</th>
                  <th>Waktu</th>
                  <th>Kasir</th>
                  <th>Total</th>
                  <th>Status</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((t) => (
                  <tr key={t.id}>
                    <td className="num font-medium">{t.invoice_number}</td>
                    <td className="text-muted whitespace-nowrap">{formatDateTime(t.created_at)}</td>
                    <td className="text-muted">{t.cashier_name || "-"}</td>
                    <td className="num font-semibold">{formatRupiah(t.total)}</td>
                    <td>
                      <Badge status={t.status} />
                    </td>
                    <td className="text-right">
                      <Link to={`/transactions/${t.id}`} className="text-sm font-semibold text-primary">
                        Detail
                      </Link>
                    </td>
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
