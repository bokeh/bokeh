import * as gulp from "gulp"
import * as gutil from "gulp-util"
import * as rename from "gulp-rename"
const uglify = require("gulp-uglify")
import * as sourcemaps from "gulp-sourcemaps"
import * as paths from "../paths"
const change = require("gulp-change")
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
import {umd, plugin_umd} from "../umd"

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
  return gulp.src([`${prefix}/*.ts`, `${prefix}/*.tsx`])
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
  return gulp.src([`${tree_ts}/**/*.ts`, `${tree_ts}/**/*.tsx`])
    .pipe(ts(tsconfig.compilerOptions, ts.reporter.nullReporter()).on('error', error))
    .pipe(change(function(this: {file: {path: string}}, content: string) {
      const prefix = path.relative(path.dirname(this.file.path), tree_ts)
      content = content.replace(/((import|from|require\s*\()\s*['"])core\//g, `$1${prefix}/core/`)
      return content
    }))
    .pipe(gulp.dest(paths.build_dir.tree_js))
})

gulp.task("scripts:compile", ["scripts:tsjs"])

gulp.task("scripts:bundle", ["scripts:compile"], (next: () => void) => {
  const tree_js = (name: string) => join(paths.build_dir.tree_js, name)

  const entries = [
    tree_js("main.js"),
    tree_js("api/main.js"),
    tree_js("models/widgets/main.js"),
    tree_js("models/widgets/tables/main.js"),
    tree_js("models/glyphs/webgl/main.js"),
  ]
  const bases = [paths.build_dir.tree_js, './node_modules']
  const excludes = ["node_modules/moment/moment.js"]

  const linker = new Linker({entries, bases, excludes})
  const {bundles: [bokehjs, api, widgets, tables, gl], modules} = linker.link()

  fs.writeFileSync(join(paths.build_dir.js, "modules.json"), JSON.stringify(modules))

  fs.writeFileSync(paths.coffee.bokehjs.destination.path,        umd(bokehjs))
  fs.writeFileSync(paths.coffee.api.destination.path,     plugin_umd(api))
  fs.writeFileSync(paths.coffee.widgets.destination.path, plugin_umd(widgets))
  fs.writeFileSync(paths.coffee.tables.destination.path,  plugin_umd(tables))
  fs.writeFileSync(paths.coffee.gl.destination.path,      plugin_umd(gl))

  next()
})

gulp.task("scripts:build", ["scripts:bundle"])

gulp.task("scripts:minify", ["scripts:bundle"], () => {
  return gulp.src(`${paths.build_dir.js}/!(*.min|compiler).js`)
    .pipe(rename((path) => path.basename += '.min'))
    .pipe(uglify({ output: { comments: /^!|copyright|license|\(c\)/i } }))
    .pipe(insert.append(license))
    .pipe(sourcemaps.write('./'))
    .pipe(gulp.dest(paths.build_dir.js))
})

gulp.task("scripts", ["scripts:build", "scripts:minify"])
