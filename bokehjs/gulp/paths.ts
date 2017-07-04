import {resolve, join} from "path"
import {argv} from "yargs"

const BUILD_DIR = resolve(argv.buildDir || "./build")
const JS_BUILD_DIR = join(BUILD_DIR, "js")
const CSS_BUILD_DIR = join(BUILD_DIR, "css")

export const build_dir = {
  all: BUILD_DIR,
  js: JS_BUILD_DIR,
  css: CSS_BUILD_DIR,
  tree_js: join(JS_BUILD_DIR, "tree"),
  tree_ts: join(JS_BUILD_DIR, "tree_ts"),
}

export const coffee = {
  bokehjs: {
    destination: {
      name: "bokeh.js",
      path: join(build_dir.js, "bokeh.js"),
    },
  },
  api: {
    destination: {
      name: "bokeh-api.js",
      path: join(build_dir.js, "bokeh-api.js"),
    },
  },
  widgets: {
    destination: {
      name: "bokeh-widgets.js",
      path: join(build_dir.js, "bokeh-widgets.js"),
    },
  },
  tables: {
    destination: {
      name: "bokeh-tables.js",
      path: join(build_dir.js, "bokeh-tables.js"),
    },
  },
  gl: {
    destination: {
      name: "bokeh-gl.js",
      path: join(build_dir.js, "bokeh-gl.js"),
    },
  },
  watchSources: [
    "./src/coffee/**/**",
  ],
}

export const css = {
  sources: [
    join(build_dir.css, "bokeh.css"),
    join(build_dir.css, "bokeh-widgets.css"),
    join(build_dir.css, "bokeh-tables.css"),
  ],
  watchSources: [
    join(build_dir.css, "bokeh.css"),
    join(build_dir.css, "bokeh-widgets.css"),
    join(build_dir.css, "bokeh-tables.css"),
  ],
}

export const less = {
  sources: [
    "./src/less/bokeh.less",
    "./src/less/bokeh-widgets.less",
    "./src/less/bokeh-tables.less",
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
