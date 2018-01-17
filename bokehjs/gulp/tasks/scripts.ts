import * as gulp from "gulp"
import * as gutil from "gulp-util"
import * as rename from "gulp-rename"
const uglify_es = require("uglify-es")
const uglify = require("gulp-uglify/composer")
import * as sourcemaps from "gulp-sourcemaps"
import * as paths from "../paths"
import * as fs from "fs"
import {join} from "path"
import {argv} from "yargs"
import * as insert from 'gulp-insert'
const stripAnsi = require('strip-ansi')
const merge = require("merge2")

const license = `/*!\n${fs.readFileSync('../LICENSE.txt', 'utf-8')}*/\n`

const ts = require('gulp-typescript')

const minify = uglify(uglify_es, console)

import {Linker, Bundle} from "../linker"

function is_partial(file: string): boolean {
  return fs.readFileSync(file, "utf8").split("\n")[0] == "/* XXX: partial */"
}

function is_excluded(code: number): boolean {
  const excluded = [
    2305, 2322, 2339, 2345, 2362, 2365, 2366, 2393,
    2415, 2459, 2461,
    2531, 2532, 2538, 2551,
    2683,
    4025,
    7005, 7006, 7009, 7010, 7015, 7016, 7017, 7019, 7027, 7030, 7031, 7034,
  ]
  return excluded.includes(code)
}

gulp.task("scripts:ts", () => {
  const errors: string[] = []

  function error(err: {message: string}) {
    const text = stripAnsi(err.message)
    errors.push(text)

    const result = text.match(/(.*)(\(\d+,\d+\): error TS(\d+):.*)/)
    if (result != null) {
      const [, file, , code] = result
      if (is_partial(file)) {
        if (is_excluded(parseInt(code))) {
          if (!(argv.include && text.includes(argv.include)))
            return
        }
      }
    }

    if (argv.filter && text.includes(argv.filter))
      return

    gutil.log(err.message)
  }

  const tsconfig = require(join(paths.src_dir.coffee, "tsconfig.json"))
  let compilerOptions = tsconfig.compilerOptions

  if (argv.es6) {
    compilerOptions.target = "ES6"
    compilerOptions.lib[0] = "es6"
  }

  if (argv.checkJs)
    compilerOptions.checkJs = true

  const prefix = paths.src_dir.coffee
  const project = gulp
    .src([`${prefix}/**/*.ts`, `${prefix}/**/*.js`])
    .pipe(sourcemaps.init())
    .pipe(ts(tsconfig.compilerOptions, ts.reporter.nullReporter()).on('error', error))

  const result = merge([
    project.js
      .pipe(sourcemaps.write("."))
      .pipe(gulp.dest(paths.build_dir.tree)),
    project.dts
      .pipe(gulp.dest(paths.build_dir.types)),
  ])
  result.on("finish", () => {
    fs.writeFileSync(join(paths.build_dir.js, "ts.log"), errors.join("\n"))
  })
  return result
})

gulp.task("scripts:compile", ["scripts:ts"])

gulp.task("scripts:bundle", ["scripts:compile"], (next: () => void) => {
  const entries = [
    paths.coffee.bokehjs.main,
    paths.coffee.api.main,
    paths.coffee.widgets.main,
    paths.coffee.tables.main,
    paths.coffee.gl.main,
  ]
  const bases = [paths.build_dir.tree, './node_modules']
  const excludes = ["node_modules/moment/moment.js"]
  const sourcemaps = argv.sourcemaps === true

  const linker = new Linker({entries, bases, excludes, sourcemaps})
  const bundles = linker.link()

  const [bokehjs, api, widgets, tables, gl] = bundles

  bokehjs.write(paths.coffee.bokehjs.output)
  api.write(paths.coffee.api.output)
  widgets.write(paths.coffee.widgets.output)
  tables.write(paths.coffee.tables.output)
  gl.write(paths.coffee.gl.output)

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
    .pipe(insert.append(license))
    .pipe(sourcemaps.write("."))
    .pipe(gulp.dest(paths.build_dir.js))
})

gulp.task("scripts", ["scripts:build", "scripts:minify"])
