import fs from "node:fs"
import {spawn, spawnSync} from "node:child_process"
import {tmpdir} from "node:os"
import {dirname, join} from "node:path"
import {fileURLToPath} from "node:url"

import assert from "node:assert/strict"
import {afterEach, beforeEach, describe, it} from "node:test"

const launcher = fileURLToPath(new URL("../../src/compiler/launcher.js", import.meta.url))
const payload = `
import fs from "node:fs";
import {createRequire} from "node:module";
const require = createRequire(import.meta.url);
process.stdout.write(JSON.stringify({received: JSON.parse(fs.readFileSync(0, "utf8")), pid: process.pid,
  args: process.argv.slice(2), execArgv: process.execArgv, version: require("typescript/package.json").version}));
`

// These npm/package doubles exercise bootstrap publication and failure paths.
// Installed-wheel validation separately loads the real native compiler packages.
const npm_fixture = String.raw`
import fs from "node:fs";
import {dirname, join} from "node:path";
const mode = process.env.FIXTURE_MODE;
fs.appendFileSync(process.env.FIXTURE_LOG, JSON.stringify({pid: process.pid, cwd: process.cwd(), args: process.argv.slice(2)}) + "\n");
console.log("npm fixture progress");
if (mode === "failure") process.exit(23);
if (mode === "wait") await new Promise(resolve => setTimeout(resolve, 30000));
if (mode === "concurrent") await new Promise(resolve => setTimeout(resolve, 150));
const pkg = JSON.parse(fs.readFileSync("package.json", "utf8"));
function write(name, contents) {
  fs.mkdirSync(dirname(name), {recursive: true});
  fs.writeFileSync(name, contents);
}
write("node_modules/typescript/package.json", JSON.stringify({name: "typescript", version: pkg.dependencies.typescript, type: "module"}));
write("node_modules/typescript/bin/tsc", 'console.log("Version ' + (mode === "bad-version" ? "0.0.0" : pkg.dependencies.typescript) + '")');
write("node_modules/@typescript/typescript-" + process.platform + "-" + process.arch + "/package.json", "{}");
write("node_modules/@typescript/typescript-" + process.platform + "-" + process.arch + "/lib/tsc" + (process.platform === "win32" ? ".exe" : ""), "native fixture");
write("node_modules/rolldown/package.json", JSON.stringify({name: "rolldown", version: pkg.dependencies.rolldown, type: "module", main: "index.mjs"}));
write("node_modules/rolldown/index.mjs", mode === "bad-binding" ? 'throw Error("native binding unavailable")' :
  'import {createRequire} from "node:module"; import {fileURLToPath} from "node:url"; const require = createRequire(import.meta.url); require.cache[fileURLToPath(new URL("binding.node", import.meta.url))] = {exports: {}};');
write("node_modules/rolldown/binding.node", "binding fixture");
`

let temporary, entry, cache, env

beforeEach(() => {
  temporary = fs.realpathSync(fs.mkdtempSync(join(tmpdir(), "bokeh compiler launcher ")))
  entry = join(temporary, "installed/js/compiler.js")
  cache = join(temporary, "cache")
  fs.mkdirSync(join(dirname(entry), "compiler"), {recursive: true})
  fs.copyFileSync(launcher, entry)
  fs.writeFileSync(join(dirname(entry), "compiler/compiler.mjs"), payload)
  fs.writeFileSync(join(dirname(entry), "compiler/compiler.mjs.map"), "{}")
  fs.writeFileSync(join(dirname(entry), "compiler/package.json"), JSON.stringify({
    private: true, type: "module", dependencies: {typescript: "7.0.2", rolldown: "1.2.15"},
  }))
  fs.writeFileSync(join(dirname(entry), "compiler/package-lock.json"), '{"lockfileVersion":3}')
  const npm = join(temporary, "npm-cli.mjs")
  fs.writeFileSync(npm, npm_fixture)
  fs.mkdirSync(join(temporary, "cwd"))
  env = {...process.env, BOKEH_COMPILER_CACHE: cache, BOKEH_NPMJS_PATH: npm,
    FIXTURE_LOG: join(temporary, "npm.jsonl"), PATH: "", NODE_PATH: ""}
  delete env.NODE_OPTIONS
})

afterEach(() => {
  fs.rmSync(temporary, {recursive: true, force: true})
})

