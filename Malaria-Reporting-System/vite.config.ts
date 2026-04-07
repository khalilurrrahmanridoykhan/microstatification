import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig(() => ({
  base: "/malaria/",
  server: {
    host: "::",
    port: 5180,
    proxy: {
      "/api": {
        target: process.env.MALARIA_PROXY_TARGET || "http://127.0.0.1:9200",
        changeOrigin: true,
      },
    },
    hmr: {
      overlay: false,
    },
  },
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
