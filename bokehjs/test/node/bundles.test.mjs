import fs from "node:fs"
import {SourceMap} from "node:module"
import {basename, dirname, isAbsolute, join, relative, resolve} from "node:path"
import {fileURLToPath} from "node:url"

import assert from "node:assert/strict"
import {describe, it} from "node:test"
import {parseSync, Visitor} from "oxc-parser"

const root = fileURLToPath(new URL("../..", import.meta.url))
const components = ["bokeh", "bokeh-gl", "bokeh-api", "bokeh-widgets", "bokeh-tables", "bokeh-mathjax"]
const suffixes = [".js", ".min.js", ".esm.js", ".esm.min.js"]
const bundles = [
  ...components.flatMap((name) => suffixes.map((suffix) => `build/js/${name}${suffix}`)),
  "build/esm/bokeh.js", "build/esm/bokeh.min.js",
  "build/js/bokeh-embed-bootstrap.js", "build/js/bokeh-embed-bootstrap.min.js",
]

function read_map(file) {
  return JSON.parse(fs.readFileSync(`${file}.map`, "utf-8"))
}

describe("shipped bundle source maps", () => {
  for (const bundle of bundles) {
    it(`contains no direct eval originating from Bokeh sources in ${bundle}`, () => {
      const file = join(root, bundle)
      const source = fs.readFileSync(file, "utf-8")
      const data = read_map(file)
      const map = new SourceMap({...data, file: data.file ?? basename(file), sourceRoot: data.sourceRoot ?? ""})
      const violations = []
      new Visitor({
        CallExpression(node) {
          if (node.callee.type == "Identifier" && node.callee.name == "eval") {
            const prefix = source.slice(0, node.callee.start).split("\n")
            const position = map.findEntry(prefix.length - 1, prefix.at(-1).length)
            if ("originalSource" in position && /(?:^|\/)src\/lib\//.test(position.originalSource)) {
              violations.push(`${position.originalSource}:${position.originalLine + 1}`)
            }
          }
        },
      }).visit(parseSync(bundle, source).program)
      assert.deepEqual(violations, [])
    })

    it(`contains original sources with paths relative to ${bundle}`, () => {
      const file = join(root, bundle)
      const map = read_map(file)
      // The optional file field is omitted by esbuild's bootstrap maps.
      assert.equal(map.file ?? basename(file), basename(file))
      assert.ok(map.sources.length > 0)
      assert.equal((map.sourcesContent).length, map.sources.length)

      const missing = []
      for (const [i, source] of map.sources.entries()) {
        assert.ok(!(source).includes("\\"))
        assert.equal(isAbsolute(source), false, source)
        const original = resolve(dirname(file), map.sourceRoot ?? "", source)
        // Dependencies may embed originals that their npm package doesn't
        // include as files. The embedded text makes those maps self-contained.
        if (typeof map.sourcesContent[i] != "string" || relative(root, original).startsWith("..")) {
          missing.push(source)
        }
      }
      assert.deepEqual(missing, [])
    })
  }

  for (const bundle of bundles.filter((file) => /\/bokeh[.]/.test(file))) {
    it(`maps an optimized runtime error in ${bundle} to its TypeScript position`, () => {
      const file = join(root, bundle)
      const source = fs.readFileSync(file, "utf-8")
      const original_file = join(root, "src/lib/core/has_props.ts")
      const original = fs.readFileSync(original_file, "utf-8")
      const marker = "models must be owned by only a single document"
      const generated_lines = source.split("\n")
      const original_lines = original.split("\n")
      const generated_line = generated_lines.findIndex((line) => line.includes(marker))
      const original_line = original_lines.findIndex((line) => line.includes(marker))
      assert.ok(generated_line >= 0)
      assert.ok(original_line >= 0)

      const data = read_map(file)
      const map = new SourceMap({...data, file: data.file ?? basename(file), sourceRoot: data.sourceRoot ?? ""})
      // Point at the string literal's opening quote, a token retained by both
      // production minifiers, instead of depending on generated identifier names.
      const position = map.findEntry(generated_line, generated_lines[generated_line].indexOf(marker) - 1)
      if (!("originalSource" in position)) {
        throw new Error(`Missing original position for ${bundle}`)
      }
      assert.equal(resolve(dirname(file), position.originalSource), original_file)
      assert.equal(position.originalLine, original_line)
      assert.equal(position.originalColumn, original_lines[original_line].indexOf(marker) - 1)
      const index = data.sources.findIndex((name) => resolve(dirname(file), name) == original_file)
      assert.equal(data.sourcesContent[index], original)
    })
  }
})
