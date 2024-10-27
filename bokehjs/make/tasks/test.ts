import type {ChildProcess} from "child_process"
import {spawn} from "child_process"
import {join, delimiter, basename, extname, dirname} from "path"
import chalk from "chalk"
import which from "which"
import fs from "fs"
import os from "os"

import {argv} from "../main"
import {task, task2, success, passthrough, BuildError} from "../task"
import * as paths from "../paths"
import {platform, find_port, retry, terminate, keep_alive} from "./_util"
import {start_server as start_js_server} from "./server"

import {Linker} from "@compiler/linker"
import * as preludes from "@compiler/prelude"
import {compile_typescript} from "@compiler/compiler"

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
      if (code === 0) {
        resolve()
      } else {
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

  switch (platform) {
    case "linux": {
      path.push("/opt/google/chrome/")
      break
    }
    case "macos": {
      path.push("/Applications/Google\ Chrome.app/Contents/MacOS/")
      break
    }
    case "windows": {
      path.push("c:\\Program Files\\Google\\Chrome\\Application\\")
      path.push("c:\\Program Files (x86)\\Google\\Chrome\\Application\\")
      break
    }
  }

  return path.join(delimiter)
}

// Keep in sync with:
//   https://github.com/actions/runner-images/blob/main/images/linux/Ubuntu2204-Readme.md#browsers-and-drivers
//
// Also update:
// - bokehjs/test/devtools/devtools.ts
// - .github/workflows/bokehjs-ci.yml
// - .github/workflows/bokeh-ci.yml
const supported_chromium_revision = "r2670" // 118.0.5993.88

function chrome(): string {
  const names = [`chromium_${supported_chromium_revision}`, "chromium", "chromium-browser", "chrome", "google-chrome", "Google Chrome"]
  const path = sys_path()

  for (const name of names) {
    const executable = which.sync(name, {nothrow: true, path})
    if (executable != null) {
      return executable
    }
  }

  throw new BuildError("headless", `can't find any of ${names.join(", ")} on PATH="${path}"`)
}

function chromium_executable(): string {
  return argv.executable ?? chrome()
}

const devtools_host = argv.host

async function headless(devtools_port: number): Promise<ChildProcess> {
  const data_dir = fs.mkdtempSync(join(os.tmpdir(), "headless"))
  if (fs.existsSync(data_dir)) {
    fs.rmSync(data_dir, {recursive: true, force: true})
  }
  const args = [
    "--headless=new",
    "--no-first-run",
    `--user-data-dir=${data_dir}`,
    `--remote-debugging-address=${devtools_host}`,
    `--remote-debugging-port=${devtools_port}`,
    "--font-render-hinting=none",           // fixes measureText() on Linux with external fonts
    "--disable-font-subpixel-positioning",  // makes images look similar on all platform
    "--force-color-profile=srgb",           // ^^^
    "--force-device-scale-factor=1",        // ^^^
  ]
  const bokeh_in_docker = process.env.BOKEH_IN_DOCKER ?? ""
  if (bokeh_in_docker == "1") {
    args.push("--no-sandbox")
  }
  const exec = chromium_executable()
  const proc = spawn(exec, args, {stdio: "pipe"})

  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new BuildError("headless", `timeout starting ${exec}`))
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
      } else if (buffer.match(/bind\(\)/) != null) {
        proc.stderr.removeAllListeners()
        clearTimeout(timer)
        reject(new BuildError("headless", `can't start headless browser on port ${devtools_port}`))
      }
    })
  })
}

async function server(port: number): Promise<ChildProcess> {
  const args = ["--no-warnings", "./test/devtools", "server", `--port=${port}`]

  if (argv.debug) {
    args.unshift("--inspect-brk")
  }

  const proc = spawn(process.execPath, args, {stdio: ["inherit", "inherit", "inherit", "ipc"]})
  terminate(proc)

  return new Promise((resolve, reject) => {
    proc.on("error", reject)
    proc.on("message", (msg) => {
      if (msg == "ready") {
        resolve(proc)
      } else {
        reject(new BuildError("devtools-server", "failed to start"))
      }
    })
    proc.on("exit", (code, _signal) => {
      if (code !== 0) {
        reject(new BuildError("devtools-server", "failed to start"))
      }
    })
  })
}

