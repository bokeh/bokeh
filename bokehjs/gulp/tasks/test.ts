import * as gulp from "gulp"
import * as gutil from "gulp-util"
import {spawn} from "child_process"
import {argv} from "yargs"
import {join} from "path"

import {compileTypeScript} from "../compiler"
import {read, write, scan, rename} from "../utils"
import * as paths from "../paths"

const coffee = require("coffeescript")

gulp.task("test:compile", async () => {
  const success = compileTypeScript("./test/tsconfig.json", {log: gutil.log})

  if (argv.emitError && !success)
    process.exit(1)

  for (const file of scan("./test", [".coffee"])) {
    const js = coffee.compile(read(file)!, {bare: true})
    write(join("./build", rename(file, {ext: ".js"})), js)
  }
})

function mocha(files: string[], options: {coverage?: boolean} = {}): Promise<void> {
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

  const env = {
    ...process.env,
    TS_NODE_PROJECT: "./test/tsconfig.json",
    NODE_PATH: paths.build_dir.tree,
  }

  const proc = spawn(process.execPath, args, {stdio: 'inherit', env: env})

  process.once('exit',    () => proc.kill())
  process.once("SIGINT",  () => proc.kill("SIGINT"))
  process.once("SIGTERM", () => proc.kill("SIGTERM"))

  return new Promise((resolve, reject) => {
    proc.on("error", reject)
    proc.on("exit", (code, signal) => {
      if (code === 0)
        resolve()
      else {
        // By default, mocha intercepts SIGINT and returns 130 code when interrupted.
        const comment = signal === "SIGINT" || code === 130 ? "interrupted" : "failed"
        reject(new gutil.PluginError("mocha", `tests ${comment}`))
      }
    })
  })
}

gulp.task("test", ["test:compile", "defaults:generate"], async () => {
  await mocha(["./build/test/unit.js", "./build/test/defaults.js", "./build/test/size.js"])
})

gulp.task("test:unit", ["test:compile"], async () => {
  await mocha(["./build/test/unit.js"])
})

gulp.task("test:unit:coverage", ["test:compile"], async () => {
  await mocha(["./build/test/unit.js"], {coverage: true})
})

gulp.task("test:client", ["test:compile"], async () => {
  await mocha(["./build/test/client"])
})

gulp.task("test:core", ["test:compile"], async () => {
  await mocha(["./build/test/core"])
})

gulp.task("test:document", ["test:compile"], async () => {
  await mocha(["./build/test/document.js"])
})

gulp.task("test:model", ["test:compile"], async () => {
  await mocha(["./build/test/model.js"])
})

gulp.task("test:models", ["test:compile"], async () => {
  await mocha(["./build/test/models"])
})

gulp.task("test:protocol", ["test:compile"], async () => {
  await mocha(["./build/test/protocol"])
})

gulp.task("test:utils", ["test:compile"], async () => {
  await mocha(["./build/test/utils.js"])
})

gulp.task("test:defaults", ["test:compile", "defaults:generate"], async () => {
  await mocha(["./build/test/defaults.js"])
})

gulp.task("test:size", ["test:compile"], async () => {
  await mocha(["./build/test/size.js"])
})
