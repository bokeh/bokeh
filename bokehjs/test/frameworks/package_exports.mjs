import assert from "node:assert/strict"
import {spawnSync} from "node:child_process"
import {mkdtempSync, readFileSync, rmSync, statSync, writeFileSync} from "node:fs"
import {dirname, join, normalize} from "node:path"
import {fileURLToPath} from "node:url"

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
  ["Bundler", "ESNext", "Bundler"],
  ["NodeNext", "NodeNext", "NodeNext"],
]
const declarations = new Map()

for (const [key, target] of Object.entries(exports)) {
  assert.equal(typeof target, "string", `expected a direct export target for ${key}`)
  const sample = samples.get(key) ?? ""
  assert.ok(!key.includes("*") || sample != "", `missing wildcard sample for ${key}`)
  const subpath = key.replaceAll("*", sample)
  const specifier = subpath == "." ? "@bokeh/bokehjs" : `@bokeh/bokehjs${subpath.slice(1)}`
  const runtime_path = join(package_dir, target.replaceAll("*", sample))
  assert.ok(statSync(runtime_path).isFile(), `missing packed export ${specifier}`)
  assert.equal(fileURLToPath(import.meta.resolve(specifier)), runtime_path, `Node resolved ${specifier} incorrectly`)

  declarations.set(specifier, runtime_path.endsWith(".js") ? runtime_path.slice(0, -3) + ".d.ts" : runtime_path)
}

const compiler = process.argv[2]
assert.ok(compiler != null, "the native TypeScript CLI path is required")
const temporary = mkdtempSync(join(import.meta.dirname, ".exports-check-"))
try {
  const source = [...declarations.keys()].map((specifier, i) => `export type Export${i} = typeof import(${JSON.stringify(specifier)})`)
  writeFileSync(join(temporary, "consumer.mts"), `${source.join("\n")}\n`)
  for (const [mode, module, moduleResolution] of modes) {
    const config = join(temporary, "tsconfig.json")
    writeFileSync(config, JSON.stringify({
      compilerOptions: {
        module, moduleResolution, resolveJsonModule: true, noEmit: true,
        noImplicitAny: true, skipLibCheck: true, types: [], target: "ES2022",
      },
      files: ["consumer.mts"],
    }))
    const result = spawnSync(process.execPath, [compiler, "--project", config, "--listFiles", "--pretty", "false"], {encoding: "utf8"})
    assert.equal(result.status, 0, `${mode} failed to type-check packed exports:\n${result.stdout}\n${result.stderr}`)
    const files = new Set(result.stdout.split(/\r?\n/).map((file) => normalize(file)))
    for (const [specifier, declaration_path] of declarations) {
      assert.ok(files.has(normalize(declaration_path)), `${mode} didn't load the packed declarations for ${specifier}`)
    }
  }
} finally {
  rmSync(temporary, {recursive: true, force: true})
}

assert.equal(globalThis.window, undefined)
assert.equal(globalThis.document, undefined)
const Bokeh = await import("@bokeh/bokehjs")
const {register_all_models} = await import("@bokeh/bokehjs/all")
const plot = Bokeh.Plotting.figure({width: 240, height: 160})
plot.line([0, 1], [1, 0])
assert.equal(typeof Bokeh.mount, "function")
const resolver = new Bokeh.ModelResolver(null)
register_all_models(resolver)
assert.equal(resolver.get("Range1d"), Bokeh.Range1d)
assert.equal(resolver.get("Button")?.__qualified__, "Button")
assert.equal(resolver.get("DataTable")?.__qualified__, "DataTable")
console.log(`packed exports passed: ${Object.keys(exports).length} Node/Bundler/NodeNext paths and SSR imports`)
