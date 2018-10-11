import {spawn} from "child_process"
import {argv} from "yargs"
import {join} from "path"

import {task, log, BuildError} from "../task"
import {compileTypeScript} from "../compiler"
import {read, write, scan, rename} from "../fs"
import * as paths from "../paths"

const coffee = require("coffeescript")

task("test:compile", async () => {
  const success = compileTypeScript("./test/tsconfig.json", {log})

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

  if (argv.grep)
    args.push("--grep", argv.grep)

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
        reject(new BuildError("mocha", `tests ${comment}`))
      }
    })
  })
}

task("test", ["test:compile", "defaults:generate"], async () => {
  await mocha(["./build/test/unit.js", "./build/test/defaults.js", "./build/test/size.js"])
})

task("test:unit", ["test:compile"], async () => {
  await mocha(["./build/test/unit.js"])
})

task("test:unit:coverage", ["test:compile"], async () => {
  await mocha(["./build/test/unit.js"], {coverage: true})
})

task("test:client", ["test:compile"], async () => {
  await mocha(["./build/test/client"])
})

task("test:core", ["test:compile"], async () => {
  await mocha(["./build/test/core"])
})

task("test:document", ["test:compile"], async () => {
  await mocha(["./build/test/document"])
})

task("test:model", ["test:compile"], async () => {
  await mocha(["./build/test/model.js"])
})

task("test:models", ["test:compile"], async () => {
  await mocha(["./build/test/models"])
})

task("test:protocol", ["test:compile"], async () => {
  await mocha(["./build/test/protocol"])
})

task("test:utils", ["test:compile"], async () => {
  await mocha(["./build/test/utils.js"])
})

task("test:defaults", ["test:compile", "defaults:generate"], async () => {
  await mocha(["./build/test/defaults.js"])
})

task("test:size", ["test:compile"], async () => {
  await mocha(["./build/test/size.js"])
})
