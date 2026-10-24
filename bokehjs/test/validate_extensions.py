"""Exercise the shipped compiler and optimized extensions in Chromium.

Run from a locked Pixi environment after building BokehJS. ``--package-root``
may be the checkout's ``src`` directory (with ``--source-checkout``) or a directory
populated by installing the Bokeh wheel. An external Node/npm installation is
required. The check records its Node executable with BOKEH_NODEJS_PATH before
removing Node and npm from PATH. It installs the native compiler into a fresh
isolated cache, then validates reuse with npm unavailable and npm offline.
"""

from __future__ import annotations

import argparse
import base64
import json
import os
import shutil
import sys
from pathlib import Path
from tempfile import TemporaryDirectory
from types import ModuleType


def configure_external_node(package_root: Path, work: Path) -> tuple[Path, Path]:
    from bokeh.settings import settings
    from bokeh.util.compiler import _nodejs_path, _npmjs_path

    configured = settings.nodejs_path()
    candidate = shutil.which(os.fspath(configured)) if configured is not None else shutil.which("nodejs") or shutil.which("node")
    assert candidate is not None, "validation requires an external Node installation or BOKEH_NODEJS_PATH"
    node = Path(candidate).resolve()
    assert not node.is_relative_to(package_root), "validation must use Node outside the installed Bokeh target"
    os.environ["BOKEH_NODEJS_PATH"] = str(node)
    assert _nodejs_path().resolve() == node
    npm = _npmjs_path().resolve()
    assert not npm.is_relative_to(package_root), npm
    os.environ["BOKEH_NPMJS_PATH"] = str(npm)

    empty = work / "empty-path"
    empty.mkdir(parents=True, exist_ok=True)
    os.environ["PATH"] = str(empty)
    os.environ["NODE_PATH"] = ""
    os.environ["NODE_OPTIONS"] = "--no-global-search-paths"
    assert shutil.which("node") is None and shutil.which("nodejs") is None and shutil.which("npm") is None
    assert _nodejs_path().resolve() == node
    assert _npmjs_path().resolve() == npm
    return node, npm


def write(path: Path, text: str) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(text, encoding="utf-8")


def check_map(path: Path, source: str) -> None:
    data = json.loads(path.read_text(encoding="utf-8"))
    assert data["version"] == 3, path
    assert data["mappings"], path
    assert any(name.endswith(source) for name in data["sources"]), (path, data["sources"])
    assert any(content is not None for content in data["sourcesContent"]), path


