import {spawn, ChildProcess} from "child_process"
import {Socket} from "net"
import {argv} from "yargs"
import {join, delimiter, basename, extname, dirname} from "path"
import os from "os"
import assert from "assert"
import chalk from "chalk"

import which from "which"

import {task, task2, success, passthrough, BuildError} from "../task"
import {Linker} from "@compiler/linker"
import * as preludes from "@compiler/prelude"
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

function terminate(proc: ChildProcess): void {
  process.once("exit",    () => proc.kill())
  process.once("SIGINT",  () => proc.kill("SIGINT"))
  process.once("SIGTERM", () => proc.kill("SIGTERM"))
}

function node(files: string[]): Promise<void> {
  const env = {
    ...process.env,
    NODE_PATH: paths.build_dir.lib,
  }

  const proc = spawn(process.execPath, files, {stdio: "inherit", env})
  terminate(proc)

  return new Promise((resolve, reject) => {
    proc.on("error", reject)
    proc.on("exit", (code, signal) => {
      if (code === 0)
        resolve()
      else {
        const comment = signal === "SIGINT" || code === 130 ? "interrupted" : "failed"
        reject(new BuildError("node", `tests ${comment}`))
      }
    })
  })
}

task("test:codebase:compile", async () => {
  compile_typescript("./test/codebase/tsconfig.json")
})

task("test:codebase", ["test:codebase:compile"], async () => {
  await node(["./build/test/codebase/index.js"])
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
      path.push("c:\\Program Files\\Google\\Chrome\\Application\\")
      path.push("c:\\Program Files (x86)\\Google\\Chrome\\Application\\")
      break
  }

  return path.join(delimiter)
}

function chrome(): string {
  const names = ["chromium", "chromium-browser", "chrome", "google-chrome", "Google Chrome"]
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
    `--remote-debugging-address=${argv.host ?? "127.0.0.1"}`,
    `--remote-debugging-port=${port}`,
    "--font-render-hinting=none",           // fixes measureText() on Linux with external fonts
    "--disable-font-subpixel-positioning",  // makes images look similar on all platform
    "--force-color-profile=srgb",           // ^^^
    "--force-device-scale-factor=1",        // ^^^
  ]
  const executable = chrome()
  const proc = spawn(executable, args, {stdio: "pipe"})

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
  terminate(proc)

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
        reject(new BuildError("devtools-server", "failed to start"))
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
    `http://localhost:${server_port}/${name}`,
    opt("k", argv.k),
    opt("grep", argv.grep),
    opt("ref", argv.ref),
    opt("baselines-root", baselines_root),
    `--screenshot=${argv.screenshot ?? "test"}`,
  ]
  return _devtools(devtools_port, args)
}

function devtools_info(devtools_port: number): Promise<void> {
  return _devtools(devtools_port, ["--info"])
}

function _devtools(devtools_port: number, user_args: string[]): Promise<void> {
  const args = [
    "--no-warnings",
    "./test/devtools",
    `--port=${devtools_port}`,
    ...user_args,
  ]

  if (argv.debug) {
    if (argv.debug === true)
      args.unshift("--inspect-brk")
    else
      args.unshift(`--inspect-brk=${argv.debug}`)
  }

  const proc = spawn(process.execPath, args, {stdio: "inherit"})
  terminate(proc)

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

async function keep_alive(): Promise<void> {
  await new Promise((resolve) => {
    process.on("SIGINT", () => resolve(undefined))
  })
}

task("test:run:headless", async () => {
  const proc = await headless(9222)
  await devtools_info(9222)
  terminate(proc)
  await keep_alive()
})

task("test:spawn:headless", async () => {
  const proc = await headless(9222)
  await devtools_info(9222)
  console.log(`Exec '${chalk.gray("kill")} ${chalk.magenta(`${proc.pid}`)}' to terminate the browser process`)
})

const start_headless = task("test:start:headless", async () => {
  let port = 9222
  await retry(async () => {
    port = await find_port(port)
    const proc = await headless(port)
    terminate(proc)
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

function compile(name: string, options?: {auto_index?: boolean}) {
  // `files` is in TS canonical form, i.e. `/` is the separator on all platforms
  const base_dir = `test/${name}`

  compile_typescript(`./${base_dir}/tsconfig.json`, !options?.auto_index ? {} : {
    inputs(files) {
      const imports = ['export * from "../framework"']

      for (const file of files) {
        if (file.startsWith(base_dir) && (file.endsWith(".ts") || file.endsWith(".tsx"))) {
          const ext = extname(file)
          const name = basename(file, ext)
          if (!name.startsWith("_") && !name.endsWith(".d")) {
            const dir = dirname(file).replace(base_dir, "").replace(/^\//, "")
            const module = dir == "" ? `./${name}` : [".", ...dir.split("/"), name].join("/")
            imports.push(`import "${module}"`)
          }
        }
      }

      const index = `${base_dir}/index.ts`
      const source = imports.join("\n")

      return new Map([[index, source]])
    },
  })
}

async function bundle(name: string): Promise<void> {
  const linker = new Linker({
    entries: [join(paths.build_dir.test, name, "index.js")],
    bases: [paths.build_dir.test, "./node_modules"],
    cache: join(paths.build_dir.test, `${name}.json`),
    target: "ES2020",
    minify: false,
    externals: [/^@bokehjs\//],
    shims: ["fs", "module"],
  })

  if (!argv.rebuild) linker.load_cache()
  const {bundles: [bundle], status} = await linker.link()
  linker.store_cache()

  const prelude = {
    main: preludes.default_prelude({global: "Tests"}),
    plugin: preludes.plugin_prelude(),
  }

  const postlude = {
    main: preludes.postlude(),
    plugin: preludes.plugin_postlude(),
  }

  bundle.assemble({prelude, postlude}).write(join(paths.build_dir.test, `${name}.js`))

  if (!status)
    throw new BuildError(`${name}:bundle`, "unable to bundle modules")
}

task("test:compile:unit", async () => compile("unit", {auto_index: true}))
const build_unit = task("test:build:unit", [passthrough("test:compile:unit")], async () => await bundle("unit"))

task2("test:unit", [start, build_unit], async ([devtools_port, server_port]) => {
  await devtools(devtools_port, server_port, "unit")
  return success(undefined)
})

task("test:compile:integration", async () => compile("integration", {auto_index: true}))
const build_integration = task("test:build:integration", [passthrough("test:compile:integration")], async () => await bundle("integration"))

task2("test:integration", [start, build_integration], async ([devtools_port, server_port]) => {
  await devtools(devtools_port, server_port, "integration", "test/baselines")
  return success(undefined)
})

task("test:defaults:compile", ["defaults:generate"], async () => compile("defaults"))
const build_defaults = task("test:build:defaults", [passthrough("test:defaults:compile")], async () => await bundle("defaults"))

task2("test:defaults", [start, build_defaults], async ([devtools_port, server_port]) => {
  await devtools(devtools_port, server_port, "defaults")
  return success(undefined)
})

task("test:build", ["test:build:defaults", "test:build:unit", "test:build:integration"])

task("test:lib", ["test:unit", "test:integration"])
task("test", ["test:codebase", "test:defaults", "test:lib"])