const flags = ["--no-deprecation", "--stack-trace-limit=17"]
const input = '{"code":"export const café = 42"}'
const options = () => ({cwd: join(temporary, "cwd"), env, encoding: "utf8", timeout: 10_000})
function run() {
  const result = spawnSync(process.execPath, [...flags, entry, "bundle"], {...options(), input})
  assert.equal(result.error, undefined)
  return result
}
function installs() {
  return fs.readFileSync(env.FIXTURE_LOG, "utf8").trim().split("\n").map((line) => JSON.parse(line))
}
function entries() {
  return fs.existsSync(cache) ? fs.readdirSync(cache) : []
}
function development_npm() {
  const bin = dirname(process.execPath)
  const npm = [join(bin, "node_modules/npm/bin/npm-cli.js"), join(bin, "../lib/node_modules/npm/bin/npm-cli.js")].find(fs.existsSync)
  assert(npm, "development npm CLI is missing")
  return npm
}
function start(extra = []) {
  const child = spawn(process.execPath, [...flags, ...extra, entry, "bundle"], options())
  let stdout = "", stderr = ""
  child.stdout.setEncoding("utf8").on("data", (chunk) => stdout += chunk)
  child.stderr.setEncoding("utf8").on("data", (chunk) => stderr += chunk)
  child.stdin.end(input)
  const done = new Promise((resolve, reject) => {
    child.once("error", reject)
    child.once("close", (code, signal) => resolve({code, signal, stdout, stderr}))
  })
  return {child, done}
}

for (const type of ["commonjs", "module"]) {
  describe(`native compiler cache in a ${type} package`, () => {
    beforeEach(() => fs.writeFileSync(join(temporary, "installed/package.json"), JSON.stringify({type})))

    it("installs pinned dependencies once, keeps stdout JSON, and reuses a read-only warm cache without npm", () => {
      const first = run()
      assert.equal(first.status, 0, first.stderr)
      assert.deepEqual(JSON.parse(first.stdout).received, JSON.parse(input))
      assert.equal(JSON.parse(first.stdout).version, "7.0.2")
      assert.deepEqual(JSON.parse(first.stdout).execArgv, flags)
      assert.deepEqual(JSON.parse(first.stdout).args, ["bundle"])
      assert.match(first.stderr, /npm fixture progress/)
      assert.deepEqual(installs()[0].args, ["ci", "--prefix", installs()[0].cwd, "--workspaces=false", "--ignore-scripts", "--include=optional", "--no-audit", "--no-fund"])
      const [key] = entries()
      const marker = join(cache, key, "complete.json")
      const stat = fs.statSync(marker)
      env.BOKEH_NPMJS_PATH = join(temporary, "missing-npm-cli.js")
      fs.chmodSync(join(temporary, "cwd"), 0o555)
      fs.chmodSync(join(temporary, "installed"), 0o555)
      fs.chmodSync(join(cache, key), 0o555)
      try {
        const warm = run()
        assert.equal(warm.status, 0, warm.stderr)
        assert.equal(warm.stderr, "")
        assert.equal(installs().length, 1)
        assert.equal(fs.statSync(marker).mtimeMs, stat.mtimeMs)
      } finally {
        fs.chmodSync(join(temporary, "cwd"), 0o755)
        fs.chmodSync(join(temporary, "installed"), 0o755)
        fs.chmodSync(join(cache, key), 0o755)
      }
    })
  })
}

