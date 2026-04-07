import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: "0.0.0.0",
    port: 5173,
    hmr: {
      overlay: false,
    },
    watch: {
      usePolling: true,
      interval: 300,
    },
    middlewareMode: false,
  },
  build: {
    // Optimize build output - use esbuild (default, faster than terser)
    minify: "esbuild",
    // Increase chunk size warning limit
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        // Optimize chunk naming without forcing manual chunk splits.
        chunkFileNames: "assets/[name]-[hash].js",
        entryFileNames: "assets/[name]-[hash].js",
        assetFileNames: "assets/[name]-[hash].[ext]",
      },
    },
    // Enable source maps for debugging (disable for production)
    sourcemap: false,
  },
});
