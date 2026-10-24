#-----------------------------------------------------------------------------
# Copyright (c) Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Boilerplate
#-----------------------------------------------------------------------------
from __future__ import annotations # isort:skip

import pytest ; pytest

#-----------------------------------------------------------------------------
# Imports
#-----------------------------------------------------------------------------

# Standard library imports
import json
import os
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path
from threading import Event, Lock
from unittest.mock import MagicMock, patch

# Module under test
import bokeh.util.compiler as buc # isort:skip

#-----------------------------------------------------------------------------
# Setup
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# General API
#-----------------------------------------------------------------------------

def test_nodejs_compile_javascript() -> None:
    assert buc.nodejs_compile("""function f(a, b) { return a + b; };""", "javascript", "some.js") == \
        dict(code="""\
"use strict";
function f(a, b) { return a + b; }
;
""", deps=[])

    assert buc.nodejs_compile("""const some = require('some/module');""", "javascript", "some.js") == \
        dict(code="""\
"use strict";
const some = require('some/module');
""", deps=["some/module"])

    assert buc.nodejs_compile("""
const {Model} = require("lib/model");

class MyModel extends Model {
    static __name__ = 'MyModel';
}

exports.MyModel = MyModel;
""", "javascript", "some.js") == \
        dict(code="""\
"use strict";
const { Model } = require("lib/model");
class MyModel extends Model {
    static __name__ = 'MyModel';
}
exports.MyModel = MyModel;
""",
             deps=["lib/model"])

    result = buc.nodejs_compile("""function f(a, b) { eturn a + b; };""", "javascript", "some.js")
    assert "TS1435" in result.error
    assert "Unknown keyword or identifier. Did you mean 'return'?" in result.error
    assert "some.js" in result.error
    assert "function f(a, b) { eturn a + b; };" in result.error
    assert "bokeh-typescript-" not in result.error

    imported = buc.nodejs_compile('import value from "some/module"; export {value}', "javascript", "some.js")
    assert "error" not in imported, imported
    assert "__importDefault" in imported.code
    assert imported.deps == ["some/module"]

    dynamic = buc.nodejs_compile('export const load = () => import("./helper")', "javascript", "some.js")
    assert "error" not in dynamic, dynamic
    assert 'require("./helper")' in dynamic.code
    assert dynamic.deps == ["./helper"]

def test_nodejs_compile_less() -> None:
    assert buc.nodejs_compile(""".bk-some-style { color: mix(#ff0000, #0000ff, 50%); }""", "less", "some.less") == \
        dict(code=""".bk-some-style{color:#800080}""")

    assert buc.nodejs_compile(""".bk-some-style color: green; }""", "less", "some.less") == \
        dict(error="ParseError: Unrecognised input in some.less on line 1, column 21:\n1 .bk-some-style color: green; }\n")

def test_nodejs_compile_typescript_readonly_package(tmp_path: Path) -> None:
    package = tmp_path / "node_modules" / "compiler-fixture"
    package.mkdir(parents=True)
    (package / "package.json").write_text(json.dumps({
        "name": "compiler-fixture",
        "exports": {"./value": {"types": "./types.d.ts", "default": "./value.js"}},
    }), encoding="utf-8")
    (package / "types.d.ts").write_text("export declare const value: string\n", encoding="utf-8")
    source = tmp_path / "readonly" / "source"
    source.mkdir(parents=True)
    (source / "helper.ts").write_text('export const suffix: string = "relative"\n', encoding="utf-8")
    (source / "compiler-fixture").mkdir()
    (source / "compiler-fixture" / "value.ts").write_text("export const value: number = 42\n", encoding="utf-8")
    source.chmod(0o555)
    try:
        result = buc.nodejs_compile('''
import {value} from "compiler-fixture/value"
import {suffix} from "./helper"
export const combined: string = `${value} ${suffix}`
''', "typescript", str(source / "virtual.ts"))
        assert "error" not in result, result
        assert result.deps == ["compiler-fixture/value", "./helper"]
        assert sorted(path.name for path in source.iterdir()) == ["compiler-fixture", "helper.ts"]
    finally:
        source.chmod(0o755)

def test_Implementation() -> None:
    obj = buc.Implementation()
    assert obj.file is None

def test_Inline() -> None:
    obj = buc.Inline("code")
    assert obj.code == "code"
    assert obj.file is None

    obj = buc.Inline("code", "file")
    assert obj.code == "code"
    assert obj.file == "file"

def test_TypeScript() -> None:
    obj = buc.TypeScript("code")
    assert isinstance(obj, buc.Inline)
    assert obj.code == "code"
    assert obj.file is None
    assert obj.lang == "typescript"

def test_JavaScript() -> None:
    obj = buc.JavaScript("code")
    assert isinstance(obj, buc.Inline)
    assert obj.code == "code"
    assert obj.file is None
    assert obj.lang == "javascript"

def test_Less() -> None:
    obj = buc.Less("code")
    assert isinstance(obj, buc.Inline)
    assert obj.code == "code"
    assert obj.file is None
    assert obj.lang == "less"

