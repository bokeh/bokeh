import assert from "node:assert/strict"
import {mkdtempSync, realpathSync, rmSync, writeFileSync} from "node:fs"
import {tmpdir} from "node:os"
import {join} from "node:path"
import {describe, it} from "node:test"
import {fileURLToPath} from "node:url"

import {bundle_models} from "../../build/js/compiler/inline.js"
import {compile_and_resolve_deps} from "../../build/js/compiler/compile.js"
import {prelude, postlude} from "../../build/js/compiler/prelude.js"

const bokehjs_dir = fileURLToPath(new URL("../../build", import.meta.url))
const factory = `import {Model} from "@bokehjs/model";
export const make_subclass = () => class extends Model {};`

function model(path, name, code, lang = "javascript") {
  return {name, full_name: name, module: `custom/${name}`, code, lang,
    file: join(path, `${name}.${lang == "typescript" ? "ts" : "js"}`), path}
}

async function compile(models) {
  return await bundle_models({models, entry: "custom/main", bokehjs_dir, bokeh_version: "4.0.0"})
}

function evaluate(code) {
  const root = {}
  const core = `${prelude()}({
    main: function(require, module) {module.exports = {models: {}};},
    model: function(require, module) {module.exports.Model = class Model {};},
    base: function(require, module) {
      module.exports.register_models = function(models) {Object.assign(require("main").models, models);};
    },
  }, "main");${postlude()}`
  new Function(core).call(root)
  new Function(code).call(root)
  return root.Bokeh.models
}

describe("inline JavaScript declaration checking", () => {
  it("accepts factory exports in fresh and cached JS models alongside independent TS models", {timeout: 30_000}, async () => {
    const path = realpathSync(mkdtempSync(join(tmpdir(), "bokeh-js-factory-")))
    try {
      for (const cached of [false, true]) {
        const js = model(path, "JsFactoryModel", `${factory}
export class JsFactoryModel extends Model {static factory = make_subclass;}`)
        if (cached) {
          js.cached = await compile_and_resolve_deps({...js, bokehjs_dir})
          assert(!("error" in js.cached), js.cached.error)
        }
        for (const mixed of [false, true]) {
          const ts = model(path, "TsModel", "export class TsModel {static value: number = 42;}", "typescript")
          const result = await compile(mixed ? [js, ts] : [js])
          assert(!("error" in result), result.error)
          const models = evaluate(result.code)
          assert.equal(typeof models.JsFactoryModel.factory(), "function")
          if (mixed) {
            assert.equal(models.TsModel.value, 42)
          }
        }
      }
    } finally {
      rmSync(path, {recursive: true, force: true})
    }
  })

  it("accepts JS helpers while retaining declaration and semantic errors in TS helpers", {timeout: 30_000}, async () => {
    const path = realpathSync(mkdtempSync(join(tmpdir(), "bokeh-js-helper-")))
    try {
      writeFileSync(join(path, "helper.js"), factory)
      const js = model(path, "HelperModel", `import {make_subclass} from "./helper.js";
export class HelperModel {static factory = make_subclass;}`)
      const result = await compile([js])
      assert(!("error" in result), result.error)
      assert.equal(typeof evaluate(result.code).HelperModel.factory(), "function")

      writeFileSync(join(path, "helper.ts"), factory)
      js.code = js.code.replace("./helper.js", "./helper.ts")
      const declaration = await compile([js])
      assert("error" in declaration)
      assert.match(declaration.error, /TS4023|TS4094/)

      writeFileSync(join(path, "helper.ts"), "export const make_subclass: number = 'invalid';")
      const semantic = await compile([js])
      assert("error" in semantic)
      assert.match(semantic.error, /TS2322/)
    } finally {
      rmSync(path, {recursive: true, force: true})
    }
  })

  it("retains declaration, type, and unresolved-import errors for TypeScript model roots", {timeout: 30_000}, async () => {
    const path = realpathSync(mkdtempSync(join(tmpdir(), "bokeh-ts-factory-")))
    try {
      const ts = model(path, "TsFactoryModel", `${factory}
export class TsFactoryModel extends Model {}`, "typescript")
      const result = await compile([ts])
      assert("error" in result)
      assert.match(result.error, /TS4023|TS4094/)

      ts.code = "export class TsFactoryModel {static value: number = 'invalid';}"
      const semantic = await compile([ts])
      assert("error" in semantic)
      assert.match(semantic.error, /TS2322/)

      ts.code = 'import {value} from "./missing-helper"; export class TsFactoryModel {static value = value;}'
      await assert.rejects(compile([ts]), /Could not resolve '\.\/missing-helper'/)
    } finally {
      rmSync(path, {recursive: true, force: true})
    }
  })
})
