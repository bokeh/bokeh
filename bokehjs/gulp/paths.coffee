JS_BUILD = "./build/js/"

module.exports =
  buildDir:
    js: JS_BUILD
    css: "./build/css/"
  coffee:
    destination:
      full: "bokeh.js"
      fullWithPath: "#{JS_BUILD}bokeh.js"
      minified: "bokeh.min.js"
    sources: [
      "./src/coffee/main.coffee"
    ]
    watchSources: [
      "./src/coffee/**/**",
    ]

  less:
    sources: [
      "./src/less/bokeh.less",
    ]
    watchSources: [
      "./src/less/**/**",
    ]
