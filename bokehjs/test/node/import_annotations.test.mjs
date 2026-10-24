import assert from "node:assert/strict"
import {describe, it} from "node:test"
import {rolldown} from "rolldown"
import {parseSync} from "rolldown/experimental"
import {originalPositionFor, TraceMap} from "@jridgewell/trace-mapping"

import {preserve_import_annotations, restore_import_annotations} from "../../build/js/compiler/import_annotations.js"

const source = `
import {other} from "/other.js"
export async function annotated(url) {
  const café = await import(/* @vite-ignore */ /* webpackIgnore: true */ \`\${url}\`)
  return café.value + other
}
export const trailing = (url) => import(url /* @vite-ignore */ /* webpackIgnore: true */)
export const variable = (url) => import(url)
export const pattern = (name) => import(\`./\${name}.js\`)
export const literal = () => import("data:text/javascript,export const value = 1")
export const nested = async (url) => import((await import(url /* @vite-ignore */ /* webpackIgnore: true */)).target)
`

describe("consumer import annotations", () => {
  for (const format of ["esm", "cjs"]) {
    it(`restores only annotated imports after ${format} minification and preserves mappings`, async () => {
      const build = await rolldown({
        input: "/entry.js",
        external: (id) => id.startsWith("data:"),
        plugins: [{name: "fixture", resolveId: (id) => id, load: (id) => id == "/other.js" ? "export const other = globalThis.other" : source}],
      })
      try {
        const result = await build.generate({format, minify: true, sourcemap: true, plugins: [preserve_import_annotations()]})
        const output = result.output.find((output) => output.type == "chunk")
        const {module, comments} = parseSync(output.fileName, output.code)
        assert.equal((module.dynamicImports).length, 7)
        const annotations = module.dynamicImports.sort((a, b) => a.start - b.start).map((expression) => comments.filter(({start, end}) =>
          start > expression.start && end <= expression.moduleRequest.start,
        ).map(({value}) => value.trim()))
        assert.deepEqual(annotations, [
          ["@vite-ignore", "webpackIgnore: true"],
          ["@vite-ignore", "webpackIgnore: true"],
          [], [], [], [],
          ["@vite-ignore", "webpackIgnore: true"],
        ])

        const map = JSON.parse(output.map.toString())
        assert.equal((map.sources).length, 2)
        const asset = result.output.filter((output) => output.type == "asset").find((output) => output.fileName.endsWith(".map"))
        const published = JSON.parse(asset.source.toString())
        for (const [key, value] of Object.entries(map)) {
          assert.deepEqual(published[key], value, `published source map ${key}`)
        }
        const generated = output.code.slice(0, output.code.indexOf(".value") + 1).split("\n")
        const original = source.slice(0, source.indexOf(".value") + 1).split("\n")
        const position = originalPositionFor(new TraceMap(map), {line: generated.length, column: generated.at(-1).length})
        assert.equal(position.line, original.length)
        assert.equal(position.column, original.at(-1).length)
        assert.deepEqual(restore_import_annotations(output.fileName, output.code, map), {code: output.code, map})
      } finally {
        await build.close()
      }
    })
  }
})
