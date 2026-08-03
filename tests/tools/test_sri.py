from __future__ import annotations

# Standard library imports
import json
from importlib import import_module
from pathlib import Path
from typing import Any

# External imports
import pytest

sri = import_module("tools.sri")


def test_compute_single_hash_pipes_openssl_commands(monkeypatch: pytest.MonkeyPatch) -> None:
    calls: list[tuple[list[str], dict[str, Any]]] = []

    class FakeProcess:
        def __init__(self, args: list[str], **kwargs: Any) -> None:
            calls.append((args, kwargs))
            self.stdout = object()

        def communicate(self) -> tuple[bytes, bytes]:
            return b"encoded-hash\n", b""

    monkeypatch.setattr(sri, "Popen", FakeProcess)
    path = Path("artifact with spaces.js")

    result = sri.compute_single_hash(path)

    assert result == "encoded-hash"
    assert calls[0][0] == ["openssl", "dgst", "-sha384", "-binary", "artifact with spaces.js"]
    assert calls[1][0] == ["openssl", "base64", "-A"]
    assert calls[1][1]["stdin"] is not None


def test_dump_hash_file_writes_sorted_non_esm_entries(tmp_path: Path, monkeypatch: pytest.MonkeyPatch) -> None:
    js_dir = tmp_path / "js"
    sri_dir = tmp_path / "sri"
    js_dir.mkdir()
    sri_dir.mkdir()

    for filename in [
        "bokeh-widgets.js",
        "bokeh.min.js",
        "bokeh.js",
        "bokeh.esm.js",
        "bokeh.esm.min.js",
        "other.js",
    ]:
        (js_dir / filename).write_text(filename)

    monkeypatch.setattr(sri, "JS_DIR", js_dir)
    monkeypatch.setattr(sri, "SRI_DIR", sri_dir)
    monkeypatch.setattr(sri, "compute_single_hash", lambda path: f"hash:{path.name}")

    sri.dump_hash_file("4.0.0")

    output = sri_dir / "4.0.0.json"
    assert output.read_text().endswith("\n")
    assert json.loads(output.read_text()) == {
        "bokeh-4.0.0.js": "hash:bokeh.js",
        "bokeh-4.0.0.min.js": "hash:bokeh.min.js",
        "bokeh-widgets-4.0.0.js": "hash:bokeh-widgets.js",
    }


def test_dump_hash_file_refuses_to_overwrite_existing_manifest(tmp_path: Path, monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setattr(sri, "SRI_DIR", tmp_path)
    (tmp_path / "4.0.0.json").write_text("{}")

    with pytest.raises(AssertionError, match="already exists"):
        sri.dump_hash_file("4.0.0")


def test_main_requires_single_version(capsys: pytest.CaptureFixture[str]) -> None:
    with pytest.raises(SystemExit) as error:
        sri.main([])

    assert error.value.code == 1
    assert capsys.readouterr().out == "usage: python -m tools.sri <new-version>\n"


@pytest.mark.parametrize("version", ["4.0", "4.0.0rc1", "4.0.0.1"])
def test_main_rejects_invalid_version(version: str) -> None:
    with pytest.raises(AssertionError, match="not a valid Bokeh release version string"):
        sri.main([version])


def test_main_generates_manifest(monkeypatch: pytest.MonkeyPatch) -> None:
    versions: list[str] = []
    monkeypatch.setattr(sri, "dump_hash_file", versions.append)

    sri.main(["4.0.0"])

    assert versions == ["4.0.0"]
