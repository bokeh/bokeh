require("./ts-node").register({project: "./gulp/tsconfig.json"});

const paths = require("./gulp/paths");
const {build_dir} = paths;

const webpack = require("webpack");
const {join} = require("path");

const config = {
  entry: {
    "bokeh":         paths.lib.bokehjs.main,
    "bokeh-api":     paths.lib.api.main,
    "bokeh-widgets": paths.lib.widgets.main,
    "bokeh-tables":  paths.lib.tables.main,
    "bokeh-gl":      paths.lib.gl.main
  },
  output: {
    filename: "[name].js",
    path: build_dir.js,
    library: "Bokeh",
    libraryTarget: "umd"
  },
  resolve: {
    modules: [build_dir.tree, "node_modules"]
  },
  plugins: [
    new webpack.optimize.CommonsChunkPlugin({
      name: "bokeh",
    }),
    new webpack.IgnorePlugin(/moment$/)
  ]
};

module.exports = config;
