import * as gulp from "gulp"
import * as gutil from "gulp-util"
import * as rename from "gulp-rename"
const change = require("gulp-change")
import chalk from "chalk"
const uglify_es = require("uglify-es")
const uglify = require("gulp-uglify/composer")
import * as sourcemaps from "gulp-sourcemaps"
import * as paths from "../paths"
import * as fs from "fs"
import * as path from "path"
import {join} from "path"
import {argv} from "yargs"
import * as insert from 'gulp-insert'
const stripAnsi = require('strip-ansi')
const merge = require("merge2")

const license = `/*!\n${fs.readFileSync('../LICENSE.txt', 'utf-8')}*/\n`

const coffee = require('gulp-coffee')
const ts = require('gulp-typescript')

const minify = uglify(uglify_es, console)

import {Linker, Bundle} from "../linker"

gulp.task("scripts:coffee", () => {
  return gulp.src('./src/coffee/**/*.coffee')
    .pipe(coffee({coffee: require("coffeescript"), bare: true}))
    .on("error", function(error: any) { console.error(error.toString()); process.exit(1) })
    .pipe(change(function(code: string) {
      const lines = code.split("\n")
      const names = new Set<string>()
      const r1 = /^export var (\w+) = \(function\(\) {$/
      const r2 = /^  return (\w+);$/
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i]
        let match = line.match(r1)
        if (match != null) {
          names.add(match[1])
          lines[i] = ""
          i++
          lines[i] =  `export ${lines[i].trim()}`
          continue
        }

        match = line.match(r2)
        if (match != null && names.has(match[1])) {
          lines[i] = ""
          i++
          lines[i] = ""
          i++
          lines[i] = ""
        }
      }
      return lines.join("\n")
    }))
    .pipe(rename((path) => path.extname = '.ts'))
    .pipe(gulp.dest(paths.build_dir.tree_ts))
})

gulp.task("scripts:js", () => {
  return gulp.src('./src/coffee/**/*.js')
    .pipe(gulp.dest(paths.build_dir.tree_ts))
})

gulp.task("scripts:ts", () => {
  return gulp.src('./src/coffee/**/*.ts')
    .pipe(gulp.dest(paths.build_dir.tree_ts))
})

const tsjs_deps = (argv.fast ? [] : ["scripts:coffee"]).concat(["scripts:js", "scripts:ts"])

gulp.task("scripts:tsjs", tsjs_deps, () => {
  function error(err: {message: string}) {
    const raw = stripAnsi(err.message)
    const result = raw.match(/(.*)(\(\d+,\d+\): error TS(\d+):.*)/)

    if (result != null) {
      const [, file, rest, code] = result
      const real = path.join('src', 'coffee', ...file.split(path.sep).slice(3))
      if (fs.existsSync(real)) {
        if (code == "8010" || code == "8008") // ignore "types can be only used in *.ts files" and similar
          return

        if (argv.filter && !raw.includes(argv.filter))
          return

        gutil.log(`${chalk.red(real)}${rest}`)
        return
      }

      // XXX: can't enable "6133", because CS generates faulty code for closures
      if (["2307", "2688", "6053"].indexOf(code) != -1) {
        gutil.log(err.message)
        return
      }
    }

    if (!argv.ts)
      return

    if (typeof argv.ts === "string") {
      const keywords = argv.ts.split(",")
      for (let keyword of keywords) {
        let must = true
        if (keyword[0] == "^") {
          keyword = keyword.slice(1)
          must = false
        }
        const found = err.message.indexOf(keyword) != -1
        if (!((found && must) || (!found && !must)))
          return
      }
    }

    gutil.log(err.message)
  }

  const tsconfig = require(join(paths.src_dir.coffee, "tsconfig.json"))
  let compilerOptions = tsconfig.compilerOptions

  if (argv.es6) {
    compilerOptions.target = "ES6"
    compilerOptions.lib[0] = "es6"
  }

  const tree_ts = paths.build_dir.tree_ts
  const project = gulp
    .src([`${tree_ts}/**/*.ts`, `${tree_ts}/**/*.js`])
    .pipe(sourcemaps.init())
    .pipe(ts(tsconfig.compilerOptions, ts.reporter.nullReporter()).on('error', error))

  return merge([
    project.js
      .pipe(sourcemaps.write("."))
      .pipe(gulp.dest(paths.build_dir.tree_js)),
    project.dts
      .pipe(gulp.dest(paths.build_dir.types)),
  ])
})

gulp.task("scripts:compile", ["scripts:tsjs"])

gulp.task("scripts:bundle", ["scripts:compile"], (next: () => void) => {
  const entries = [
    paths.coffee.bokehjs.main,
    paths.coffee.api.main,
    paths.coffee.widgets.main,
    paths.coffee.tables.main,
    paths.coffee.gl.main,
  ]
  const bases = [paths.build_dir.tree_js, './node_modules']
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
