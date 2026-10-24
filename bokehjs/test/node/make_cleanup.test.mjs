import assert from "node:assert/strict"
import {spawn, spawnSync} from "node:child_process"
import {once} from "node:events"
import fs from "node:fs"
import {tmpdir} from "node:os"
import {join} from "node:path"
import {afterEach, beforeEach, describe, it} from "node:test"

const bootstrap = new URL("../../make/index.js", import.meta.url)
let temporary
let child

// Exercise the real bootstrap without bundling the library or starting watchers.
const bundler = `
import fs from "node:fs/promises"
export async function rolldown() {
  return {
    async write({file}) {
      await fs.copyFile("payload.mjs", file)
      if (process.env.MODE == "bootstrap") {
        setInterval(() => {}, 1000)
        console.log("ready")
        await new Promise(() => {})
      }
    },
    async close() {},
  }
}
`

const payload = `
import {spawn} from "node:child_process"
export async function main() {
  if (process.env.MODE == "return") return
  if (process.env.MODE == "exit") process.exit(23)
  if (process.env.MODE == "error") throw new Error("task failed")
  if (process.env.MODE == "child") {
    const child = spawn(process.execPath, ["child.mjs"], {stdio: ["ignore", "inherit", "inherit", "ipc"]})
    process.once("exit", () => child.kill())
    process.once(process.env.SIGNAL, () => child.kill(process.env.SIGNAL))
    child.once("exit", (code) => process.exit(code == 0 ? 23 : 99))
    child.once("message", () => console.log("ready"))
  } else {
    setInterval(() => {}, 1000)
    console.log("ready")
  }
  await new Promise(() => {})
}
`

const child_payload = `
import fs from "node:fs"
const timeout = setTimeout(() => process.exit(99), 5000)
process.once(process.env.SIGNAL, () => {
  setTimeout(() => {
    fs.writeFileSync("child-cleaned", "yes")
    clearTimeout(timeout)
    process.exit(0)
  }, 25)
})
process.send("ready")
`

beforeEach(() => {
  temporary = fs.mkdtempSync(join(tmpdir(), "bokeh make cleanup "))
  fs.mkdirSync(join(temporary, "make"))
  fs.mkdirSync(join(temporary, "node_modules/rolldown"), {recursive: true})
  fs.copyFileSync(bootstrap, join(temporary, "make/index.js"))
  fs.writeFileSync(join(temporary, "package.json"), '{"type":"module"}')
  fs.writeFileSync(join(temporary, "node_modules/rolldown/package.json"), '{"type":"module","exports":"./index.js"}')
  fs.writeFileSync(join(temporary, "node_modules/rolldown/index.js"), bundler)
  fs.writeFileSync(join(temporary, "payload.mjs"), payload)
  fs.writeFileSync(join(temporary, "child.mjs"), child_payload)
})

afterEach(() => {
  if (child != null && child.exitCode == null && child.signalCode == null) {
    child.kill("SIGKILL")
  }
  fs.rmSync(temporary, {recursive: true, force: true})
})

async function run(mode, signal) {
  child = spawn(process.execPath, ["make/index.js"], {
    cwd: temporary,
    env: {...process.env, MODE: mode, SIGNAL: signal},
    stdio: ["ignore", "pipe", "pipe"],
    timeout: 10_000,
  })
  let stderr = ""
  child.stderr.on("data", (chunk) => stderr += chunk)
  const closed = once(child, "close")
  if (signal != null) {
    let output = ""
    for await (const chunk of child.stdout) {
      output += chunk
      if (output.includes("ready\n")) {
        assert.equal(fs.readdirSync(join(temporary, "make/_build")).length, 1)
        child.kill(signal)
        break
      }
    }
    assert.ok(output.includes("ready\n"), stderr)
  }
  const [code, received] = await closed
  assert.deepEqual(fs.readdirSync(join(temporary, "make/_build")), [], stderr)
  return {code, signal: received, stderr}
}

describe("make bootstrap cleanup", {timeout: 15_000}, () => {
  it("cleans a fresh checkout before npm dependencies are installed", () => {
    fs.rmSync(join(temporary, "node_modules"), {recursive: true})
    fs.mkdirSync(join(temporary, "build/js"), {recursive: true})
    fs.writeFileSync(join(temporary, "build/js/stale.js"), "stale build")
    const source = join(temporary, "make/main.ts")
    fs.writeFileSync(source, "source file")
    // clean:all owns build/, not another make invocation's bootstrap bundle.
    fs.mkdirSync(join(temporary, "make/_build/other-run"), {recursive: true})
    const other_bundle = join(temporary, "make/_build/other-run/main.mjs")
    fs.writeFileSync(other_bundle, "active bootstrap")

    // Repeating setup also succeeds when there is no previous build to remove.
    for (let i = 0; i < 2; i++) {
      const result = spawnSync(process.execPath, ["make/index.js", "clean:all"], {
        cwd: temporary,
        encoding: "utf8",
        timeout: 10_000,
      })
      assert.equal(result.status, 0, result.stderr)
      assert.equal(fs.existsSync(join(temporary, "build")), false)
      assert.equal(fs.existsSync(join(temporary, "node_modules")), false)
      assert.deepEqual(fs.readdirSync(join(temporary, "make/_build")), ["other-run"])
      assert.equal(fs.readFileSync(other_bundle, "utf8"), "active bootstrap")
      assert.equal(fs.readFileSync(source, "utf8"), "source file")
    }
  })

  for (const [mode, expected] of [["return", 0], ["exit", 23], ["error", 1]]) {
    it(`removes its temporary bundle after ${mode}`, async () => {
      const result = await run(mode)
      assert.equal(result.code, expected, result.stderr)
    })
  }

  // Windows does not deliver Unix signals to Node listeners through kill().
  for (const signal of ["SIGINT", "SIGTERM"]) {
    for (const mode of ["bootstrap", "task"]) {
      it(`cleans up and preserves default ${signal} termination during ${mode}`, {skip: process.platform == "win32"}, async () => {
        const result = await run(mode, signal)
        assert.equal(result.code, null, result.stderr)
        assert.equal(result.signal, signal, result.stderr)
      })
    }
    it(`lets task handlers finish child cleanup on ${signal}`, {skip: process.platform == "win32"}, async () => {
      const result = await run("child", signal)
      assert.equal(result.code, 23, result.stderr)
      assert.equal(fs.readFileSync(join(temporary, "child-cleaned"), "utf8"), "yes")
    })
  }
})
