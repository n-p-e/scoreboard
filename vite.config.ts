import tailwindcss from "@tailwindcss/vite"
import { tanstackStart } from "@tanstack/solid-start/plugin/vite"
import { nitro } from "nitro/vite"
import { defineConfig } from "vite"
import solidPlugin from "vite-plugin-solid"

export default defineConfig({
  server: {
    port: 3000,
  },
  plugins: [
    tailwindcss(),
    tanstackStart(),
    nitro(),
    solidPlugin({ ssr: true }),
  ],
  build: {
    target: "es2022",
    minify: !process.env.BUILD_DISABLE_MINIFY,
    sourcemap: !process.env.BUILD_DISABLE_SOURCEMAP,
  },
  resolve: {
    tsconfigPaths: true,
  },
  optimizeDeps: {
    exclude: ["bun"],
  },
})
