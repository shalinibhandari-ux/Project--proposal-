
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { VitePWA } from "vite-plugin-pwa";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),

    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["favicon.svg"],

      manifest: {
        id: "/",
        name: "Offline Ride Hailing",
        short_name: "Ride",
        description: "Book and track rides with offline support.",
        start_url: "/",
        scope: "/",
        display: "standalone",
        background_color: "#ffffff",
        theme_color: "#10284F",

        icons: [
          {
            src: "/icons/icon-512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "any",
          },
        ],
      },

      workbox: {
        globPatterns: [
          "**/*.{js,mjs,css,html,ico,png,svg,webp,pmtiles}",
        ],

        maximumFileSizeToCacheInBytes: 10 * 1024 * 1024,
        navigateFallback: "/index.html",
        cleanupOutdatedCaches: true,

        runtimeCaching: [
          {
            // Images
            urlPattern: /^https:\/\/.*\.(?:png|jpg|jpeg|svg|gif|webp)$/i,
            handler: "CacheFirst",
            options: {
              cacheName: "images-cache",
              cacheableResponse: {
                statuses: [0, 200],
              },
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 60 * 60 * 24 * 30,
              },
            },
          },

          {
            // OpenStreetMap tiles: previously viewed tiles can be reused offline.
            urlPattern: /^https:\/\/[abc]\.tile\.openstreetmap\.org\/.*$/i,
            handler: "CacheFirst",
            options: {
              cacheName: "osm-map-tiles",
              cacheableResponse: {
                statuses: [0, 200],
              },
              expiration: {
                maxEntries: 500,
                maxAgeSeconds: 60 * 60 * 24 * 30,
              },
            },
          },

          {
            // Map fonts and sprites
            urlPattern: /^https:\/\/protomaps\.github\.io\/basemaps-assets\/.*$/i,
            handler: "CacheFirst",
            options: {
              cacheName: "map-fonts-sprites",
              cacheableResponse: {
                statuses: [0, 200],
              },
              expiration: {
                maxEntries: 300,
                maxAgeSeconds: 60 * 60 * 24 * 30,
              },
            },
          },
        ],
      },
    }),
  ],
});
