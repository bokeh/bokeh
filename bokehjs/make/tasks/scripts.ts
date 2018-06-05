import * as uglify from "uglify-js"
import {join, basename} from "path"
import {argv} from "yargs"

import {task, log} from "../task"
import {compileTypeScript} from "../compiler"
import {Linker} from "../linker"
import {read, write, rename} from "../fs"
import * as paths from "../paths"

task("scripts:ts", async () => {
  const success = compileTypeScript(join(paths.src_dir.lib, "tsconfig.json"), {
    log,
    out_dir: {js: paths.build_dir.tree, dts: paths.build_dir.types}
  })

  if (argv.emitError && !success)
    process.exit(1)
})

task("scripts:compile", ["scripts:ts"])

task("scripts:bundle", ["scripts:compile"], async () => {
  const entries = [
    paths.lib.bokehjs.main,
    paths.lib.api.main,
    paths.lib.widgets.main,
    paths.lib.tables.main,
    paths.lib.gl.main,
  ]
  const bases = [paths.build_dir.tree, './node_modules']
  const excludes = ["node_modules/moment/moment.js"]

  const linker = new Linker({entries, bases, excludes})
  const bundles = linker.link()

  const [bokehjs, api, widgets, tables, gl] = bundles

  bokehjs.write(paths.lib.bokehjs.output)
  api.write(paths.lib.api.output)
  widgets.write(paths.lib.widgets.output)
  tables.write(paths.lib.tables.output)
  gl.write(paths.lib.gl.output)
})

task("scripts:build", ["scripts:bundle"])

task("scripts:minify", ["scripts:bundle"], async () => {
  function minify(js: string): void {
    const js_map = rename(js, {ext: '.js.map'})
    const min_js = rename(js, {ext: '.min.js'})
    const min_js_map = rename(js, {ext: '.min.js.map'})

    const minify_opts = {
      output: {
        comments: /^!|copyright|license|\(c\)/i
      },
      sourceMap: {
        content: read(js_map)! as any,
        filename: basename(min_js),
        url: basename(min_js_map),
      },
    }

    const minified = uglify.minify(read(js)!, minify_opts)

    if (minified.error != null) {
      const {error: {message, line, col}} = minified as any
      throw new Error(`${js}:${line-1}:${col}: ${message}`)
    }

    write(min_js, minified.code)
    write(min_js_map, minified.map)
  }

  minify(paths.lib.bokehjs.output)
  minify(paths.lib.api.output)
  minify(paths.lib.widgets.output)
  minify(paths.lib.tables.output)
  minify(paths.lib.gl.output)
})

task("scripts", ["scripts:build", "scripts:minify"])
