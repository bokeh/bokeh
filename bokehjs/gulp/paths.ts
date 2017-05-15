import * as path from "path"
import {argv} from "yargs"

const BUILD_DIR = argv.buildDir || "./build"
const JS_BUILD_DIR = path.join(BUILD_DIR, "js")
const CSS_BUILD_DIR = path.join(BUILD_DIR, "css")

// TODO FIXME how can we generate coffeescript and have require
// find it without putting it in src/ ? The browserify docs
// seem to say we have to put it in node_modules... maybe
// that's the answer, I don't know. Doesn't seem much better
// than putting it in src though.
const COFFEE_BUILD_DIR = path.join("./src", "coffee")
const SERVER_DIR = "../bokeh/server/static/"

export const buildDir = {
  all: BUILD_DIR,
  js: JS_BUILD_DIR,
  jsTree: path.join(JS_BUILD_DIR, "tree"),
  coffee: COFFEE_BUILD_DIR,
  css: CSS_BUILD_DIR,
}

export const serverDir = {
  all: SERVER_DIR,
  js: path.join(SERVER_DIR, "js"),
  css: path.join(SERVER_DIR, "css"),
}

export const coffee = {
  bokehjs: {
    destination: {
      full: "bokeh.js",
      fullWithPath: path.join(JS_BUILD_DIR, "bokeh.js"),
      minified: "bokeh.min.js",
    },
  },
  api: {
    destination: {
      full: "bokeh-api.js",
      fullWithPath: path.join(JS_BUILD_DIR, "bokeh-api.js"),
      minified: "bokeh-api.min.js",
    },
  },
  widgets: {
    destination: {
      full: "bokeh-widgets.js",
      fullWithPath: path.join(JS_BUILD_DIR, "bokeh-widgets.js"),
      minified: "bokeh-widgets.min.js",
    },
  },
  gl: {
    destination: {
      full: "bokeh-gl.js",
      fullWithPath: path.join(JS_BUILD_DIR, "bokeh-gl.js"),
      minified: "bokeh-gl.min.js",
    },
  },
  sources: [
    "./src/coffee/main.coffee",
    "./src/coffee/widget/main.coffee",
  ],
  watchSources: [
    "./src/coffee/**/**",
  ],
}

export const css = {
  sources: [
    path.join(CSS_BUILD_DIR, "bokeh.css"),
    path.join(CSS_BUILD_DIR, "bokeh-widgets.css"),
  ],
  watchSources: [
    path.join(CSS_BUILD_DIR, "bokeh.css"),
    path.join(CSS_BUILD_DIR, "bokeh-widgets.css"),
  ],
}

export const less = {
  sources: [
    "./src/less/bokeh.less",
    "./src/less/bokeh-widgets.less",
  ],
  watchSources: [
    "./src/less/**/**",
  ],
}

export const test = {
  watchSources: [
    "./test/**/**",
    "./src/coffee/**/**",
  ]
}
