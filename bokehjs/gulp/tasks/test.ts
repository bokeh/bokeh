import * as gulp from "gulp"
import * as gutil from "gulp-util"
import * as through from "through2"
import * as cp from "child_process"
import chalk from "chalk"
import {argv} from "yargs"

import * as paths from "../paths"
import {buildWatchTask} from "../utils"

import {join} from "path"
const ts = require('gulp-typescript')

gulp.task("test:compile", () => {
  let n_errors = 0

  function error(err: {message: string}) {
    gutil.log(err.message)
    n_errors++
  }

  const project = ts.createProject("./test/tsconfig.json")
  const compiler = project
    .src()
    .pipe(project(ts.reporter.nullReporter()).on("error", error))

  const result = compiler
    .js
    .pipe(gulp.dest(join("./build", "test")))

  result.on("finish", function() {
    if (argv.emitError && n_errors > 0) {
      gutil.log(`There were ${chalk.red("" + n_errors)} TypeScript errors.`)
      process.exit(1)
    }
  })

  return result
})

function mocha(options: {coverage?: boolean} = {}) {
  const files: string[] = []

  return through.obj(
    function(file: {path: string}, _enc, next) {
      files.push(file.path)
      next()
    },
    function(next) {
      const _mocha = "node_modules/mocha/bin/_mocha"

      let args: string[]
      if (!options.coverage)
        args = [_mocha]
      else
        args = ["node_modules/.bin/istanbul", "cover", _mocha, "--"]

      if (argv.debug)
        args.unshift("debug")

      args = args.concat(
        ["--compilers", "coffee:coffeescript/register,ts:./ts-node/register"],
        ["--reporter", argv.reporter || "spec"],
        ["--slow", "5s"],
        ["./test/index.coffee"],
        files,
      )

      const env = Object.assign({}, process.env, {
        TS_NODE_PROJECT: "./test/tsconfig.json",
        NODE_PATH: paths.build_dir.tree,
      })

      const proc = cp.spawn(process.execPath, args, {stdio: 'inherit', env: env})

      proc.on("error", (err) => {
        this.emit("error", new gutil.PluginError("mocha", err))
      })

      proc.on("exit", (code, signal) => {
        if (code != 0) {
          const comment = signal === "SIGINT" ? "interrupted" : "failed"
          this.emit("error", new gutil.PluginError("mocha", `tests ${comment}`))
        } else
          next()
      })

      process.on('exit',    () => proc.kill())
      process.on("SIGTERM", () => proc.kill("SIGTERM"))
      process.on("SIGINT",  () => proc.kill("SIGINT"))
    }
  )
}

gulp.task("test", ["defaults:generate"], () => {
  return gulp.src(["./test/unit.coffee", "./test/defaults.ts", "./test/size.ts"]).pipe(mocha())
})

gulp.task("test:unit", () => {
  return gulp.src(["./test/unit.coffee"]).pipe(mocha())
})

gulp.task("test:unit:coverage", () => {
  return gulp.src(["./test/unit.coffee"]).pipe(mocha({coverage: true}))
})

gulp.task("test:client", () => {
  return gulp.src(["./test/client"]).pipe(mocha())
})

gulp.task("test:core", () => {
  return gulp.src(["./test/core"]).pipe(mocha())
})

gulp.task("test:document", () => {
  return gulp.src(["./test/document.coffee"]).pipe(mocha())
})

gulp.task("test:model", () => {
  return gulp.src(["./test/model.coffee"]).pipe(mocha())
})

gulp.task("test:models", () => {
  return gulp.src(["./test/models"]).pipe(mocha())
})

gulp.task("test:protocol", () => {
  return gulp.src(["./test/protocol"]).pipe(mocha())
})

gulp.task("test:utils", () => {
  return gulp.src(["./test/utils.coffee"]).pipe(mocha())
})

gulp.task("test:defaults", ["defaults:generate"], () => {
  return gulp.src(["./test/defaults.ts"]).pipe(mocha())
})

gulp.task("test:size", () => {
  return gulp.src(["./test/size.ts"]).pipe(mocha())
})

buildWatchTask("test", paths.test.watchSources)
