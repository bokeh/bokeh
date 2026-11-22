import assert from "node:assert/strict"
import fs from "node:fs"
import os from "node:os"
import {join, dirname, basename} from "node:path"
import type {TestContext} from "node:test"
import {test} from "node:test"

import {order_by_imports} from "./utilities.js"

type Sources = {[file: string]: string}

/** Creates a temporary source tree and returns its directory. */
function fixture(t: TestContext, sources: Sources): string {
  const dir = fs.mkdtempSync(join(os.tmpdir(), "bokehjs-test-modules-"))
  t.after(() => fs.rmSync(dir, {recursive: true, force: true}))
  for (const [file, source] of Object.entries(sources)) {
    const path = join(dir, file)
    fs.mkdirSync(dirname(path), {recursive: true})
    fs.writeFileSync(path, source, {encoding: "utf-8"})
  }
  return dir
}

const is_test_module = (file: string) => !basename(file).startsWith("_")

function order(t: TestContext, sources: Sources, files: string[] = Object.keys(sources)): string[] {
  return order_by_imports(fixture(t, sources), files, is_test_module)
}

/** All permutations of `items`. */
function* permutations<T>(items: T[]): Iterable<T[]> {
  if (items.length <= 1) {
    yield items
  } else {
    for (const [i, item] of items.entries()) {
      const rest = [...items.slice(0, i), ...items.slice(i + 1)]
      for (const permutation of permutations(rest)) {
        yield [item, ...permutation]
      }
    }
  }
}

void test("a test module comes after a test module it imports", (t) => {
  const sources = {
    "a.ts": 'import {x} from "./b"\n',
    "b.ts": "export const x = 1\n",
  }
  assert.deepEqual(order(t, sources), ["b.ts", "a.ts"])
  assert.deepEqual(order(t, sources, ["b.ts", "a.ts"]), ["b.ts", "a.ts"])
})

void test("imports are followed through helper modules, which aren't included", (t) => {
  const sources = {
    "a.ts": 'import {y} from "./_util"\n',
    "_util.ts": 'export {x as y} from "./sub/b"\n',
    "sub/b.ts": "export const x = 1\n",
  }
  assert.deepEqual(order(t, sources), ["sub/b.ts", "a.ts"])
})

void test("re-exports are treated as imports", (t) => {
  const sources = {
    "a.ts": 'export {x} from "./b"\nexport * from "./c"\n',
    "b.ts": "export const x = 1\n",
    "c.ts": "export const z = 1\n",
  }
  assert.deepEqual(order(t, sources), ["b.ts", "c.ts", "a.ts"])
})

void test("relative paths, .js extensions and index modules are resolved", (t) => {
  const sources = {
    "models/widgets/tables/data_table.ts": 'import {build} from "../../sources/cds_view"\n',
    "models/sources/cds_view.ts": 'import {x} from "../dir"\nexport const build = x\n',
    "models/dir/index.ts": 'import {y} from "./y.js"\nexport const x = y\n',
    "models/dir/y.ts": "export const y = 1\n",
  }
  assert.deepEqual(order(t, sources), [
    "models/dir/y.ts",
    "models/dir/index.ts",
    "models/sources/cds_view.ts",
    "models/widgets/tables/data_table.ts",
  ])
})

void test("non-relative, JSON and unknown imports are ignored", (t) => {
  const sources = {
    "a.ts": [
      'import {expect} from "#framework/assertions"',
      'import {Plot} from "@bokehjs/models"',
      'import data from "./data.json" with {type: "json"}',
      'import {missing} from "./missing"',
      "",
    ].join("\n"),
    "b.ts": "export const x = 1\n",
  }
  assert.deepEqual(order(t, sources), ["a.ts", "b.ts"])
})

void test("each test module is included exactly once", (t) => {
  const sources = {
    "a.ts": 'import "./c"\nimport "./_util"\n',
    "b.ts": 'import "./c"\nimport "./_util"\n',
    "c.ts": "",
    "_util.ts": 'import "./c"\n',
  }
  const result = order(t, sources)
  assert.equal(result.length, 3)
  assert.deepEqual(new Set(result), new Set(["a.ts", "b.ts", "c.ts"]))
})

void test("import cycles don't prevent ordering", (t) => {
  const sources = {
    "a.ts": 'import "./b"\n',
    "b.ts": 'import "./a"\n',
    "c.ts": 'import "./a"\n',
  }
  const result = order(t, sources)
  assert.deepEqual(new Set(result), new Set(["a.ts", "b.ts", "c.ts"]))
  assert.equal(result.at(-1), "c.ts")
})

void test("the order of discovery doesn't affect dependencies being loaded first", (t) => {
  // e  ->  d  ->  _h  ->  b  ->  a
  //        \-> c ---------/
  const sources = {
    "a.ts": "",
    "b.ts": 'import "./a"\n',
    "c.ts": 'import "./b"\n',
    "_h.ts": 'import "./b"\n',
    "d.ts": 'import "./_h"\nimport "./c"\n',
    "e.ts": 'import "./d"\n',
  }
  const imports: [string, string][] = [
    ["b.ts", "a.ts"],
    ["c.ts", "b.ts"],
    ["d.ts", "b.ts"],
    ["d.ts", "c.ts"],
    ["e.ts", "d.ts"],
  ]

  const dir = fixture(t, sources)
  for (const files of permutations(Object.keys(sources))) {
    const result = order_by_imports(dir, files, is_test_module)
    assert.equal(result.length, 5, `for ${files.join(", ")}`)
    for (const [importer, imported] of imports) {
      assert.ok(result.indexOf(imported) < result.indexOf(importer), `${imported} before ${importer} for ${files.join(", ")}`)
    }
  }
})
