export function StatCard({ label, value, hint, trend }) {
  return (
    <div className="card p-4 lg:p-5">
      <p className="text-sm text-muted">{label}</p>
      <p className="text-2xl font-bold mt-1 num">{value}</p>
      {hint && (
        <p
          className={`text-xs mt-1.5 ${
            trend === "up" ? "text-success" : trend === "down" ? "text-danger" : "text-muted"
          }`}
        >
          {hint}
        </p>
      )}
    </div>
  );
}

export function EmptyState({ title, description, action }) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-16 px-6">
      <div className="h-12 w-12 rounded-full bg-primary-soft flex items-center justify-center mb-3">
        <svg viewBox="0 0 24 24" fill="none" stroke="#C2410C" strokeWidth="1.8" className="h-6 w-6">
          <path d="M9 12h6M9 16h6M9 8h1" strokeLinecap="round" />
          <rect x="4" y="4" width="16" height="16" rx="2" />
        </svg>
      </div>
      <p className="font-semibold">{title}</p>
      {description && <p className="text-sm text-muted mt-1 max-w-sm">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function Loading({ label = "Memuat data..." }) {
  return (
    <div className="flex items-center justify-center py-16 text-muted text-sm gap-2">
      <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="3" opacity="0.25" />
        <path d="M21 12a9 9 0 0 0-9-9" stroke="#C2410C" strokeWidth="3" strokeLinecap="round" />
      </svg>
      {label}
    </div>
  );
}

export function Badge({ status }) {
  const map = {
    PAID: "bg-success/10 text-success",
    PENDING: "bg-warning/10 text-warning",
    CANCELLED: "bg-danger/10 text-danger",
    REFUNDED: "bg-muted/10 text-muted",
  };
  const label = {
    PAID: "Lunas",
    PENDING: "Menunggu",
    CANCELLED: "Dibatalkan",
    REFUNDED: "Dikembalikan",
  };
  return <span className={`badge ${map[status] || "bg-muted/10 text-muted"}`}>{label[status] || status}</span>;
}

export function ErrorBanner({ message }) {
  if (!message) return null;
  return (
    <div className="rounded-xl bg-danger/10 text-danger text-sm px-4 py-3 mb-4 border border-danger/20">
      {message}
    </div>
  );
}
