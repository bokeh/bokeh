import assert from "node:assert/strict"
import {createRequire} from "node:module"
import {test} from "node:test"

import {to_cjs} from "#compiler/esm_to_cjs.js"

type Exports = {[key: string]: any}
type Modules = {[spec: string]: string}

const node_require = createRequire(import.meta.url)

/**
 * Converts and evaluates `modules` with a minimal CommonJS loader, like
 * the one in bundles. Modules ending with `.cjs` are evaluated as is.
 */
function run(modules: Modules, entry: string = "./main"): Exports {
  const cache = new Map<string, {exports: Exports}>()

  function require(spec: string): Exports {
    if (spec == "tslib") {
      return node_require("tslib") as Exports
    }
    const cached = cache.get(spec)
    if (cached != null) {
      return cached.exports
    }
    const source = modules[spec] as string | undefined
    if (source == null) {
      throw new Error(`unknown module '${spec}'`)
    }
    const mod = {exports: {} as Exports}
    cache.set(spec, mod)
    if (spec.endsWith(".cjs")) {
      new Function("require", "module", "exports", source)(require, mod, mod.exports)
    } else {
      const {code} = to_cjs(`${spec}.js`, source)
      const __esModule = () => Object.defineProperty(mod.exports, "__esModule", {value: true})
      const __esExport = (name: string, value: unknown) => Object.defineProperty(mod.exports, name, {enumerable: true, get: () => value})
      new Function("require", "module", "exports", "__esModule", "__esExport", `"use strict";\n${code}`)(require, mod, mod.exports, __esModule, __esExport)
    }
    return mod.exports
  }

  return require(entry)
}

void test("to_cjs() supports named, default and namespace imports of ES modules", () => {
  const main = run({
    "./main": `
      import def, {a, b as c} from "./lib"
      import * as ns from "./lib"
      export const result = [def, a, c, ns.a, ns.default]
    `,
    "./lib": `
      export const a = 1
      export const b = 2
      export default 3
    `,
  })
  assert.deepEqual(main.result, [3, 1, 2, 1, 3])
  assert.equal(main.__esModule, true)
})

void test("to_cjs() supports default and namespace imports of CommonJS modules", () => {
  const main = run({
    "./main": `
      import fn from "./fn.cjs"
      import * as ns from "./obj.cjs"
      import obj, {x} from "./obj.cjs"
      export const result = [fn(), ns.x, ns.default.x, obj.x, x]
    `,
    "./fn.cjs": "module.exports = () => 'fn'",
    "./obj.cjs": "module.exports = {x: 'x'}",
  })
  assert.deepEqual(main.result, ["fn", "x", "x", "x", "x"])
})

void test("to_cjs() evaluates imports in order and before the module's body", () => {
  const main = run({
    "./main": `
      import {log} from "./log"
      log.push("main")
      import "./a"
      import "./b"
      export {log}
    `,
    "./log": "export const log = []",
    "./a": `import {log} from "./log"; log.push("a")`,
    "./b": `import {log} from "./log"; log.push("b")`,
  })
  assert.deepEqual(main.log, ["a", "b", "main"])
})

void test("to_cjs() supports all kinds of exports", () => {
  const main = run({
    "./main": `
      export const a = 1, {b, c: [d]} = {b: 2, c: [3]}
      export function f() { return "f" }
      export class C {}
      const e = 5
      export {e as renamed, e as "with space"}
    `,
  })
  assert.equal(main.a, 1)
  assert.equal(main.b, 2)
  assert.equal(main.d, 3)
  assert.equal(main.f(), "f")
  assert.equal(main.C.name, "C")
  assert.equal(main.renamed, 5)
  assert.equal(main["with space"], 5)
})

void test("to_cjs() supports all kinds of default exports", () => {
  const main = run({
    "./main": `
      import f from "./function"
      import C from "./class"
      import A from "./anonymous"
      import x from "./expression"
      export const result = [f(), C.name, typeof A, x]
    `,
    "./function": "export default function f() { return 'f' }",
    "./class": "export default class C {}",
    "./anonymous": "export default class {}",
    "./expression": "export default 1 + 2",
  })
  assert.deepEqual(main.result, ["f", "C", "function", 3])
})

