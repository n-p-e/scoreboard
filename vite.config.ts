import tailwindcss from "@tailwindcss/vite"
import { tanstackStart } from "@tanstack/solid-start/plugin/vite"
import { defineConfig } from "vite"
import viteSolid from "vite-plugin-solid"

export default defineConfig({
  server: {
    port: 3000,
  },
  plugins: [tanstackStart(), viteSolid({ ssr: true }), tailwindcss()],
  build: {
    target: "es2022",
    minify: !import.meta.env.BUILD_DISABLE_MINIFY,
  },
  resolve: {
    tsconfigPaths: true,
  },
})
