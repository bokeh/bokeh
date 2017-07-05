import * as browserify from "browserify"
import * as gulp from "gulp"
import * as gutil from "gulp-util"
import * as rename from "gulp-rename"
const uglify = require("gulp-uglify")
import * as sourcemaps from "gulp-sourcemaps"
const source = require('vinyl-source-stream')
const buffer = require('vinyl-buffer')
import * as paths from "../paths"
const change = require("gulp-change")
import * as fs from "fs"
import * as path from "path"
import {argv} from "yargs"
import * as insert from 'gulp-insert'
const stripAnsi = require('strip-ansi')

const license = '/*\n' + fs.readFileSync('../LICENSE.txt', 'utf-8') + '*/\n';

const gulpif = require('gulp-if')
const newer = require('gulp-newer')
const coffee = require('gulp-coffee')
const ts = require('gulp-typescript')

import {namedLabeler, Labels} from "../labeler"

gulp.task("scripts:coffee", () => {
  return gulp.src('./src/coffee/**/*.coffee')
    .pipe(gulpif(argv.incremental, newer({dest: paths.build_dir.tree_js, ext: '.js'})))
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

const tsconfig = require("../../tsconfig.json")

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

const commonOpts = {
  extensions: [".js"],
  paths: ['./node_modules', paths.build_dir.tree_js],
  insertGlobals: false,
  insertGlobalVars: {
   process: undefined,
  },
  debug: true,
}

gulp.task("scripts:bundle", ["scripts:compile"], (cb: (arg?: any) => void) => {
  const preludePath = path.resolve("./src/js/prelude.js")
  const preludeText = fs.readFileSync(preludePath, { encoding: 'utf8' })

  const bokehjsOpts = Object.assign({
    entries: [path.resolve(path.join(paths.build_dir.tree_js, 'main.js'))],
    preludePath: preludePath,
    prelude: preludeText,
  }, commonOpts)

  const bokehjs = browserify(bokehjsOpts)
  const labels: {[key: string]: Labels} = {}

  function buildBokehjs(next: (arg?: any) => void) {
    if (argv.verbose) gutil.log("Building bokehjs")
    bokehjs.exclude(path.resolve("build/js/tree/models/glyphs/webgl/index.js"))
    labels.bokehjs = namedLabeler(bokehjs, {})
    bokehjs
      .bundle()
      .pipe(source(paths.coffee.bokehjs.destination.name))
      .pipe(buffer())
      .pipe(sourcemaps.init({loadMaps: true}))
      // This solves a conflict when requirejs is loaded on the page. Backbone
      // looks for `define` before looking for `module.exports`, which eats up
      // our backbone.
      .pipe(change((content: string) => {
        return `(function() { var define = undefined; return ${content} })()`
      }))
      .pipe(change((content: string) => {
        return `window.Bokeh = Bokeh = ${content}`
      }))
      .pipe(insert.append(license))
      .pipe(sourcemaps.write('./'))
      .pipe(gulp.dest(paths.build_dir.js))
      .on('end', () => next())
  }

  const pluginPreludePath = path.resolve("./src/js/plugin-prelude.js")
  const pluginPreludeText = fs.readFileSync(pluginPreludePath, { encoding: 'utf8' })

  function mkBuildPlugin(plugin_name: string, main: string) {
    return (next: (arg?: any) => void) => {
      if (argv.verbose) gutil.log(`Building ${plugin_name}`)
      const pluginOpts = Object.assign({
        entries: [path.resolve(path.join(paths.build_dir.tree_js, main))],
        preludePath: pluginPreludePath,
        prelude: pluginPreludeText,
      }, commonOpts)
      const plugin = browserify(pluginOpts)
      plugin.exclude(path.resolve("node_modules/moment/moment.js"))
      labels[plugin_name] = namedLabeler(plugin, labels.bokehjs)
      for (const file in labels.bokehjs) {
        plugin.external(file)
      }
      plugin
        .bundle()
        .pipe(source((paths.coffee as any)[plugin_name].destination.name))
        .pipe(buffer())
        .pipe(sourcemaps.init({loadMaps: true}))
        // This solves a conflict when requirejs is loaded on the page. Backbone
        // looks for `define` before looking for `module.exports`, which eats up
        // our backbone.
        .pipe(change((content: string) => {
          return `(function() { var define = undefined; return ${content} })()`
        }))
        .pipe(insert.append(license))
        .pipe(sourcemaps.write('./'))
        .pipe(gulp.dest(paths.build_dir.js))
        .on('end', () => next())
    }
  }

  const buildAPI = mkBuildPlugin("api", "api/main.js")

  const buildWidgets = mkBuildPlugin("widgets", 'models/widgets/main.js')

  const buildTables = mkBuildPlugin("tables", 'models/widgets/tables/main.js')

  const buildGL = mkBuildPlugin("gl", "models/glyphs/webgl/main.js")

  function writeLabels(next: (arg?: any) => void) {
    const data: {[key: string]: any} = {}
    for (const name in labels) {
      const module_labels = labels[name]
      data[name] = Object.keys(module_labels).map((key) => module_labels[key]).sort()
    }
    const modulesPath = path.join(paths.build_dir.js, "modules.json")
    fs.writeFile(modulesPath, JSON.stringify(data), () => next())
  }

  buildBokehjs(() => buildAPI(() => buildWidgets(() => buildTables(() => buildGL(() => writeLabels(cb))))))
})

gulp.task("scripts:build", ["scripts:bundle"])

gulp.task("scripts:minify", ["scripts:bundle"], () => {
  return gulp.src(`${paths.build_dir.js}/!(*.min|compile).js`)
    .pipe(rename((path) => path.basename += '.min'))
    .pipe(uglify({ output: { comments: /^!|copyright|license|\(c\)/i } }))
    .pipe(insert.append(license))
    .pipe(sourcemaps.write('./'))
    .pipe(gulp.dest(paths.build_dir.js))
})

gulp.task("scripts", ["scripts:build", "scripts:minify"])