void test("to_cjs() supports re-exports", () => {
  const main = run({
    "./main": `
      export {a as b, default as def} from "./lib"
      export * from "./star"
      export * as ns from "./lib"
      export const shadowed = "local"
    `,
    "./lib": "export const a = 1; export default 2",
    "./star": "export const s = 3; export const shadowed = 'star'; export default 4",
  })
  assert.equal(main.b, 1)
  assert.equal(main.def, 2)
  assert.equal(main.s, 3)
  assert.equal(main.shadowed, "local", "local exports take precedence over star exports")
  assert.equal(main.default, undefined, "star exports don't include default")
  assert.equal(main.ns.a, 1)
})

void test("to_cjs() preserves live bindings of reassigned exports", () => {
  const main = run({
    "./main": `
      import {count, increment} from "./counter"
      import * as counter from "./counter"
      const before = count
      increment()
      export const result = [before, count, counter.count]
    `,
    "./counter": "export let count = 0; export function increment() { count++ }",
  })
  assert.deepEqual(main.result, [0, 1, 1])
})

void test("to_cjs() calls imported functions with undefined `this`", () => {
  const main = run({
    "./main": `
      import {this_of} from "./lib"
      export const result = this_of()
      export const tagged = this_of\`\`
    `,
    "./lib": "export function this_of() { return this }",
  })
  assert.equal(main.result, undefined)
  assert.equal(main.tagged, undefined)
})

void test("to_cjs() guards calls at the start of statements against ASI", () => {
  const source = `
    import {push, log} from "./log"
    push("a")
    push("b")
    if (log.length == 0) push("never")
    for (const x of ["c"]) push(x)
    export {log}
  `
  const main = run({
    "./main": source,
    "./log": "export const log = []; export function push(x) { log.push(x) }",
  })
  assert.deepEqual(main.log, ["a", "b", "c"])
  const {code} = to_cjs("main.js", source)
  assert.match(code, /^\s*;\(0, log_\d+\.push\)\("a"\)$/m, "statements in statement lists are guarded")
  assert.match(code, /if \(log_\d+\.log\.length == 0\) \(0, /, "braceless bodies aren't guarded")
})

void test("to_cjs() rewrites shorthand properties and respects shadowing", () => {
  const main = run({
    "./main": `
      import {a} from "./lib"
      function shadowed(a) { return a }
      export const result = [{a}, shadowed(2), (() => { const a = 3; return a })()]
    `,
    "./lib": "export const a = 1",
  })
  assert.deepEqual(main.result, [{a: 1}, 2, 3])
})

void test("to_cjs() preserves names of classes and functions", () => {
  // like core/kinds, where nested classes shadow top-level exports
  const main = run({
    "./main": `
      export var Kinds
      (function (Kinds) {
        class Any {}
        Kinds.Any = Any
      })(Kinds || (Kinds = {}))
      export const Any = new Kinds.Any()
    `,
  })
  assert.equal(main.Any.constructor.name, "Any")
})

void test("to_cjs() converts dynamic imports", async () => {
  const main = run({
    "./main": `export const promise = import("./lib")`,
    "./lib": "export const a = 1",
  })
  const ns = await main.promise
  assert.equal(ns.a, 1)
})

void test("to_cjs() reports dependencies in the order of evaluation", () => {
  const {deps} = to_cjs("main.js", `
    import "./a"
    export * from "./b"
    import def from "./c"
    export const lazy = () => import("./d")
  `)
  assert.deepEqual(deps, ["./a", "./b", "./c", "./d", "tslib"])
})

void test("to_cjs() rejects unsupported syntax", () => {
  assert.throws(() => to_cjs("main.js", "export const url = import.meta.url"), /import\.meta/)
  assert.throws(() => to_cjs("main.js", "export const p = import(name)"), /dynamic import/)
})
