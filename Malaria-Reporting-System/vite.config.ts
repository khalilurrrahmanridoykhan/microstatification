import { defineConfig } from "vite";
import legacy from "@vitejs/plugin-legacy";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
// Proxy all `/api` traffic to the mock server (default) or Django, e.g.:
//   MALARIA_API_PROXY=http://127.0.0.1:8888 npm run dev:web
const malariaApiProxy = process.env.MALARIA_API_PROXY || "http://127.0.0.1:3000";

export default defineConfig(({ mode }) => ({
  base: "/malaria/",
  server: {
    host: "::",
    port: 8080,
    proxy: {
      "/api": malariaApiProxy,
    },
    hmr: {
      overlay: false,
    },
  },
  plugins: [
    react(),
    legacy({
      targets: ["defaults", "not IE 11"],
    }),
    mode === "development" && componentTagger(),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
