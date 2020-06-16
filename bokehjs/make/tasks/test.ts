import {spawn, ChildProcess} from "child_process"
import {Socket} from "net"
import {argv} from "yargs"
import {join, delimiter} from "path"
import os from "os"
import assert from "assert"

import which from "which"

import {task, task2, success, passthrough, BuildError} from "../task"
import {Linker} from "@compiler/linker"
import {default_prelude} from "@compiler/prelude"
import {compile_typescript} from "@compiler/compiler"
import * as paths from "../paths"

async function is_available(port: number): Promise<boolean> {
  const host = "0.0.0.0"
  const timeout = 10000

  return new Promise((resolve, reject) => {
    const socket = new Socket()
    let available = false
    let failure = false

    socket.on("connect", () => {
      socket.destroy()
    })

    socket.setTimeout(timeout)
    socket.on("timeout", () => {
      failure = true
      socket.destroy()
    })

    socket.on("error", (error: NodeJS.ErrnoException) => {
      if (error.code === "ECONNREFUSED")
        available = true
    })

    socket.on("close", () => {
      if (!failure)
        resolve(available)
      else
        reject(new BuildError("net", "timeout when searching for unused port"))
    })

    socket.connect(port, host)
  })
}

async function find_port(port: number): Promise<number> {
  while (!await is_available(port)) {
    port++
  }
  return port
}

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
  compile_typescript("./test/codebase/tsconfig.json")
})

task("test:size", ["test:codebase:compile"], async () => {
  await mocha(["./build/test/codebase/size.js"])
})

function sys_path(): string {
  const path = [process.env.PATH]

  switch (os.type()) {
    case "Linux":
      path.push("/opt/google/chrome/")
      break
    case "Darwin":
      path.push("/Applications/Google\ Chrome.app/Contents/MacOS/")
      break
    case "Windows_NT":
      path.push("c:\\Program Files (x86)\\Google\\Chrome\\Application\\")
      break
  }

  return path.join(delimiter)
}

function chrome(): string {
  const names = ["chrome", "google-chrome", "Google Chrome"]
  if (os.type() == "Linux")
    names.unshift("chromium-browser", "chromium")
  const path = sys_path()

  for (const name of names) {
    const executable = which.sync(name, {nothrow: true, path})
    if (executable != null)
      return executable
  }

  throw new BuildError("headless", `can't find any of ${names.join(", ")} on PATH="${path}"`)
}

async function headless(port: number): Promise<ChildProcess> {
  const args = [
    "--headless",
    `--remote-debugging-port=${port}`,
    "--hide-scrollbars",
    "--font-render-hinting=none",
    "--disable-font-subpixel-positioning",
    "--force-color-profile=srgb",
    "--force-device-scale-factor=1",
  ]
  const executable = chrome()
  const proc = spawn(executable, args, {stdio: "pipe"})

  process.once("exit",    () => proc.kill())
  process.once("SIGINT",  () => proc.kill("SIGINT"))
  process.once("SIGTERM", () => proc.kill("SIGTERM"))

  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new BuildError("headless", `timeout starting ${executable}`))
    }, 30000)
    proc.on("error", reject)
    let buffer = ""
    proc.stderr.on("data", (chunk) => {
      buffer += `${chunk}`

      const result = buffer.match(/DevTools listening [^\n]*\n/)
      if (result != null) {
        proc.stderr.removeAllListeners()
        clearTimeout(timer)
        const [line] = result
        console.log(line.trim())
        resolve(proc)
      } else if (buffer.match(/bind\(\)/)) {
        proc.stderr.removeAllListeners()
        clearTimeout(timer)
        reject(new BuildError("headless", `can't start headless browser on port ${port}`))
      }
    })
  })
}

async function server(port: number): Promise<ChildProcess> {
  const args = ["--no-warnings", "./test/devtools", "server", `--port=${port}`]

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
    proc.on("exit", (code, _signal) => {
      if (code !== 0) {
        reject(new BuildError("devtools-server", `failed to start`))
      }
    })
  })
}

async function retry(fn: () => Promise<void>, attempts: number): Promise<void> {
  assert(attempts > 0)
  while (true) {
    if (--attempts == 0) {
      await fn()
      break
    } else {
      try {
        await fn()
        break
      } catch {}
    }
  }
}

function opt(name: string, value: unknown): string {
  return value != null ? `--${name}=${value}` : ""
}

function devtools(devtools_port: number, server_port: number, name: string, baselines_root?: string): Promise<void> {
  const args = [
    "--no-warnings",
    "./test/devtools",
    `http://localhost:${server_port}/${name}`,
    `--port=${devtools_port}`,
    opt("k", argv.k),
    opt("grep", argv.grep),
    opt("baselines-root", baselines_root),
    `--screenshot=${argv.screenshot ?? "test"}`,
  ]

  if (argv.debug) {
    if (argv.debug === true)
      args.unshift("--inspect-brk")
    else
      args.unshift(`--inspect-brk=${argv.debug}`)
  }

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

const start_headless = task("test:start:headless", async () => {
  let port = 9222
  await retry(async () => {
    port = await find_port(port)
    await headless(port)
  }, 3)
  return success(port)
})

const start_server = task("test:start:server", async () => {
  let port = 5777
  await retry(async () => {
    port = await find_port(port)
    await server(port)
  }, 3)
  return success(port)
})

const start = task2("test:start", [start_headless, start_server], async (devtools_port, server_port) => {
  return success([devtools_port, server_port] as [number, number])
})

function compile(name: string) {
  compile_typescript(`./test/${name}/tsconfig.json`)
}

function bundle(name: string): void {
  const linker = new Linker({
    entries: [join(paths.build_dir.test, name, "index.js")],
    bases: [paths.build_dir.test, "./node_modules"],
    cache: join(paths.build_dir.test, `${name}.json`),
    target: "ES2020",
    minify: false,
    externals: [/^@bokehjs\//],
    prelude: () => default_prelude({global: "Tests"}),
    shims: ["fs", "module"],
  })

  if (!argv.rebuild) linker.load_cache()
  const [bundle] = linker.link()
  linker.store_cache()

  bundle.assemble().write(join(paths.build_dir.test, `${name}.js`))
}

task("test:compile:unit", async () => compile("unit"))
const unit_bundle = task("test:unit:bundle", [passthrough("test:compile:unit")], async () => bundle("unit"))

task2("test:unit", [start, unit_bundle], async ([devtools_port, server_port]) => {
  await devtools(devtools_port, server_port, "unit")
  return success(undefined)
})

task("test:compile:integration", async () => compile("integration"))
const integration_bundle = task("test:integration:bundle", [passthrough("test:compile:integration")], async () => bundle("integration"))

task2("test:integration", [start, integration_bundle], async ([devtools_port, server_port]) => {
  await devtools(devtools_port, server_port, "integration", "test/baselines")
  return success(undefined)
})

task("test:defaults:compile", ["defaults:generate"], async () => compile("defaults"))
const defaults_bundle = task("test:defaults:bundle", [passthrough("test:defaults:compile")], async () => bundle("defaults"))

task2("test:defaults", [start, defaults_bundle], async ([devtools_port, server_port]) => {
  await devtools(devtools_port, server_port, "defaults")
  return success(undefined)
})

task("test:bundle", ["test:defaults:bundle", "test:unit:bundle", "test:integration:bundle"])
task("test:build", ["test:bundle"])

task("test:lib", ["test:unit", "test:integration"])
task("test", ["test:size", "test:defaults", "test:lib"])
