import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import AppLayout from "../components/AppLayout";
import { Loading, EmptyState } from "../components/ui";
import { getErrorMessage } from "../utils/errors";
import api from "../api/client";
import { formatRupiah } from "../utils/format";

export default function POS() {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [cart, setCart] = useState([]); // { product, qty }
  const [discount, setDiscount] = useState(0);
  const [method, setMethod] = useState("TUNAI");
  const [cashGiven, setCashGiven] = useState("");
  const [mobileCartOpen, setMobileCartOpen] = useState(false);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    Promise.all([api.get("/products", { params: { active: true } }), api.get("/categories")]).then(
      ([p, c]) => {
        setProducts(p.data);
        setCategories(c.data);
        setLoading(false);
      }
    );
  }, []);

  const filtered = products.filter((p) => {
    const matchSearch =
      !search ||
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.code.toLowerCase().includes(search.toLowerCase());
    const matchCategory = !categoryId || p.category_id === categoryId;
    return matchSearch && matchCategory;
  });

  const subtotal = useMemo(
    () => cart.reduce((sum, i) => sum + Number(i.product.selling_price) * i.qty, 0),
    [cart]
  );
  const safeDiscount = Math.min(Number(discount) || 0, subtotal);
  const total = subtotal - safeDiscount;
  const change = method === "TUNAI" ? Math.max((Number(cashGiven) || 0) - total, 0) : 0;

  function addToCart(product) {
    setCart((prev) => {
      const existing = prev.find((i) => i.product.id === product.id);
      if (existing) {
        if (existing.qty >= product.stock) return prev;
        return prev.map((i) => (i.product.id === product.id ? { ...i, qty: i.qty + 1 } : i));
      }
      return [...prev, { product, qty: 1 }];
    });
  }

  function updateQty(productId, qty) {
    setCart((prev) =>
      prev
        .map((i) => (i.product.id === productId ? { ...i, qty: Math.max(qty, 0) } : i))
        .filter((i) => i.qty > 0)
    );
  }

  function removeFromCart(productId) {
    setCart((prev) => prev.filter((i) => i.product.id !== productId));
  }

  function clearCart() {
    setCart([]);
    setDiscount(0);
    setCashGiven("");
    setError("");
  }

  async function handleCheckout() {
    setError("");
    if (cart.length === 0) return;
    if (method === "TUNAI" && (Number(cashGiven) || 0) < total) {
      setError("Uang bayar kurang dari total.");
      return;
    }
    setSubmitting(true);
    try {
      const { data } = await api.post("/transactions/checkout", {
        items: cart.map((i) => ({ product_id: i.product.id, qty: i.qty })),
        discount: safeDiscount,
        payment: { method, amount: method === "TUNAI" ? Number(cashGiven) : total },
      });
      clearCart();
      navigate(`/receipt/${data.invoice_number}`);
    } catch (err) {
      setError(getErrorMessage(err, "Checkout gagal."));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AppLayout title="Kasir" subtitle="Pilih barang, sistem hitung otomatis">
      <div className="grid lg:grid-cols-[1fr_380px] gap-5 h-full">
        {/* Kolom produk */}
        <div className="flex flex-col min-h-0">
          <div className="flex gap-2 mb-4">
            <div className="relative flex-1">
              <SearchIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted" />
              <input
                className="input pl-10"
                placeholder="Cari nama atau kode produk..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>

          <div className="flex gap-2 overflow-x-auto pb-3 -mx-1 px-1">
            <CategoryChip active={!categoryId} onClick={() => setCategoryId("")} label="Semua" />
            {categories.map((c) => (
              <CategoryChip
                key={c.id}
                active={categoryId === c.id}
                onClick={() => setCategoryId(c.id)}
                label={c.name}
              />
            ))}
          </div>

          {loading ? (
            <Loading />
          ) : filtered.length === 0 ? (
            <EmptyState title="Produk tidak ditemukan" description="Coba kata kunci lain atau tambah produk baru." />
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3 overflow-y-auto pb-24 lg:pb-2">
              {filtered.map((p) => {
                const inCart = cart.find((i) => i.product.id === p.id)?.qty || 0;
                const outOfStock = p.stock <= 0;
                return (
                  <button
                    key={p.id}
                    disabled={outOfStock || inCart >= p.stock}
                    onClick={() => addToCart(p)}
                    className="card p-3.5 text-left hover:border-primary/40 hover:shadow-pop transition-all disabled:opacity-40 disabled:cursor-not-allowed relative"
                  >
                    {inCart > 0 && (
                      <span className="absolute -top-2 -right-2 h-6 w-6 rounded-full bg-primary text-white text-xs font-bold flex items-center justify-center">
                        {inCart}
                      </span>
                    )}
                    <p className="font-semibold text-sm leading-snug line-clamp-2">{p.name}</p>
                    <p className="text-xs text-muted mt-1">{p.code}</p>
                    <div className="flex items-end justify-between mt-3">
                      <p className="font-bold text-primary-dark num text-sm">
                        {formatRupiah(p.selling_price)}
                      </p>
                      <p className={`text-xs num ${outOfStock ? "text-danger" : "text-muted"}`}>
                        {outOfStock ? "Habis" : `Stok ${p.stock}`}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Panel keranjang - desktop */}
        <div className="hidden lg:block">
          <CartPanel
            cart={cart}
            subtotal={subtotal}
            discount={discount}
            setDiscount={setDiscount}
            total={total}
            method={method}
            setMethod={setMethod}
            cashGiven={cashGiven}
            setCashGiven={setCashGiven}
            change={change}
            updateQty={updateQty}
            removeFromCart={removeFromCart}
            onCheckout={handleCheckout}
            submitting={submitting}
            error={error}
          />
        </div>
      </div>

      {/* Bar mobile sticky */}
      {cart.length > 0 && (
        <button
          onClick={() => setMobileCartOpen(true)}
          className="lg:hidden fixed bottom-4 left-4 right-4 btn-primary justify-between px-5 py-3.5 shadow-pop z-30"
        >
          <span>{cart.reduce((s, i) => s + i.qty, 0)} item di keranjang</span>
          <span className="num">{formatRupiah(total)}</span>
        </button>
      )}

      {/* Drawer keranjang - mobile */}
      {mobileCartOpen && (
        <div className="lg:hidden fixed inset-0 z-40 flex flex-col justify-end">
          <div className="absolute inset-0 bg-ink/40" onClick={() => setMobileCartOpen(false)} />
          <div className="relative bg-cream rounded-t-2xl max-h-[88vh] overflow-y-auto p-4 pt-3">
            <div className="h-1.5 w-12 bg-line rounded-full mx-auto mb-3" />
            <CartPanel
              cart={cart}
              subtotal={subtotal}
              discount={discount}
              setDiscount={setDiscount}
              total={total}
              method={method}
              setMethod={setMethod}
              cashGiven={cashGiven}
              setCashGiven={setCashGiven}
              change={change}
              updateQty={updateQty}
              removeFromCart={removeFromCart}
              onCheckout={handleCheckout}
              submitting={submitting}
              error={error}
            />
          </div>
        </div>
      )}
    </AppLayout>
  );
}

function CategoryChip({ label, active, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`shrink-0 rounded-full px-3.5 py-1.5 text-sm font-medium border transition-colors ${
        active ? "bg-primary text-white border-primary" : "bg-white text-muted border-line hover:border-primary/40"
      }`}
    >
      {label}
    </button>
  );
}

function CartPanel({
  cart,
  subtotal,
  discount,
  setDiscount,
  total,
  method,
  setMethod,
  cashGiven,
  setCashGiven,
  change,
  updateQty,
  removeFromCart,
  onCheckout,
  submitting,
  error,
}) {
  return (
    <div className="card p-4 flex flex-col">
      <p className="font-semibold mb-3">Keranjang</p>

      {cart.length === 0 ? (
        <p className="text-sm text-muted py-8 text-center">Belum ada barang dipilih.</p>
      ) : (
        <div className="space-y-3 max-h-[34vh] overflow-y-auto pr-1">
          {cart.map((i) => (
            <div key={i.product.id} className="flex items-center gap-3">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{i.product.name}</p>
                <p className="text-xs text-muted num">{formatRupiah(i.product.selling_price)}</p>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  onClick={() => updateQty(i.product.id, i.qty - 1)}
                  className="h-7 w-7 rounded-lg border border-line hover:bg-cream flex items-center justify-center text-sm font-bold"
                >
                  −
                </button>
                <span className="w-6 text-center text-sm num">{i.qty}</span>
                <button
                  disabled={i.qty >= i.product.stock}
                  onClick={() => updateQty(i.product.id, i.qty + 1)}
                  className="h-7 w-7 rounded-lg border border-line hover:bg-cream flex items-center justify-center text-sm font-bold disabled:opacity-30"
                >
                  +
                </button>
              </div>
              <button
                onClick={() => removeFromCart(i.product.id)}
                className="text-muted hover:text-danger shrink-0"
                aria-label="Hapus"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-4 w-4">
                  <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" />
                </svg>
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="border-t border-line mt-4 pt-4 space-y-2.5">
        <div className="flex justify-between text-sm">
          <span className="text-muted">Subtotal</span>
          <span className="num">{formatRupiah(subtotal)}</span>
        </div>
        <div className="flex justify-between items-center text-sm">
          <span className="text-muted">Diskon</span>
          <input
            type="number"
            min={0}
            className="input w-28 text-right py-1.5 num"
            value={discount}
            onChange={(e) => setDiscount(e.target.value)}
            placeholder="0"
          />
        </div>
        <div className="flex justify-between font-bold text-base pt-1">
          <span>Total</span>
          <span className="num text-primary-dark">{formatRupiah(total)}</span>
        </div>
      </div>

      <div className="border-t border-line mt-4 pt-4 space-y-3">
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => setMethod("TUNAI")}
            className={`btn text-sm ${method === "TUNAI" ? "bg-primary text-white" : "bg-cream text-ink"}`}
          >
            Tunai
          </button>
          <button
            onClick={() => setMethod("QRIS")}
            className={`btn text-sm ${method === "QRIS" ? "bg-primary text-white" : "bg-cream text-ink"}`}
          >
            QRIS
          </button>
        </div>

        {method === "TUNAI" && (
          <div>
            <label className="label">Uang diterima</label>
            <input
              type="number"
              min={0}
              className="input num"
              value={cashGiven}
              onChange={(e) => setCashGiven(e.target.value)}
              placeholder="0"
            />
            <div className="flex justify-between text-sm mt-2">
              <span className="text-muted">Kembalian</span>
              <span className="num font-semibold">{formatRupiah(change)}</span>
            </div>
          </div>
        )}
        {method === "QRIS" && (
          <p className="text-xs text-muted bg-cream rounded-lg p-3">
            Pelanggan scan QRIS warung, konfirmasi setelah pembayaran diterima di perangkat/provider
            QRIS.
          </p>
        )}
      </div>

      {error && <p className="text-sm text-danger mt-3">{error}</p>}

      <button
        onClick={onCheckout}
        disabled={cart.length === 0 || submitting}
        className="btn-primary w-full justify-center mt-4"
      >
        {submitting ? "Memproses..." : "Bayar"}
      </button>
    </div>
  );
}

function SearchIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" {...props}>
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.5-3.5" strokeLinecap="round" />
    </svg>
  );
}
