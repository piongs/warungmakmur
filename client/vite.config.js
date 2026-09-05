import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      // Saat development: jalankan API lokal dengan `npm run api:dev` (port 4000),
      // request /api/* dari Vite otomatis diteruskan ke situ.
      "/api": {
        target: "http://localhost:4000",
        changeOrigin: true,
      },
    },
  },
});
