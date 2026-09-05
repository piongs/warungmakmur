/**
 * Buat nomor invoice unik berformat INV-YYYYMMDD-XXXX
 * XXXX = urutan transaksi pada hari itu (di-lock lewat transaksi DB
 * sehingga aman dari race condition saat dua kasir checkout bersamaan).
 */
export async function generateInvoiceNumber(client) {
  const today = new Date();
  const y = today.getFullYear();
  const m = String(today.getMonth() + 1).padStart(2, "0");
  const d = String(today.getDate()).padStart(2, "0");
  const prefix = `INV-${y}${m}${d}-`;

  // Lock baris-baris invoice hari ini agar penomoran tidak bentrok.
  const { rows } = await client.query(
    `select invoice_number from transactions
     where invoice_number like $1
     order by invoice_number desc
     limit 1
     for update`,
    [`${prefix}%`]
  );

  let next = 1;
  if (rows.length > 0) {
    const last = rows[0].invoice_number;
    const lastSeq = parseInt(last.split("-")[2], 10);
    next = lastSeq + 1;
  }
  return `${prefix}${String(next).padStart(4, "0")}`;
}
