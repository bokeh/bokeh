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
}

export const src_dir = {
  lib: join(base_dir, "src", "lib"),
  less: join(base_dir, "src", "less"),
  compiler: join(base_dir, "src", "compiler"),
  test: join(base_dir, "test"),
  examples: join(base_dir, "examples"),
}

export const lib = {
  bokehjs: {
    main: join(build_dir.lib, "main.js"),
    legacy: join(build_dir.lib, "legacy.js"),
    output: join(build_dir.js, "bokeh.js"),
  },
  gl: {
    main: join(build_dir.lib, "models/glyphs/webgl/main.js"),
    legacy: undefined,
    output: join(build_dir.js, "bokeh-gl.js"),
  },
  api: {
    main: join(build_dir.lib, "api/main.js"),
    legacy: undefined,
    output: join(build_dir.js, "bokeh-api.js"),
  },
  widgets: {
    main: join(build_dir.lib, "models/widgets/main.js"),
    legacy: undefined,
    output: join(build_dir.js, "bokeh-widgets.js"),
  },
  tables: {
    main: join(build_dir.lib, "models/widgets/tables/main.js"),
    legacy: undefined,
    output: join(build_dir.js, "bokeh-tables.js"),
  },
}
