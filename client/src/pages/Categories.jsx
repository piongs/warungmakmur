import { useEffect, useState } from "react";
import AppLayout from "../components/AppLayout";
import { Loading, EmptyState } from "../components/ui";
import { getErrorMessage } from "../utils/errors";
import api from "../api/client";

export default function Categories() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [editingName, setEditingName] = useState("");

  async function load() {
    setLoading(true);
    const { data } = await api.get("/categories");
    setCategories(data);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  async function handleAdd(e) {
    e.preventDefault();
    setError("");
    try {
      await api.post("/categories", { name });
      setName("");
      load();
    } catch (err) {
      setError(getErrorMessage(err, "Gagal menambah kategori."));
    }
  }

  async function handleUpdate(id) {
    await api.put(`/categories/${id}`, { name: editingName });
    setEditingId(null);
    load();
  }

  async function handleDelete(c) {
    if (c.product_count > 0) {
      alert("Kategori masih dipakai produk, tidak bisa dihapus.");
      return;
    }
    if (!confirm(`Hapus kategori "${c.name}"?`)) return;
    await api.delete(`/categories/${c.id}`);
    load();
  }

  return (
    <AppLayout title="Kategori" subtitle="Kelompokkan produk agar mudah dicari saat kasir">
      <div className="grid lg:grid-cols-[1fr_320px] gap-5">
        <div className="card overflow-hidden order-2 lg:order-1">
          {loading ? (
            <Loading />
          ) : categories.length === 0 ? (
            <EmptyState title="Belum ada kategori" description="Tambah kategori pertama di panel sebelah." />
          ) : (
            <table className="table-shell">
              <thead>
                <tr>
                  <th>Nama kategori</th>
                  <th>Jumlah produk</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {categories.map((c) => (
                  <tr key={c.id}>
                    <td className="font-medium">
                      {editingId === c.id ? (
                        <input
                          className="input py-1.5"
                          value={editingName}
                          onChange={(e) => setEditingName(e.target.value)}
                          autoFocus
                        />
                      ) : (
                        c.name
                      )}
                    </td>
                    <td className="num text-muted">{c.product_count}</td>
                    <td className="text-right space-x-3">
                      {editingId === c.id ? (
                        <>
                          <button className="text-sm font-semibold text-primary" onClick={() => handleUpdate(c.id)}>
                            Simpan
                          </button>
                          <button className="text-sm font-semibold text-muted" onClick={() => setEditingId(null)}>
                            Batal
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            className="text-sm font-semibold text-primary"
                            onClick={() => {
                              setEditingId(c.id);
                              setEditingName(c.name);
                            }}
                          >
                            Ubah
                          </button>
                          <button className="text-sm font-semibold text-danger" onClick={() => handleDelete(c)}>
                            Hapus
                          </button>
                        </>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <div className="card p-5 order-1 lg:order-2 h-fit">
          <p className="font-semibold mb-3">Tambah kategori</p>
          {error && <p className="text-sm text-danger mb-2">{error}</p>}
          <form onSubmit={handleAdd} className="space-y-3">
            <input
              className="input"
              placeholder="Contoh: Minuman"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
            <button type="submit" className="btn-primary w-full justify-center">
              Tambah
            </button>
          </form>
        </div>
      </div>
    </AppLayout>
  );
}
