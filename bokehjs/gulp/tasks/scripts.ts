import * as gulp from "gulp"
import * as gutil from "gulp-util"
import * as rename from "gulp-rename"
const uglify = require("gulp-uglify")
import * as sourcemaps from "gulp-sourcemaps"
import * as paths from "../paths"
import * as fs from "fs"
import * as path from "path"
import {join} from "path"
import {argv} from "yargs"
import * as insert from 'gulp-insert'
const stripAnsi = require('strip-ansi')

const license = `/*!\n${fs.readFileSync('../LICENSE.txt', 'utf-8')}*/\n`

const coffee = require('gulp-coffee')
const ts = require('gulp-typescript')

import {Linker} from "../linker"

gulp.task("scripts:coffee", () => {
  return gulp.src('./src/coffee/**/*.coffee')
    .pipe(coffee({bare: true}))
    .pipe(rename((path) => path.extname = '.ts'))
    .pipe(gulp.dest(paths.build_dir.tree_ts))
})

gulp.task("scripts:js", () => {
  return gulp.src('./src/coffee/**/*.js')
    .pipe(rename((path) => path.extname = '.ts'))
    .pipe(gulp.dest(paths.build_dir.tree_ts))
})

gulp.task("scripts:ts", () => {
  const prefix = "./src/coffee/**"
  return gulp.src(`${prefix}/*.ts`)
    .pipe(gulp.dest(paths.build_dir.tree_ts))
})

const tsconfig = require(join(paths.src_dir.coffee, "tsconfig.json"))

gulp.task("scripts:tsjs", ["scripts:coffee", "scripts:js", "scripts:ts"], () => {
  function error(err: {message: string}) {
    const raw = stripAnsi(err.message)
    const result = raw.match(/(.*)(\(\d+,\d+\): error TS(\d+):.*)/)

    if (result != null) {
      const [, file, rest, code] = result
      const real = path.join('src', 'coffee', ...file.split(path.sep).slice(3))
      if (fs.existsSync(real)) {
        gutil.log(`${gutil.colors.red(real)}${rest}`)
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

  const tree_ts = paths.build_dir.tree_ts
  return gulp.src(`${tree_ts}/**/*.ts`)
    .pipe(sourcemaps.init())
    .pipe(ts(tsconfig.compilerOptions, ts.reporter.nullReporter()).on('error', error))
    .pipe(sourcemaps.write("."))
    .pipe(gulp.dest(paths.build_dir.tree_js))
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
  const [bokehjs, api, widgets, tables, gl] = linker.link()

  bokehjs.write(paths.coffee.bokehjs.output)
  api.write(paths.coffee.api.output)
  widgets.write(paths.coffee.widgets.output)
  tables.write(paths.coffee.tables.output)
  gl.write(paths.coffee.gl.output)

  next()
})

gulp.task("scripts:build", ["scripts:bundle"])

gulp.task("scripts:minify", ["scripts:bundle"], () => {
  return gulp.src(`${paths.build_dir.js}/!(*.min|compiler).js`)
    .pipe(sourcemaps.init({loadMaps: true}))
    .pipe(rename((path) => path.basename += '.min'))
    .pipe(uglify({ output: { comments: /^!|copyright|license|\(c\)/i } }))
    .pipe(insert.append(license))
    .pipe(sourcemaps.write("."))
    .pipe(gulp.dest(paths.build_dir.js))
})

gulp.task("scripts", ["scripts:build", "scripts:minify"])
