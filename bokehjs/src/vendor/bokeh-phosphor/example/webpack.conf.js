module.exports = {
  entry: './example/index.ts',
  output: {
    filename: './example/bundle.js',
    libraryTarget: "var",
    library: "bokeh_phosphor"
  },
  resolve: {
    extensions: ['', '.ts', '.js']
  },
  module: {
    loaders: [
      { test: /\.ts$/, loader: 'ts-loader' },
      { test: /\.css$/, loader: 'style-loader!css-loader' },
    ]
  }
}
