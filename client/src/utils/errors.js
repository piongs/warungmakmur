/**
 * Ambil pesan error yang AMAN dirender React (selalu string, tidak pernah objek).
 * Menangani berbagai bentuk response error:
 *  - dari backend kita:        { error: "pesan..." }
 *  - dari Vercel platform:     { error: { code, message } }  (mis. 404/500 bawaan Vercel)
 *  - dari axios tanpa response (network error, CORS, dll)
 */
export function getErrorMessage(err, fallback = "Terjadi kesalahan, coba lagi.") {
  const data = err?.response?.data;

  if (typeof data?.error === "string") return data.error;
  if (typeof data?.error?.message === "string") return data.error.message;
  if (typeof data?.message === "string") return data.message;
  if (typeof err?.message === "string" && err.message !== "Network Error") return fallback;
  if (err?.message === "Network Error") {
    return "Tidak bisa terhubung ke server. Cek koneksi internet atau coba lagi.";
  }
  return fallback;
}
