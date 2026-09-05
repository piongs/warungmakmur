import { useEffect, useState } from "react";
import AppLayout from "../components/AppLayout";
import { Loading, EmptyState, ErrorBanner } from "../components/ui";
import { getErrorMessage } from "../utils/errors";
import api from "../api/client";
import { formatDateTime } from "../utils/format";
import { Modal } from "./Products";

export default function Stock() {
  const [products, setProducts] = useState([]);
  const [movements, setMovements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState({ product_id: "", type: "IN", qty: "", note: "" });
  const [error, setError] = useState("");

  async function load() {
    setLoading(true);
    const [p, m] = await Promise.all([
      api.get("/products", { params: { active: true } }),
      api.get("/stock/movements"),
    ]);
    setProducts(p.data);
    setMovements(m.data);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    try {
      await api.post("/stock/movements", { ...form, qty: Number(form.qty) });
      setModalOpen(false);
      setForm({ product_id: "", type: "IN", qty: "", note: "" });
      load();
    } catch (err) {
      setError(getErrorMessage(err, "Gagal mencatat pergerakan stok."));
    }
  }

  const typeLabel = { IN: "Masuk", OUT_SALE: "Keluar (jual)", ADJUSTMENT: "Penyesuaian" };
  const typeColor = {
    IN: "text-success",
    OUT_SALE: "text-danger",
    ADJUSTMENT: "text-warning",
  };

  return (
    <AppLayout
      title="Stok"
      subtitle="Barang masuk, keluar, dan riwayat penyesuaian"
      actions={
        <button className="btn-primary" onClick={() => setModalOpen(true)}>
          + Catat stok
        </button>
      }
    >
      <div className="grid lg:grid-cols-2 gap-5">
        <div className="card overflow-hidden">
          <div className="p-4 border-b border-line">
            <p className="font-semibold">Stok saat ini</p>
          </div>
          {loading ? (
            <Loading />
          ) : (
            <div className="overflow-x-auto max-h-[520px] overflow-y-auto">
              <table className="table-shell">
                <thead className="sticky top-0 bg-white">
                  <tr>
                    <th>Produk</th>
                    <th>Stok</th>
                    <th>Minimum</th>
                  </tr>
                </thead>
                <tbody>
                  {products.map((p) => (
                    <tr key={p.id}>
                      <td className="font-medium">{p.name}</td>
                      <td className={`num ${p.stock <= p.minimum_stock ? "text-danger font-semibold" : ""}`}>
                        {p.stock}
                      </td>
                      <td className="num text-muted">{p.minimum_stock}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="card overflow-hidden">
          <div className="p-4 border-b border-line">
            <p className="font-semibold">Riwayat pergerakan</p>
          </div>
          {loading ? (
            <Loading />
          ) : movements.length === 0 ? (
            <EmptyState title="Belum ada riwayat" />
          ) : (
            <div className="overflow-x-auto max-h-[520px] overflow-y-auto">
              <table className="table-shell">
                <thead className="sticky top-0 bg-white">
                  <tr>
                    <th>Waktu</th>
                    <th>Produk</th>
                    <th>Tipe</th>
                    <th>Qty</th>
                    <th>Sisa</th>
                  </tr>
                </thead>
                <tbody>
                  {movements.map((m) => (
                    <tr key={m.id}>
                      <td className="text-muted whitespace-nowrap">{formatDateTime(m.created_at)}</td>
                      <td className="font-medium">{m.product_name}</td>
                      <td className={typeColor[m.type]}>{typeLabel[m.type]}</td>
                      <td className="num">{m.qty > 0 ? `+${m.qty}` : m.qty}</td>
                      <td className="num text-muted">{m.stock_after}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {modalOpen && (
        <Modal title="Catat pergerakan stok" onClose={() => setModalOpen(false)}>
          <ErrorBanner message={error} />
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="label">Produk</label>
              <select
                className="input"
                value={form.product_id}
                onChange={(e) => setForm({ ...form, product_id: e.target.value })}
                required
              >
                <option value="">Pilih produk</option>
                {products.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} (stok: {p.stock})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Tipe</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setForm({ ...form, type: "IN" })}
                  className={`btn text-sm ${form.type === "IN" ? "bg-primary text-white" : "bg-cream"}`}
                >
                  Barang masuk
                </button>
                <button
                  type="button"
                  onClick={() => setForm({ ...form, type: "ADJUSTMENT" })}
                  className={`btn text-sm ${form.type === "ADJUSTMENT" ? "bg-primary text-white" : "bg-cream"}`}
                >
                  Penyesuaian
                </button>
              </div>
            </div>
            <div>
              <label className="label">
                {form.type === "IN" ? "Jumlah masuk" : "Perubahan (boleh minus)"}
              </label>
              <input
                type="number"
                className="input num"
                value={form.qty}
                onChange={(e) => setForm({ ...form, qty: e.target.value })}
                placeholder={form.type === "IN" ? "contoh: 24" : "contoh: -2"}
                required
              />
            </div>
            <div>
              <label className="label">Catatan (opsional)</label>
              <input
                className="input"
                value={form.note}
                onChange={(e) => setForm({ ...form, note: e.target.value })}
                placeholder="contoh: Kulakan dari agen"
              />
            </div>
            <div className="flex gap-2 pt-2">
              <button type="button" className="btn-secondary flex-1 justify-center" onClick={() => setModalOpen(false)}>
                Batal
              </button>
              <button type="submit" className="btn-primary flex-1 justify-center">
                Simpan
              </button>
            </div>
          </form>
        </Modal>
      )}
    </AppLayout>
  );
}
