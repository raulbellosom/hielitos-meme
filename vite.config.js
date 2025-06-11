import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["favicon.svg", "robots.txt", "assets/*"],
      manifest: {
        name: "Hielitos Memé",
        short_name: "Hielitos",
        description: "Punto de venta offline para hielitos",
        theme_color: "#3b82f6",
        background_color: "#ffffff",
        display: "standalone",
        start_url: ".",
        icons: [
          {
            src: "/icons/icon-192x192.png",
            sizes: "192x192",
            type: "image/png",
          },
          {
            src: "/icons/icon-512x512.png",
            sizes: "512x512",
            type: "image/png",
          },
        ],
      },
      workbox: {
        // Sólo cachear js/css/html/ico/png/svg/webmanifest, NO el .wasm
        globPatterns: ["**/*.{js,css,html,ico,png,svg,webmanifest}"],
        globIgnores: ["**/sql-wasm.wasm"],
        cleanupOutdatedCaches: true,
      },
    }),
  ],
  build: {
    target: "esnext",
  },
});