@patch("builtins.open")
def test_FromFile(mock_open: MagicMock) -> None:
    obj = buc.FromFile("path.ts")
    assert obj.lang == "typescript"

    obj = buc.FromFile("path.js")
    assert obj.lang == "javascript"

    obj = buc.FromFile("path.css")
    assert obj.lang == "less"

    obj = buc.FromFile("path.less")
    assert obj.lang == "less"

def test_exts() -> None:
    assert buc.exts == (".ts", ".js", ".css", ".less")

def test_jsons() -> None:
    for file in os.listdir(os.path.join(buc.bokehjs_dir, "js")):
        if file.endswith('.json'):
            with open(os.path.join(buc.bokehjs_dir, "js", file), encoding="utf-8") as f:
                assert all('\\' not in mod for mod in json.load(f))

@pytest.mark.free_threading
def test_bundle_models_coalesces_concurrent_compilation(monkeypatch: pytest.MonkeyPatch) -> None:
    started = Event()
    release = Event()
    calls = 0
    calls_lock = Lock()
    custom_models = {"TestModel": MagicMock(full_name="TestModel")}

    def bundle(models):
        nonlocal calls
        with calls_lock:
            calls += 1
        started.set()
        assert release.wait(timeout=2)
        return "bundle"

    monkeypatch.setattr(buc, "_bundle_cache", {})
    monkeypatch.setattr(buc, "_bundle_futures", {})
    monkeypatch.setattr(buc, "_get_custom_models", lambda models: custom_models)
    monkeypatch.setattr(buc, "_bundle_models", bundle)

    with ThreadPoolExecutor(max_workers=2) as executor:
        first = executor.submit(buc.bundle_models, None)
        assert started.wait(timeout=1)
        second = executor.submit(buc.bundle_models, None)
        release.set()

        assert first.result(timeout=1) == "bundle"
        assert second.result(timeout=1) == "bundle"

    assert calls == 1


def test_bundle_models_propagates_compilation_errors(monkeypatch: pytest.MonkeyPatch) -> None:
    custom_models = {"TestModel": MagicMock(full_name="TestModel")}

    def fail(models):
        raise buc.CompilationError("invalid implementation")

    monkeypatch.setattr(buc, "_bundle_cache", {})
    monkeypatch.setattr(buc, "_bundle_futures", {})
    monkeypatch.setattr(buc, "_get_custom_models", lambda models: custom_models)
    monkeypatch.setattr(buc, "_bundle_models", fail)

    with pytest.raises(buc.CompilationError, match="invalid implementation"):
        buc.bundle_models(None)

    assert buc._bundle_futures == {}


def test_custom_model_bundles_use_model_set_specific_entries(monkeypatch: pytest.MonkeyPatch) -> None:
    class First:
        __implementation__ = buc.JavaScript("export class First {}")

    class Second:
        __implementation__ = buc.JavaScript("export class Second {}")

    first = buc.CustomModel(First)
    second = buc.CustomModel(Second)
    node = MagicMock(return_value=json.dumps({"code": "bundled models"}))
    monkeypatch.setattr(buc, "_run_nodejs", node)

    def request(*models: buc.CustomModel) -> dict:
        custom_models = {model.full_name: model for model in models}
        assert buc._bundle_models(custom_models) == "bundled models"
        result = node.call_args.args[1]
        assert result["entry"] == f"custom/main/{buc.calc_cache_key(custom_models)}"
        return result

    first_request = request(first)
    second_request = request(second)
    combined_request = request(first, second)

    assert len({first_request["entry"], second_request["entry"], combined_request["entry"]}) == 3
    assert request(second, first) == combined_request

def test_inline_extension() -> None:
    from bokeh.io import save
    from bokeh.models import TickFormatter
    from bokeh.plotting import figure
    from bokeh.util.compiler import TypeScript

    TS_CODE = """
    import {TickFormatter} from "models/formatters/tick_formatter"

    export class TestFormatter extends TickFormatter {

      doFormat(ticks: number[]): string[] {
        if (ticks.length == 0)
          return[]
        else {
          const formatted = [`${ticks[0]}`]
          for (let i = 1; i < ticks.length; i++) {
            const difference = (ticks[i] - ticks[0]).toPrecision(2)
            formatted.push(`+${difference}}`)
          }
          return formatted
        }
      }
    }
    """

    class TestFormatter(TickFormatter):

        __implementation__ = TypeScript(TS_CODE)

    class TestFormatter2(TickFormatter):

        __implementation__ = TypeScript("^") # invalid syntax on purpose

    p = figure()
    p.scatter([1, 2, 3, 4, 6], [5, 7, 3, 2, 4])
    p.xaxis.formatter = TestFormatter()
    save(p)

