import { useEffect, useState } from "react";
import AppLayout from "../components/AppLayout";
import { Loading, EmptyState, ErrorBanner } from "../components/ui";
import { getErrorMessage } from "../utils/errors";
import api from "../api/client";
import { formatRupiah } from "../utils/format";

const emptyForm = {
  code: "",
  name: "",
  category_id: "",
  selling_price: "",
  cost_price: "",
  stock: "",
  minimum_stock: 5,
  unit: "pcs",
};

export default function Products() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState("");

  async function load() {
    setLoading(true);
    const [p, c] = await Promise.all([api.get("/products"), api.get("/categories")]);
    setProducts(p.data);
    setCategories(c.data);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  const filtered = products.filter(
    (p) =>
      !search ||
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.code.toLowerCase().includes(search.toLowerCase())
  );

  function openCreate() {
    setEditing(null);
    setForm(emptyForm);
    setError("");
    setModalOpen(true);
  }

  function openEdit(p) {
    setEditing(p);
    setForm({
      code: p.code,
      name: p.name,
      category_id: p.category_id || "",
      selling_price: p.selling_price,
      cost_price: p.cost_price,
      stock: p.stock,
      minimum_stock: p.minimum_stock,
      unit: p.unit,
    });
    setError("");
    setModalOpen(true);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    try {
      if (editing) {
        await api.put(`/products/${editing.id}`, form);
      } else {
        await api.post("/products", form);
      }
      setModalOpen(false);
      load();
    } catch (err) {
      setError(getErrorMessage(err, "Gagal menyimpan produk."));
    }
  }

  async function handleDeactivate(p) {
    if (!confirm(`Nonaktifkan produk "${p.name}"?`)) return;
    await api.delete(`/products/${p.id}`);
    load();
  }

  return (
    <AppLayout
      title="Produk"
      subtitle={`${products.length} produk terdaftar`}
      actions={
        <button className="btn-primary" onClick={openCreate}>
          + Produk baru
        </button>
      }
    >
      <div className="mb-4">
        <input
          className="input max-w-xs"
          placeholder="Cari produk..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="card overflow-hidden">
        {loading ? (
          <Loading />
        ) : filtered.length === 0 ? (
          <EmptyState title="Belum ada produk" description="Tambahkan produk pertama warung kamu." action={<button className="btn-primary" onClick={openCreate}>+ Produk baru</button>} />
        ) : (
          <div className="overflow-x-auto">
            <table className="table-shell">
              <thead>
                <tr>
                  <th>Kode</th>
                  <th>Nama</th>
                  <th>Kategori</th>
                  <th>Harga jual</th>
                  <th>Stok</th>
                  <th>Status</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((p) => (
                  <tr key={p.id}>
                    <td className="text-muted num">{p.code}</td>
                    <td className="font-medium">{p.name}</td>
                    <td className="text-muted">{p.category_name || "-"}</td>
                    <td className="num">{formatRupiah(p.selling_price)}</td>
                    <td className={`num ${p.stock <= p.minimum_stock ? "text-danger font-semibold" : ""}`}>
                      {p.stock}
                    </td>
                    <td>
                      <span className={`badge ${p.is_active ? "bg-success/10 text-success" : "bg-muted/10 text-muted"}`}>
                        {p.is_active ? "Aktif" : "Nonaktif"}
                      </span>
                    </td>
                    <td className="text-right">
                      <button onClick={() => openEdit(p)} className="text-sm font-semibold text-primary mr-3">
                        Ubah
                      </button>
                      {p.is_active && (
                        <button onClick={() => handleDeactivate(p)} className="text-sm font-semibold text-danger">
                          Nonaktifkan
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {modalOpen && (
        <Modal onClose={() => setModalOpen(false)} title={editing ? "Ubah produk" : "Produk baru"}>
          <ErrorBanner message={error} />
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">Kode produk</label>
                <input
                  className="input"
                  value={form.code}
                  onChange={(e) => setForm({ ...form, code: e.target.value })}
                  required
                />
              </div>
              <div>
                <label className="label">Satuan</label>
                <input
                  className="input"
                  value={form.unit}
                  onChange={(e) => setForm({ ...form, unit: e.target.value })}
                  placeholder="pcs, botol, kg..."
                />
              </div>
            </div>
            <div>
              <label className="label">Nama produk</label>
              <input
                className="input"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
              />
            </div>
            <div>
              <label className="label">Kategori</label>
              <select
                className="input"
                value={form.category_id}
                onChange={(e) => setForm({ ...form, category_id: e.target.value })}
              >
                <option value="">Tanpa kategori</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">Harga jual</label>
                <input
                  type="number"
                  min={0}
                  className="input num"
                  value={form.selling_price}
                  onChange={(e) => setForm({ ...form, selling_price: e.target.value })}
                  required
                />
              </div>
              <div>
                <label className="label">Harga modal</label>
                <input
                  type="number"
                  min={0}
                  className="input num"
                  value={form.cost_price}
                  onChange={(e) => setForm({ ...form, cost_price: e.target.value })}
                />
              </div>
            </div>
            {!editing && (
              <div>
                <label className="label">Stok awal</label>
                <input
                  type="number"
                  min={0}
                  className="input num"
                  value={form.stock}
                  onChange={(e) => setForm({ ...form, stock: e.target.value })}
                />
              </div>
            )}
            <div>
              <label className="label">Stok minimum (peringatan)</label>
              <input
                type="number"
                min={0}
                className="input num"
                value={form.minimum_stock}
                onChange={(e) => setForm({ ...form, minimum_stock: e.target.value })}
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

export function Modal({ title, children, onClose }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-ink/40" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-pop w-full max-w-md max-h-[90vh] overflow-y-auto p-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-bold text-lg">{title}</h2>
          <button onClick={onClose} className="text-muted hover:text-ink">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-5 w-5">
              <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" />
            </svg>
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
