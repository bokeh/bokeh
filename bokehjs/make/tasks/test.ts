import {spawn} from "child_process"
import {argv} from "yargs"
import {join} from "path"

import {task, log, BuildError} from "../task"
import {compile_typescript} from "@compiler/compiler"
import * as paths from "../paths"

task("test:compile", async () => {
  const success = compile_typescript("./test/tsconfig.json", {log})

  if (argv.emitError && !success)
    process.exit(1)
})

function mocha(files: string[]): Promise<void> {
  const _mocha = "node_modules/mocha/bin/_mocha"

  let args: string[]
  if (!argv.coverage)
    args = [_mocha]
  else
    args = ['node_modules/.bin/nyc', _mocha]

  if (argv.debug) {
    if (argv.debug === true)
      args.unshift("--inspect-brk")
    else
      args.unshift(`--inspect-brk=${argv.debug}`)
  }

  if (argv.k)
    args.push("--grep", argv.k as string)

  args = args.concat(
    ["--reporter", (argv.reporter as string | undefined) || "spec"],
    ["--slow", "5s"],
    ["--exit"],
    ["./build/test/index.js"],
    files,
  )

  const env = {
    ...process.env,
    NODE_PATH: paths.build_dir.lib,
  }

  const proc = spawn(process.execPath, args, {stdio: 'inherit', env})

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

import {Linker} from "@compiler/linker"
import {default_prelude} from "@compiler/prelude"

task("test:integration:bundle", ["test:compile"], async () => {
  const linker = new Linker({
    entries: [join(paths.build_dir.test, "integration", "index.js")],
    bases: [paths.build_dir.test, "./node_modules"],
    cache: join(paths.build_dir.test, "integration.json"),
    transpile: "ES2017",
    externals: [/^@bokehjs\//],
    prelude: default_prelude({global: "Tests"}),
  })

  if (!argv.rebuild) linker.load_cache()
  const [bundle] = linker.link()
  linker.store_cache()

  bundle.assemble().write(join(paths.build_dir.test, "integration.js"))
})

task("test:integration", ["test:integration:bundle"], async () => {
  const proc = spawn(process.execPath, ["build/test/devtools.js", "test/integration/index.html"], {stdio: 'inherit'})

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
