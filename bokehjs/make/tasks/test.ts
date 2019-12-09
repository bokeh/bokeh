import {spawn} from "child_process"
import {argv} from "yargs"
import {join} from "path"

import {task, log, BuildError} from "../task"
import {Linker} from "@compiler/linker"
import {default_prelude} from "@compiler/prelude"
import {compile_typescript} from "@compiler/compiler"
import * as paths from "../paths"

function mocha(files: string[]): Promise<void> {
  let args = ["node_modules/mocha/bin/_mocha"]

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

task("test:codebase:compile", async () => {
  const success = compile_typescript("./test/codebase/tsconfig.json", {log})

  if (argv.emitError && !success)
    process.exit(1)
})

task("test:size", ["test:codebase:compile"], async () => {
  await mocha(["./build/test/codebase/size.js"])
})

function bundle(name: string): void {
  const linker = new Linker({
    entries: [join(paths.build_dir.test, name, "index.js")],
    bases: [paths.build_dir.test, "./node_modules"],
    cache: join(paths.build_dir.test, `${name}.json`),
    transpile: "ES2017",
    externals: [/^@bokehjs\//],
    prelude: default_prelude({global: "Tests"}),
  })

  if (!argv.rebuild) linker.load_cache()
  const [bundle] = linker.link()
  linker.store_cache()

  bundle.assemble().write(join(paths.build_dir.test, `${name}.js`))
}

function devtools(name: string): Promise<void> {
  const grep = argv.k ?? argv.grep
  const args = ["--no-warnings", "./test/devtools", `test/${name}/index.html`, grep != null ? `--grep=${grep}` : ""]
  const proc = spawn(process.execPath, args, {stdio: 'inherit'})

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
}

task("test:compile", ["defaults:generate"], async () => {
  const success = compile_typescript("./test/tsconfig.json", {log})

  if (argv.emitError && !success)
    process.exit(1)
})

task("test:bundle", ["test:unit:bundle", "test:integration:bundle"])

task("test:unit:bundle", ["test:compile"], async () => bundle("unit"))
task("test:unit", ["test:unit:bundle"], async () => devtools("unit"))

task("test:integration:bundle", ["test:compile"], async () => bundle("integration"))
task("test:integration", ["test:integration:bundle"], async () => devtools("integration"))

task("test", ["test:size", "test:unit", "test:integration"])
