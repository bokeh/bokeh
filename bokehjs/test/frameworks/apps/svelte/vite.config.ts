import {svelte} from "@sveltejs/vite-plugin-svelte"
import {fileURLToPath, URL} from "node:url"
import {defineConfig} from "vite"

export default defineConfig({
  plugins: [svelte()],
  resolve: {
    alias: {
      "@bokeh/bokehjs": fileURLToPath(new URL("../../../../build/esm/bokeh.js", import.meta.url)),
    },
  },
  build: {
    target: "es2022",
  },
})
