export function formatRupiah(value) {
  const n = Number(value) || 0;
  return "Rp" + n.toLocaleString("id-ID", { maximumFractionDigits: 0 });
}

export function formatDate(dateStr) {
  const d = new Date(dateStr);
  return d.toLocaleDateString("id-ID", { day: "2-digit", month: "2-digit", year: "numeric" });
}

export function formatDateTime(dateStr) {
  const d = new Date(dateStr);
  return (
    d.toLocaleDateString("id-ID", { day: "2-digit", month: "2-digit", year: "numeric" }) +
    " " +
    d.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })
  );
}

export function todayISO() {
  return new Date().toISOString().slice(0, 10);
}
