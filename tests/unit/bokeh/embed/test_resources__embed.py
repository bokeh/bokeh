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
from types import ModuleType, SimpleNamespace
from typing import Any

# External imports
import pytest

# Bokeh imports
import bokeh.embed.resources as ber
from bokeh.embed.resources import (
    ExtensionRequirement,
    ResolvedResource,
    ResolvedResources,
    ResourceAssetRequirement,
    ResourceRequirements,
)
from bokeh.models import (
    ColorBar,
    Div,
    LinearAxis,
    LinearColorMapper,
    Markdown,
    Paragraph,
    SizeBar,
    Slider,
    Title,
)
from bokeh.resources import Resources
from bokeh.util.compiler import CompilationError


@pytest.fixture(autouse=True)
def isolate_extension_state(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setattr(ber, "extension_dirs", {})
    monkeypatch.delenv("BOKEH_DEV", raising=False)


@pytest.mark.parametrize(("kwargs", "message"), [
    ({"kind": "unknown", "url": "extension.js"}, "kind"),
    ({"kind": "script"}, "exactly one"),
    ({"kind": "script", "url": "extension.js", "content": "void 0"}, "exactly one"),
    ({"kind": "script", "url": "extension.js", "package": "extension"}, "exactly one"),
    ({"kind": "script", "url": 1}, "url must be a string"),
    ({"kind": "script", "package": ""}, "non-empty string"),
    ({"kind": "script", "url": "extension.js", "module": 1}, "module must be a boolean"),
    ({"kind": "style", "url": "extension.css", "module": True}, "cannot be JavaScript modules"),
    ({"kind": "style", "package": "extension"}, "must be scripts"),
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
    package = ResourceAssetRequirement("script", package="example")
    assert ResourceAssetRequirement.from_dict(package.to_dict()) == package
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
    assert asset.to_dict()["content_sha256"] == hashlib.sha256(b"export const value = 1").hexdigest()
    assert resolved.to_dict()["assets"] == [asset.to_dict()]
    assert len(resolved.fingerprint) == 64


def test_join_extension_url() -> None:
    assert ber._join_extension_url("https://example.test/root", "child", "file.js") == \
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
    assert bundle.name == name
    assert bundle.server_url == f"https://host.test/app/static/extensions/{name}/custom.js?v={version_hash}"
    assert bundle.cdn_url == "https://unpkg.com/@example/extension@1.2.3/dist/custom.js"
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


def test_packaged_extension_requirements_resolve_under_each_policy(
    tmp_path: Path, monkeypatch: pytest.MonkeyPatch,
) -> None:
    name = "logical_extension"
    base_dir = _install_extension_module(monkeypatch, tmp_path / name, name)
    artifact = base_dir / "dist" / "custom.js"
    artifact.write_text("globalThis.logical_extension = true")
    (base_dir / "package.json").write_text(json.dumps({
        "name": "@example/logical-extension", "version": "1.2.3", "module": "dist/custom.js",
    }))

    class RegisteredModel:
        __view_module__ = f"{name}.models"

    monkeypatch.setattr(ber, "HasProps", SimpleNamespace(
        model_class_reverse_map={"RegisteredModel": RegisteredModel},
    ))
    requirements = ResourceRequirements((), (
        ExtensionRequirement(f"package:{name}", (ResourceAssetRequirement("script", package=name),)),
    ))

    inline = Resources(mode="inline").resolve(requirements)
    server = Resources(mode="server", root_url="https://host.test/app/").resolve(requirements)
    cdn = Resources(mode="cdn").resolve(requirements)
    relative = Resources(mode="relative", root_dir=tmp_path).resolve(requirements)
    absolute = Resources(mode="absolute").resolve(requirements)

    assert inline.assets[0].content is not None
    assert "globalThis.logical_extension = true" in inline.assets[0].content
    assert server.assets[0].url is not None
    assert server.assets[0].url.startswith(f"https://host.test/app/static/extensions/{name}/custom.js?v=")
    assert cdn.assets[0].url == "https://unpkg.com/@example/logical-extension@1.2.3/dist/custom.js"
    assert relative.assets[0].url == f"{name}/dist/custom.js"
    assert absolute.assets[0].url == str(artifact)
    assert requirements.extensions[0].assets[0].to_dict() == {"kind": "script", "package": name}


@pytest.mark.parametrize(("mode", "expected"), [
    ("none", "none"),
    ("inline", "inline"),
    ("offline", "offline"),
    ("cdn", "cdn"),
])
def test_server_extension_resources_honors_requested_policy(mode: str, expected: str) -> None:
    default = Resources(mode="server", minified=False, root_url="https://default.test/")

    policy = ber.server_extension_resources(
        default, mode=mode, minified="true", root_url="https://host.test/app/",
    )

    assert policy.mode == expected
    assert policy.minified is True
    assert policy.root_url is None


def test_server_extension_resources_preserves_defaults_and_server_root() -> None:
    default = Resources(mode="cdn", minified=False)

    assert ber.server_extension_resources(
        default, mode=None, minified=None, root_url="https://host.test/app/",
    ) is default
    server = ber.server_extension_resources(
        default, mode="server", minified="false", root_url="https://host.test/app/",
    )
    assert server == Resources(mode="server", minified=False, root_url="https://host.test/app/")


def test_resolve_server_extensions_skips_discovery_for_host_owned_resources(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    def fail() -> ResourceRequirements:
        raise AssertionError("host-owned resources must not discover registered extensions")

    monkeypatch.setattr(ber, "requirements_for_all_models", fail)

    resolved = ber.resolve_server_extensions(Resources(mode="none"))

    assert resolved.requirements == ResourceRequirements((), ())
    assert resolved.assets == ()


def test_resolve_server_extensions_reports_custom_model_compilation_failure(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    class CustomModel:
        __module__ = "custom.models"
        __view_module__ = "custom.models"
        __implementation__ = object()

    monkeypatch.setattr(ber, "bundle_extensions", lambda models, policy: [])

    def fail(models: Any) -> None:
        raise CompilationError("invalid implementation")

    monkeypatch.setattr(ber, "bundle_models", fail)

    with pytest.raises(ValueError, match="failed to compile custom models: invalid implementation"):
        ber.resolve_server_extensions(Resources(mode="inline"), (CustomModel,))


@pytest.mark.parametrize(("mode", "minified", "message"), [
    (None, "true", "requires Bokeh-Resource-Mode"),
    ("relative", None, "cannot resolve relative"),
    ("absolute", None, "cannot resolve absolute"),
    ("unknown", None, "unknown server extension resource mode"),
    ("cdn", "yes", "must be 'true' or 'false'"),
])
def test_server_extension_resources_rejects_unsupported_requests(
    mode: str | None, minified: str | None, message: str,
) -> None:
    with pytest.raises(ValueError, match=message):
        ber.server_extension_resources(
            Resources(mode="cdn"), mode=mode, minified=minified,
            root_url="https://host.test/app/",
        )


def test_requirements_for_all_models_cover_all_registered_extension_kinds(
    monkeypatch: pytest.MonkeyPatch, tmp_path: Path,
) -> None:
    class ExternalModel:
        __module__ = "external.models"
        __view_module__ = "external.models"
        __javascript__ = ["https://example.test/external.js"]
        __css__ = ["https://example.test/external.css"]

    class PackagedModel:
        __module__ = "packaged.models"
        __view_module__ = "packaged.models"

    class CustomModel:
        __module__ = "custom.models"
        __view_module__ = "custom.models"
        __implementation__ = object()
        __javascript__ = ["https://example.test/custom-dependency.js"]

    registered = {"ExternalModel": ExternalModel, "PackagedModel": PackagedModel, "CustomModel": CustomModel}
    monkeypatch.setattr(ber, "HasProps", SimpleNamespace(model_class_reverse_map=registered))
    package = tmp_path / "packaged.js"
    package.write_text("globalThis.packaged = true")
    seen: set[type[Any]] = set()

    def bundle_extensions(model_types, policy):
        seen.update(model_types)
        return [SimpleNamespace(
            name="packaged", artifact_path=package,
            server_url="/static/extensions/packaged/packaged.js", cdn_url=None,
        )]

    monkeypatch.setattr(ber, "bundle_extensions", bundle_extensions)
    bundled: list[set[type[Any]]] = []

    def bundle_models(model_types):
        bundled.append(set(model_types))
        return "compiled-custom-models"

    monkeypatch.setattr(ber, "bundle_models", bundle_models)

    without_custom = ber.requirements_for_all_models(include_custom_models=False)
    assert "bokeh.custom-models" not in {extension.name for extension in without_custom.extensions}
    assert bundled == []

    requirements = ber.requirements_for_all_models()
    assets = {
        extension.name: extension.assets for extension in requirements.extensions
    }

    assert requirements.components == (
        "bokeh/core", "bokeh/widgets", "bokeh/tables", "bokeh/webgl", "bokeh/mathjax",
    )
    assert seen == set(registered.values())
    assert ResourceAssetRequirement("script", url="https://example.test/external.js") in assets["external"]
    assert ResourceAssetRequirement("style", url="https://example.test/external.css") in assets["external"]
    assert assets["package:packaged"] == (ResourceAssetRequirement("script", package="packaged"),)
    assert assets["bokeh.custom-models"] == (ResourceAssetRequirement("script", content="compiled-custom-models"),)
    assert bundled == [{CustomModel}]
    assert requirements.extensions[-1].name == "bokeh.custom-models"
    dependency_index = next(
        index for index, extension in enumerate(requirements.extensions)
        if ResourceAssetRequirement("script", url="https://example.test/custom-dependency.js") in extension.assets
    )
    assert dependency_index < len(requirements.extensions) - 1


def test_server_package_resolution_uses_the_registered_model_snapshot(
    monkeypatch: pytest.MonkeyPatch, tmp_path: Path,
) -> None:
    class PackagedModel:
        __module__ = "packaged.models"
        __view_module__ = "packaged.models"

    class LateModel:
        __module__ = "late.models"
        __view_module__ = "late.models"

    registry = {"PackagedModel": PackagedModel}
    monkeypatch.setattr(ber, "HasProps", SimpleNamespace(model_class_reverse_map=registry))
    package = tmp_path / "packaged.js"
    package.write_text("globalThis.packaged = true")
    calls: list[set[type[Any]]] = []

    def bundle_extensions(model_types, policy):
        selected = set(model_types)
        calls.append(selected)
        registry.clear()
        registry["LateModel"] = LateModel
        if PackagedModel not in selected:
            return []
        return [SimpleNamespace(
            name="packaged", artifact_path=package,
            server_url="/static/extensions/packaged/packaged.js", cdn_url=None,
        )]

    monkeypatch.setattr(ber, "bundle_extensions", bundle_extensions)

    resolved = ber.resolve_server_extensions(
        Resources(mode="inline"), model_types=(PackagedModel,),
    )

    assert calls == [{PackagedModel}, {PackagedModel}]
    [content] = [asset.content for asset in resolved.assets if asset.content is not None]
    assert "globalThis.packaged = true" in content


@pytest.mark.parametrize("model", [
    Title(text="$$x$$"),
    Slider(title="$$x$$"),
    LinearAxis(axis_label="$$x$$"),
    LinearAxis(major_label_overrides={0: "$$x$$"}),
    Paragraph(text="$$x$$"),
    Div(text="$$x$$"),
    Markdown(text="$$x$$"),
    ColorBar(
        color_mapper=LinearColorMapper(palette="Viridis256", low=0, high=1),
        title="$$x$$",
    ),
    ColorBar(
        color_mapper=LinearColorMapper(palette="Viridis256", low=0, high=1),
        major_label_overrides={0: "$$x$$"},
    ),
    SizeBar(title="$$x$$"),
    SizeBar(major_label_overrides={0: "$$x$$"}),
])
def test_requirements_detect_mathjax(model: Any) -> None:
    assert "bokeh/mathjax" in ber.requirements_for_objs([model]).components


@pytest.mark.parametrize("model", [
    Paragraph(text="$$x$$", disable_math=True),
    Div(text="$$x$$", disable_math=True),
    Div(text="$$x$$", render_as_text=True),
    Markdown(text="$$x$$", disable_math=True),
    LinearAxis(major_label_overrides={"$$x$$": "plain text"}),
])
def test_requirements_skip_unrendered_mathjax(model: Any) -> None:
    assert "bokeh/mathjax" not in ber.requirements_for_objs([model]).components
