import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { getErrorMessage } from "../utils/errors";
import api from "../api/client";

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;

export default function Login() {
  const { login, loginWithGoogleToken } = useAuth();
  const navigate = useNavigate();
  const [mode, setMode] = useState("login"); // login | register
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const googleBtnRef = useRef(null);

  useEffect(() => {
    if (!GOOGLE_CLIENT_ID) return; // Google Login belum dikonfigurasi, tombol fallback yang tampil

    function renderButton() {
      if (!window.google || !googleBtnRef.current) return;
      window.google.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback: handleGoogleCredential,
      });
      window.google.accounts.id.renderButton(googleBtnRef.current, {
        theme: "outline",
        size: "large",
        width: googleBtnRef.current.offsetWidth || 320,
        text: "continue_with",
        locale: "id",
      });
    }

    if (window.google) {
      renderButton();
    } else {
      const script = document.createElement("script");
      script.src = "https://accounts.google.com/gsi/client";
      script.async = true;
      script.defer = true;
      script.onload = renderButton;
      document.body.appendChild(script);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleGoogleCredential(response) {
    setError("");
    setLoading(true);
    try {
      await loginWithGoogleToken(response.credential);
      navigate("/dashboard");
    } catch (err) {
      setError(getErrorMessage(err, "Login Google gagal, coba lagi."));
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      if (mode === "login") {
        await login(form.email, form.password);
      } else {
        const { data } = await api.post("/auth/register", form);
        localStorage.setItem("pos_token", data.token);
        localStorage.setItem("pos_user", JSON.stringify(data.user));
      }
      navigate("/dashboard");
    } catch (err) {
      setError(getErrorMessage(err, "Terjadi kesalahan, coba lagi."));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen grid lg:grid-cols-2 bg-cream">
      {/* Panel visual — rak warung sederhana */}
      <div className="hidden lg:flex flex-col justify-between bg-primary-dark text-white p-12 relative overflow-hidden">
        <WarungPattern />
        <div className="relative z-10">
          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-lg bg-white/15 flex items-center justify-center font-bold">
              W
            </div>
            <span className="font-bold text-lg">Warung Makmur</span>
          </div>
        </div>
        <div className="relative z-10 max-w-sm">
          <p className="text-3xl font-bold leading-snug">
            Catat setiap transaksi, tanpa kalkulator.
          </p>
          <p className="text-white/70 mt-3 text-sm leading-relaxed">
            Pilih barang, sistem hitung kembalian, kurangi stok, dan cetak nota — otomatis, dari
            satu layar kasir.
          </p>
        </div>
        <div className="relative z-10 flex items-center gap-6 text-sm text-white/60">
          <span>Stok real-time</span>
          <span>·</span>
          <span>Nota digital</span>
          <span>·</span>
          <span>Laporan harian</span>
        </div>
      </div>

      {/* Form */}
      <div className="flex items-center justify-center p-6 lg:p-12">
        <div className="w-full max-w-sm">
          <div className="lg:hidden flex items-center gap-2.5 mb-8">
            <div className="h-9 w-9 rounded-lg bg-primary text-white flex items-center justify-center font-bold">
              W
            </div>
            <span className="font-bold text-lg">Warung Makmur</span>
          </div>

          <h1 className="text-2xl font-bold">
            {mode === "login" ? "Masuk ke kasir" : "Buat akun admin"}
          </h1>
          <p className="text-muted text-sm mt-1.5">
            {mode === "login"
              ? "Masukkan email dan kata sandi untuk mulai berjualan."
              : "Untuk pengaturan pertama kali warung kamu."}
          </p>

          {error && (
            <div className="mt-5 rounded-xl bg-danger/10 text-danger text-sm px-4 py-3 border border-danger/20">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            {mode === "register" && (
              <div>
                <label className="label">Nama</label>
                <input
                  className="input"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="Nama kasir/admin"
                  required
                />
              </div>
            )}
            <div>
              <label className="label">Email</label>
              <input
                type="email"
                className="input"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="nama@warung.com"
                required
              />
            </div>
            <div>
              <label className="label">Kata sandi</label>
              <input
                type="password"
                className="input"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                placeholder="••••••••"
                required
                minLength={6}
              />
            </div>
            <button type="submit" disabled={loading} className="btn-primary w-full justify-center">
              {loading ? "Memproses..." : mode === "login" ? "Masuk" : "Daftar & masuk"}
            </button>
          </form>

          <div className="mt-4 flex items-center gap-3">
            <div className="h-px bg-line flex-1" />
            <span className="text-xs text-muted">atau</span>
            <div className="h-px bg-line flex-1" />
          </div>

          {GOOGLE_CLIENT_ID ? (
            <div ref={googleBtnRef} className="mt-4 w-full flex justify-center" />
          ) : (
            <button
              type="button"
              onClick={() =>
                setError(
                  "Login Google belum dikonfigurasi. Set VITE_GOOGLE_CLIENT_ID di environment variables."
                )
              }
              className="btn-secondary w-full justify-center mt-4"
            >
              <GoogleIcon /> Lanjutkan dengan Google
            </button>
          )}

          <p className="text-sm text-muted mt-6 text-center">
            {mode === "login" ? (
              <>
                Belum punya akun?{" "}
                <button className="text-primary font-semibold" onClick={() => setMode("register")}>
                  Daftar admin
                </button>
              </>
            ) : (
              <>
                Sudah punya akun?{" "}
                <button className="text-primary font-semibold" onClick={() => setMode("login")}>
                  Masuk
                </button>
              </>
            )}
          </p>
        </div>
      </div>
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4">
      <path fill="#4285F4" d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.5h6.5c-.3 1.5-1.1 2.7-2.4 3.6v3h3.9c2.3-2.1 3.5-5.2 3.5-8.8Z" />
      <path fill="#34A853" d="M12 24c3.2 0 6-1.1 7.9-2.9l-3.9-3c-1.1.7-2.4 1.2-4 1.2-3.1 0-5.7-2.1-6.6-4.9H1.4v3.1C3.3 21.3 7.3 24 12 24Z" />
      <path fill="#FBBC05" d="M5.4 14.4c-.2-.7-.4-1.5-.4-2.4s.1-1.6.4-2.4V6.5H1.4A12 12 0 0 0 0 12c0 1.9.5 3.8 1.4 5.5l4-3.1Z" />
      <path fill="#EA4335" d="M12 4.7c1.8 0 3.3.6 4.6 1.8l3.4-3.4C18 1.2 15.2 0 12 0 7.3 0 3.3 2.7 1.4 6.5l4 3.1c.9-2.8 3.5-4.9 6.6-4.9Z" />
    </svg>
  );
}

function WarungPattern() {
  // Ilustrasi geometris sederhana: rak dengan toples/botol, mewakili suasana warung.
  const items = [
    { x: 24, w: 34, h: 70, r: 6 },
    { x: 66, w: 26, h: 90, r: 13 },
    { x: 100, w: 30, h: 56, r: 6 },
    { x: 138, w: 22, h: 100, r: 11 },
    { x: 168, w: 34, h: 64, r: 6 },
    { x: 210, w: 26, h: 84, r: 13 },
  ];
  return (
    <svg
      viewBox="0 0 260 220"
      className="absolute -right-10 -bottom-8 w-72 opacity-[0.14] pointer-events-none"
      fill="none"
    >
      <line x1="0" y1="140" x2="260" y2="140" stroke="white" strokeWidth="3" />
      <line x1="0" y1="200" x2="260" y2="200" stroke="white" strokeWidth="3" />
      {items.map((it, i) => (
        <rect
          key={i}
          x={it.x}
          y={140 - it.h}
          width={it.w}
          height={it.h}
          rx={it.r}
          stroke="white"
          strokeWidth="3"
        />
      ))}
    </svg>
  );
}
