path = require("path")
argv = require("yargs").argv

BUILD_DIR = if typeof argv.buildDir == "string" then argv.buildDir else "./build"
JS_BUILD_DIR = path.join(BUILD_DIR, "js")
CSS_BUILD_DIR = path.join(BUILD_DIR, "css")
SERVER_DIR = "../bokeh/server/static/"

module.exports = {
  buildDir:
    all: BUILD_DIR
    js: JS_BUILD_DIR
    css: CSS_BUILD_DIR
  serverDir:
    all: SERVER_DIR
    js: path.join(SERVER_DIR, "js")
    css: path.join(SERVER_DIR, "css")

  coffee:
    bokehjs:
      destination:
        full: "bokeh.js"
        fullWithPath: path.join(JS_BUILD_DIR, "bokeh.js")
        minified: "bokeh.min.js"
    widgets:
      destination:
        full: "bokeh-widgets.js"
        fullWithPath: path.join(JS_BUILD_DIR, "bokeh-widgets.js")
        minified: "bokeh-widgets.min.js"
    sources: [
        "./src/coffee/main.coffee"
        "./src/coffee/widget/main.coffee"
    ]
    watchSources: [
      "./src/coffee/**/**"
    ]

  css:
    sources: [
      path.join(CSS_BUILD_DIR, "bokeh.css")
      path.join(CSS_BUILD_DIR, "bokeh-widgets.css")
    ]
    watchSources: [
      path.join(CSS_BUILD_DIR, "bokeh.css")
      path.join(CSS_BUILD_DIR, "bokeh-widgets.css")
    ]

  less:
    sources: [
      "./src/less/bokeh.less",
      "./src/less/bokeh-widgets.less",
    ]
    watchSources: [
      "./src/less/**/**",
    ]

  test:
    watchSources: [
      "./test/**/**",
      "./src/coffee/**/**",
    ]
}
