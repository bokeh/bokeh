import {fileURLToPath, URL} from "node:url"

export default {
  mode: "production",
  entry: fileURLToPath(new URL("../../../../build/test/frameworks/compiled/apps/webpack/main.js", import.meta.url)),
  output: {
    clean: true,
    filename: "bundle.js",
    path: fileURLToPath(new URL("./dist", import.meta.url)),
  },
  resolve: {
    extensions: [".js"],
    alias: {
      "@bokeh/bokehjs": fileURLToPath(new URL("../../../../build/esm/bokeh.js", import.meta.url)),
    },
  },
}
