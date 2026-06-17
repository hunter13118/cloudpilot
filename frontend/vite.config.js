import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

const base = process.env.VITE_BASE_PATH || "/projects/cloudpilot/";

export default defineConfig({
  base,
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      [`${base.replace(/\/$/, "")}/api`]: {
        target: "http://localhost:8788",
        changeOrigin: true,
        rewrite: (path) => path.replace(new RegExp(`^${base.replace(/\/$/, "")}`), ""),
      },
    },
  },
  preview: { port: 4173 },
});
