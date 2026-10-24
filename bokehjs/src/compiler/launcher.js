class CompilerSetupError extends Error {}

// Dynamic imports keep this entry usable in both CommonJS and ESM packages.
async function main() {
  const fs = await import("node:fs")
  const {spawn} = await import("node:child_process")
  const {createHash} = await import("node:crypto")
  const {homedir} = await import("node:os")
  const {delimiter, dirname, join, resolve} = await import("node:path")
  const {pathToFileURL} = await import("node:url")
  const source = join(dirname(resolve(process.argv[1])), "compiler")
  const names = ["package.json", "package-lock.json", "compiler.mjs", "compiler.mjs.map"]
  const files = names.map((name) => [name, fs.readFileSync(join(source, name))])
  const pkg = JSON.parse(files[0][1])
  const libc = process.platform == "linux" ? process.report.getReport().header.glibcVersionRuntime ?? "musl" : null
  const hash = createHash("sha256").update(JSON.stringify([1, process.platform, process.arch, process.versions.modules, libc]))
  for (const [name, contents] of files) {
    hash.update(name).update("\0").update(contents).update("\0")
  }
  const key = hash.digest("hex")
  const user_cache = process.platform == "darwin" ? join(homedir(), "Library/Caches") :
    process.platform == "win32" ? process.env.LOCALAPPDATA ?? join(homedir(), "AppData/Local") :
      process.env.XDG_CACHE_HOME ?? join(homedir(), ".cache")
  const cache = resolve(process.env.BOKEH_COMPILER_CACHE ?? join(user_cache, "bokeh/compiler"))
  const destination = join(cache, key)

  function setup_error(message) {
    return new CompilerSetupError(`${message}\nCompiler cache: ${cache} (override with BOKEH_COMPILER_CACHE).`)
  }

  function cache_error(error) {
    if (["EACCES", "EPERM", "EROFS", "ENOSPC", "ENOTDIR", "EEXIST"].includes(error.code)) {
      return setup_error(`Cannot write Bokeh's compiler cache (${error.code}). Set BOKEH_COMPILER_CACHE to a writable directory with enough free space, then retry.`)
    }
    return error
  }

  function complete(directory) {
    try {
      const marker = JSON.parse(fs.readFileSync(join(directory, "complete.json"), "utf8"))
      return marker.key == key && marker.files.length != 0 && marker.files.every(({name, size}) =>
        !name.startsWith("..") && !name.includes(":") && fs.statSync(join(directory, name)).size == size,
      )
    } catch {
      return false
    }
  }

  function npm_command() {
    const override = process.env.BOKEH_NPMJS_PATH
    if (override != null) {
      if (!fs.existsSync(override)) {
        throw setup_error(`Cannot find npm at BOKEH_NPMJS_PATH=${override}. Install npm with Node.js and set BOKEH_NPMJS_PATH to its npm-cli.js. npm is required to populate the compiler cache on first use.`)
      }
      return [process.execPath, [override]]
    }
    const bin = dirname(process.execPath)
    const candidates = [join(bin, "node_modules/npm/bin/npm-cli.js"), join(bin, "../lib/node_modules/npm/bin/npm-cli.js")]
    if (process.env.npm_execpath?.endsWith("npm-cli.js")) {
      candidates.push(process.env.npm_execpath)
    }
    for (const directory of (process.env.PATH ?? "").split(delimiter)) {
      if (directory != "") {
        candidates.push(join(directory, "node_modules/npm/bin/npm-cli.js"))
        if (process.platform != "win32") {
          candidates.push(join(directory, "npm"))
        }
      }
    }
    const cli = candidates.find((file) => fs.existsSync(file))
    if (cli == null) {
      throw setup_error("Bokeh needs npm to install its pinned compiler on first use. Install npm with Node.js or set BOKEH_NPMJS_PATH to npm-cli.js.")
    }
    const resolved = fs.realpathSync(cli)
    return resolved.endsWith(".js") ? [process.execPath, [resolved]] : [resolved, []]
  }

  const existed = fs.existsSync(destination)
  if (!complete(destination)) {
    if (existed) {
      throw setup_error(`Bokeh's compiler cache is incomplete. Stop compiler processes, remove ${destination}, and retry.`)
    }
    const [npm, prefix] = npm_command()
    let staging
    try {
      fs.mkdirSync(cache, {recursive: true})
      staging = fs.realpathSync(fs.mkdtempSync(join(cache, `${key}.tmp-`)))
    } catch (error) {
      throw cache_error(error)
    }
    let child = null
    let interrupted = null
    const cleanup = () => fs.rmSync(staging, {recursive: true, force: true})
    const signals = ["SIGINT", "SIGTERM"].map((signal) => [signal, () => {
      interrupted = {signal, terminate: process.listenerCount(signal) == 1}
      child?.kill(signal)
    }])
    process.once("exit", cleanup)
    for (const [signal, handler] of signals) {
      process.prependListener(signal, handler)
    }
    async function run(command, args, capture = false) {
      if (interrupted != null) {
        throw new Error("Compiler installation interrupted")
      }
      return await new Promise((resolve, reject) => {
        child = spawn(command, args, {cwd: staging, stdio: ["ignore", capture ? "pipe" : process.stderr, process.stderr]})
        let output = ""
        child.stdout?.setEncoding("utf8").on("data", (chunk) => output += chunk)
        child.once("error", reject)
        child.once("close", (code, signal) => {
          child = null
          if (code == 0 && interrupted == null) {
            resolve(output)
          } else {
            reject(new Error(`Bokeh compiler setup failed (${signal ?? code}); its cache was not published.`))
          }
        })
      })
    }
    try {
      for (const [name, contents] of files) {
        fs.writeFileSync(join(staging, name), contents)
      }
      console.error("Installing Bokeh's pinned TypeScript and Rolldown compiler...")
      try {
        await run(npm, [...prefix, "ci", "--prefix", staging, "--workspaces=false", "--ignore-scripts", "--include=optional", "--no-audit", "--no-fund"])
      } catch (error) {
        if (interrupted != null) {
          throw error
        }
        throw setup_error(`${error.message}\nFirst use needs access to the npm registry unless its packages are already cached. Check npm's diagnostics above and registry/proxy settings; disable npm_config_offline and run a compilation with network access to prepare for later offline use.`)
      }
      // Load native bindings before publishing. A separate process avoids keeping
      // modules whose absolute paths point at the staging directory after rename.
      const validation = `
import fs from "node:fs";
import {createRequire} from "node:module";
import {dirname, join, relative} from "node:path";
import {pathToFileURL} from "node:url";
import {execFileSync} from "node:child_process";
const require = createRequire(join(process.cwd(), "package.json"));
const expected = JSON.parse(process.argv[1]);
for (const name of ["typescript", "rolldown"]) {
  if (require(name + "/package.json").version !== expected[name]) throw Error("Unexpected " + name + " version");
}
const tsc = join(dirname(require.resolve("typescript/package.json")), "bin/tsc");
const native = join(dirname(require.resolve("@typescript/typescript-" + process.platform + "-" + process.arch + "/package.json")), "lib/tsc" + (process.platform === "win32" ? ".exe" : ""));
const version = execFileSync(process.execPath, [tsc, "--version"], {encoding: "utf8"}).trim();
if (version !== "Version " + expected.typescript) throw Error("Unexpected TypeScript executable: " + version);
await import(pathToFileURL(require.resolve("rolldown")));
const bindings = Object.keys(require.cache).filter((file) => file.endsWith(".node") && !relative(process.cwd(), file).startsWith(".."));
if (bindings.length === 0) throw Error("Rolldown's native binding did not load");
const files = [tsc, native, require.resolve("typescript/package.json"), require.resolve("rolldown/package.json"), require.resolve("rolldown"), ...bindings];
process.stdout.write(JSON.stringify(files.map((file) => ({name: relative(process.cwd(), file), size: fs.statSync(file).size}))));
`
      const required = JSON.parse(await run(process.execPath, ["--input-type=module", "--eval", validation, JSON.stringify(pkg.dependencies)], true))
      required.push(...files.map(([name, contents]) => ({name, size: contents.length})))
      fs.writeFileSync(join(staging, "complete.json"), JSON.stringify({key, files: required}))
      try {
        fs.renameSync(staging, destination)
      } catch (error) {
        // Another caller can finish the same immutable cache while we install.
        if (!complete(destination)) {
          throw error
        }
      }
    } catch (error) {
      throw cache_error(error)
    } finally {
      cleanup()
      process.removeListener("exit", cleanup)
      for (const [signal, handler] of signals) {
        process.removeListener(signal, handler)
      }
      if (interrupted?.terminate) {
        process.kill(process.pid, interrupted.signal)
      }
    }
  }
  await import(pathToFileURL(join(destination, "compiler.mjs")))
}

void main().catch((error) => {
  console.error(error instanceof CompilerSetupError ? error.message : error)
  process.exitCode = 1
})
