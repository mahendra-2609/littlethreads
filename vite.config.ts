import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    // `npm run dev` also starts `wrangler pages dev` on 8788, which runs the real
    // Pages Functions against a local D1. Vite forwards /api there.
    proxy: { "/api": "http://localhost:8788" },
  },
  build: {
    outDir: "dist",
    sourcemap: false,
  },
});
