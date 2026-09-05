import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { QRCodeSVG } from "qrcode.react";
import api from "../api/client";
import { Loading } from "../components/ui";
import { formatDateTime, formatRupiah } from "../utils/format";

export default function Receipt() {
  const { invoiceNumber } = useParams();
  const [tx, setTx] = useState(null);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    api
      .get(`/receipts/${invoiceNumber}`)
      .then((res) => setTx(res.data))
      .catch(() => setNotFound(true));
  }, [invoiceNumber]);

  if (notFound) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-cream p-6">
        <p className="text-muted">Nota tidak ditemukan.</p>
      </div>
    );
  }
  if (!tx) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-cream">
        <Loading />
      </div>
    );
  }

  const receiptUrl = `${window.location.origin}/receipt/${tx.invoice_number}`;

  return (
    <div className="min-h-screen bg-cream flex flex-col items-center py-8 px-4 print:bg-white print:py-0">
      <div className="w-full max-w-sm bg-white rounded-2xl shadow-pop print:shadow-none p-6 font-mono">
        <div className="text-center mb-4">
          <p className="font-bold text-base tracking-tight">WARUNG MAKMUR</p>
          <p className="text-xs text-muted mt-1">Jl. Contoh No. 1, Kota Kamu</p>
        </div>

        <div className="border-t border-dashed border-line my-3" />

        <div className="text-xs space-y-0.5">
          <p>No: {tx.invoice_number}</p>
          <p>{formatDateTime(tx.created_at)} · Kasir: {tx.cashier_name || "-"}</p>
        </div>

        <div className="border-t border-dashed border-line my-3" />

        <div className="text-xs space-y-1.5">
          {tx.items.map((it, i) => (
            <div key={i}>
              <p>{it.product_name}</p>
              <div className="flex justify-between text-muted">
                <span>
                  {it.qty} × {formatRupiah(it.price)}
                </span>
                <span className="text-ink">{formatRupiah(it.line_total)}</span>
              </div>
            </div>
          ))}
        </div>

        <div className="border-t border-dashed border-line my-3" />

        <div className="text-xs space-y-1">
          <div className="flex justify-between">
            <span>SUBTOTAL</span>
            <span>{formatRupiah(tx.subtotal)}</span>
          </div>
          {Number(tx.discount) > 0 && (
            <div className="flex justify-between">
              <span>DISKON</span>
              <span>-{formatRupiah(tx.discount)}</span>
            </div>
          )}
          <div className="flex justify-between font-bold text-sm pt-1">
            <span>TOTAL</span>
            <span>{formatRupiah(tx.total)}</span>
          </div>
          <div className="flex justify-between pt-1">
            <span>{tx.payment_method || "-"}</span>
            <span>{formatRupiah(tx.paid_amount || tx.total)}</span>
          </div>
          {Number(tx.change_amount) > 0 && (
            <div className="flex justify-between">
              <span>KEMBALI</span>
              <span>{formatRupiah(tx.change_amount)}</span>
            </div>
          )}
        </div>

        <div className="border-t border-dashed border-line my-4" />

        <div className="flex flex-col items-center gap-2">
          <QRCodeSVG value={receiptUrl} size={96} fgColor="#292524" />
          <p className="text-[10px] text-muted text-center">
            Pindai untuk membuka nota digital ini kapan saja
          </p>
        </div>

        <p className="text-center text-xs text-muted mt-4">Terima kasih sudah berbelanja 🙏</p>
      </div>

      <div className="flex gap-2 mt-5 print:hidden">
        <button onClick={() => window.print()} className="btn-primary">
          Cetak nota
        </button>
        <Link to="/pos" className="btn-secondary">
          Kembali ke kasir
        </Link>
      </div>
    </div>
  );
}
