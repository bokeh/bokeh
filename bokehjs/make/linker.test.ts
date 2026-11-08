import assert from "node:assert/strict"
import fs from "node:fs"
import os from "node:os"
import {join, dirname} from "node:path"
import type {TestContext} from "node:test"
import {test} from "node:test"

import {Linker} from "#compiler/linker.js"

type Files = {[file: string]: string}

/** Creates a temporary source tree with `lib/` and `node_modules/` and returns its directory. */
function fixture(t: TestContext, files: Files): string {
  const dir = fs.mkdtempSync(join(os.tmpdir(), "bokehjs-test-linker-"))
  t.after(() => fs.rmSync(dir, {recursive: true, force: true}))
  const all: Files = {
    "node_modules/tslib/package.json": JSON.stringify({name: "tslib", type: "module", main: "tslib.js"}),
    "node_modules/tslib/tslib.js": "export function __importStar(mod) { return mod }",
    ...files,
  }
  for (const [file, source] of Object.entries(all)) {
    const path = join(dir, file)
    fs.mkdirSync(dirname(path), {recursive: true})
    fs.writeFileSync(path, source, {encoding: "utf-8"})
  }
  return dir
}

/** Links `lib/index.js` and returns the reported status and cycles. */
async function link(t: TestContext, files: Files, options: {detect_cycles?: boolean} = {}): Promise<{status: boolean, output: string}> {
  const dir = fixture(t, files)
  const linker = new Linker({
    entries: [join(dir, "lib", "index.js")],
    bases: [join(dir, "lib"), join(dir, "node_modules")],
    ...options,
  })
  const log = t.mock.method(console, "log", () => {})
  const {status} = await linker.link()
  const output = log.mock.calls.map((call) => call.arguments.join(" ")).join("\n")
  log.mock.restore()
  return {status, output}
}

const esm_package = (name: string, source: string) => ({
  [`node_modules/${name}/package.json`]: JSON.stringify({name, type: "module", main: "index.js"}),
  [`node_modules/${name}/index.js`]: source,
})

const cjs_package = (name: string, files: Files) => ({
  [`node_modules/${name}/package.json`]: JSON.stringify({name, main: "index.js"}),
  ...Object.fromEntries(Object.entries(files).map(([file, source]) => [`node_modules/${name}/${file}`, source])),
})

void test("Linker succeeds without cycles", async (t) => {
  const {status, output} = await link(t, {
    "lib/index.js": `import {a} from "./a.js"; export {a}`,
    "lib/a.js": "export const a = 1",
  })
  assert.equal(status, true)
  assert.equal(output, "")
})

void test("Linker reports cycles of internal modules", async (t) => {
  const {status, output} = await link(t, {
    "lib/index.js": `import "./a.js"`,
    "lib/a.js": `import {b} from "./b.js"; export const a = () => b`,
    "lib/b.js": `import {a} from "./a.js"; export const b = () => a`,
  })
  assert.equal(status, false)
  assert.match(output, /cycle detected:\n├─ a\n├─ b\n└─ a/)
})

void test("Linker reports cycles of third-party ES modules", async (t) => {
  const {status, output} = await link(t, {
    "lib/index.js": `import "esm_a"`,
    ...esm_package("esm_a", `import "esm_b"; export const a = 1`),
    ...esm_package("esm_b", `import "esm_a"; export const b = 1`),
  })
  assert.equal(status, false)
  assert.match(output, /cycle detected:/)
})

void test("Linker reports cycles of mixed ES and CommonJS modules", async (t) => {
  const {status} = await link(t, {
    "lib/index.js": `import "esm_a"`,
    ...esm_package("esm_a", `import "cjs_b"; export const a = 1`),
    ...cjs_package("cjs_b", {"index.js": `require("esm_a"); exports.b = 1`}),
  })
  assert.equal(status, false)
})

void test("Linker allows cycles of CommonJS modules", async (t) => {
  const {status, output} = await link(t, {
    "lib/index.js": `import "cjs_a"`,
    ...cjs_package("cjs_a", {"index.js": `require("./b.js"); exports.a = 1`, "b.js": `require("./index.js"); exports.b = 1`}),
  })
  assert.equal(status, true)
  assert.equal(output, "")
})

void test("Linker doesn't detect cycles when disabled", async (t) => {
  const {status} = await link(t, {
    "lib/index.js": `import "./a.js"`,
    "lib/a.js": `import "./index.js"`,
  }, {detect_cycles: false})
  assert.equal(status, true)
})
