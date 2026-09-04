const path = require("path")

module.exports = {
  entry: "./lib/anywidget.js",
  output: {
    filename: "anywidget.js",
    path: path.resolve(__dirname, ".."),
    library: {type: "module"},
    module: true,
  },
  experiments: {outputModule: true},
  performance: {hints: false},
}
