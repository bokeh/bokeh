import assert from "node:assert/strict"
import {readFileSync, statSync} from "node:fs"
import {dirname, join, normalize} from "node:path"
import {fileURLToPath} from "node:url"

import ts from "typescript"

// Run this copy from the installed workspace so every import uses packed files.
const package_path = fileURLToPath(import.meta.resolve("@bokeh/bokehjs/package.json"))
const package_dir = dirname(package_path)
assert.equal(package_dir, join(import.meta.dirname, "node_modules/@bokeh/bokehjs"))
const {exports} = JSON.parse(readFileSync(package_path, "utf-8"))
const samples = new Map([
  ["./api/*", "io"],
  ["./models/*", "ranges/range1d"],
  ["./document/*", "document"],
  ["./build/js/lib/*.js", "models/ranges/range1d"],
  ["./build/js/lib/*", "models/ranges/range1d"],
])
const modes = [
  ["Bundler", ts.ModuleKind.ESNext, ts.ModuleResolutionKind.Bundler],
  ["NodeNext", ts.ModuleKind.NodeNext, ts.ModuleResolutionKind.NodeNext],
]
const containing_file = join(import.meta.dirname, "consumer.mts")

for (const [key, target] of Object.entries(exports)) {
  assert.equal(typeof target, "string", `expected a direct export target for ${key}`)
  const sample = samples.get(key) ?? ""
  assert.ok(!key.includes("*") || sample != "", `missing wildcard sample for ${key}`)
  const subpath = key.replaceAll("*", sample)
  const specifier = subpath == "." ? "@bokeh/bokehjs" : `@bokeh/bokehjs${subpath.slice(1)}`
  const runtime_path = join(package_dir, target.replaceAll("*", sample))
  assert.ok(statSync(runtime_path).isFile(), `missing packed export ${specifier}`)
  assert.equal(fileURLToPath(import.meta.resolve(specifier)), runtime_path, `Node resolved ${specifier} incorrectly`)

  const declaration_path = runtime_path.endsWith(".js") ? runtime_path.slice(0, -3) + ".d.ts" : runtime_path
  for (const [mode, module, moduleResolution] of modes) {
    const {resolvedModule} = ts.resolveModuleName(specifier, containing_file, {
      module, moduleResolution, resolveJsonModule: true,
    }, ts.sys, undefined, undefined, ts.ModuleKind.ESNext)
    assert.equal(resolvedModule == null ? undefined : normalize(resolvedModule.resolvedFileName), declaration_path,
      `${mode} didn't resolve the packed declarations for ${specifier}`)
  }
}

assert.equal(globalThis.window, undefined)
assert.equal(globalThis.document, undefined)
const Bokeh = await import("@bokeh/bokehjs")
assert.equal(typeof Bokeh.server_document, "function")
// DocumentConfig has an existing registration needed by plain Documents.
const initial_models = ["DocumentConfig"]
assert.deepEqual(Bokeh.Models.names, initial_models, "importing the npm entry point populated the built-in model registry")
const {ClientConnection} = await import("@bokeh/bokehjs/build/js/lib/client/connection.js")
const {Deserializer} = await import("@bokeh/bokehjs/build/js/lib/core/serialization/deserializer.js")
const original_connect = ClientConnection.prototype.connect
const owners = []
const original_warn = console.warn
const warnings = []
console.warn = (...args) => warnings.push(args)
const connection_options = {url: "ws://packed.test/ws", token: btoa(JSON.stringify({session_id: "packed-registry"}))}
const probe_completed = new Error("registry probe completed before browser document construction")
const completed = (error) => error === probe_completed
try {
  // Opt-out leaves registry preparation with the application.
  ClientConnection.prototype.connect = async function() {
    assert.deepEqual(Bokeh.Models.names, initial_models)
    throw probe_completed
  }
  const manual = Bokeh.connect_session({...connection_options, register_builtin_models: false})
  owners.push(manual)
  await assert.rejects(manual.ready, completed)
  manual.dispose()
  assert.deepEqual(Bokeh.Models.names, initial_models)

  class ApplicationPlot extends Bokeh.Plot {}
  Bokeh.register_models({Plot: ApplicationPlot})
  // Literal serialized models keep widgets/tables out of the initial import graph.
  const serialized_roots = [
    {type: "object", name: "Plot", id: "plot", attributes: {name: "plot"}},
    {type: "object", name: "Slider", id: "slider", attributes: {name: "slider", start: 0, end: 10, value: 3}},
    {type: "object", name: "DataTable", id: "table", attributes: {name: "table"}},
  ]
  let decoded = 0
  ClientConnection.prototype.connect = async function() {
    // Registration must complete before the existing connection begins decoding.
    assert.equal(Bokeh.Models.get("Plot"), ApplicationPlot)
    assert.ok(Bokeh.Models.get("Slider"))
    assert.ok(Bokeh.Models.get("DataTable"))
    const roots = new Deserializer(Bokeh.Models).decode(structuredClone(serialized_roots))
    assert.ok(roots[0] instanceof ApplicationPlot)
    assert.ok(roots[1] instanceof Bokeh.Models.get("Slider"))
    assert.ok(roots[2] instanceof Bokeh.Models.get("DataTable"))
    decoded += 1
    // Like the SSR plot below, these local models live until this isolated probe
    // exits. Destroying them opens the browser signal cleanup MessageChannel.
    // Acquisition itself requires browser Document state. This Node probe stops
    // after the real model deserializer has exercised the prepared registry.
    throw probe_completed
  }
  const cancelled = Bokeh.connect_session(connection_options)
  owners.push(cancelled)
  cancelled.dispose()
  const first = Bokeh.connect_session(connection_options)
  const second = Bokeh.connect_session(connection_options)
  owners.push(first, second)
  await Promise.all([assert.rejects(first.ready, completed), assert.rejects(second.ready, completed)])
  await assert.rejects(cancelled.ready, {name: "AbortError"})
  assert.equal(decoded, 2, "a connection cancelled during lazy registration still began decoding")
  const repeated = Bokeh.connect_session(connection_options)
  owners.push(repeated)
  await assert.rejects(repeated.ready, completed)
  assert.equal(decoded, 3)
  assert.deepEqual(warnings, [], "automatic registration emitted duplicate-model warnings")
  assert.equal(globalThis.window, undefined)
  assert.equal(globalThis.document, undefined)
} finally {
  for (const owner of owners) owner.dispose()
  ClientConnection.prototype.connect = original_connect
  console.warn = original_warn
}

const {register_all_models} = await import("@bokeh/bokehjs/all")
const plot = Bokeh.Plotting.figure({width: 240, height: 160})
plot.line([0, 1], [1, 0])
assert.equal(typeof Bokeh.mount, "function")
const resolver = new Bokeh.ModelResolver(null)
register_all_models(resolver)
assert.equal(resolver.get("Range1d"), Bokeh.Range1d)
assert.equal(resolver.get("Button")?.__qualified__, "Button")
assert.equal(resolver.get("DataTable")?.__qualified__, "DataTable")
console.log(`packed exports passed: ${Object.keys(exports).length} paths, SSR imports, and automatic live-session model registration`)
