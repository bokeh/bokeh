import assert from "node:assert/strict"
import {join, normalize} from "node:path"
import {pathToFileURL} from "node:url"

const build_dir = normalize(`${import.meta.dirname}/../..`) // build/test/codebase -> build
const prelude_url = pathToFileURL(join(build_dir, "js/compiler/prelude.js")).href
const {prelude_esm} = await import(prelude_url) as {prelude_esm(minified: boolean): string}

const source = `${prelude_esm(false)}({
  main: function(_require, _module, exports, __esModule, __esExport) {
    __esModule();
    __esExport("shared", "main");
    exports.main_only = "main";
  }
}, "main", {}, {});
const plugin = main.register_plugin({
  plugin: function(_require, _module, exports, __esModule, __esExport) {
    __esModule();
    __esExport("shared", "plugin");
    exports.plugin_only = "plugin";
  }
}, "plugin", {}, {});
return {main, plugin};
`

type TestExports = {
  readonly shared: string
  readonly main_only?: string
  readonly plugin_only?: string
}

const {main, plugin} = new Function(source)() as {main: TestExports, plugin: TestExports}
assert.equal(main.shared, "main")
assert.equal(main.main_only, "main")
assert.equal(main.plugin_only, "plugin")
assert.equal(plugin.shared, "plugin")
assert.equal(plugin.plugin_only, "plugin")
