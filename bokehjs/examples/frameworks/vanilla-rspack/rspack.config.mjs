import {fileURLToPath} from "node:url"

export default {
  mode: "production",
  entry: fileURLToPath(new URL("./src/main.ts", import.meta.url)),
  module: {rules: [{test: /\.ts$/, use: "ts-loader"}]},
  output: {
    clean: true,
    filename: "bundle.js",
    path: fileURLToPath(new URL("./dist", import.meta.url)),
  },
  resolve: {extensions: [".ts", ".js"]},
}
