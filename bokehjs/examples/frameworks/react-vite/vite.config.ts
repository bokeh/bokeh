import {defineConfig} from "vite"

const backend = process.env.BOKEH_SESSION_BACKEND ?? "http://127.0.0.1:8000"

export default defineConfig({
  build: {rolldownOptions: {input: {main: "index.html", live: "live.html", server: "server.html"}}},
  server: {
    host: "127.0.0.1",
    port: 5173,
    strictPort: true,
    proxy: {
      "/session": backend,
      "/bkapp": {target: backend, ws: true},
    },
  },
})
