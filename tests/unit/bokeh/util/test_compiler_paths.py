#-----------------------------------------------------------------------------
# Copyright (c) Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------
from __future__ import annotations

# Standard library imports
from pathlib import Path
from types import SimpleNamespace
from unittest.mock import Mock

# External imports
import pytest

# Bokeh imports
import bokeh.util.compiler as compiler


@pytest.fixture(autouse=True)
def clear_runtime_cache(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setattr(compiler, "_nodejs", None)
    monkeypatch.setattr(compiler, "_npmjs", None)
    monkeypatch.delenv("BOKEH_NPMJS_PATH", raising=False)


def test_node_is_discovered_on_path(monkeypatch: pytest.MonkeyPatch, tmp_path: Path) -> None:
    node = tmp_path / "node"
    monkeypatch.setattr(compiler, "which", lambda name: str(node) if name == "node" else None)
    monkeypatch.setattr(compiler, "settings", SimpleNamespace(nodejs_path=lambda: None))
    popen = Mock(return_value=SimpleNamespace(communicate=lambda: (b"v24.19.0\n", b""), returncode=0))
    monkeypatch.setattr(compiler, "Popen", popen)
    assert compiler._detect_nodejs() == node
    assert popen.call_args.args[0] == [str(node), "--version"]


def test_explicit_node_overrides_path(monkeypatch: pytest.MonkeyPatch, tmp_path: Path) -> None:
    node = tmp_path / "other installation/bin/node"
    monkeypatch.setattr(compiler, "which", lambda name: None)
    monkeypatch.setattr(compiler, "settings", SimpleNamespace(nodejs_path=lambda: str(node)))
    popen = Mock(return_value=SimpleNamespace(communicate=lambda: (b"v24.19.0\n", b""), returncode=0))
    monkeypatch.setattr(compiler, "Popen", popen)
    assert compiler._detect_nodejs() == node
    assert popen.call_args.args[0] == [str(node), "--version"]


@pytest.mark.skipif(compiler.sys.platform == "win32", reason="POSIX version-manager symlink")
def test_node_preserves_version_manager_shim(monkeypatch: pytest.MonkeyPatch, tmp_path: Path) -> None:
    target = tmp_path / "dispatch-shim"
    target.touch()
    node = tmp_path / "node"
    node.symlink_to(target)
    monkeypatch.setattr(compiler, "which", lambda name: str(node) if name == "node" else None)
    monkeypatch.setattr(compiler, "settings", SimpleNamespace(nodejs_path=lambda: None))
    popen = Mock(return_value=SimpleNamespace(communicate=lambda **_: (b"v24.19.0\n", b""), returncode=0))
    monkeypatch.setattr(compiler, "Popen", popen)
    assert compiler._run_nodejs(["--version"]) == "v24.19.0\n"
    assert compiler._nodejs_path() == node
    assert all(Path(call.args[0][0]) == node for call in popen.call_args_list)


@pytest.mark.parametrize("layout", ["posix", "windows", "separate"])
def test_npm_cli_from_existing_installation(monkeypatch: pytest.MonkeyPatch, tmp_path: Path, layout: str) -> None:
    node = tmp_path / ("node.exe" if layout == "windows" else "bin/node")
    if layout == "windows":
        npm = tmp_path / "node_modules/npm/bin/npm-cli.js"
    elif layout == "posix":
        npm = tmp_path / "lib/node_modules/npm/bin/npm-cli.js"
    else:
        npm = tmp_path / "share/nodejs/npm/bin/npm-cli.js"
    npm.parent.mkdir(parents=True)
    npm.write_text("// npm CLI", encoding="utf-8")
    monkeypatch.setattr(compiler, "_nodejs_path", lambda: node)
    monkeypatch.setattr(compiler, "which", lambda name: str(npm) if layout == "separate" else None)
    assert compiler._npmjs_path() == npm


def test_node_without_npm_can_run_compiler(monkeypatch: pytest.MonkeyPatch, tmp_path: Path) -> None:
    node = tmp_path / "node"
    monkeypatch.setattr(compiler, "_nodejs_path", lambda: node)
    monkeypatch.setattr(compiler, "which", lambda name: None)
    monkeypatch.delenv("BOKEH_NPMJS_PATH", raising=False)
    env = compiler._nodejs_env(npm=True)
    assert env["PATH"].split(compiler.os.pathsep)[0] == str(node.parent)
    assert "BOKEH_NPMJS_PATH" not in env
    with pytest.raises(RuntimeError, match="npm is needed for installing"):
        compiler._npmjs_path()


def test_npm_is_found_beside_shim_selected_runtime(monkeypatch: pytest.MonkeyPatch, tmp_path: Path) -> None:
    node = tmp_path / "shims/node"
    runtime = tmp_path / "runtime/bin/node"
    npm = tmp_path / "runtime/lib/node_modules/npm/bin/npm-cli.js"
    npm.parent.mkdir(parents=True)
    npm.touch()
    monkeypatch.setattr(compiler, "_nodejs_path", lambda: node)
    monkeypatch.setattr(compiler, "which", lambda name: None)
    popen = Mock(return_value=SimpleNamespace(communicate=lambda: (str(runtime).encode(), b""), returncode=0))
    monkeypatch.setattr(compiler, "Popen", popen)
    assert compiler._npmjs_path() == npm
    assert popen.call_args.args[0] == [node, "--print", "process.execPath"]


def test_child_environment_uses_selected_node_and_npm(monkeypatch: pytest.MonkeyPatch, tmp_path: Path) -> None:
    node = tmp_path / "runtime/bin/node"
    npm = tmp_path / "runtime/lib/npm-cli.js"
    monkeypatch.setattr(compiler, "_nodejs_path", lambda: node)
    monkeypatch.setattr(compiler, "_find_npmjs", lambda: npm)
    monkeypatch.setenv("PATH", "")
    env = compiler._nodejs_env(npm=True)
    assert env["PATH"].split(compiler.os.pathsep)[0] == str(node.parent)
    assert env["BOKEH_NPMJS_PATH"] == str(npm)
    assert compiler.os.environ["PATH"] == ""


def test_explicit_npm_override_is_preserved(monkeypatch: pytest.MonkeyPatch, tmp_path: Path) -> None:
    node = tmp_path / "runtime/bin/node"
    npm = tmp_path / "other installation/npm-cli.js"
    monkeypatch.setattr(compiler, "_nodejs_path", lambda: node)
    monkeypatch.setattr(compiler, "_npmjs", tmp_path / "cached/npm-cli.js")
    monkeypatch.setenv("BOKEH_NPMJS_PATH", str(npm))
    assert compiler._npmjs_path() == npm
    assert compiler._nodejs_env(npm=True)["BOKEH_NPMJS_PATH"] == str(npm)


def test_npm_uses_node_with_cli_script(monkeypatch: pytest.MonkeyPatch, tmp_path: Path) -> None:
    node = tmp_path / "node"
    npm = tmp_path / "npm-cli.js"
    monkeypatch.setattr(compiler, "_nodejs_path", lambda: node)
    monkeypatch.setattr(compiler, "_npmjs_path", lambda: npm)
    run = Mock(return_value="ok")
    monkeypatch.setattr(compiler, "_run", run)
    assert compiler._run_npmjs(["install", "example"]) == "ok"
    run.assert_called_once_with(node, [str(npm), "install", "example"], None)
