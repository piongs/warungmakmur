import { NavLink } from "react-router-dom";

const TABS = [
  { to: "/reports/sales", label: "Penjualan" },
  { to: "/reports/products", label: "Produk" },
  { to: "/reports/stock", label: "Stok" },
];

export function ReportTabs() {
  return (
    <div className="flex gap-1 border-b border-line mb-5 -mt-1 overflow-x-auto">
      {TABS.map((t) => (
        <NavLink
          key={t.to}
          to={t.to}
          className={({ isActive }) =>
            `px-4 py-2.5 text-sm font-semibold border-b-2 transition-colors shrink-0 ${
              isActive ? "border-primary text-primary-dark" : "border-transparent text-muted hover:text-ink"
            }`
          }
        >
          {t.label}
        </NavLink>
      ))}
    </div>
  );
}

const PRESETS = [
  { key: "today", label: "Hari ini" },
  { key: "week", label: "Minggu ini" },
  { key: "month", label: "Bulan ini" },
  { key: "custom", label: "Kustom" },
];

export function PeriodFilter({ preset, setPreset, from, to, setFrom, setTo }) {
  return (
    <div className="flex flex-wrap items-center gap-2 mb-5">
      {PRESETS.map((p) => (
        <button
          key={p.key}
          onClick={() => setPreset(p.key)}
          className={`rounded-full px-3.5 py-1.5 text-sm font-medium border transition-colors ${
            preset === p.key ? "bg-primary text-white border-primary" : "bg-white text-muted border-line"
          }`}
        >
          {p.label}
        </button>
      ))}
      {preset === "custom" && (
        <div className="flex items-center gap-2 ml-1">
          <input type="date" className="input py-1.5" value={from} onChange={(e) => setFrom(e.target.value)} />
          <span className="text-muted text-sm">s/d</span>
          <input type="date" className="input py-1.5" value={to} onChange={(e) => setTo(e.target.value)} />
        </div>
      )}
    </div>
  );
}

export function computeRange(preset, customFrom, customTo) {
  const now = new Date();
  if (preset === "today") {
    const d = now.toISOString().slice(0, 10);
    return { from: d, to: d };
  }
  if (preset === "week") {
    const day = now.getDay() || 7;
    const monday = new Date(now);
    monday.setDate(now.getDate() - day + 1);
    return { from: monday.toISOString().slice(0, 10), to: now.toISOString().slice(0, 10) };
  }
  if (preset === "month") {
    const first = new Date(now.getFullYear(), now.getMonth(), 1);
    return { from: first.toISOString().slice(0, 10), to: now.toISOString().slice(0, 10) };
  }
  return { from: customFrom, to: customTo };
}
