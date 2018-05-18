import * as gulp from "gulp"
import * as gutil from "gulp-util"
import * as through from "through2"
import * as cp from "child_process"
import {argv} from "yargs"

import {compileTypeScript} from "../compiler"
import * as paths from "../paths"

import {join} from "path"

const coffee = require("gulp-coffee")

gulp.task("test:compile", () => {
  const success = compileTypeScript("./test/tsconfig.json", {log: gutil.log})

  if (argv.emitError && !success)
    process.exit(1)

  return gulp
     .src('./test/**/*.coffee')
     .pipe(coffee({coffee: require("coffeescript"), bare: true}))
     .pipe(gulp.dest(join("./build", "test")))
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
        ["--reporter", argv.reporter || "spec"],
        ["--slow", "5s"],
        ["--exit"],
        ["./build/test/index.js"],
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
    },
  )
}

gulp.task("test", ["test:compile", "defaults:generate"], () => {
  return gulp.src(["./build/test/unit.js", "./build/test/defaults.js", "./build/test/size.js"]).pipe(mocha())
})

gulp.task("test:unit", ["test:compile"], () => {
  return gulp.src(["./build/test/unit.js"]).pipe(mocha())
})

gulp.task("test:unit:coverage", ["test:compile"], () => {
  return gulp.src(["./build/test/unit.js"]).pipe(mocha({coverage: true}))
})

gulp.task("test:client", ["test:compile"], () => {
  return gulp.src(["./build/test/client"]).pipe(mocha())
})

gulp.task("test:core", ["test:compile"], () => {
  return gulp.src(["./build/test/core"]).pipe(mocha())
})

gulp.task("test:document", ["test:compile"], () => {
  return gulp.src(["./build/test/document.js"]).pipe(mocha())
})

gulp.task("test:model", ["test:compile"], () => {
  return gulp.src(["./build/test/model.js"]).pipe(mocha())
})

gulp.task("test:models", ["test:compile"], () => {
  return gulp.src(["./build/test/models"]).pipe(mocha())
})

gulp.task("test:protocol", ["test:compile"], () => {
  return gulp.src(["./build/test/protocol"]).pipe(mocha())
})

gulp.task("test:utils", ["test:compile"], () => {
  return gulp.src(["./build/test/utils.js"]).pipe(mocha())
})

gulp.task("test:defaults", ["test:compile", "defaults:generate"], () => {
  return gulp.src(["./build/test/defaults.js"]).pipe(mocha())
})

gulp.task("test:size", ["test:compile"], () => {
  return gulp.src(["./build/test/size.js"]).pipe(mocha())
})
