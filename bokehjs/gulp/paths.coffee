path = require("path")
argv = require("yargs").argv

BUILD_DIR = if typeof argv.buildDir == "string" then argv.buildDir else "./build"
JS_BUILD_DIR = path.join(BUILD_DIR, "js")
CSS_BUILD_DIR = path.join(BUILD_DIR, "css")
# TODO FIXME how can we generate coffeescript and have require
# find it without putting it in src/ ? The browserify docs
# seem to say we have to put it in node_modules... maybe
# that's the answer, I don't know. Doesn't seem much better
# than putting it in src though.
COFFEE_BUILD_DIR = path.join('./src', "coffee")
SERVER_DIR = "../bokeh/server/static/"

module.exports = {
  buildDir:
    all: BUILD_DIR
    js: JS_BUILD_DIR
    jsTree: path.join(JS_BUILD_DIR, "tree")
    coffee: COFFEE_BUILD_DIR
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
    compiler:
      destination:
        full: "bokeh-compiler.js"
        fullWithPath: path.join(JS_BUILD_DIR, "bokeh-compiler.js")
        minified: "bokeh-compiler.min.js"
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