def test_bundle_models_preserves_cache_hook(monkeypatch: pytest.MonkeyPatch, tmp_path: Path) -> None:
    # Hooks may supply precompiled code even when the original TS is unavailable
    # or invalid. Bundling must preserve that result and skip hooks on cache hits.
    class CachedModel:
        __implementation__ = buc.TypeScript("invalid original source", "virtual.ts")
        __base_path__ = tmp_path
        __dependencies__ = {"fixture": "1.2.3"}

    model = buc.CustomModel(CachedModel)
    cached = buc.AttrDict(code='exports.CachedModel = require("./helper").CachedModel;', deps=["./helper"])
    hook = MagicMock(return_value=cached)
    node = MagicMock(return_value=json.dumps({"code": "bundled model"}))
    npm = MagicMock()
    monkeypatch.setattr(buc, "_bundle_cache", {})
    monkeypatch.setattr(buc, "_bundle_futures", {})
    monkeypatch.setattr(buc, "_CACHING_IMPLEMENTATION", hook)
    monkeypatch.setattr(buc, "_run_nodejs", node)
    monkeypatch.setattr(buc, "_run_npmjs", npm)

    assert buc.bundle_models([CachedModel]) == "bundled model"
    assert buc.bundle_models([CachedModel]) == "bundled model"
    hook.assert_called_once()
    npm.assert_called_once_with(["install", "--no-progress", "fixture@1.2.3"])
    node.assert_called_once()
    argv, request = node.call_args.args
    assert argv[-1] == "bundle"
    assert request["models"][0]["cached"] == cached
    assert request["models"][0]["module"] == model.module
    assert request["models"][0]["path"] == str(tmp_path)

def test_bundle_models_retries_after_compilation_error(monkeypatch: pytest.MonkeyPatch) -> None:
    class BrokenModel:
        __implementation__ = buc.TypeScript("export class BrokenModel {}")

    node = MagicMock(side_effect=[json.dumps({"error": "TS2307: missing dependency"}), json.dumps({"code": "fixed"})])
    monkeypatch.setattr(buc, "_bundle_cache", {})
    monkeypatch.setattr(buc, "_bundle_futures", {})
    monkeypatch.setattr(buc, "_run_nodejs", node)

    with pytest.raises(buc.CompilationError, match="TS2307: missing dependency"):
        buc.bundle_models([BrokenModel])
    assert not buc._bundle_cache
    assert not buc._bundle_futures
    assert buc.bundle_models([BrokenModel]) == "fixed"
    assert node.call_count == 2

def test_bundle_models_preserves_response_and_diagnostics(monkeypatch: pytest.MonkeyPatch, capsys: pytest.CaptureFixture[str]) -> None:
    class EscapedModel:
        __implementation__ = buc.JavaScript("export class EscapedModel {}")

    code = r'exports.value = "\r"; exports.pattern = /\r?\n/g;'
    diagnostic = "Rolldown WASI trapped; retrying bundle in a fresh Node process (attempt 2/3).\n"
    process = MagicMock(returncode=0)
    process.communicate.return_value = (json.dumps({"code": code}).encode(), diagnostic.encode())
    monkeypatch.setattr(buc, "_nodejs_path", lambda: Path("node"))
    monkeypatch.setattr(buc, "Popen", MagicMock(return_value=process))
    model = buc.CustomModel(EscapedModel)

    assert buc._bundle_models({model.full_name: model}) == code
    assert capsys.readouterr().err == diagnostic

@patch("bokeh.util.compiler._run")
def test_npmjs_version(mock_run: MagicMock) -> None:
    mock_run.side_effect = [FileNotFoundError, "11.6.3\n"]
    # assume npm is not installed, no file can be found and None is returned
    assert buc.npmjs_version() is None
    # assume npm is installed, a version is returned and stripped
    assert buc.npmjs_version() == "11.6.3"

@patch("bokeh.util.compiler._run")
@patch("bokeh.util.compiler._nodejs_path")
def test_nodejs_version(mock_path: MagicMock, mock_run: MagicMock) -> None:
    mock_path.side_effect = [RuntimeError, "node"]
    mock_run.return_value = "v20.19.5\n"
    # assume node is not installed, then `_detect_nodejs()` raises a RuntimeError
    assert buc.nodejs_version() is None
    # assume node is installed, a version is returned and stripped
    assert buc.nodejs_version() == "v20.19.5"

@pytest.mark.parametrize("version, supported", [
    ("v18.20.0", False),
    ("v22.12.0", False),
    ("v22.13.0", True),
    ("v24.19.0", True),
])
@patch("bokeh.util.compiler.Popen")
@patch("bokeh.util.compiler.settings")
def test_detect_nodejs_minimum(mock_settings: MagicMock, mock_popen: MagicMock, version: str, supported: bool) -> None:
    mock_settings.nodejs_path.return_value = "custom-node"
    process = mock_popen.return_value
    process.communicate.return_value = (version.encode(), b"")
    process.returncode = 0
    if supported:
        assert buc._detect_nodejs() == Path("custom-node").absolute()
    else:
        with pytest.raises(RuntimeError, match=r"node.js v22\.13\.0 or higher"):
            buc._detect_nodejs()

#-----------------------------------------------------------------------------
# Dev API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Private API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Code
#-----------------------------------------------------------------------------
