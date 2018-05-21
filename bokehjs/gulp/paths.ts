import {resolve, join} from "path"
import {argv} from "yargs"

export const base_dir = resolve("./")

const BUILD_DIR = argv.buildDir ? resolve(argv.buildDir) : join(base_dir, "build")
const JS_BUILD_DIR = join(BUILD_DIR, "js")
const CSS_BUILD_DIR = join(BUILD_DIR, "css")

export const build_dir = {
  all: BUILD_DIR,
  js: JS_BUILD_DIR,
  css: CSS_BUILD_DIR,
  test: join(BUILD_DIR, "test"),
  types: join(JS_BUILD_DIR, "types"),
  tree: join(JS_BUILD_DIR, "tree"),
  compiler: join(JS_BUILD_DIR, "compiler"),
}

export const src_dir = {
  lib: join(base_dir, "src", "lib"),
  compiler: join(base_dir, "src", "compiler"),
  test: join(base_dir, "test"),
  examples: join(base_dir, "examples"),
}

export const lib = {
  bokehjs: {
    main: join(build_dir.tree, "main.js"),
    output: join(build_dir.js, "bokeh.js"),
  },
  api: {
    main: join(build_dir.tree, "api/main.js"),
    output: join(build_dir.js, "bokeh-api.js"),
  },
  widgets: {
    main: join(build_dir.tree, "models/widgets/main.js"),
    output: join(build_dir.js, "bokeh-widgets.js"),
  },
  tables: {
    main: join(build_dir.tree, "models/widgets/tables/main.js"),
    output: join(build_dir.js, "bokeh-tables.js"),
  },
  gl: {
    main: join(build_dir.tree, "models/glyphs/webgl/main.js"),
    output: join(build_dir.js, "bokeh-gl.js"),
  },
}

export const css = {
  sources: [
    join(build_dir.css, "bokeh.css"),
    join(build_dir.css, "bokeh-widgets.css"),
    join(build_dir.css, "bokeh-tables.css"),
  ],
}

export const less = {
  sources: [
    join(base_dir, "src/less/bokeh.less"),
    join(base_dir, "src/less/bokeh-widgets.less"),
    join(base_dir, "src/less/bokeh-tables.less"),
  ],
}
