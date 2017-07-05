require("./ts-node").register({project: "./gulp/tsconfig.json"});

const {build_dir} = require("./gulp/paths");

const webpack = require("webpack");
const {join} = require("path");

const config = {
  entry: {
    "bokeh":         join(build_dir.tree_js, "main.js"),
    "bokeh-api":     join(build_dir.tree_js, "api/main.js"),
    "bokeh-widgets": join(build_dir.tree_js, "models/widgets/main.js"),
    "bokeh-tables":  join(build_dir.tree_js, "models/widgets/tables/main.js"),
    "bokeh-gl":      join(build_dir.tree_js, "models/glyphs/webgl/main.js")
  },
  output: {
    filename: "[name].js",
    path: build_dir.js,
    library: "Bokeh",
    libraryTarget: "umd"
  },
  resolve: {
    modules: [build_dir.tree_js, "node_modules"]
  },
  plugins: [
    new webpack.optimize.CommonsChunkPlugin({
      name: "bokeh",
    }),
    new webpack.IgnorePlugin(/moment$/)
  ]
};

module.exports = config;
