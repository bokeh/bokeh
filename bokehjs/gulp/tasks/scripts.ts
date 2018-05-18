import * as gulp from "gulp"
import * as gutil from "gulp-util"
import * as rename from "gulp-rename"
const uglify_es = require("uglify-es")
const uglify = require("gulp-uglify/composer")
import * as sourcemaps from "gulp-sourcemaps"
import * as fs from "fs"
import {join} from "path"
import {argv} from "yargs"

const tslint = require('gulp-tslint')

const minify = uglify(uglify_es, console)

import {compileTypeScript} from "../compiler"
import {Linker, Bundle} from "../linker"
import * as paths from "../paths"

gulp.task("scripts:ts", (next: () => void) => {
  const success = compileTypeScript(join(paths.src_dir.lib, "tsconfig.json"), {
    log: gutil.log,
    out_dir: {js: paths.build_dir.tree, dts: paths.build_dir.types}
  })

  if (argv.emitError && !success)
    process.exit(1)

  next()
})

gulp.task("~scripts:ts", ["scripts:ts"], () => {
  gulp.watch(join(paths.src_dir.lib, "**", "*.ts"), ["scripts:ts"])
})

gulp.task("tslint", () => {
  const srcs = [
    join(paths.src_dir.lib),
    join(paths.base_dir, "test"),
    join(paths.base_dir, "examples"),
  ]
  return gulp
    .src(srcs.map((dir) => join(dir, "**", "*.ts")))
    .pipe(tslint({
      rulesDirectory: join(paths.base_dir, "tslint", "rules"),
      formatter: "stylish",
      fix: argv.fix || false,
    }))
    .pipe(tslint.report({summarizeFailureOutput: true}))
})

gulp.task("scripts:compile", ["scripts:ts"])

gulp.task("scripts:bundle", ["scripts:compile"], (next: () => void) => {
  const entries = [
    paths.lib.bokehjs.main,
    paths.lib.api.main,
    paths.lib.widgets.main,
    paths.lib.tables.main,
    paths.lib.gl.main,
  ]
  const bases = [paths.build_dir.tree, './node_modules']
  const excludes = ["node_modules/moment/moment.js"]
  const sourcemaps = argv.sourcemaps === true

  const linker = new Linker({entries, bases, excludes, sourcemaps})
  const bundles = linker.link()

  const [bokehjs, api, widgets, tables, gl] = bundles

  bokehjs.write(paths.lib.bokehjs.output)
  api.write(paths.lib.api.output)
  widgets.write(paths.lib.widgets.output)
  tables.write(paths.lib.tables.output)
  gl.write(paths.lib.gl.output)

  if (argv.stats) {
    const minify_opts = {
      output: {
        comments: /^!|copyright|license|\(c\)/i
      }
    }

    const entries: [string, string, boolean, number][] = []

    function collect_entries(name: string, bundle: Bundle): void {
      for (const mod of bundle.modules) {
        const minified = uglify_es.minify(mod.source, minify_opts)
        if (minified.error != null) {
          const {error: {message, line, col}} = minified
          throw new Error(`${mod.canonical}:${line-1}:${col}: ${message}`)
        } else
          entries.push([name, mod.canonical, mod.is_external, minified.code.length])
      }
    }

    collect_entries("bokehjs", bokehjs)
    collect_entries("api", api)
    collect_entries("widgets", widgets)
    collect_entries("tables", tables)
    collect_entries("gl", gl)

    const csv = entries.map(([name, mod, external, minified]) => `${name},${mod},${external},${minified}`).join("\n")
    const header = "bundle,module,external,minified\n"
    fs.writeFileSync(join(paths.build_dir.js, "stats.csv"), header + csv)
  }

  next()
})

gulp.task("scripts:build", ["scripts:bundle"])

gulp.task("scripts:minify", ["scripts:bundle"], () => {
  return gulp.src(`${paths.build_dir.js}/!(*.min|compiler).js`)
    .pipe(sourcemaps.init({loadMaps: true}))
    .pipe(rename((path) => path.basename += '.min'))
    .pipe(minify({ output: { comments: /^!|copyright|license|\(c\)/i } }))
    .pipe(sourcemaps.write("."))
    .pipe(gulp.dest(paths.build_dir.js))
})

gulp.task("scripts", ["scripts:build", "scripts:minify"])
