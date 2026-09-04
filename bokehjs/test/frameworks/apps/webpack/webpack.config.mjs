import {fileURLToPath, URL} from "node:url"

export default {
  mode: "production",
  entry: fileURLToPath(new URL("./main.ts", import.meta.url)),
  output: {
    clean: true,
    filename: "bundle.js",
    path: fileURLToPath(new URL("./dist", import.meta.url)),
  },
  module: {
    rules: [{
      test: /\.ts$/,
      use: {loader: "ts-loader", options: {transpileOnly: true, compilerOptions: {noEmit: false}}},
    }],
  },
  resolve: {
    extensions: [".ts", ".js"],
    alias: {
      "@bokeh/bokehjs": fileURLToPath(new URL("../../../../build/esm/bokeh.js", import.meta.url)),
    },
  },
}
