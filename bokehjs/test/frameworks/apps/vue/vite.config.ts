import {fileURLToPath, URL} from "node:url"
import {defineConfig} from "vite"

export default defineConfig({
  resolve: {
    alias: {
      "@bokeh/bokehjs": fileURLToPath(new URL("../../../../build/esm/bokeh.js", import.meta.url)),
    },
  },
  build: {
    target: "es2022",
  },
})
