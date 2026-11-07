import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      // In development the Express API runs on 3001; Vite forwards /api to it.
      "/api": "http://localhost:3001",
    },
  },
  build: {
    outDir: "dist",
    sourcemap: false,
  },
});