describe("native compiler cache lifecycle", () => {
  it("isolates npm from an ancestor workspace containing a symlinked cache", () => {
    const workspace = join(temporary, "workspace")
    cache = join(workspace, "work")
    fs.mkdirSync(workspace)
    const alias = join(temporary, "workspace-alias")
    fs.symlinkSync(workspace, alias, "junction")
    env.BOKEH_COMPILER_CACHE = join(alias, "work")
    fs.writeFileSync(join(workspace, "package.json"), '{"private":true,"workspaces":["work/*"]}')
    const root_lock = "This unrelated workspace lock must not be read or changed."
    fs.writeFileSync(join(workspace, "package-lock.json"), root_lock)
    assert.equal(run().status, 0)
    const record = installs()[0]
    // Replay the launcher's actual npm arguments with a dependency-free package,
    // so real npm workspace discovery is covered without registry access.
    fs.mkdirSync(record.cwd)
    fs.writeFileSync(join(record.cwd, "package.json"), '{"name":"isolated-compiler-fixture","version":"1.0.0"}')
    fs.writeFileSync(join(record.cwd, "package-lock.json"), '{"lockfileVersion":3,"packages":{"":{"name":"isolated-compiler-fixture","version":"1.0.0"}}}')
    const result = spawnSync(process.execPath, [development_npm(), ...record.args, "--cache", join(temporary, "npm-cache")], {
      ...options(), cwd: record.cwd, env: {...env, npm_config_offline: "true", npm_config_update_notifier: "false"},
    })
    assert.equal(result.status, 0, result.stderr)
    assert.equal(fs.readFileSync(join(workspace, "package-lock.json"), "utf8"), root_lock)
    assert(!fs.existsSync(join(workspace, "node_modules")))
  })

  it("explains offline first-use recovery while retaining npm diagnostics", () => {
    const runtime = fileURLToPath(new URL("../../src/compiler/runtime/", import.meta.url))
    for (const name of ["package.json", "package-lock.json"]) {
      fs.copyFileSync(join(runtime, name), join(dirname(entry), "compiler", name))
    }
    env.BOKEH_NPMJS_PATH = development_npm()
    env.npm_config_cache = join(temporary, "empty-npm-cache")
    env.npm_config_offline = "true"
    env.npm_config_update_notifier = "false"
    const result = run()
    assert.equal(result.status, 1)
    assert.equal(result.stdout, "")
    assert.match(result.stderr, /ENOTCACHED/)
    assert.match(result.stderr, /First use needs access to the npm registry/)
    assert.match(result.stderr, /npm_config_offline/)
    assert.match(result.stderr, /compilation with network access/)
    assert(result.stderr.includes(cache))
    assert.match(result.stderr, /BOKEH_COMPILER_CACHE/)
    assert.doesNotMatch(result.stderr, /\n\s+at /)
    assert.deepEqual(entries(), [])
  })

  it("explains how to provide missing npm before creating a cache", () => {
    env.BOKEH_NPMJS_PATH = join(temporary, "missing-npm-cli.js")
    const result = run()
    assert.equal(result.status, 1)
    assert.equal(result.stdout, "")
    assert.match(result.stderr, /Install npm with Node.js/)
    assert.match(result.stderr, /BOKEH_NPMJS_PATH/)
    assert.match(result.stderr, /first use/)
    assert(result.stderr.includes(cache))
    assert.doesNotMatch(result.stderr, /\n\s+at /)
    assert.deepEqual(entries(), [])
  })

  it("explains cache filesystem failures without a Node stack", () => {
    fs.writeFileSync(cache, "an existing file")
    const result = run()
    assert.equal(result.status, 1)
    assert.equal(result.stdout, "")
    assert.match(result.stderr, /Cannot write Bokeh's compiler cache/)
    assert.match(result.stderr, /BOKEH_COMPILER_CACHE to a writable directory/)
    assert(result.stderr.includes(cache))
    assert.doesNotMatch(result.stderr, /\n\s+at /)
    assert.equal(fs.readFileSync(cache, "utf8"), "an existing file")
  })

  it("explains an unwritable cache without starting npm", {skip: process.platform == "win32" || process.getuid?.() == 0}, () => {
    fs.mkdirSync(cache, {mode: 0o555})
    try {
      const result = run()
      assert.equal(result.status, 1)
      assert.equal(result.stdout, "")
      assert.match(result.stderr, /Cannot write Bokeh's compiler cache \(EACCES\)/)
      assert.match(result.stderr, /BOKEH_COMPILER_CACHE to a writable directory/)
      assert(result.stderr.includes(cache))
      assert.doesNotMatch(result.stderr, /\n\s+at /)
      assert(!fs.existsSync(env.FIXTURE_LOG))
      assert.deepEqual(entries(), [])
    } finally {
      fs.chmodSync(cache, 0o755)
    }
  })

  it("retains debugging details for unexpected adapter failures", () => {
    fs.writeFileSync(join(dirname(entry), "compiler/compiler.mjs"), 'throw new Error("unexpected adapter failure")')
    const result = run()
    assert.equal(result.status, 1)
    assert.equal(result.stdout, "")
    assert.match(result.stderr, /unexpected adapter failure/)
    assert.match(result.stderr, /\n\s+at .*compiler\.mjs:1/)
  })

  it("invalidates on shipped package, lockfile, or adapter changes and ignores global packages", () => {
    assert.equal(run().status, 0)
    for (const name of ["package.json", "package-lock.json", "compiler.mjs"]) {
      fs.appendFileSync(join(dirname(entry), "compiler", name), "\n")
      assert.equal(run().status, 0)
    }
    assert.equal(installs().length, 4)
    assert.equal(entries().length, 4)
    env.NODE_PATH = join(temporary, "global/node_modules")
    fs.mkdirSync(join(env.NODE_PATH, "typescript"), {recursive: true})
    fs.writeFileSync(join(env.NODE_PATH, "typescript/package.json"), '{"version":"5.9.2"}')
    assert.equal(JSON.parse(run().stdout).version, "7.0.2")
  })

  for (const mode of ["failure", "bad-version", "bad-binding"]) {
    it(`does not publish or retain staging after ${mode}`, () => {
      env.FIXTURE_MODE = mode
      const result = run()
      assert.notEqual(result.status, 0)
      assert.equal(result.stdout, "")
      assert.deepEqual(entries(), [])
      delete env.FIXTURE_MODE
      assert.equal(run().status, 0)
      assert.equal(entries().length, 1)
    })
  }

  it("publishes one immutable directory when installers race and imports in the caller process", async () => {
    env.FIXTURE_MODE = "concurrent"
    const first = start(), second = start()
    const results = await Promise.all([first.done, second.done])
    for (const [index, result] of results.entries()) {
      assert.equal(result.code, 0, result.stderr)
      assert.equal(JSON.parse(result.stdout).pid, [first, second][index].child.pid)
    }
    assert.equal(entries().length, 1)
    assert.equal(installs().length, 2)
  })

  it("accepts a concurrent publication immediately after a missing completion marker", async () => {
    assert.equal(run().status, 0)
    const [key] = entries()
    const destination = join(cache, key)
    const published = join(temporary, "published")
    fs.renameSync(destination, published)
    const preload = join(temporary, "publication.cjs")
    fs.writeFileSync(preload, `
const fs = require("node:fs");
const read = fs.readFileSync;
fs.readFileSync = function(file, ...args) {
  try { return read.call(this, file, ...args); }
  catch (error) {
    if (file === ${JSON.stringify(join(destination, "complete.json"))}) {
      fs.renameSync(${JSON.stringify(published)}, ${JSON.stringify(destination)});
      fs.readFileSync = read;
      require("node:module").syncBuiltinESMExports();
    }
    throw error;
  }
};
require("node:module").syncBuiltinESMExports();
`)
    const result = await start(["--require", preload]).done
    assert.equal(result.code, 0, result.stderr)
    assert.equal(JSON.parse(result.stdout).version, "7.0.2")
    assert.deepEqual(entries(), [key])
    assert.equal(installs().length, 2)
  })

  it("reports damaged published caches without reinstalling in place", () => {
    assert.equal(run().status, 0)
    const [key] = entries()
    fs.truncateSync(join(cache, key, "node_modules/rolldown/binding.node"), 0)
    const result = run()
    assert.notEqual(result.status, 0)
    assert.match(result.stderr, /compiler cache is incomplete/)
    assert.equal(installs().length, 1)
    assert.deepEqual(entries(), [key])
  })

  for (const signal of ["SIGINT", "SIGTERM"]) {
    it(`cleans owned staging and forwards ${signal} during installation`, {skip: process.platform == "win32"}, async () => {
      env.FIXTURE_MODE = "wait"
      const {child, done} = start()
      for (let i = 0; !fs.existsSync(env.FIXTURE_LOG) && i < 100; i++) {
        await new Promise((resolve) => setTimeout(resolve, 20))
      }
      assert(fs.existsSync(env.FIXTURE_LOG), "npm fixture did not start")
      child.kill(signal)
      const result = await done
      assert.equal(result.signal, signal, result.stderr)
      assert.deepEqual(entries(), [])
      assert.throws(() => process.kill(installs()[0].pid, 0), {code: "ESRCH"})
    })
  }

  it("preserves existing signal handlers while cleaning staging", {skip: process.platform == "win32"}, async () => {
    env.FIXTURE_MODE = "wait"
    const preload = join(temporary, "signals.cjs")
    fs.writeFileSync(preload, 'process.on("SIGTERM", () => setTimeout(() => process.exit(77), 100));')
    const {child, done} = start(["--require", preload])
    for (let i = 0; !fs.existsSync(env.FIXTURE_LOG) && i < 100; i++) {
      await new Promise((resolve) => setTimeout(resolve, 20))
    }
    assert(fs.existsSync(env.FIXTURE_LOG), "npm fixture did not start")
    child.kill("SIGTERM")
    const result = await done
    assert.equal(result.code, 77, result.stderr)
    assert.deepEqual(entries(), [])
  })
})
