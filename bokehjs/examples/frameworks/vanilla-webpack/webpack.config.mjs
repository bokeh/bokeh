import {fileURLToPath} from "node:url"

export default {
  mode: "production",
  entry: fileURLToPath(new URL("./build/main.js", import.meta.url)),
  output: {
    clean: true,
    filename: "bundle.js",
    path: fileURLToPath(new URL("./dist", import.meta.url)),
  },
  resolve: {extensions: [".js"]},
}
