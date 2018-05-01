import * as gulp from "gulp"
import * as gutil from "gulp-util"
import chalk from "chalk"
import * as sourcemaps from "gulp-sourcemaps"
import * as paths from "../paths"
import {join, dirname, basename} from "path"
import {argv} from "yargs"
const merge = require("merge2")

const ts = require('gulp-typescript')
const tslint = require('gulp-tslint')

import {Linker} from "../linker"

gulp.task("scripts:ts", () => {
  let n_errors = 0

  function error(err: {message: string}) {
    gutil.log(err.message)
    n_errors++
  }

  const project = ts.createProject(join(paths.src_dir.lib, "tsconfig.json"))
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

function bundle(minify: boolean) {
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

  const linker = new Linker({entries, bases, excludes, sourcemaps, minify})
  const bundles = linker.link()

  function ext(path: string): string {
    return !minify ? path : join(dirname(path), basename(path, ".js") + ".min.js")
  }

  const [bokehjs, api, widgets, tables, gl] = bundles

  bokehjs.write(ext(paths.lib.bokehjs.output))
  api.write(ext(paths.lib.api.output))
  widgets.write(ext(paths.lib.widgets.output))
  tables.write(ext(paths.lib.tables.output))
  gl.write(ext(paths.lib.gl.output))
}

gulp.task("scripts:bundle", ["scripts:compile"], (next: () => void) => {
  bundle(false)
  next()
})

gulp.task("scripts:build", ["scripts:bundle"], (next: () => void) => {
  bundle(true)
  next()
})

gulp.task("scripts", ["scripts:build"])
