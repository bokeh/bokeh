#-----------------------------------------------------------------------------
# Copyright (c) Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt.
#-----------------------------------------------------------------------------

from __future__ import annotations

# Standard library imports
import hashlib
import json
import sys
from pathlib import Path
from types import ModuleType
from typing import Any

# External imports
import pytest

# Bokeh imports
import bokeh.embed.resources as ber
from bokeh.embed.resources import (
    URL,
    ExtensionRequirement,
    ResolvedResource,
    ResolvedResources,
    ResourceAssetRequirement,
    ResourceRequirements,
)
from bokeh.models import (
    LinearAxis,
    Paragraph,
    Slider,
    Title,
)
from bokeh.resources import Resources


@pytest.fixture(autouse=True)
def isolate_extension_state(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setattr(ber, "extension_dirs", {})
    monkeypatch.delenv("BOKEH_DEV", raising=False)


@pytest.mark.parametrize(("kwargs", "message"), [
    ({"kind": "unknown", "url": "extension.js"}, "kind"),
    ({"kind": "script"}, "exactly one"),
    ({"kind": "script", "url": "extension.js", "content": "void 0"}, "exactly one"),
    ({"kind": "script", "url": 1}, "url must be a string"),
    ({"kind": "script", "url": "extension.js", "module": 1}, "module must be a boolean"),
    ({"kind": "style", "url": "extension.css", "module": True}, "cannot be JavaScript modules"),
])
def test_resource_asset_requirement_rejects_invalid_values(kwargs: dict[str, Any], message: str) -> None:
    with pytest.raises(ValueError, match=message):
        ResourceAssetRequirement(**kwargs)


def test_resource_asset_requirement_schema_round_trip() -> None:
    asset = ResourceAssetRequirement(
        "script", content="export const value = 1", integrity="sha384-example",
        crossorigin="anonymous", module=True,
    )

    data = asset.to_dict()

    assert data["module"] is True
    assert ResourceAssetRequirement.from_dict(data) == asset
    with pytest.raises(ValueError, match="must be objects"):
        ResourceAssetRequirement.from_dict([])  # type: ignore[arg-type]


def test_extension_requirement_validates_schema() -> None:
    asset = ResourceAssetRequirement("script", url="extension.js")
    extension = ExtensionRequirement("example", (asset,))

    assert ExtensionRequirement.from_dict(extension.to_dict()) == extension
    with pytest.raises(ValueError, match="non-empty strings"):
        ExtensionRequirement("", ())
    with pytest.raises(ValueError, match="ResourceAssetRequirement"):
        ExtensionRequirement("example", (object(),))  # type: ignore[arg-type]
    with pytest.raises(ValueError, match="must be objects"):
        ExtensionRequirement.from_dict([])  # type: ignore[arg-type]
    with pytest.raises(ValueError, match="must be an array"):
        ExtensionRequirement.from_dict({"name": "example", "assets": {}})
    with pytest.raises(ValueError, match="non-empty strings"):
        ExtensionRequirement.from_dict({"assets": []})


def test_resource_requirements_validate_schema() -> None:
    asset = ResourceAssetRequirement("script", url="extension.js")
    extension = ExtensionRequirement("example", (asset,))

    with pytest.raises(ValueError, match="unknown Bokeh resource components"):
        ResourceRequirements(("unknown",))  # type: ignore[arg-type]
    with pytest.raises(ValueError, match="must be unique"):
        ResourceRequirements(("bokeh/core", "bokeh/core"))
    with pytest.raises(ValueError, match="unique names"):
        ResourceRequirements(extensions=(extension, extension))
    with pytest.raises(ValueError, match="must be an object"):
        ResourceRequirements.from_dict([])  # type: ignore[arg-type]
    with pytest.raises(ValueError, match="components must be an array"):
        ResourceRequirements.from_dict({"components": (), "extensions": []})
    with pytest.raises(ValueError, match="extensions must be an array"):
        ResourceRequirements.from_dict({"components": [], "extensions": ()})
    with pytest.raises(ValueError, match="unknown component"):
        ResourceRequirements.from_dict({"components": ["unknown"], "extensions": []})


def test_resolved_resources_schema_and_fingerprint() -> None:
    asset = ResolvedResource(
        "script", content="export const value = 1", integrity="sha384-example",
        crossorigin="anonymous", nonce="example", module=True,
    )
    resolved = ResolvedResources(
        ResourceRequirements(), Resources(mode="none"), "1.2.3", (asset,),
    )

    assert asset.to_dict()["module"] is True
    assert resolved.to_dict()["assets"] == [asset.to_dict()]
    assert len(resolved.fingerprint) == 64


def test_url_joining_and_string_conversion() -> None:
    assert str(URL("https://example.test/root") / "child/file.js") == \
        "https://example.test/root/child/file.js"


class _ExtensionModel:
    def __init__(self, name: str) -> None:
        self.__view_module__ = f"{name}.models"


def _extension_model(name: str) -> Any:
    return _ExtensionModel(name)


def _install_extension_module(
    monkeypatch: pytest.MonkeyPatch, base_dir: Path, name: str,
) -> Path:
    base_dir.mkdir()
    module = ModuleType(name)
    module.__file__ = str(base_dir / "__init__.py")
    monkeypatch.setitem(sys.modules, name, module)
    (base_dir / "bokeh.ext.json").write_text("{}")
    (base_dir / "dist").mkdir()
    return base_dir


def test_bundle_extensions_resolves_package_metadata(
    tmp_path: Path, monkeypatch: pytest.MonkeyPatch,
) -> None:
    name = "metadata_extension"
    base_dir = _install_extension_module(monkeypatch, tmp_path / name, name)
    artifact = base_dir / "dist" / "custom.js"
    artifact.write_text("export const value = 1")
    (base_dir / "package.json").write_text(json.dumps({
        "name": "@example/extension", "version": "1.2.3", "module": "dist/custom.js",
    }))

    [bundle] = ber.bundle_extensions({_extension_model(name)}, Resources(mode="server", root_url="https://host.test/app/"))

    version_hash = hashlib.sha256(b"1.2.3").hexdigest()
    assert bundle.artifact_path == artifact
    assert str(bundle.server_url) == f"https://host.test/app/static/extensions/{name}/custom.js?v={version_hash}"
    assert str(bundle.cdn_url) == "https://unpkg.com/@example/extension@1.2.3/dist/custom.js"
    assert ber.extension_dirs[name] == artifact.parent


def test_bundle_extensions_resolves_package_default_artifact(
    tmp_path: Path, monkeypatch: pytest.MonkeyPatch,
) -> None:
    name = "default_artifact_extension"
    base_dir = _install_extension_module(monkeypatch, tmp_path / name, name)
    artifact = base_dir / "dist" / f"{name}.js"
    artifact.write_text("export const value = 1")
    (base_dir / "package.json").write_text(json.dumps({"name": name, "version": "2.0.0"}))

    [bundle] = ber.bundle_extensions({_extension_model(name)}, Resources(mode="server"))

    assert bundle.artifact_path == artifact
    assert bundle.cdn_url is None


def test_bundle_extensions_falls_back_from_invalid_package_metadata(
    tmp_path: Path, monkeypatch: pytest.MonkeyPatch,
) -> None:
    name = "fallback_extension"
    base_dir = _install_extension_module(monkeypatch, tmp_path / name, name)
    artifact = base_dir / "dist" / f"{name}.min.js"
    artifact.write_text("globalThis.extension = true")
    (base_dir / "package.json").write_text("not-json")

    [bundle] = ber.bundle_extensions({_extension_model(name)}, Resources(mode="server"))

    assert bundle.artifact_path == artifact
    assert bundle.cdn_url is None


def test_bundle_extensions_rejects_invalid_or_missing_artifacts(
    tmp_path: Path, monkeypatch: pytest.MonkeyPatch,
) -> None:
    invalid_name = "invalid_package_extension"
    invalid_dir = _install_extension_module(monkeypatch, tmp_path / invalid_name, invalid_name)
    (invalid_dir / "package.json").write_text("{}")
    with pytest.raises(ValueError, match="missing package name"):
        ber.bundle_extensions({_extension_model(invalid_name)}, Resources(mode="server"))

    missing_name = "missing_artifact_extension"
    _install_extension_module(monkeypatch, tmp_path / missing_name, missing_name)
    with pytest.raises(ValueError, match="can't resolve artifact path"):
        ber.bundle_extensions({_extension_model(missing_name)}, Resources(mode="server"))


def test_bundle_extensions_skips_non_packages(
    tmp_path: Path, monkeypatch: pytest.MonkeyPatch,
) -> None:
    no_file_name = "no_file_extension"
    no_file_module = ModuleType(no_file_name)
    no_file_module.__file__ = None
    monkeypatch.setitem(sys.modules, no_file_name, no_file_module)

    no_marker_name = "no_marker_extension"
    no_marker_dir = tmp_path / no_marker_name
    no_marker_dir.mkdir()
    no_marker_module = ModuleType(no_marker_name)
    no_marker_module.__file__ = str(no_marker_dir / "__init__.py")
    monkeypatch.setitem(sys.modules, no_marker_name, no_marker_module)

    assert ber.bundle_extensions(
        {_extension_model(no_file_name), _extension_model(no_marker_name)}, Resources(mode="server"),
    ) == []


@pytest.mark.parametrize("model", [
    Title(text="$$x$$"),
    Slider(title="$$x$$"),
    LinearAxis(axis_label="$$x$$"),
    LinearAxis(major_label_overrides={0: "$$x$$"}),
    Paragraph(text="$$x$$"),
])
def test_requirements_detect_mathjax(model: Any) -> None:
    assert "bokeh/mathjax" in ber.requirements_for_objs([model]).components
