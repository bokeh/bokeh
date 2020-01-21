import {spawn, ChildProcess} from "child_process"
import {argv} from "yargs"
import {join} from "path"

import which from "which"

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
    shims: ["fs", "module"],
  })

  if (!argv.rebuild) linker.load_cache()
  const [bundle] = linker.link()
  linker.store_cache()

  bundle.assemble().write(join(paths.build_dir.test, `${name}.js`))
}

async function chrome(): Promise<string> {
  const names = ["chromium-browser", "chromium", "chrome", "google-chrome", "Google Chrome"]
  for (const name of names) {
    try {
      return await which(name)
    } catch {}
  }

  throw new BuildError("headless", "can't find chromium or chrome executables")
}

async function headless(): Promise<ChildProcess> {
  const cmd = await chrome()
  const args = ["--headless", "--hide-scrollbars", "--remote-debugging-port=9222"]
  const proc = spawn(cmd, args, {stdio: "pipe"})

  process.once("exit",    () => proc.kill())
  process.once("SIGINT",  () => proc.kill("SIGINT"))
  process.once("SIGTERM", () => proc.kill("SIGTERM"))

  return new Promise((resolve, reject) => {
    setTimeout(() => reject(new Error("timeout")), 5000)
    proc.on("error", reject)
    proc.stderr.on("data", (chunk) => {
      const text = `${chunk}`
      for (const line of text.split("\n")) {
        if (line.match(/DevTools listening/) != null) {
          console.log(line)
          resolve(proc)
        }
      }
    })
  })
}

function server(): Promise<ChildProcess> {
  const args = ["--no-warnings", "./test/devtools", "server"]

  if (argv.debug) {
    if (argv.debug === true)
      args.unshift("--inspect-brk")
    else
      args.unshift(`--inspect-brk=${argv.debug}`)
  }

  const proc = spawn(process.execPath, args, {stdio: ["inherit", "inherit", "inherit", "ipc"]})

  process.once("exit",    () => proc.kill())
  process.once("SIGINT",  () => proc.kill("SIGINT"))
  process.once("SIGTERM", () => proc.kill("SIGTERM"))

  return new Promise((resolve, reject) => {
    proc.on("error", reject)
    proc.on("message", (msg) => {
      if (msg == "ready")
        resolve(proc)
      else
        reject(new BuildError("devtools-server", "failed to start"))
    })
  })
}

function opt(name: string, value: unknown): string {
  return value != null ? `--${name}=${value}` : ""
}

function devtools(name: string): Promise<void> {
  const args = ["--no-warnings", "./test/devtools", `http://localhost:5777/${name}`, opt("k", argv.k), opt("grep", argv.grep)]
  const proc = spawn(process.execPath, args, {stdio: 'inherit'})

  process.once("exit",    () => proc.kill())
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

task("test:start:headless", async () => {
  await headless()
})

task("test:start:server", async () => {
  await server()
})

task("test:start", ["test:start:headless", "test:start:server"])

task("test:compile", ["defaults:generate"], async () => {
  const success = compile_typescript("./test/tsconfig.json", {log})

  if (argv.emitError && !success)
    process.exit(1)
})

task("test:bundle", ["test:unit:bundle", "test:integration:bundle"])

task("test:unit:bundle", ["test:compile"], async () => {
  bundle("unit")
})
task("test:unit", ["test:start", "test:unit:bundle"], async () => {
  await devtools("unit")
})

task("test:integration:bundle", ["test:compile"], async () => {
  bundle("integration")
})
task("test:integration", ["test:start", "test:integration:bundle"], async () => {
  await devtools("integration")
})

task("test", ["test:size", "test:unit", "test:integration"])
