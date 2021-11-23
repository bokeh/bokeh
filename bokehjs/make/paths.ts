import {resolve, join} from "path"
import {argv} from "yargs"

export const base_dir = resolve("./")

export const make_dir = join(base_dir, "make")

const BUILD_DIR = argv.buildDir ? resolve(argv.buildDir as string) : join(base_dir, "build")
const JS_BUILD_DIR = join(BUILD_DIR, "js")
const CSS_BUILD_DIR = join(BUILD_DIR, "css")

export const build_dir = {
  all: BUILD_DIR,
  js: JS_BUILD_DIR,
  css: CSS_BUILD_DIR,
  test: join(BUILD_DIR, "test"),
  types: join(JS_BUILD_DIR, "types"),
  lib: join(JS_BUILD_DIR, "lib"),
  compiler: join(JS_BUILD_DIR, "compiler"),
  server: join(JS_BUILD_DIR, "server"),
  packages: join(BUILD_DIR, "packages"),
}

export const src_dir = {
  lib: join(base_dir, "src", "lib"),
  less: join(base_dir, "src", "less"),
  compiler: join(base_dir, "src", "compiler"),
  server: join(base_dir, "src", "server"),
  test: join(base_dir, "test"),
  examples: join(base_dir, "examples"),
}

import {BundleDef} from "@compiler/linker"

const bokehjs: BundleDef = {
  name: "bokeh",
  main: join(build_dir.lib, "main.js"),
  output: join(build_dir.js, "bokeh.js"),
}
const gl: BundleDef = {
  name: "bokeh-gl",
  main: join(build_dir.lib, "models/glyphs/webgl/main.js"),
  output: join(build_dir.js, "bokeh-gl.js"),
  extends: [bokehjs],
}
const api: BundleDef = {
  name: "bokeh-api",
  main: join(build_dir.lib, "api/main.js"),
  output: join(build_dir.js, "bokeh-api.js"),
  extends: [bokehjs],
}
const widgets: BundleDef = {
  name: "bokeh-widgets",
  main: join(build_dir.lib, "models/widgets/main.js"),
  output: join(build_dir.js, "bokeh-widgets.js"),
  extends: [bokehjs],
}
const tables: BundleDef = {
  name: "bokeh-tables",
  main: join(build_dir.lib, "models/widgets/tables/main.js"),
  output: join(build_dir.js, "bokeh-tables.js"),
  extends: [bokehjs, widgets],
}
const mathjax: BundleDef = {
  name: "bokeh-mathjax",
  main: join(build_dir.lib, "models/text/mathjax/main.js"),
  output: join(build_dir.js, "bokeh-mathjax.js"),
  extends: [bokehjs],
}

export const lib = {bokehjs, gl, api, widgets, tables, mathjax}
