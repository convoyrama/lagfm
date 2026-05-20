import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// @ts-expect-error process is a nodejs global
const host = process.env.TAURI_DEV_HOST;

// https://vite.dev/config/
export default defineConfig(async () => ({
  // Revertimos a ruta absoluta "/" para evitar bloqueos de MIME types en Linux AppImage
  base: "/",
  plugins: [react()],

  build: {
    // Forzamos un target de JS más antiguo y compatible con WebKitGTK 4.1
    target: "es2020",
    // Aseguramos que el CSS no sea inyectado dinámicamente sino que sea un archivo físico
    cssCodeSplit: false,
  },

  clearScreen: false,
  server: {
    port: 1420,
    strictPort: true,
    host: host || false,
    hmr: host
      ? {
          protocol: "ws",
          host,
          port: 1421,
        }
      : undefined,
    watch: {
      ignored: ["**/src-tauri/**"],
    },
  },
}));
