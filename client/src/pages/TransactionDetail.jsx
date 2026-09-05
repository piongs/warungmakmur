import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import AppLayout from "../components/AppLayout";
import { Loading, Badge } from "../components/ui";
import api from "../api/client";
import { formatDateTime, formatRupiah } from "../utils/format";

export default function TransactionDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [tx, setTx] = useState(null);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    const { data } = await api.get(`/transactions/${id}`);
    setTx(data);
    setLoading(false);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  async function handleCancel() {
    if (!confirm("Batalkan transaksi ini? Stok akan dikembalikan.")) return;
    await api.post(`/transactions/${id}/cancel`);
    load();
  }

  return (
    <AppLayout
      title={tx ? tx.invoice_number : "Detail transaksi"}
      subtitle={tx ? formatDateTime(tx.created_at) : ""}
      actions={
        tx && (
          <div className="flex gap-2">
            <Link to={`/receipt/${tx.invoice_number}`} className="btn-secondary">
              Lihat nota
            </Link>
            {tx.status === "PAID" && (
              <button className="btn-danger" onClick={handleCancel}>
                Batalkan
              </button>
            )}
          </div>
        )
      }
    >
      {loading ? (
        <Loading />
      ) : (
        <div className="grid lg:grid-cols-[1fr_320px] gap-5">
          <div className="card overflow-hidden">
            <table className="table-shell">
              <thead>
                <tr>
                  <th>Produk</th>
                  <th>Harga</th>
                  <th>Qty</th>
                  <th className="text-right">Subtotal</th>
                </tr>
              </thead>
              <tbody>
                {tx.items.map((it) => (
                  <tr key={it.id}>
                    <td className="font-medium">{it.product_name}</td>
                    <td className="num text-muted">{formatRupiah(it.price)}</td>
                    <td className="num">{it.qty}</td>
                    <td className="num text-right">{formatRupiah(it.line_total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="card p-5 space-y-3 h-fit">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted">Status</span>
              <Badge status={tx.status} />
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted">Kasir</span>
              <span className="font-medium">{tx.cashier_name || "-"}</span>
            </div>
            <div className="border-t border-line pt-3 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted">Subtotal</span>
                <span className="num">{formatRupiah(tx.subtotal)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted">Diskon</span>
                <span className="num">{formatRupiah(tx.discount)}</span>
              </div>
              <div className="flex justify-between font-bold">
                <span>Total</span>
                <span className="num text-primary-dark">{formatRupiah(tx.total)}</span>
              </div>
            </div>
            <div className="border-t border-line pt-3 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted">Dibayar</span>
                <span className="num">{formatRupiah(tx.paid_amount)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted">Kembalian</span>
                <span className="num">{formatRupiah(tx.change_amount)}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </AppLayout>
  );
}
