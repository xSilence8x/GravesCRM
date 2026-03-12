import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  // Build output goes to Flask's static folder
  build: {
    outDir: "../app/static/react",
    emptyOutDir: true,
  },
  server: {
    host: "::",
    port: 5173,
    // During development, proxy /api calls to Flask
    proxy: {
      "/api": {
        target: "http://127.0.0.1:5000",
        changeOrigin: true,
      },
    },
  },
  plugins: [react()].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));