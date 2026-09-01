import type {ChildProcess} from "node:child_process"
import {spawn} from "node:child_process"
import {join, delimiter, basename, extname, dirname} from "node:path"
import fs from "node:fs"
import os from "node:os"

import chalk from "chalk"
import which from "which"
import {glob} from "glob"

import {argv} from "../args.js"
import {task, task2, success, passthrough, BuildError} from "../task.js"
import * as paths from "../paths.js"
import {platform, find_port, retry, terminate, keep_alive} from "./_util.js"
import {compile_typescript} from "./_util.js"
import {start_server as start_js_server} from "./server.js"

import {Linker} from "#compiler/linker.js"
import * as preludes from "#compiler/prelude.js"

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

task("test:framework:compile", async () => {
  compile_typescript("./test/framework/tsconfig.json")
})

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
// - bokehjs/test/run-baseline-tests.mjs
const supported_chromium_revision = "r3265" // 141.0.7390.54

function chrome(): string {
  const bokeh_chrome = process.env.BOKEH_CHROME
  if (bokeh_chrome !== undefined) {
    if (fs.existsSync(bokeh_chrome)) {
      return bokeh_chrome
    } else {
      throw new BuildError("headless", `can't find BOKEH_CHROME=${bokeh_chrome}`)
    }
  }
  const names = [`chromium_${supported_chromium_revision}`, "chromium", "chromium-browser", "chrome", "google-chrome", "Google Chrome for Testing", "Google Chrome"]
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

type HeadlessProcess = {
  process: ChildProcess
  stderr: () => string
}

const expected_browser_exits = new WeakSet<ChildProcess>()

function format_chrome_stderr(stderr: string): string {
  const lines = stderr.trim().split("\n")
  const routine_noise = [
    "ERROR:dbus/",
    "ERROR:google_apis/gcm/",
    "DevTools listening",
  ]
  const relevant = lines.filter((line) => line.trim() != "" && !routine_noise.some((pattern) => line.includes(pattern)))
  if (relevant.length == 0) {
    return "(no relevant Chrome stderr; routine startup messages suppressed)"
  }
  const max_lines = 20
  if (relevant.length <= max_lines) {
    return relevant.join("\n")
  } else {
    return `[showing last ${max_lines} of ${relevant.length} relevant lines]\n${relevant.slice(-max_lines).join("\n")}`
  }
}

async function headless(devtools_port: number): Promise<HeadlessProcess> {
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
    args.push(
      "--no-sandbox",
      // Containers have no hardware GPU. Keep WebGL enabled through Chrome's
      // supported software renderer instead of disabling GPU-backed coverage.
      "--enable-unsafe-swiftshader",
    )
  }
  const exec = chromium_executable()
  const proc = spawn(exec, args, {stdio: "pipe"})
  const max_stderr = 64*1024
  let stderr = ""
  let ready = false

  const browser = await new Promise<HeadlessProcess>((resolve, reject) => {
    const reject_startup = (error: Error) => {
      expected_browser_exits.add(proc)
      if (proc.exitCode == null && proc.signalCode == null) {
        proc.kill("SIGKILL")
      }
      reject(error)
    }
    const timer = setTimeout(() => {
      reject_startup(new BuildError("headless", `timeout starting ${exec}`))
    }, 30000)
    proc.on("error", (error) => {
      clearTimeout(timer)
      reject(error)
    })
    proc.on("exit", (code, signal) => {
      clearTimeout(timer)
      if (!ready) {
        reject(new BuildError("headless", `${exec} exited during startup with code=${code} signal=${signal}`))
      } else if (!expected_browser_exits.has(proc)) {
        console.error(`Headless browser exited unexpectedly with code=${code} signal=${signal}`)
        if (stderr.trim() != "") {
          console.error(`Chrome stderr:\n${format_chrome_stderr(stderr)}`)
        }
      }
    })
    proc.stderr.on("data", (chunk) => {
      stderr += `${chunk}`
      if (stderr.length > max_stderr) {
        stderr = stderr.slice(-max_stderr)
      }

      const result = stderr.match(/DevTools listening [^\n]*\n/)
      if (!ready && result != null) {
        ready = true
        clearTimeout(timer)
        const [line] = result
        console.log(line.trim())
        resolve({process: proc, stderr: () => stderr})
      } else if (stderr.match(/bind\(\)/) != null) {
        clearTimeout(timer)
        reject_startup(new BuildError("headless", `can't start headless browser on port ${devtools_port}`))
      }
    })
  })

  return browser
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

function run_baseline_test(command: "run" | "review" | "accept", args: string[] = []): Promise<void> {
  const runner = join("test", "run-baseline-tests.mjs")
  const proc = spawn(process.execPath, [runner, command, ...args], {stdio: "inherit"})
  terminate(proc)

  return new Promise((resolve, reject) => {
    proc.on("error", reject)
    proc.on("exit", (code, signal) => {
      if (code === 0) {
        resolve()
      } else {
        const comment = signal === "SIGINT" || code === 130 ? "interrupted" : "failed"
        reject(new BuildError("baseline-test", `${command} ${comment}`))
      }
    })
  })
}

function baseline_test_options(): string[] {
  return [
    ...opt("keyword", argv.keyword),
    ...opt("grep", argv.grep),
    ...opt("ref", argv.ref),
    ...opt("randomize", argv.randomize),
    ...opt("seed", argv.seed),
    ...opt("pedantic", argv.pedantic),
    ...opt("rebuild", argv.rebuild),
    `--screenshot=${argv.screenshot}`,
  ]
}

function baseline_test_review_options(): string[] {
  const has_port = process.argv.slice(2).some((arg) => arg == "--port" || arg.startsWith("--port="))
  return has_port ? [`--port=${argv.port}`] : []
}

function devtools(executable: string, server_port: number, name: string, baselines_root?: string, dev: boolean = true): Promise<void> {
  const args = [
    ...opt("keyword", argv.keyword),
    ...opt("grep", argv.grep),
    ...opt("ref", argv.ref),
    ...opt("baselines-root", baselines_root),
    ...opt("randomize", argv.randomize),
    ...opt("seed", argv.seed),
    ...opt("pedantic", argv.pedantic),
    `--screenshot=${argv.screenshot}`,
    `http://localhost:${server_port}/${name}${!dev ? "?dev=false" : ""}`,
  ]
  return _devtools(executable, args)
}

function devtools_info(executable: string): Promise<void> {
  return _devtools(executable, ["--info"])
}

function _devtools(executable: string, user_args: string[]): Promise<void> {
  const args = [
    "--no-warnings",
    "./test/devtools",
    `--executable=${executable}`,
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
  await devtools_info(chromium_executable())
})

task("test:run:headless", async () => {
  const {process: proc} = await headless(9222)
  terminate(proc)
  await keep_alive()
})

task("test:spawn:headless", async () => {
  const {process: proc} = await headless(9222)
  console.log(`Exec '${chalk.gray("kill")} ${chalk.magenta(`${proc.pid}`)}' to terminate the browser process`)
})

const start_server = task("test:start:server", async () => {
  let port = 5777
  await retry(async () => {
    port = await find_port(port)
    await server(port)
  }, 3)
  return success(port)
})

const start = task2("test:start", [start_server], async (server_port) => {
  return success(server_port)
})

async function tsc(name: string) {
  compile_typescript(join(paths.src_dir.test, name, "tsconfig.json"))
}

async function auto_index(name: string): Promise<void> {
  const build_dir = join(paths.build_dir.test, name)
  const files = await glob(join(build_dir, "/**/*.js").replace(/\\/g, "/"))

  const imports = []
  for (const file of files) {
    const ext = extname(file)
    const name = basename(file, ext)
    if (!name.startsWith("_") && !name.endsWith(".d") && name != "index" && name != "auto_index") {
      const dir = dirname(file).replace(build_dir, "").replace(/^\//, "").replace(/\\/g, "/")
      const module = dir == "" ? `./${name}` : [".", ...dir.split("/"), name].join("/")
      imports.push(`import "${module}"`)
    }
  }

  const index_file = join(build_dir, "auto_index.js")
  const source = imports.join("\n")
  fs.writeFileSync(index_file, source, {encoding: "utf-8"})
}

async function bundle(name: string): Promise<void> {
  const linker = new Linker({
    entries: [join(paths.build_dir.test, name, "index.js")],
    bases: [paths.build_dir.test, "./node_modules"],
    cache: join(paths.build_dir.test, `${name}.json`),
    import_map: {
      "#framework/*": "framework/*",
      path: "#framework/path",
    },
    target: "ES2024",
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

task("test:compile:unit", [passthrough("test:framework:compile")], async () => {
  await tsc("unit")
})
task("test:auto_index:unit", async () => {
  await auto_index("unit")
})
export const build_unit = task("test:build:unit", [
  passthrough("test:compile:unit"), passthrough("test:auto_index:unit"),
], async () => {
  await bundle("unit")
})

task2("test:unit", [start, start_js_server, build_unit], async (server_port) => {
  await devtools(chromium_executable(), server_port, "unit")
  return success(undefined)
})

task2("test:unit:minified", [start, start_js_server, build_unit], async (server_port) => {
  await devtools(chromium_executable(), server_port, "unit", undefined, false)
  return success(undefined)
})

task("test:compile:integration", [passthrough("test:framework:compile")], async () => {
  await tsc("integration")
})
task("test:auto_index:integration", async () => {
  await auto_index("integration")
})
export const build_integration = task("test:build:integration", [
  passthrough("test:compile:integration"), passthrough("test:auto_index:integration"),
], async () => {
  await bundle("integration")
})

task2("test:integration", [start, build_integration], async (server_port) => {
  const baselines_root = (() => {
    if (platform == "linux") {
      return "test/baselines"
    } else {
      console.log(`${chalk.yellow("warning")}: baseline testing is not supported on this platform`)
      return undefined
    }
  })()
  await devtools(chromium_executable(), server_port, "integration", baselines_root)
  return success(undefined)
})

async function copy_defaults() {
  const bokehjs_dir = process.cwd()
  const name = "defaults.json5"
  const src = join(bokehjs_dir, "..", "tests", "baselines", name)
  const dst = join(bokehjs_dir, "build", "test", "defaults", name)
  await fs.promises.copyFile(src, dst)
}

task("test:defaults:compile", ["test:framework:compile"], async () => tsc("defaults"))
export const build_defaults = task("test:build:defaults", [passthrough("test:defaults:compile")], async () => {
  await copy_defaults()
  await bundle("defaults")
})

task2("test:defaults", [start, build_defaults], async (server_port) => {
  await devtools(chromium_executable(), server_port, "defaults")
  return success(undefined)
})

task("test:build", ["test:build:defaults", "test:build:unit", "test:build:integration"])

task("test:lib", ["test:unit", "test:integration"])
task("test", ["test:codebase", "test:defaults", "test:lib"])

task("baseline-test", async () => await run_baseline_test("run", baseline_test_options()))
task("baseline-test:review", async () => await run_baseline_test("review", baseline_test_review_options()))
task("baseline-test:accept", async () => await run_baseline_test("accept"))
