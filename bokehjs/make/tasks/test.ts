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

function mocha(files: string[]): Promise<void> {
  const _mocha = "node_modules/mocha/bin/_mocha"

  let args: string[]
  if (!argv.coverage)
    args = [_mocha]
  else
    args = ["node_modules/.bin/istanbul", "cover", _mocha, "--"]

  if (argv.debug)
    args.unshift("--inspect-brk")

  if (argv.k)
    args.push("--grep", argv.k)

  args = args.concat(
    ["--reporter", argv.reporter || "spec"],
    ["--slow", "5s"],
    ["--exit"],
    ["./build/test/index.js"],
    files,
  )

  const env = {
    ...process.env,
    NODE_PATH: paths.build_dir.lib,
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
        const comment = signal === "SIGINT" || code === 130 ? "interrupted" : "failed"
        reject(new BuildError("mocha", `tests ${comment}`))
      }
    })
  })
}

task("test:defaults", ["test:compile", "defaults:generate"], async () => {
  await mocha(["./build/test/defaults.js"])
})

task("test:size", ["test:compile"], async () => {
  await mocha(["./build/test/size.js"])
})

task("test:unit", ["test:compile"], async () => {
  await mocha(["./build/test/unit.js"])
})

task("test:integration", ["test:compile"], async () => {
  const proc = spawn(process.execPath, ["build/test/devtools.js", "test/integration.html"], {stdio: 'inherit'})

  process.once('exit',    () => proc.kill())
  process.once("SIGINT",  () => proc.kill("SIGINT"))
  process.once("SIGTERM", () => proc.kill("SIGTERM"))

  return new Promise((resolve, reject) => {
    proc.on("error", reject)
    proc.on("exit", (code, signal) => {
      if (code === 0)
        resolve()
      else {
        const comment = signal === "SIGINT" || code === 130 ? "interrupted" : "failed"
        reject(new BuildError("devtools", `tests ${comment}`))
      }
    })
  })
})

task("test", ["test:defaults", "test:size", "test:unit", "test:integration"])
