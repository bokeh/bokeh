BUILD_DIR = "./build/"
JS_BUILD = "#{BUILD_DIR}js/"
SERVER_DIR = "../bokeh/server/static/"

module.exports =
  buildDir:
    all: BUILD_DIR
    js: JS_BUILD
    css: "#{BUILD_DIR}css/"
  serverDir:
    all: SERVER_DIR
    js: "#{SERVER_DIR}js/"
    css: "#{SERVER_DIR}css/"
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

  css:
    sources: [
      "./build/css/bokeh.css"
    ]
    watchSources: [
      "./build/css/bokeh.css",
    ]

  less:
    sources: [
      "./src/less/bokeh.less",
    ]
    watchSources: [
      "./src/less/**/**",
    ]

  test:
    watchSources: [
      "./test/**/**",
      "./src/coffee/**/**",
    ]

