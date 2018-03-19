import * as gulp from "gulp"
import * as gutil from "gulp-util"
import chalk from "chalk"
import * as rename from "gulp-rename"
const uglify_es = require("uglify-es")
const uglify = require("gulp-uglify/composer")
import * as sourcemaps from "gulp-sourcemaps"
import * as paths from "../paths"
import * as fs from "fs"
import {join} from "path"
import {argv} from "yargs"
import * as insert from 'gulp-insert'
const merge = require("merge2")

const license = `/*!\n${fs.readFileSync('../LICENSE.txt', 'utf-8')}*/\n`

const ts = require('gulp-typescript')
const tslint = require('gulp-tslint')

const minify = uglify(uglify_es, console)

import {Linker, Bundle} from "../linker"

gulp.task("scripts:ts", () => {
  let n_errors = 0

  function error(err: {message: string}) {
    gutil.log(err.message)
    n_errors++
  }

  const project = ts.createProject(join(paths.src_dir.coffee, "tsconfig.json"))
  const compiler = project
    .src()
    .pipe(sourcemaps.init())
    .pipe(project(ts.reporter.nullReporter()).on("error", error))

  const result = merge([
    compiler.js
      .pipe(sourcemaps.write("."))
      .pipe(gulp.dest(paths.build_dir.tree)),
    compiler.dts
      .pipe(gulp.dest(paths.build_dir.types)),
  ])

  result.on("finish", function() {
    if (argv.emitError && n_errors > 0) {
      gutil.log(`There were ${chalk.red("" + n_errors)} TypeScript errors.`)
      process.exit(1)
    }
  })

  return result
})

gulp.task("~scripts:ts", ["scripts:ts"], () => {
  gulp.watch(join(paths.src_dir.ts, "**", "*.ts"), ["scripts:ts"])
})


gulp.task("scripts:tslint", () => {
  const srcs = [
    join(paths.src_dir.coffee),
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
    .pipe(tslint.report({emitError: false}))
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
