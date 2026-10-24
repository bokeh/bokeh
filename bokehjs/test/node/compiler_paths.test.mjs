import {mkdtempSync, mkdirSync, realpathSync, rmSync, writeFileSync} from "node:fs"
import {tmpdir} from "node:os"
import {join, posix, win32} from "node:path"
import {fileURLToPath} from "node:url"

import assert from "node:assert/strict"
import {it} from "node:test"
import {TraceMap, originalPositionFor} from "@jridgewell/trace-mapping"

import {bundle_models} from "../../build/js/compiler/inline.js"
import {is_relative_to_base} from "../../build/js/compiler/bundle.js"
import {prelude, postlude} from "../../build/js/compiler/prelude.js"

it("keeps modules on another Windows drive or UNC share outside the bundle base", () => {
  const base = String.raw`C:\temporary\modules`
  for (const file of [String.raw`D:\private\helper.ts`, String.raw`C:\project\helper.ts`, String.raw`C:\temporary`]) {
    assert.equal(is_relative_to_base(win32.relative(base, file)), false, file)
  }
  const share = String.raw`\\server\temporary\modules`
  assert.equal(is_relative_to_base(win32.relative(share, String.raw`\\server\private\helper.ts`)), false)
  assert.equal(is_relative_to_base(win32.relative(share, String.raw`\\other\temporary\helper.ts`)), false)
  for (const file of [String.raw`C:\temporary\modules\helper.ts`, String.raw`C:\temporary\modules\..helper.ts`]) {
    assert.equal(is_relative_to_base(win32.relative(base, file)), true, file)
  }
  assert.equal(is_relative_to_base(posix.relative("/temporary/modules", "/temporary/modules/helper.ts")), true)
  assert.equal(is_relative_to_base(posix.relative("/temporary/modules", "/private/helper.ts")), false)
})

it("keeps inline output location-independent without merging distinct helper modules", {timeout: 60_000}, async () => {
  const temporary = realpathSync(mkdtempSync(join(tmpdir(), "bokeh private source ")))
  try {
    const helper = 'export const state = {value: 42}\nexport function fail() {throw new Error("path stable mapping marker")}\n'
    const code = `
import {state as first, fail} from "./first/helper"
import {state as again} from "./first/../first/helper"
import {state as second} from "./second/helper"
export class A0Model {
  static first = first
  static again = again
  static second = second
  static lazy() {return import("./first/helper")}
  static fail() {fail()}
}
`
    const outputs = []
    for (const directory of ["first-project", "first-project", "second-project"]) {
      const path = join(temporary, directory, "src")
      for (const subdirectory of ["first", "second"]) {
        mkdirSync(join(path, subdirectory), {recursive: true})
        writeFileSync(join(path, subdirectory, "helper.ts"), helper)
      }
      const result = await bundle_models({
        models: [{name: "A0Model", full_name: "A0Model", module: "custom/a0model", code,
                  lang: "typescript", file: join(path, "user-script.py:A0Model.ts"), path}],
        entry: "custom/main/path-fixture",
        bokehjs_dir: fileURLToPath(new URL("../../build", import.meta.url)),
        bokeh_version: "4.0.0",
      })
      assert(!("error" in result), result.error)
      outputs.push(result.code)
    }
    assert.equal(outputs[0], outputs[1], "a repeated build must not embed its temporary directory")
    assert.equal(outputs[0], outputs[2], "relocating identical inputs must not change the bundle or its map")

    const [generated, encoded] = outputs[0].split("//# sourceMappingURL=data:application/json;base64,")
    const map = JSON.parse(Buffer.from(encoded.trim(), "base64").toString())
    for (const value of [generated, JSON.stringify(map)]) {
      assert(!value.includes(temporary), "output exposed the caller's source directory")
      assert(!value.includes("bokeh-inline-"), "output exposed the compiler's temporary directory")
    }
    assert(map.sources.some((source) => source.endsWith("user-script.py:A0Model.ts")))
    assert(map.sources.every((source) => source.startsWith("inline/") && !source.includes("..")))
    const marker = '"path stable mapping marker"'
    const lines = generated.slice(0, generated.indexOf(marker)).split("\n")
    const position = originalPositionFor(new TraceMap(map), {line: lines.length, column: lines.at(-1).length})
    assert(position.source.endsWith("/helper.ts"))
    assert.equal(position.line, 2)
    assert.equal(position.column, helper.split("\n")[1].indexOf(marker))
    assert.equal(map.sourcesContent[map.sources.indexOf(position.source)], helper)

    const host = `${prelude()}({
      main: function(require, module) {module.exports = {models: {}};},
      base: function(require, module) {
        module.exports.register_models = function(models) {Object.assign(require("main").models, models);};
      },
    }, "main");${postlude()}`
    const root = {}
    new Function(host).call(root)
    new Function(outputs[0]).call(root)
    const {A0Model} = root.Bokeh.models
    assert.equal(A0Model.first, A0Model.again)
    assert.notEqual(A0Model.first, A0Model.second)
    assert.equal((await A0Model.lazy()).state, A0Model.first)
  } finally {
    rmSync(temporary, {recursive: true, force: true})
  }
})
