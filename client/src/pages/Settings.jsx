import { useEffect, useState } from "react";
import AppLayout from "../components/AppLayout";
import { Loading, ErrorBanner } from "../components/ui";
import { Modal } from "./Products";
import { getErrorMessage } from "../utils/errors";
import api from "../api/client";
import { useAuth } from "../context/AuthContext";
import { formatDate } from "../utils/format";

export default function Settings() {
  const { user } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", password: "", role: "kasir" });
  const [error, setError] = useState("");

  async function load() {
    setLoading(true);
    const { data } = await api.get("/users");
    setUsers(data);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    try {
      await api.post("/users", form);
      setModalOpen(false);
      setForm({ name: "", email: "", password: "", role: "kasir" });
      load();
    } catch (err) {
      setError(getErrorMessage(err, "Gagal menambah user."));
    }
  }

  async function toggleActive(u) {
    await api.put(`/users/${u.id}`, { is_active: !u.is_active });
    load();
  }

  return (
    <AppLayout title="Pengaturan" subtitle="Kelola akun kasir dan warung">
      <div className="grid lg:grid-cols-[1fr_320px] gap-5">
        <div className="card overflow-hidden order-2 lg:order-1">
          <div className="p-4 border-b border-line flex items-center justify-between">
            <p className="font-semibold">Pengguna</p>
          </div>
          {loading ? (
            <Loading />
          ) : (
            <table className="table-shell">
              <thead>
                <tr>
                  <th>Nama</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Bergabung</th>
                  <th>Status</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id}>
                    <td className="font-medium">{u.name}</td>
                    <td className="text-muted">{u.email}</td>
                    <td className="capitalize">{u.role}</td>
                    <td className="text-muted">{formatDate(u.created_at)}</td>
                    <td>
                      <span className={`badge ${u.is_active ? "bg-success/10 text-success" : "bg-muted/10 text-muted"}`}>
                        {u.is_active ? "Aktif" : "Nonaktif"}
                      </span>
                    </td>
                    <td className="text-right">
                      {u.id !== user.id && (
                        <button className="text-sm font-semibold text-primary" onClick={() => toggleActive(u)}>
                          {u.is_active ? "Nonaktifkan" : "Aktifkan"}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <div className="card p-5 order-1 lg:order-2 h-fit space-y-5">
          <div>
            <p className="font-semibold mb-3">Tambah kasir</p>
            <button className="btn-primary w-full justify-center" onClick={() => setModalOpen(true)}>
              + Kasir baru
            </button>
          </div>
          <div className="border-t border-line pt-4">
            <p className="font-semibold mb-2 text-sm">Tentang warung</p>
            <p className="text-sm text-muted leading-relaxed">
              Nama toko, alamat, dan info nota bisa diubah langsung di{" "}
              <code className="text-xs bg-cream px-1.5 py-0.5 rounded">client/src/pages/Receipt.jsx</code>{" "}
              agar sesuai identitas warung kamu.
            </p>
          </div>
        </div>
      </div>

      {modalOpen && (
        <Modal title="Tambah kasir" onClose={() => setModalOpen(false)}>
          <ErrorBanner message={error} />
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="label">Nama</label>
              <input className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
            </div>
            <div>
              <label className="label">Email</label>
              <input type="email" className="input" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
            </div>
            <div>
              <label className="label">Password sementara</label>
              <input type="password" className="input" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required minLength={6} />
            </div>
            <div>
              <label className="label">Role</label>
              <select className="input" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
                <option value="kasir">Kasir</option>
                <option value="admin">Admin</option>
                <option value="owner">Owner</option>
              </select>
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
