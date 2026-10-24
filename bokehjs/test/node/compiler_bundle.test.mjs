import fs from "node:fs"
import {spawnSync} from "node:child_process"
import {tmpdir} from "node:os"
import {dirname, join, resolve} from "node:path"
import {pathToFileURL} from "node:url"

import assert from "node:assert/strict"
import {describe, it} from "node:test"
import {rolldown} from "rolldown"
import {TraceMap, originalPositionFor} from "@jridgewell/trace-mapping"
import MagicString from "magic-string"

import {bundle, bundle_log} from "../../build/js/compiler/bundle.js"

describe("Rolldown compatibility", () => {
  it("bundles an empty extension through a symlinked project directory", async () => {
    const temporary = fs.realpathSync(fs.mkdtempSync(join(tmpdir(), "bokeh symlink bundle ")))
    try {
      const real = join(temporary, "real")
      const base = join(temporary, "linked")
      fs.mkdirSync(real)
      fs.symlinkSync(real, base, "junction")
      fs.writeFileSync(join(real, "index.js"), "export {}")
      await bundle({components: [{main: join(base, "index.js"), output: join(base, "bundle.js")}], base, plugin: true})
      for (const suffix of [".js", ".min.js"]) {
        let result
        const Bokeh = {register_plugin(modules, entry, aliases) {
          const module = {exports: {}}
          modules[entry](() => assert.fail("empty extension has no dependencies"), module, module.exports,
            () => Object.defineProperty(module.exports, "__esModule", {value: true}))
          assert.equal(aliases.index, entry)
          result = module.exports
        }}
        new Function(fs.readFileSync(join(real, `bundle${suffix}`), "utf8")).call({Bokeh})
        assert.deepEqual(Object.keys(result), [])
      }
    } finally {
      fs.rmSync(temporary, {recursive: true, force: true})
    }
  })

  it("suppresses plugin timing telemetry without hiding other diagnostics", () => {
    const messages = []
    for (const code of ["PLUGIN_TIMINGS", "PLUGIN_WARNING", "UNRESOLVED_IMPORT", "CIRCULAR_DEPENDENCY"]) {
      bundle_log("warn", {code, message: "PLUGIN_TIMINGS"}, (level, log) => messages.push({level, code: log.code}))
    }
    assert.deepEqual(messages, [
      {level: "warn", code: "PLUGIN_WARNING"},
      {level: "error", code: "UNRESOLVED_IMPORT"},
      {level: "warn", code: "CIRCULAR_DEPENDENCY"},
    ])
  })

  it("keeps direct eval diagnostics visible outside the exact regl dependency", async () => {
    for (const id of ["/project/app.js", "/project/node_modules/other/dist/regl.js", "/project/node_modules/regl/dist/regl.js"]) {
      const messages = []
      const build = await rolldown({
        input: id,
        plugins: [{name: "fixture", resolveId: (id) => id, load: () => "export function direct(code) { return eval(code) }"}],
        onLog(level, log) {
          bundle_log(level, log, (level, log) => messages.push({level, log: typeof log == "string" ? {message: log} : log}))
        },
      })
      try {
        await build.generate({format: "esm"})
        assert.equal((messages.filter(({log}) => log.code == "EVAL")).length, id == "/project/node_modules/regl/dist/regl.js" ? 0 : 1)
      } finally {
        await build.close()
      }
    }
  })

  it("keeps static and lazy registry links separate while preserving native URL imports", async () => {
    const base = fs.realpathSync(fs.mkdtempSync(join(tmpdir(), "bokeh bundle ")))
    try {
      fs.writeFileSync(join(base, "package.json"), '{"type":"module"}')
      fs.writeFileSync(join(base, "static.js"), "export const state = {loads: 0}; export const value = 21;")
      fs.writeFileSync(join(base, "lazy.js"), 'import {state} from "./static.js"; state.loads++; export const value = 42;')
      fs.writeFileSync(join(base, "main.js"), `
        import {value} from "./static.js";
        export {state} from "./static.js";
        export const answer = 2 * value;
        export const lazy = async () => (await import("./lazy.js")).value;
        export const native = async (url) => (await import(/* @vite-ignore */ /* webpackIgnore: true */ url)).value;
      `)
      await bundle({components: [{main: join(base, "main.js"), output: join(base, "bundle.js")}], base, esm: true})
      // A separate Node process exercises the emitted loaders in all formats.
      const runner = join(base, "run.mjs")
      fs.writeFileSync(runner, String.raw`
        import fs from "node:fs";
        import assert from "node:assert/strict";
        for (const suffix of [".js", ".min.js", ".esm.js", ".esm.min.js"]) {
          const file = new URL("./bundle" + suffix, import.meta.url);
          const code = fs.readFileSync(file, "utf8");
          const runtime = suffix.startsWith(".esm") ? (await import(file)).default :
            new Function(code + "\nreturn this.Bokeh;").call({});
          assert.equal(runtime.answer, 42);
          assert.equal(runtime.state.loads, 0);
          assert.equal(await runtime.lazy(), 42);
          assert.equal(await runtime.lazy(), 42);
          assert.equal(runtime.state.loads, 1);
          assert.equal(await runtime.native("data:text/javascript,export const value = 43"), 43);
          assert(code.includes("webpackIgnore: true"));
          assert(code.includes("@vite-ignore"));
        }
      `)
      const result = spawnSync(process.execPath, [runner], {encoding: "utf8", timeout: 10_000})
      assert.equal(result.error, undefined)
      assert.equal(result.status, 0, result.stderr)
    } finally {
      fs.rmSync(base, {recursive: true, force: true})
    }
  })

  it("rejects internal import cycles while allowing dependency cycles and the explicit opt-out", async () => {
    const base = fs.realpathSync(fs.mkdtempSync(join(tmpdir(), "bokeh cycle bundle ")))
    try {
      fs.writeFileSync(join(base, "package.json"), '{"type":"module"}')
      const options = {components: [{main: join(base, "main.js"), output: join(base, "bundle.js")}], base, minify: false}
      fs.writeFileSync(join(base, "main.js"), 'import {other} from "./other.js"; export function main() {return other};')
      for (const source of [
        'import {main} from "./main.js"; export function other() {return main};',
        'export function other() {return import("./main.js")};',
      ]) {
        fs.writeFileSync(join(base, "other.js"), source)
        await assert.rejects(bundle(options), /cycle detected: main -> other -> main/)
        await bundle({...options, detect_cycles: false})
      }

      const dependency = join(base, "node_modules", "cyclic")
      fs.mkdirSync(dependency, {recursive: true})
      fs.writeFileSync(join(dependency, "package.json"), '{"type":"module", "main":"a.js"}')
      fs.writeFileSync(join(dependency, "a.js"), 'import {b} from "./b.js"; export function a() {return b};')
      fs.writeFileSync(join(dependency, "b.js"), 'import {a} from "./a.js"; export function b() {return a};')
      fs.writeFileSync(join(base, "main.js"), 'export {a} from "cyclic";')
      await bundle(options)
    } finally {
      fs.rmSync(base, {recursive: true, force: true})
    }
  })

  it("maps unusable dependency maps to distributed JavaScript and preserves usable originals", async () => {
    const base = fs.realpathSync(fs.mkdtempSync(join(tmpdir(), "bokeh source map bundle ")))
    try {
      fs.writeFileSync(join(base, "package.json"), '{"type":"module"}')
      const originals = new Map()
      const cases = ["empty", "missing", "unmapped", "valid"]
      for (const name of cases) {
        const original = `export function fail() {\n  throw new Error("mapping marker ${name}");\n}\n`
        const file = join(base, `${name}.js`)
        const source = new MagicString(original)
        if (name == "valid") {
          source.prepend("// compiled prefix\n")
        }
        const code = `${source.toString()}//# sourceMappingURL=${name}.js.map\n`
        const map = JSON.parse(source.generateMap({source: `${name}.ts`, includeContent: true, hires: true}).toString())
        if (name == "empty") {
          Object.assign(map, {sources: [], sourcesContent: [], mappings: ";;;"})
        } else if (name == "missing") {
          map.sourcesContent = [null]
        } else if (name == "unmapped") {
          map.mappings = ""
        }
        fs.writeFileSync(file, code)
        fs.writeFileSync(`${file}.map`, JSON.stringify(map))
        originals.set(name, {file: name == "valid" ? join(base, "valid.ts") : file, code: name == "valid" ? original : code})
      }
      fs.writeFileSync(join(base, "main.js"), cases.map((name) => `export {fail as ${name}} from "./${name}.js";`).join("\n"))
      await bundle({components: [{main: join(base, "main.js"), output: join(base, "bundle.js")}], base, esm: true})
      for (const suffix of [".js", ".min.js", ".esm.js", ".esm.min.js"]) {
        const file = join(base, `bundle${suffix}`)
        const code = fs.readFileSync(file, "utf8")
        const data = JSON.parse(fs.readFileSync(`${file}.map`, "utf8"))
        const map = new TraceMap(data)
        for (const name of cases) {
          const marker = `mapping marker ${name}`
          const offset = code.indexOf(marker) - 1
          assert(offset >= 0)
          const lines = code.slice(0, offset).split("\n")
          const position = originalPositionFor(map, {line: lines.length, column: lines.at(-1).length})
          const original = originals.get(name)
          assert.equal(resolve(dirname(file), position.source), original.file, `${suffix}: ${name}`)
          assert.equal(position.line, 2)
          assert.equal(position.column, original.code.split("\n")[1].indexOf(marker) - 1)
          const index = data.sources.findIndex((source) => resolve(dirname(file), source) == original.file)
          assert.equal(data.sourcesContent[index], original.code)
        }
      }
    } finally {
      fs.rmSync(base, {recursive: true, force: true})
    }
  })

  it("escapes Unicode without shifting source maps or marking CommonJS exports as ES modules", async () => {
    const base = fs.realpathSync(fs.mkdtempSync(join(tmpdir(), "bokeh ASCII bundle ")))
    try {
      fs.writeFileSync(join(base, "package.json"), '{"type":"module"}')
      fs.writeFileSync(join(base, "legacy.cjs"), 'module.exports = {default: {value: 42}};')
      const source = 'export const text = "µ−🦋";\nexport const regexp = /π/u;\nexport default text;\nexport function fail() {throw new Error("after Unicode marker")}\n'
      fs.writeFileSync(join(base, "unicode.js"), source)
      fs.writeFileSync(join(base, "main.js"), 'export * from "./unicode.js"; export {default as legacy} from "./legacy.cjs";')
      await bundle({components: [{main: join(base, "main.js"), output: join(base, "bundle.js")}], base, esm: true})
      for (const suffix of [".js", ".min.js", ".esm.js", ".esm.min.js"]) {
        const file = join(base, `bundle${suffix}`)
        const code = fs.readFileSync(file, "utf8")
        assert(!/[^\x00-\x7F]/.test(code), suffix)
        const runtime = suffix.startsWith(".esm") ? (await import(pathToFileURL(file))).default :
          new Function(`${code}\nreturn this.Bokeh;`).call({})
        assert.equal(runtime.text, "µ−🦋")
        assert(runtime.regexp.test("π"))
        const namespace = runtime.require("unicode")
        assert.equal(namespace.__esModule, true)
        assert.equal(namespace.default, runtime.text)
        assert.equal(Object.getOwnPropertyDescriptor(namespace, "__esModule").enumerable, false)
        assert.equal(runtime.require("legacy.cjs"), runtime.legacy)
        assert.equal(runtime.legacy.__esModule, undefined)
        assert.deepEqual(runtime.legacy.default, {value: 42})

        const marker = "after Unicode marker"
        const offset = code.indexOf(marker) - 1
        assert(offset >= 0)
        const lines = code.slice(0, offset).split("\n")
        const map = new TraceMap(JSON.parse(fs.readFileSync(`${file}.map`, "utf8")))
        const position = originalPositionFor(map, {line: lines.length, column: lines.at(-1).length})
        assert.equal(resolve(dirname(file), position.source), join(base, "unicode.js"))
        assert.equal(position.line, 4)
        assert.equal(position.column, source.split("\n")[3].indexOf(marker) - 1)
      }
    } finally {
      fs.rmSync(base, {recursive: true, force: true})
    }
  })

  it("resolves prefixed plugin imports through the parent registry in classic and ESM bundles", async () => {
    const base = fs.realpathSync(fs.mkdtempSync(join(tmpdir(), "bokeh plugin bundle ")))
    try {
      fs.writeFileSync(join(base, "package.json"), '{"type":"module"}')
      const parent = join(base, "parent")
      const extension = join(base, "extension")
      fs.mkdirSync(parent)
      fs.mkdirSync(extension)
      fs.writeFileSync(join(parent, "style.js"), 'export default ".fixture {}"; export const value = {};')
      fs.writeFileSync(join(parent, "main.js"), 'export * as style from "./style.js";')
      await bundle({components: [{main: join(parent, "main.js"), output: join(base, "bokeh.js")}], base: parent, esm: true})
      fs.writeFileSync(join(extension, "extension.js"), `
        import style, * as namespace from "@bokehjs/style";
        export {style, namespace};
        export const lazy = () => import("@bokehjs/style");
      `)
      await bundle({
        components: [{main: join(extension, "extension.js"), output: join(base, "extension.js")}],
        base: extension, plugin: true, esm: true, external: [/^@bokehjs\//],
      })
      for (const suffix of [".js", ".min.js", ".esm.js", ".esm.min.js"]) {
        let runtime, plugin
        if (suffix.startsWith(".esm")) {
          runtime = (await import(pathToFileURL(join(base, `bokeh${suffix}`)))).default
          plugin = (await import(pathToFileURL(join(base, `extension${suffix}`)))).default
        } else {
          const root = {}
          new Function(fs.readFileSync(join(base, `bokeh${suffix}`), "utf8")).call(root)
          new Function(fs.readFileSync(join(base, `extension${suffix}`), "utf8")).call(root)
          runtime = root.Bokeh
          plugin = runtime.require("extension")
        }
        const namespace = runtime.require("style")
        assert.equal(plugin.style, ".fixture {}")
        assert.equal(plugin.namespace, namespace)
        assert.equal(plugin.namespace.value, runtime.style.value)
        assert.equal(await plugin.lazy(), namespace)
        assert.equal(runtime.require("@bokehjs/style"), namespace)
      }
    } finally {
      fs.rmSync(base, {recursive: true, force: true})
    }
  })
})

it("keeps the existing test runner global and parent module resolution", async () => {
  const base = fs.realpathSync(fs.mkdtempSync(join(tmpdir(), "bokeh test bundle ")))
  try {
    fs.writeFileSync(join(base, "package.json"), JSON.stringify({type: "module", sideEffects: false}))
    const parent = join(base, "parent")
    fs.mkdirSync(parent)
    fs.writeFileSync(join(parent, "lazy.js"), "export const value = {};")
    fs.writeFileSync(join(parent, "fixture.js"), `
      export default ".fixture {color: red}";
      export const value = {};
      export const registrations = [];
      export function register() { registrations.push(value); }
      export {value as lazy_value} from "./lazy.js";
    `)
    const parent_output = join(parent, "bundle.js")
    await bundle({
      components: [{main: join(parent, "fixture.js"), output: parent_output}],
      base: parent,
      global: "Parent",
    })
    fs.writeFileSync(join(base, "register.js"), `
      import {register} from "@bokehjs/fixture";
      register();
    `)
    fs.writeFileSync(join(base, "main.js"), `
      import "./register.js";
      import style, {value} from "@bokehjs/fixture";
      export {style, value};
      export const local = {};
      export const lazy = () => import("@bokehjs/fixture");
      export const lazy_only = () => import("@bokehjs/lazy");
    `)
    const output = join(base, "tests.js")
    await bundle({
      components: [{main: join(base, "main.js"), output}],
      base,
      global: "Tests",
      external: [/^@bokehjs\//],
      plugins: [{name: "test-registration", transform: () => ({moduleSideEffects: true})}],
    })
    for (const suffix of [".js", ".min.js"]) {
      const parent_code = fs.readFileSync(parent_output.replace(/\.js$/, suffix), "utf8")
      const parent_runtime = new Function(parent_code + "\nreturn this.Parent;").call({})
      const shared = parent_runtime.require("fixture")
      const requests = []
      const code = fs.readFileSync(output.replace(/\.js$/, suffix), "utf8")
      const runtime = new Function("require", code + "\nreturn this.Tests;").call({}, (id) => {
        requests.push(id)
        assert(["@bokehjs/fixture", "@bokehjs/lazy"].includes(id))
        return parent_runtime.require(id)
      })
      assert.equal(runtime.style, ".fixture {color: red}")
      assert.equal(runtime.value, shared.value)
      assert.deepEqual(shared.registrations, [shared.value])
      assert.equal(await runtime.lazy(), shared)
      assert.equal(await runtime.lazy(), shared)
      assert.equal(await runtime.lazy_only(), parent_runtime.require("lazy"))
      assert.equal((await runtime.lazy_only()).value, shared.lazy_value)
      assert.deepEqual(requests, ["@bokehjs/fixture", "@bokehjs/lazy"])
      assert.equal(runtime.require("main").local, runtime.local)
    }
  } finally {
    fs.rmSync(base, {recursive: true, force: true})
  }
})
