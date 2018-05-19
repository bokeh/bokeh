import * as gulp from "gulp"
import * as gutil from "gulp-util"
import * as cp from "child_process"
import {argv} from "yargs"
import {join} from "path"

import {compileTypeScript} from "../compiler"
import {read, write, scan, rename} from "../utils"
import * as paths from "../paths"

const coffee = require("coffeescript")

gulp.task("test:compile", (next: () => void) => {
  const success = compileTypeScript("./test/tsconfig.json", {log: gutil.log})

  if (argv.emitError && !success)
    process.exit(1)

  for (const file of scan("./test", [".coffee"])) {
    const js = coffee.compile(read(file)!, {bare: true})
    write(join("./build", rename(file, {ext: ".js"})), js)
  }

  next()
})

function mocha(files: string[], options: {coverage?: boolean} = {}): void {
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

  process.on("SIGINT", () => console.log()) // flush

  const ret = cp.spawnSync(process.execPath, args, {stdio: 'inherit', env: env})

  const {status, signal, error} = ret

  if (error != null) {
    gutil.log(`tests failed: ${error}`)
    process.exit(1)
  }

  if (status != 0) {
    const comment = signal === "SIGINT" ? "interrupted" : "failed"
    gutil.log(`tests ${comment}`)
    process.exit(1)
  }
}

gulp.task("test", ["test:compile", "defaults:generate"], (next: () => void) => {
  mocha(["./build/test/unit.js", "./build/test/defaults.js", "./build/test/size.js"])
  next()
})

gulp.task("test:unit", ["test:compile"], (next: () => void) => {
  mocha(["./build/test/unit.js"])
  next()
})

gulp.task("test:unit:coverage", ["test:compile"], (next: () => void) => {
  mocha(["./build/test/unit.js"], {coverage: true})
  next()
})

gulp.task("test:client", ["test:compile"], (next: () => void) => {
  mocha(["./build/test/client"])
  next()
})

gulp.task("test:core", ["test:compile"], (next: () => void) => {
  mocha(["./build/test/core"])
  next()
})

gulp.task("test:document", ["test:compile"], (next: () => void) => {
  mocha(["./build/test/document.js"])
  next()
})

gulp.task("test:model", ["test:compile"], (next: () => void) => {
  mocha(["./build/test/model.js"])
  next()
})

gulp.task("test:models", ["test:compile"], (next: () => void) => {
  mocha(["./build/test/models"])
  next()
})

gulp.task("test:protocol", ["test:compile"], (next: () => void) => {
  mocha(["./build/test/protocol"])
  next()
})

gulp.task("test:utils", ["test:compile"], (next: () => void) => {
  mocha(["./build/test/utils.js"])
  next()
})

gulp.task("test:defaults", ["test:compile", "defaults:generate"], (next: () => void) => {
  mocha(["./build/test/defaults.js"])
  next()
})

gulp.task("test:size", ["test:compile"], (next: () => void) => {
  mocha(["./build/test/size.js"])
  next()
})
