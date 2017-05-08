import * as gulp from "gulp"
import * as gutil from "gulp-util"
import * as through from "through"
import * as cp from "child_process"
import {Stream} from "stream"
import {argv} from "yargs"

import * as paths from "../paths"
import {buildWatchTask} from "../utils"

function mocha(options: {coverage?: boolean} = {}) {
  type This = Stream & {_files: string[] | null}

  return through(
    function(this: This, file: {path: string}) {
      if (this._files == null)
        this._files = [file.path]
      else
        this._files.push(file.path)
    },
    function(this: This) {
      const _mocha = "node_modules/mocha/bin/_mocha"

      let args: string[]
      if (!options.coverage)
        args = [_mocha]
      else
        args = ["node_modules/.bin/istanbul", "cover", _mocha, "--"]

      if (argv.debug)
        args.unshift("debug")

      args = args.concat(
        ["--compilers", "coffee:coffee-script/register,ts:ts-node/register"],
        ["--reporter", argv.reporter || "spec"],
        ["--slow", "5s"],
        ["./test/index.coffee"],
        this._files!,
      )

      const env = Object.assign({}, process.env, {
        TS_NODE_PROJECT: "./test/tsconfig.json"
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
          this.emit("end")
      })

      process.on('exit',    () => proc.kill())
      process.on("SIGTERM", () => proc.kill("SIGTERM"))
      process.on("SIGINT",  () => proc.kill("SIGINT"))
    }
  )
}

gulp.task("test", ["defaults:generate"], () => {
  gulp.src(["./test/unit.coffee", "./test/defaults.coffee", "./test/size"]).pipe(mocha())
})

gulp.task("test:unit", () => {
  gulp.src(["./test/unit.coffee"]).pipe(mocha())
})

gulp.task("test:unit:coverage", () => {
  gulp.src(["./test/unit.coffee"]).pipe(mocha({coverage: true}))
})

gulp.task("test:client", () => {
  gulp.src(["./test/client.coffee"]).pipe(mocha())
})

gulp.task("test:core", () => {
  gulp.src(["./test/core"]).pipe(mocha())
})

gulp.task("test:document", () => {
  gulp.src(["./test/document.coffee"]).pipe(mocha())
})

gulp.task("test:model", () => {
  gulp.src(["./test/model.coffee"]).pipe(mocha())
})

gulp.task("test:models", () => {
  gulp.src(["./test/models"]).pipe(mocha())
})

gulp.task("test:utils", () => {
  gulp.src(["./test/utils.coffee"]).pipe(mocha())
})

gulp.task("test:common", () => {
  gulp.src(["./test/common"]).pipe(mocha())
})

gulp.task("test:defaults", ["defaults:generate"], () => {
  gulp.src(["./test/defaults.coffee"]).pipe(mocha())
})

gulp.task("test:size", () => {
  gulp.src(["./test/size.coffee"]).pipe(mocha())
})

buildWatchTask("test", paths.test.watchSources)
