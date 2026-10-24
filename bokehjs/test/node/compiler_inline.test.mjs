import {fileURLToPath} from "node:url"
import {mkdtempSync, mkdirSync, readFileSync, realpathSync, rmSync, writeFileSync} from "node:fs"
import {tmpdir} from "node:os"
import {dirname, join} from "node:path"

import assert from "node:assert/strict"
import {describe, it} from "node:test"

import {bundle_models} from "../../build/js/compiler/inline.js"
import {bundle} from "../../build/js/compiler/bundle.js"
import {compile_and_resolve_deps} from "../../build/js/compiler/compile.js"
import {prelude, postlude} from "../../build/js/compiler/prelude.js"

const bokehjs_dir = fileURLToPath(new URL("../../build", import.meta.url))
const path = fileURLToPath(new URL(".", import.meta.url))

describe("inline custom model bundle identity", () => {
  it("keeps separate entries and reuses cached constructors when a bundle loads again", {timeout: 30_000}, async () => {
    const request = (name) => ({
      entry: `custom/main/${name}`,
      models: [{name, full_name: name, module: `custom/${name}`, code: `export class ${name} {}`,
                lang: "typescript", file: `${name}.ts`, path}],
      bokehjs_dir,
      bokeh_version: "4.0.0",
    })
    const compile = async (request) => {
      const result = await bundle_models(request)
      if ("error" in result) {
        throw new Error(result.error)
      }
      return result.code
    }
    const first_request = request("FirstModel")
    const second_request = request("SecondModel")
    const first = await compile(first_request)
    const second = await compile(second_request)
    const repeated = await compile(first_request)

    // Use the shipped registry with a minimal model-registration endpoint so
    // this test does not require a DOM or the full browser model hierarchy.
    const core = `${prelude()}({
      main: function(require, module) {module.exports = {models: {}, registrations: 0};},
      base: function(require, module) {
        const main = require("main");
        module.exports.register_models = function(models) {
          Object.assign(main.models, models);
          main.registrations++;
        };
      },
    }, "main");${postlude()}`
    const root = {}
    new Function(core).call(root)
    new Function(first).call(root)
    const first_exports = root.Bokeh.require(first_request.entry)
    assert.deepEqual(Object.keys(first_exports), ["FirstModel"])
    assert.equal(root.Bokeh.models.FirstModel, first_exports.FirstModel)

    new Function(second).call(root)
    const second_exports = root.Bokeh.require(second_request.entry)
    assert.deepEqual(Object.keys(second_exports), ["SecondModel"])
    assert.equal(root.Bokeh.require(first_request.entry), first_exports)
    assert.equal(root.Bokeh.models.FirstModel, first_exports.FirstModel)
    assert.equal(root.Bokeh.models.SecondModel, second_exports.SecondModel)
    assert.equal(root.Bokeh.registrations, 2)

    new Function(repeated).call(root)
    assert.equal(root.Bokeh.require(first_request.entry), first_exports)
    assert.equal(root.Bokeh.models.FirstModel, first_exports.FirstModel)
    assert.equal(root.Bokeh.registrations, 2)
  })
})

describe("inline custom model registry imports", () => {
  it("allows mutually referring models in fresh and cached CommonJS implementations", {timeout: 30_000}, async () => {
    for (const cached of [false, true]) {
      const models = [
        {name: "FirstModel", module: "custom/first", other: "SecondModel", dependency: "custom/second"},
        {name: "SecondModel", module: "custom/second", other: "FirstModel", dependency: "custom/first"},
      ].map(({name, module, other, dependency}) => ({
        name, full_name: name, module, lang: "typescript", file: `${name}.ts`, path,
        code: `import {${other}} from "${dependency}";
export class ${name} {static peer() {return ${other};}}`,
      }))
      if (cached) {
        for (const model of models) {
          // Cache hooks return CommonJS and resolve custom-model dependencies
          // when the complete graph is bundled, not during single-file emit.
          model.cached = await compile_and_resolve_deps({...model, lang: "javascript", bokehjs_dir})
          assert(!("error" in model.cached), model.cached.error)
        }
      }
      const result = await bundle_models({models, entry: "custom/main", bokehjs_dir, bokeh_version: "4.0.0"})
      assert(!("error" in result), result.error)
      const core = `${prelude()}({
        main: function(require, module) {module.exports = {models: {}};},
        base: function(require, module) {
          module.exports.register_models = function(models) {Object.assign(require("main").models, models);};
        },
      }, "main");${postlude()}`
      const root = {}
      new Function(core).call(root)
      new Function(result.code).call(root)
      const {FirstModel, SecondModel} = root.Bokeh.models
      assert.equal(FirstModel.peer(), SecondModel)
      assert.equal(SecondModel.peer(), FirstModel)
    }
  })

  it("preserves default and namespace imports, including cached CommonJS implementations", {timeout: 30_000}, async () => {
    const base = realpathSync(mkdtempSync(join(tmpdir(), "bokeh inline registry ")))
    try {
      const files = {
        "main.js": `
          export {models} from "./base.js";
          export * as array from "./core/util/array.js";
          export * as layout from "./core/layout/index.js";
          export {default as style} from "./styles/core.css.js";
        `,
        "base.js": `
          export const models = {};
          export function register_models(values) {Object.assign(models, values);}
        `,
        "core/util/array.js": "export const marker = {};",
        "core/layout/index.js": "export const marker = {};",
        "styles/core.css.js": 'export default ".fixture {color: red}";',
      }
      for (const [name, code] of Object.entries(files)) {
        mkdirSync(dirname(join(base, name)), {recursive: true})
        writeFileSync(join(base, name), code)
      }
      const output = join(base, "bokeh.js")
      await bundle({components: [{main: join(base, "main.js"), output}], base, minify: false})

      for (const cached of [false, true]) {
        for (const prefix of ["", "@bokehjs/"]) {
          const name = "RegistryModel"
          const code = `
            import css from "${prefix}styles/core.css";
            import * as array from "${prefix}core/util/array";
            import * as layout from "${prefix}core/layout";
            export class ${name} {
              static css = css;
              static array = array;
              static layout = layout;
              ${cached ? "" : `static lazy() {return import("${prefix}core/util/array");}`}
            }
          `
          const model = {name, full_name: name, module: `custom/${name}`, code,
            lang: "typescript", file: `${name}.ts`, path}
          if (cached) {
            model.cached = await compile_and_resolve_deps({...model, bokehjs_dir})
            assert(!("error" in model.cached), model.cached.error)
          }
          const result = await bundle_models({models: [model], entry: "custom/main", bokehjs_dir, bokeh_version: "4.0.0"})
          assert(!("error" in result), result.error)

          const root = {}
          new Function(readFileSync(output, "utf8")).call(root)
          new Function(result.code).call(root)
          const {RegistryModel} = root.Bokeh.models
          assert.equal(RegistryModel.css, ".fixture {color: red}")
          assert.equal(RegistryModel.array, root.Bokeh.require("core/util/array"))
          assert.equal(RegistryModel.layout, root.Bokeh.require("core/layout"))
          if (!cached) {
            assert.equal(await RegistryModel.lazy(), RegistryModel.array)
          }
        }
      }
    } finally {
      rmSync(base, {recursive: true, force: true})
    }
  })
})
