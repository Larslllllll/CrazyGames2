import { defineConfig } from "vite";

// base "./" → relative asset paths (required by the CrazyGames CDN).
export default defineConfig({
  base: "./",
  build: {
    target: "es2019",
    minify: "esbuild",
    sourcemap: false,
    assetsInlineLimit: 0,
    rollupOptions: { output: { manualChunks: undefined } },
  },
  server: { host: true, port: 5173 },
  preview: { host: true, port: 4173 },
});