function opt(name: string, value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.map((v) => `--${name}=${v}`)
  } else if (value != null) {
    return [`--${name}=${value}`]
  } else {
    return []
  }
}

function devtools(devtools_port: number, server_port: number, name: string, baselines_root?: string): Promise<void> {
  const args = [
    ...opt("keyword", argv.keyword),
    ...opt("grep", argv.grep),
    ...opt("ref", argv.ref),
    ...opt("baselines-root", baselines_root),
    ...opt("randomize", argv.randomize),
    ...opt("seed", argv.seed),
    ...opt("pedantic", argv.pedantic),
    `--screenshot=${argv.screenshot}`,
    `http://localhost:${server_port}/${name}`,
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
    `--host=${devtools_host}`,
    `--port=${devtools_port}`,
    ...user_args,
  ]

  if (argv.debug) {
    args.unshift("--inspect-brk")
  }

  const proc = spawn(process.execPath, args, {stdio: "inherit"})
  terminate(proc)

  return new Promise((resolve, reject) => {
    proc.on("error", reject)
    proc.on("exit", (code, signal) => {
      if (code === 0) {
        resolve()
      } else {
        const comment = signal === "SIGINT" || code === 130 ? "interrupted" : "failed"
        reject(new BuildError("devtools", `tests ${comment}`))
      }
    })
  })
}

task("test:info", async () => {
  const proc = await headless(9222)
  await devtools_info(9222)
  proc.kill()
})

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

  compile_typescript(`./${base_dir}/tsconfig.json`, !(options?.auto_index ?? false) ? {} : {
    inputs(files) {
      const imports = ['export * from "../framework"']

      for (const file of files) {
        if (file.startsWith(base_dir) && (file.endsWith(".ts") || file.endsWith(".tsx"))) {
          const ext = extname(file)
          const name = basename(file, ext)
          if (!name.startsWith("_") && !name.endsWith(".d") && name != "index") {
            const dir = dirname(file).replace(base_dir, "").replace(/^\//, "")
            const module = dir == "" ? `./${name}` : [".", ...dir.split("/"), name].join("/")
            imports.push(`import "${module}"`)
          }
        }
      }

      const index = `${base_dir}/index.ts`

      if (fs.existsSync(index)) {
        const content = fs.readFileSync(index, {encoding: "utf-8"})
        imports.unshift(content)
      }

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

  if (!argv.rebuild) {
    linker.load_cache()
  }
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

  if (!status) {
    throw new BuildError(`${name}:bundle`, "unable to bundle modules")
  }
}

task("test:compile:unit", async () => compile("unit", {auto_index: true}))
export const build_unit = task("test:build:unit", [passthrough("test:compile:unit")], async () => await bundle("unit"))

task2("test:unit", [start, start_js_server, build_unit], async ([devtools_port, server_port]) => {
  await devtools(devtools_port, server_port, "unit")
  return success(undefined)
})

task("test:compile:integration", async () => compile("integration", {auto_index: true}))
export const build_integration = task("test:build:integration", [passthrough("test:compile:integration")], async () => await bundle("integration"))

task2("test:integration", [start, build_integration], async ([devtools_port, server_port]) => {
  const baselines_root = (() => {
    if (platform == "linux") {
      return "test/baselines"
    } else {
      console.log(`${chalk.yellow("warning")}: baseline testing is not supported on this platform`)
      return undefined
    }
  })()
  await devtools(devtools_port, server_port, "integration", baselines_root)
  return success(undefined)
})

async function copy_defaults() {
  const bokehjs_dir = process.cwd()
  const name = "defaults.json5"
  const src = join(bokehjs_dir, "..", "tests", "baselines", name)
  const dst = join(bokehjs_dir, "build", "test", "defaults", name)
  await fs.promises.copyFile(src, dst)
}

task("test:defaults:compile", async () => compile("defaults"))
export const build_defaults = task("test:build:defaults", [passthrough("test:defaults:compile")], async () => {
  await copy_defaults()
  await bundle("defaults")
})

task2("test:defaults", [start, build_defaults], async ([devtools_port, server_port]) => {
  await devtools(devtools_port, server_port, "defaults")
  return success(undefined)
})

task("test:build", ["test:build:defaults", "test:build:unit", "test:build:integration"])

task("test:lib", ["test:unit", "test:integration"])
task("test", ["test:codebase", "test:defaults", "test:lib"])
