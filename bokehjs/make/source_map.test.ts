import assert from "node:assert/strict"
import fs from "node:fs"
import os from "node:os"
import {join, dirname} from "node:path"
import type {TestContext} from "node:test"
import {test} from "node:test"

import {load_source_map, file_url} from "#compiler/source_map.js"

/** Creates a temporary directory with `files` and returns its path. */
function fixture(t: TestContext, files: {[file: string]: string}): string {
  const dir = fs.mkdtempSync(join(os.tmpdir(), "bokehjs-test-source-map-"))
  t.after(() => fs.rmSync(dir, {recursive: true, force: true}))
  for (const [file, source] of Object.entries(files)) {
    const path = join(dir, file)
    fs.mkdirSync(dirname(path), {recursive: true})
    fs.writeFileSync(path, source, {encoding: "utf-8"})
  }
  return dir
}

const map = (sources: string[], extra: object = {}) => JSON.stringify({version: 3, mappings: "AAAA", names: [], sources, ...extra})

void test("load_source_map() loads map files and contents of sources from disk", (t) => {
  const dir = fixture(t, {
    "src/a.ts": "export const a = 1",
    "lib/a.js.map": map(["../src/a.ts"]),
  })
  const file = join(dir, "lib", "a.js")
  const loaded = load_source_map(file, "export const a = 1\n//# sourceMappingURL=a.js.map")
  assert.ok(loaded != null)
  assert.deepEqual(loaded.sources, [file_url(join(dir, "src", "a.ts"))])
  assert.deepEqual(loaded.sourcesContent, ["export const a = 1"])
})

void test("load_source_map() resolves sources relative to the map file and its sourceRoot", (t) => {
  const dir = fixture(t, {
    "maps/a.js.map": map(["a.ts"], {sourceRoot: "../src", sourcesContent: ["content"]}),
  })
  const loaded = load_source_map(join(dir, "lib", "a.js"), "//# sourceMappingURL=../maps/a.js.map")
  assert.ok(loaded != null)
  assert.deepEqual(loaded.sources, [file_url(join(dir, "src", "a.ts"))])
  assert.deepEqual(loaded.sourcesContent, ["content"])
  assert.equal(loaded.sourceRoot, undefined)
})

void test("load_source_map() loads inline maps", () => {
  const inline = Buffer.from(map(["a.ts"], {sourcesContent: ["content"]})).toString("base64")
  const loaded = load_source_map("/lib/a.js", `//# sourceMappingURL=data:application/json;base64,${inline}`)
  assert.deepEqual(loaded?.sourcesContent, ["content"])
})

void test("load_source_map() ignores missing or incomplete maps", (t) => {
  const dir = fixture(t, {
    "lib/missing_source.js.map": map(["../src/missing.ts"]),
    "lib/invalid.js.map": "{",
  })
  const file = join(dir, "lib", "a.js")
  assert.equal(load_source_map(file, "export const a = 1"), null)
  assert.equal(load_source_map(file, "//# sourceMappingURL=missing_map.js.map"), null)
  assert.equal(load_source_map(file, "//# sourceMappingURL=missing_source.js.map"), null)
  assert.equal(load_source_map(file, "//# sourceMappingURL=invalid.js.map"), null)
})
