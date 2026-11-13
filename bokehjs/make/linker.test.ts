import assert from "node:assert/strict"
import fs from "node:fs"
import os from "node:os"
import vm from "node:vm"
import {join, dirname} from "node:path"
import type {TestContext} from "node:test"
import {test} from "node:test"

import MagicString from "magic-string"
import {TraceMap, originalPositionFor} from "@jridgewell/trace-mapping"

import type {CycleDetection} from "#compiler/linker.js"
import {Linker} from "#compiler/linker.js"
import * as preludes from "#compiler/prelude.js"

type Files = {[file: string]: string}

type LinkOptions = {detect_cycles?: CycleDetection}

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
async function link(t: TestContext, files: Files, options: LinkOptions = {}): Promise<{status: boolean, output: string, linker: Linker}> {
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
  return {status, output, linker}
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

void test("Linker reports cycles of ES modules within cycles of CommonJS modules", async (t) => {
  const {status, output} = await link(t, {
    "lib/index.js": `import "cjs_a"`,
    // the shortest cycle through `cjs_a` (`cjs_a -> cjs_a/b -> cjs_a`) has no ES modules
    ...cjs_package("cjs_a", {"index.js": `require("./b.js"); exports.a = 1`, "b.js": `require("./index.js"); require("esm_c"); exports.b = 1`}),
    ...esm_package("esm_c", `import "cjs_a/b.js"; export const c = 1`),
  })
  assert.equal(status, false)
  assert.match(output, /cycle detected:\n├─ esm_c\/index\.js\n├─ cjs_a\/b\.js\n└─ esm_c\/index\.js/)
})

void test("Linker allows cycles of CommonJS modules", async (t) => {
  const {status, output} = await link(t, {
    "lib/index.js": `import "cjs_a"`,
    ...cjs_package("cjs_a", {"index.js": `require("./b.js"); exports.a = 1`, "b.js": `require("./index.js"); exports.b = 1`}),
  })
  assert.equal(status, true)
  assert.equal(output, "")
})

void test("Linker reports only cycles of internal modules when requested", async (t) => {
  const third_party = await link(t, {
    "lib/index.js": `import "esm_a"`,
    ...esm_package("esm_a", `import "esm_b"; export const a = 1`),
    ...esm_package("esm_b", `import "esm_a"; export const b = 1`),
  }, {detect_cycles: "internal"})
  assert.equal(third_party.status, true)
  assert.equal(third_party.output, "")

  const internal = await link(t, {
    "lib/index.js": `import "./a.js"`,
    "lib/a.js": `import {b} from "./b.js"; export const a = () => b`,
    "lib/b.js": `import {a} from "./a.js"; export const b = () => a`,
  }, {detect_cycles: "internal"})
  assert.equal(internal.status, false)
  assert.match(internal.output, /cycle detected:\n├─ a\n├─ b\n└─ a/)

  // e.g. through a package that imports the extension's modules
  const mixed = await link(t, {
    "lib/index.js": `import "./a.js"`,
    "lib/a.js": `import "esm_b"; export const a = 1`,
    ...esm_package("esm_b", `import "esm_c"; export const b = 1`),
    ...esm_package("esm_c", `import "esm_b"; import "../../lib/a.js"; export const c = 1`),
  }, {detect_cycles: "internal"})
  assert.equal(mixed.status, false)
  assert.match(mixed.output, /cycle detected:\n├─ a\n├─ esm_b\/index\.js\n├─ esm_c\/index\.js\n└─ a/)
})

void test("Linker doesn't detect cycles when disabled", async (t) => {
  const {status} = await link(t, {
    "lib/index.js": `import "./a.js"`,
    "lib/a.js": `import "./index.js"`,
  }, {detect_cycles: "none"})
  assert.equal(status, true)
})

/** Links `lib/index.js`, evaluates the bundle and returns exports of the entry module. */
async function evaluate(t: TestContext, files: Files): Promise<{[key: string]: unknown}> {
  const {linker} = await link(t, {
    "node_modules/tslib/tslib.js": "export function __importDefault(mod) { return mod && mod.__esModule ? mod : {default: mod} }",
    ...files,
  })
  const {bundles: [bundle]} = await linker.link()
  const prelude = {main: preludes.prelude(), plugin: preludes.plugin_prelude()}
  const postlude = {main: preludes.postlude(), plugin: preludes.plugin_postlude()}
  const {source} = bundle.assemble({prelude, postlude, minified: false})
  const context: {Bokeh?: {[key: string]: unknown}} = {}
  vm.runInNewContext(source, context)
  return context.Bokeh!
}

void test("Linker doesn't convert CommonJS modules of packages with ES modules", async (t) => {
  const exports = await evaluate(t, {
    "lib/index.js": `import {cjs} from "esm"; import {helper} from "dual"; export const result = [cjs, helper]`,
    "node_modules/esm/package.json": JSON.stringify({name: "esm", type: "module", main: "index.js"}),
    "node_modules/esm/index.js": `import cjs from "./cjs.cjs"; export {cjs}`,
    "node_modules/esm/cjs.cjs": "exports.a = 1",
    "node_modules/dual/package.json": JSON.stringify({name: "dual", main: "cjs/index.js", module: "esm/index.js"}),
    "node_modules/dual/esm/index.js": `import helper from "../helper.js"; export {helper}`,
    "node_modules/dual/helper.js": "exports.b = 2",
  })
  // CommonJS modules don't set `__esModule`, so their default import is `module.exports`
  assert.equal(JSON.stringify(exports.result), JSON.stringify([{a: 1}, {b: 2}]))
})

void test("Linker maps bundles to original sources", async (t) => {
  // like tsc's output, i.e. `lib/index.js` with a map pointing to `src/index.ts`
  const ts = "// greeting\nexport function greet(name: string): string {\n  return 'hello ' + name\n}\n"
  const str = new MagicString(ts)
  for (const match of ts.matchAll(/: string/g)) {
    str.remove(match.index, match.index + match[0].length)
  }
  const map = str.generateMap({hires: true, source: "../src/index.ts", file: "index.js", includeContent: true})
  const {linker} = await link(t, {
    "src/index.ts": ts,
    "lib/index.js": `${str.toString()}//# sourceMappingURL=index.js.map\n`,
    "lib/index.js.map": map.toString(),
  })
  const {bundles: [bundle]} = await linker.link()

  // bundles share maps of modules between preludes, so assemble each kind twice
  const kinds = {
    plain: {
      prelude: {main: preludes.prelude(), plugin: preludes.plugin_prelude()},
      postlude: {main: preludes.postlude(), plugin: preludes.plugin_postlude()},
    },
    esm: {
      prelude: {main: preludes.prelude_esm(false), plugin: preludes.plugin_prelude_esm(false)},
      postlude: {main: preludes.postlude_esm(), plugin: preludes.plugin_postlude_esm()},
    },
  }
  for (const kind of ["plain", "esm", "plain", "esm"] as const) {
    for (const minified of [false, true]) {
      const {source, sourcemap} = bundle.assemble({...kinds[kind], minified})
      assert.ok(sourcemap != null)
      const index = source.search(/["'`]hello /) // the minifier may use a template literal
      const lines = source.slice(0, index).split("\n")
      const position = originalPositionFor(new TraceMap(sourcemap), {line: lines.length, column: lines[lines.length - 1].length})
      const message = `${minified ? "minified" : "unminified"} ${kind} bundle`
      assert.match(position.source ?? "", /src\/index\.ts$/, message)
      assert.deepEqual([position.line, position.column], [3, 9], message)
    }
  }
})

void test("Linker stores its cache only when it changed", async (t) => {
  const dir = fixture(t, {
    "lib/index.js": `import {a} from "./a.js"; export {a}`,
    "lib/a.js": "export const a = 1",
  })
  const cache = join(dir, "cache.json")
  const build = async () => {
    const linker = new Linker({entries: [join(dir, "lib", "index.js")], bases: [join(dir, "lib"), join(dir, "node_modules")], cache})
    linker.load_cache()
    await linker.link()
    linker.store_cache()
  }
  const stored = () => fs.readFileSync(cache, "utf-8")

  await build()
  const initial = stored()
  assert.match(initial, /export const a = 1/)

  const marked = JSON.stringify({...JSON.parse(initial), marked: true})
  fs.writeFileSync(cache, marked)
  await build()
  assert.equal(stored(), marked, "nothing changed, so not stored")

  fs.writeFileSync(cache, JSON.stringify({version: 0}))
  t.mock.method(console, "warn", () => {})
  await build()
  assert.equal(stored(), initial, "incompatible cache, so stored")

  fs.writeFileSync(join(dir, "lib", "a.js"), "export const a = 2")
  await build()
  assert.match(stored(), /export const a = 2/, "a module changed, so stored")

  fs.writeFileSync(join(dir, "lib", "index.js"), "export const a = 3")
  await build()
  assert.doesNotMatch(stored(), /a\.js/, "a module was removed, so stored")
})
