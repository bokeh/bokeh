import fs from "node:fs"
import {spawnSync} from "node:child_process"
import {tmpdir} from "node:os"
import {basename, join} from "node:path"
import {fileURLToPath} from "node:url"

import assert from "node:assert/strict"
import {afterEach, beforeEach, describe, it} from "node:test"

const root = fileURLToPath(new URL("../..", import.meta.url))
let temporary

beforeEach(() => {
  temporary = fs.mkdtempSync(join(tmpdir(), "bokeh extension without npm "))
})

afterEach(() => {
  fs.rmSync(temporary, {recursive: true, force: true})
})

function run(command) {
  // Test extension dependency installation independently of the shipped
  // launcher's first-use setup, covered by validate_extensions.py.
  const result = spawnSync(process.execPath, [join(root, "build/js/compiler/main.js"), command,
    "--base-dir", temporary, "--bokehjs-dir", join(root, "build"), "--bokeh-version", "4.0.0"], {
    cwd: temporary,
    env: {...process.env, PATH: "", BOKEH_NPMJS_PATH: join(temporary, "unavailable-npm.cjs")},
    encoding: "utf8",
    timeout: 30_000,
  })
  assert.equal(result.error, undefined)
  return result
}

describe("native extension compiler npm requirements", () => {
  it("initializes and builds a package-free extension without npm", {timeout: 60_000}, () => {
    const initialized = run("init")
    assert.equal(initialized.status, 0, `${initialized.stdout}\n${initialized.stderr}`)
    fs.rmSync(join(temporary, "package.json"))
    const built = run("build")
    assert.equal(built.status, 0, `${built.stdout}\n${built.stderr}`)
    assert.ok(fs.existsSync(join(temporary, "dist", `${basename(temporary)}.js`)))
    assert.ok(!built.stderr.includes("ExperimentalWarning"))
  })

  it("fails visibly when dependency installation needs unavailable npm", {timeout: 60_000}, () => {
    const initialized = run("init")
    assert.equal(initialized.status, 0, `${initialized.stdout}\n${initialized.stderr}`)
    const built = run("build")
    assert.equal(built.status, 1)
    assert.ok(`${built.stdout}\n${built.stderr}`.includes("unavailable-npm.cjs"))
  })
})
