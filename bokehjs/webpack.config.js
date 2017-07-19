require("./ts-node").register({project: "./gulp/tsconfig.json"});

const paths = require("./gulp/paths");
const {build_dir} = paths;

const webpack = require("webpack");
const {join} = require("path");

const config = {
  entry: {
    "bokeh":         paths.coffee.bokehjs.main,
    "bokeh-api":     paths.coffee.api.main,
    "bokeh-widgets": paths.coffee.widgets.main,
    "bokeh-tables":  paths.coffee.tables.main,
    "bokeh-gl":      paths.coffee.gl.main
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