def cache_snapshot(directory: Path) -> dict[Path, tuple[int, int]]:
    files = {}
    for path in directory.rglob("*"):
        if path.is_file():
            stat = path.stat()
            files[path.relative_to(directory)] = (stat.st_size, stat.st_mtime_ns)
    return files


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--package-root", type=Path, required=True)
    parser.add_argument("--work-dir", type=Path, required=True)
    parser.add_argument("--source-checkout", action="store_true", help="use the checkout's current bokehjs/build artifacts")
    parser.add_argument("--dependency-root", type=Path, action="append", default=[])
    args = parser.parse_args()

    package_root = args.package_root.resolve()
    args.work_dir.mkdir(parents=True, exist_ok=True)
    sys.path[:0] = [str(package_root), *[str(path.resolve()) for path in args.dependency_root]]
    os.environ["BOKEH_DEV"] = "true" if args.source_checkout else "false"
    os.environ["npm_config_offline"] = "false"
    os.environ["npm_config_audit"] = "false"
    node, npm = configure_external_node(package_root, args.work_dir.resolve())

    import bokeh
    from bokeh import ext
    from bokeh.core.serialization import Deserializer, Serializer
    from bokeh.models import Slider
    from bokeh.settings import settings
    from bokeh.util.compiler import (
        AttrDict, CompilationError, CustomModel, JavaScript, TypeScript, bundle_models, calc_cache_key,
        get_cache_hook, nodejs_compile, set_cache_hook,
    )
    from playwright.sync_api import sync_playwright

    imported = Path(bokeh.__file__).resolve()
    assert imported.is_relative_to(package_root), (imported, package_root)
    static = settings.bokehjs_path()
    compiler_static = static
    assert (compiler_static / "js/compiler.js").is_file(), compiler_static
    if not args.source_checkout:
        assert static.resolve().is_relative_to(package_root), static
        assert compiler_static.resolve().is_relative_to(package_root), compiler_static
        assert compiler_static.resolve() == static.resolve(), (compiler_static, static)
    sys.modules["build_fixture"] = ModuleType("build_fixture")

    class CompiledSlider(Slider):
        __module__ = "build_fixture"
        __qualname__ = "CompiledSlider"

    class InlineSlider(Slider):
        __module__ = "build_fixture"
        __qualname__ = "InlineSlider"
        __implementation__ = TypeScript('''
import {Slider} from "@bokehjs/models/widgets/sliders/slider"
import {JavaScriptSlider} from "__JAVASCRIPT_MODULE__"
import {inline_suffix} from "./inline_esm_helper"
import {shared_state} from "./inline_helper"
import {package_suffix} from "extension-helper/value"
import "./inline.less"
import "./inline.css"
export class InlineSlider extends Slider {
  extension_label(): string {
    return `${this.title}: ${inline_suffix}; ${package_suffix}`
  }
  extension_state(): object {
    return shared_state
  }
  extension_peer_class(): typeof JavaScriptSlider {
    return JavaScriptSlider
  }
}
''')

    class PeerSlider(InlineSlider):
        __module__ = "build_fixture"
        __qualname__ = "PeerSlider"
        __implementation__ = TypeScript('''
import {InlineSlider} from "__INLINE_MODULE__"
import {shared_state} from "./inline_helper"
export class PeerSlider extends InlineSlider {
  override extension_state(): object {
    return shared_state
  }
}
'''.replace("__INLINE_MODULE__", CustomModel(InlineSlider).module))

    class JavaScriptSlider(Slider):
        __module__ = "build_fixture"
        __qualname__ = "JavaScriptSlider"
        __implementation__ = JavaScript('''
import {Slider} from "@bokehjs/models/widgets/sliders/slider"
import {InlineSlider} from "__INLINE_MODULE__"
export class JavaScriptSlider extends Slider {
  async extension_label() {
    const {lazy_suffix} = await import("./inline_lazy")
    return `${this.title}: ${lazy_suffix}`
  }
  async extension_state() {
    const {shared_state} = await import("./inline_lazy")
    return shared_state
  }
  extension_inline_class() {
    return InlineSlider
  }
}
'''.replace("__INLINE_MODULE__", CustomModel(InlineSlider).module))

    class CachedSlider(Slider):
        __module__ = "build_fixture"
        __qualname__ = "CachedSlider"
        __implementation__ = JavaScript('throw new Error("compiled-model cache hook was not used")')

    compiler_cache = args.work_dir.resolve() / "compiler-cache"
    npm_cache = args.work_dir.resolve() / "npm-cache"
    os.environ["BOKEH_COMPILER_CACHE"] = str(compiler_cache)
    os.environ["npm_config_cache"] = str(npm_cache)
    assert not compiler_cache.exists(), "cold validation requires a fresh --work-dir"

    with TemporaryDirectory(prefix="compiler-", dir=args.work_dir.resolve()) as directory:
        work = Path(directory)
        extension = work / "compiled_extension"
        inline_source = extension / "inline"
        write(inline_source / "inline_helper.ts", '''
export const shared_state = {value: 0}
''')
        write(inline_source / "inline_esm_helper.ts", '''
export const inline_suffix: string = "relative TypeScript dependency"
export const unused_bundle_sentinel = "unused-inline-helper-must-be-shaken"
''')
        write(inline_source / "inline_lazy.js", '''
export {shared_state} from "./inline_helper"
export const lazy_suffix = "dynamic JavaScript dependency"
''')
        write(inline_source / "inline.less", "@color: rgb(255, 0, 0); .inline-less-fixture { color: @color; }\n")
        write(inline_source / "inline.css", ".inline-css-fixture { border-top-width: 7px; border-top-style: solid; }\n")
        # This similarly named source must not shadow an npm package export.
        write(inline_source / "extension-helper/value.ts", "export const package_suffix: number = 42\n")
        inline_classes = [InlineSlider, PeerSlider, JavaScriptSlider, CachedSlider]
        for cls in inline_classes:
            cls.__base_path__ = str(inline_source)
            impl = cls.__implementation__
            suffix = "ts" if impl.lang == "typescript" else "js"
            code = impl.code.replace("__JAVASCRIPT_MODULE__", CustomModel(JavaScriptSlider).module)
            cls.__implementation__ = type(impl)(code, str(inline_source / f"{cls.__name__}.{suffix}"))
        write(extension / "bokeh.ext.json", "{}")
        # An ESM package with a CommonJS dependency and raw assets exercises npm
        # installation and interop without downloading packages or relying on
        # the checkout's modules.
        write(work / "helper/package.json", json.dumps({
            "name": "extension-helper", "version": "1.0.0",
            "type": "module", "main": "index.js", "types": "index.d.ts",
            "exports": {
                ".": {"types": "./index.d.ts", "default": "./index.js"},
                "./value": {"types": "./value.d.ts", "import": "./value.js", "require": "./value.cjs"},
            },
        }))
        write(work / "helper/suffix.cjs", 'exports.suffix = "from dependency";\n')
        write(work / "helper/index.js", '''
export {suffix} from "./suffix.cjs"
export {default as raw_css} from "./raw.css"
export {default as raw_yaml} from "./raw.yaml"
export {default as raw_json5} from "./raw.json5"
export {default as parsed_json} from "./raw.json"
''')
        write(work / "helper/index.d.ts", '''
export declare const suffix: string
export declare const raw_css: string
export declare const raw_yaml: string
export declare const raw_json5: string
export declare const parsed_json: {answer: number}
''')
        write(work / "helper/value.js", 'export const package_suffix = "ESM package export"\n')
        write(work / "helper/value.cjs", 'exports.package_suffix = "CommonJS package export";\n')
        write(work / "helper/value.d.ts", 'export declare const package_suffix: string\n')
        write(work / "helper/raw.css", ".asset-fixture { color: purple; }\n")
        write(work / "helper/raw.yaml", "title: fixture\nanswer: 42\n")
        write(work / "helper/raw.json5", "{answer: 42, trailing: true,}\n")
        write(work / "helper/raw.json", '{"answer": 42}\n')
        write(extension / "package.json", json.dumps({
            "name": "compiled-extension", "version": "1.0.0",
            "dependencies": {"extension-helper": "file:../helper"},
        }))
        write(extension / "styles/fixture.less", "@color: red;\n.bk-extension-fixture { color: @color; }\n")
        write(extension / "index.ts", '''
import {register_models, default_resolver} from "@bokehjs/base"
import {Model} from "@bokehjs/model"
import {Slider} from "@bokehjs/models/widgets/sliders/slider"
import {suffix} from "extension-helper"
import css, {extension_fixture} from "styles/fixture.css"

export class CompiledSlider extends Slider {
  static override __module__ = "build_fixture"

  extension_label(): string {
    return `${this.title}: ${suffix}`
  }
}

register_models({CompiledSlider})
export {Model as extension_model, default_resolver as extension_resolver, css, extension_fixture}
export {raw_css, raw_yaml, raw_json5, parsed_json} from "extension-helper"
''')

        # Change cwd as well as Python's import root. An installed compiler
        # accidentally reaching back into repository node_modules must fail.
        original_cwd = Path.cwd()
        try:
            os.chdir(work)
            assert ext.build(extension), "cold native compiler installation or extension build failed"
            for name, version in [("typescript", "7.0.2"), ("rolldown", "1.2.15")]:
                packages = list(compiler_cache.rglob(f"node_modules/{name}/package.json"))
                assert packages, f"compiler cache has no installed {name}"
                assert all(json.loads(path.read_text(encoding="utf-8"))["version"] == version for path in packages), packages
            installed_cache = cache_snapshot(compiler_cache)
            assert installed_cache, "cold compilation did not populate the isolated cache"

            # Warm compilation must neither invoke npm nor access its registry.
            # The sentinel also detects a version probe that would otherwise
            # quietly succeed using npm from the selected Node installation.
            unavailable_npm = args.work_dir.resolve() / "unavailable-npm.cjs"
            npm_invoked = args.work_dir.resolve() / "npm-invoked"
            write(unavailable_npm, f'''
require("node:fs").writeFileSync({json.dumps(str(npm_invoked))}, "invoked")
console.error("npm must not run after the compiler cache is populated")
process.exit(91)
''')
            os.environ["BOKEH_NPMJS_PATH"] = str(unavailable_npm)
            os.environ["npm_config_offline"] = "true"
            os.environ["npm_config_registry"] = "http://127.0.0.1:9"
            assert ext.build(extension), "warm extension compilation requires npm or registry access"
            write(extension / "extension-helper.ts", "export const suffix: number = 42\n")
            extension.chmod(0o555)
            try:
                npm_inline = nodejs_compile('''
import {suffix} from "extension-helper"
export const value: string = suffix
''', lang="typescript", file=str(extension / "virtual.ts"))
                assert "error" not in npm_inline, npm_inline
                assert npm_inline.deps == ["extension-helper"]
                assert not (extension / "virtual.ts").exists()
            finally:
                extension.chmod(0o755)
            cache_hits = []
            previous_cache_hook = get_cache_hook()

            def legacy_cache_hook(model, implementation):
                if model.cls is CachedSlider:
                    cache_hits.append(model.full_name)
                    # Public cache hooks predate the ESM pipeline and return
                    # CommonJS code with no format marker.
                    return AttrDict(code='''
const {Slider} = require("@bokehjs/models/widgets/sliders/slider")
const {shared_state} = require("./inline_helper")
const {package_suffix} = require("extension-helper/value")
class CachedSlider extends Slider {
  extension_label() {return `${this.title}: ${package_suffix}`}
  extension_state() {return shared_state}
}
exports.CachedSlider = CachedSlider
exports.cached_helper = shared_state
''', deps=["@bokehjs/models/widgets/sliders/slider", "./inline_helper", "extension-helper/value"])
                return previous_cache_hook(model, implementation)

            before_inline = {path.relative_to(inline_source): path.read_bytes() if path.is_file() else None for path in inline_source.rglob("*")}
            set_cache_hook(legacy_cache_hook)
            inline_source.chmod(0o555)
            try:
                inline = bundle_models(inline_classes)
                assert cache_hits == [CustomModel(CachedSlider).full_name], cache_hits
                after_inline = {path.relative_to(inline_source): path.read_bytes() if path.is_file() else None for path in inline_source.rglob("*")}
                assert after_inline == before_inline, "inline compilation modified its read-only source directory"
            finally:
                inline_source.chmod(0o755)
                set_cache_hook(previous_cache_hook)
            assert inline is not None
            inline_code, separator, inline_map = inline.partition("//# sourceMappingURL=data:application/json;base64,")
            assert separator, "inline bundle has no embedded source map"
            assert "unused-inline-helper-must-be-shaken" not in inline_code, "unused ESM helper export was not removed"
            map_data = json.loads(base64.b64decode(inline_map.strip()))
            assert map_data["mappings"] and len(map_data["sources"]) == len(map_data["sourcesContent"])
            for name, original in [
                ("InlineSlider.ts", InlineSlider.__implementation__.code),
                ("inline_helper.ts", (inline_source / "inline_helper.ts").read_text(encoding="utf-8")),
                ("inline_esm_helper.ts", (inline_source / "inline_esm_helper.ts").read_text(encoding="utf-8")),
            ]:
                indices = [index for index, source in enumerate(map_data["sources"]) if source.endswith(name)]
                assert indices, (name, map_data["sources"])
                assert any(map_data["sourcesContent"][index] == original for index in indices), name
            less = nodejs_compile("@color: red; .inline-fixture {color: @color}", lang="less", file="inline.less")
            assert "error" not in less, less
            assert ".inline-fixture" in less.code and "red" in less.code
            invalid = nodejs_compile("export const broken: number = 'text'", lang="typescript", file="invalid.ts")
            assert "error" in invalid, "compiler lost TypeScript diagnostics"
            assert "TS2322" in invalid.error and "invalid.ts" in invalid.error, invalid
            assert "bokeh-typescript-" not in invalid.error, invalid
        finally:
            os.chdir(original_cwd)

        dist = extension / "dist"
        assert (dist / "lib/index.d.ts").is_file()
        declarations = (dist / "lib/index.d.ts").read_text(encoding="utf-8")
        assert all(name in declarations for name in ("raw_css", "raw_yaml", "raw_json5", "parsed_json"))
        assert (dist / "lib/index.d.ts.map").is_file()
        assert (dist / "lib/styles/fixture.css.d.ts").is_file()
        for suffix in ("", ".min"):
            check_map(dist / f"compiled_extension{suffix}.js.map", "index.ts")

        models = [
            CompiledSlider(start=0, end=10, value=3, title="compiled"),
            InlineSlider(start=0, end=10, value=4, title="typescript"),
            PeerSlider(start=0, end=10, value=5, title="peer"),
            JavaScriptSlider(start=0, end=10, value=5, title="javascript"),
            CachedSlider(start=0, end=10, value=6, title="cached"),
        ]
        graph = Serializer(deferred=False).encode(models)
        with sync_playwright() as manager:
            browser = manager.chromium.launch(executable_path=os.environ.get("BOKEH_CHROME"))
            try:
                for suffix in ("", ".min"):
                    page = browser.new_page()
                    try:
                        for component, source in (("bokeh", "model.ts"), ("bokeh-widgets", "slider.ts"), ("bokeh-tables", "data_table.ts")):
                            check_map(static / f"js/{component}{suffix}.js.map", source)
                            page.add_script_tag(path=static / f"js/{component}{suffix}.js")
                        page.add_script_tag(path=dist / f"compiled_extension{suffix}.js")
                        page.add_script_tag(content=inline)
                        result = page.evaluate('''async ({graph, aliases, entry}) => {
                          const {Model} = Bokeh.require("model")
                          const {Slider} = Bokeh.require("models/widgets/sliders/slider")
                          const {DataTable} = Bokeh.require("models/widgets/tables/data_table")
                          const {default_resolver} = Bokeh.require("base")
                          const {Deserializer} = Bokeh.require("core/serialization/deserializer")
                          const {Serializer} = Bokeh.require("core/serialization/serializer")
                          function check(condition, message) {
                            if (!condition) throw new Error(message)
                          }
                          check(Bokeh.extension_model === Model, "duplicate Model constructor")
                          check(Bokeh.extension_resolver === default_resolver, "duplicate model registry")
                          check(DataTable.prototype instanceof Model, "tables bundle has a different Model")
                          check(Bokeh.css.includes(".bk-extension-fixture"), "missing compiled CSS")
                          check(Bokeh.extension_fixture === "bk-extension-fixture", "CSS class export changed")
                          check(Bokeh.raw_css === ".asset-fixture { color: purple; }\\n", "raw CSS text changed")
                          check(Bokeh.raw_yaml === "title: fixture\\nanswer: 42\\n", "raw YAML text changed")
                          check(Bokeh.raw_json5 === "{answer: 42, trailing: true,}\\n", "raw JSON5 text changed")
                          check(Bokeh.parsed_json.answer === 42, "JSON object import changed")
                          const models = new Deserializer(default_resolver).decode(graph)
                          const inline_exports = Bokeh.require(entry)
                          const names = ["CompiledSlider", "InlineSlider", "PeerSlider", "JavaScriptSlider", "CachedSlider"]
                          for (const [index, model] of models.entries()) {
                            const name = names[index]
                            const qualified = index === 0 ? `build_fixture.${name}` : name
                            check(model.constructor.name === name, `mangled class ${name}`)
                            check(model.constructor.__qualified__ === qualified, "qualified name changed")
                            check(model.constructor === default_resolver.get(qualified), "registry identity changed")
                            check(model instanceof Slider && model instanceof Model, "custom model base identity changed")
                            if (index !== 0) {
                              const module_exports = Bokeh.require(aliases[name])
                              check(module_exports[name] === model.constructor,
                                `custom module alias changed for ${name}; exports: ${Object.keys(module_exports).join(", ")}`)
                              check(inline_exports[name] === model.constructor, `${entry} constructor export changed for ${name}`)
                            }
                            model.value += 1
                          }
                          check(models[0].extension_label() === "compiled: from dependency", "CommonJS dependency failed")
                          check(models[1].extension_label() === "typescript: relative TypeScript dependency; ESM package export",
                            "inline relative or npm dependency failed")
                          check(models[2] instanceof models[1].constructor, "cross-model import has a different constructor")
                          check(models[2].extension_label() === "peer: relative TypeScript dependency; ESM package export", "cross-model inheritance failed")
                          check(await models[3].extension_label() === "javascript: dynamic JavaScript dependency", "inline dynamic dependency failed")
                          check(models[4].extension_label() === "cached: CommonJS package export", "cached CommonJS package export failed")
                          const state = models[1].extension_state()
                          check(models[2].extension_state() === state, "inline models have duplicate shared modules")
                          check(await models[3].extension_state() === state, "dynamic import has a duplicate shared module")
                          check(models[4].extension_state() === state, "cached CommonJS import has a duplicate shared module")
                          check(Bokeh.require(aliases.CachedSlider).cached_helper === state, "cached CommonJS helper export changed")
                          check(models[1].extension_peer_class() === models[3].constructor, "cyclic model import has a different peer")
                          check(models[3].extension_inline_class() === models[1].constructor, "cyclic model import has a different source")
                          const styled = document.createElement("div")
                          styled.className = "inline-less-fixture inline-css-fixture"
                          document.body.appendChild(styled)
                          check(getComputedStyle(styled).color === "rgb(255, 0, 0)", "inline LESS was not installed")
                          check(getComputedStyle(styled).borderTopWidth === "7px", "inline CSS was not installed")
                          styled.remove()
                          return new Serializer().encode(models)
                        }''', {"graph": graph, "aliases": {cls.__name__: CustomModel(cls).module for cls in inline_classes},
                               "entry": "custom/main/" + calc_cache_key({model.full_name: model for model in map(CustomModel, inline_classes)})})
                        restored = Deserializer().decode(result)
                        assert [type(model) for model in restored] == [type(model) for model in models]
                        assert [model.value for model in restored] == [4, 5, 6, 6, 7]
                        assert [model.title for model in restored] == ["compiled", "typescript", "peer", "javascript", "cached"]
                    finally:
                        page.close()
            finally:
                browser.close()

        invalid_source = work / "invalid_inline"
        write(invalid_source / "invalid_helper.ts", 'export const broken: number = "not a number"\n')
        write(invalid_source / "transitive.ts", 'export {broken} from "./invalid_helper"\n')

        class InvalidDependencySlider(Slider):
            __module__ = "build_fixture"
            __qualname__ = "InvalidDependencySlider"
            __base_path__ = str(invalid_source)
            __implementation__ = TypeScript('''
import {Slider} from "@bokehjs/models/widgets/sliders/slider"
import {broken} from "./transitive"
export class InvalidDependencySlider extends Slider {
  dependency_value(): number {return broken}
}
''', str(invalid_source / "InvalidDependencySlider.ts"))

        class MissingPackageSlider(Slider):
            __module__ = "build_fixture"
            __qualname__ = "MissingPackageSlider"
            __base_path__ = str(invalid_source)
            __implementation__ = JavaScript('''
import "missing-inline-fixture-package"
import {Slider} from "@bokehjs/models/widgets/sliders/slider"
export class MissingPackageSlider extends Slider {}
''', str(invalid_source / "MissingPackageSlider.js"))

        for cls, diagnostics in [
            (InvalidDependencySlider, ["TS2322", "invalid_helper.ts"]),
            (MissingPackageSlider, ["missing-inline-fixture-package"]),
        ]:
            # The public Python path propagates compiler diagnostics before
            # returning a bundle, so callers can handle the failed embedding.
            try:
                bundle_models([cls])
            except CompilationError as error:
                for diagnostic in diagnostics:
                    assert diagnostic in str(error), error
            else:
                raise AssertionError(f"inline bundler accepted {cls.__name__}")

        # Side-effect imports are not necessarily diagnosed by TypeScript.
        # The bundler must reject a missing dependency rather than emitting a
        # bundle that only fails when loaded by the browser.
        write(extension / "index.ts", 'import "missing-extension-dependency"\nexport {}\n')
        try:
            os.chdir(work)
            assert not ext.build(extension), "bundler accepted an unresolved dependency"
        finally:
            os.chdir(original_cwd)

        assert not npm_invoked.exists(), "warm compilation invoked npm"
        assert cache_snapshot(compiler_cache) == installed_cache, "warm compilation changed the compiler installation"

    report = {"bokeh": str(imported), "compiler": str(compiler_static / "js/compiler.js"),
              "node": str(node), "npm": str(npm), "node_source": "external", "node_on_path": False,
              "compiler_cache": str(compiler_cache), "npm_cache": str(npm_cache),
              "unavailable_npm": str(unavailable_npm), "npm_invoked": str(npm_invoked),
              "cold_install": "passed", "warm_without_npm": "passed",
              "variants": ["unminified", "minified"], "status": "passed"}
    write(args.work_dir / "validation-report.json", json.dumps(report, indent=2) + "\n")
    print(json.dumps(report))


if __name__ == "__main__":
    main()
