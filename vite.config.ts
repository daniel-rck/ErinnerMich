import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      strategies: "injectManifest",
      srcDir: "src/sw",
      filename: "sw.ts",
      registerType: "autoUpdate",
      injectRegister: "auto",
      injectManifest: {
        globPatterns: ["**/*.{js,css,html,svg,png,webmanifest}"],
      },
      manifest: {
        name: "ErinnerMich",
        short_name: "ErinnerMich",
        description:
          "Erinnern. Reflektieren. Durchatmen. Reminder, Habits, Mood und Wellness-Tools — ohne Account, alles lokal im Browser.",
        theme_color: "#7c3aed",
        background_color: "#0b0b10",
        display: "standalone",
        start_url: "/",
        scope: "/",
        lang: "de",
        icons: [
          {
            src: "/logo.svg",
            sizes: "any",
            type: "image/svg+xml",
            purpose: "any",
          },
          {
            src: "/logo-maskable.svg",
            sizes: "any",
            type: "image/svg+xml",
            purpose: "maskable",
          },
        ],
        shortcuts: [
          {
            name: "Neue Erinnerung",
            short_name: "Reminder",
            url: "/new?kind=reminder",
            icons: [{ src: "/logo.svg", sizes: "any", type: "image/svg+xml" }],
          },
          {
            name: "Neuer Habit",
            short_name: "Habit",
            url: "/new?kind=habit",
            icons: [{ src: "/logo.svg", sizes: "any", type: "image/svg+xml" }],
          },
          {
            name: "Mood loggen",
            short_name: "Mood",
            url: "/?mood=open",
            icons: [{ src: "/logo.svg", sizes: "any", type: "image/svg+xml" }],
          },
        ],
        share_target: {
          action: "/new",
          method: "GET",
          params: {
            title: "title",
            text: "title",
          },
        },
      },
      devOptions: {
        enabled: false,
      },
    }),
  ],
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./src/test/setup.ts"],
    css: true,
  },
});
