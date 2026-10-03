#-----------------------------------------------------------------------------
# Copyright (c) Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt.
#-----------------------------------------------------------------------------

from __future__ import annotations

# Standard library imports
import json
from collections.abc import Callable, Iterator
from copy import deepcopy
from dataclasses import fields
from pathlib import Path
from types import SimpleNamespace
from typing import Any

# External imports
import numpy as np
import pytest

# Bokeh imports
from bokeh import __version__
from bokeh.document import Document
from bokeh.embed import (
    EmbedBuildError,
    EmbedResult,
    EmbedRoot,
    EmbedSpec,
    EmbedValidationError,
    ResourceAssetRequirement,
    ThemePolicy,
    components,
    embed,
    embed_server,
    file_html,
    server_document,
    server_session,
)
from bokeh.embed.resources import (
    ExtensionRequirement,
    ResolvedResource,
    ResolvedResources,
    ResourceRequirements,
)
from bokeh.events import DocumentReady
from bokeh.io import save
from bokeh.io.doc import patch_curdoc
from bokeh.model import Model
from bokeh.models import Button, CustomJS, DataTable
from bokeh.models.ui.notifications import Notifications
from bokeh.plotting import figure
from bokeh.resources import ResourceConflictError, Resources
from bokeh.settings import settings
from bokeh.themes import Theme
from bokeh.util.compiler import JavaScript
from bokeh.util.warnings import BokehDeprecationWarning

import bokeh.embed.renderers as renderers # isort:skip

FIXTURE_PATH = Path(__file__).parents[4] / "bokehjs" / "test" / "unit" / "embed" / "embed_fixtures.json"


def _fixture(name: str) -> dict:
    data = json.loads(FIXTURE_PATH.read_text())
    assert data["schema"] == "bokeh.embed.fixtures/v1"
    return next(case["payload"] for case in data["cases"] if case["name"] == name)


def _plot():
    plot = figure(width=200, height=150)
    plot.scatter([1, 2], [3, 4])
    return plot


@pytest.fixture
def cleanup_extensions() -> Iterator[None]:
    yield
    Model.clear_extensions()


def _callback(id: str, code: str) -> CustomJS:
    callback = CustomJS._new(id)
    assert callback is not None
    callback.__init__()
    callback.code = code
    return callback


def _equivalent_graph(prefix: str) -> Document:
    shared = _callback(f"{prefix}-shared", "shared")
    cycle_a = _callback(f"{prefix}-cycle-a", "cycle-a")
    cycle_b = _callback(f"{prefix}-cycle-b", "cycle-b")
    cycle_a.args = {"other": cycle_b}
    cycle_b.args = {"other": cycle_a}
    first = CustomJS(code="first", args={"shared": shared, "cycle": cycle_a})
    second = CustomJS(code="second", args={"shared": shared})
    document = Document()
    document.add_root(first)
    document.add_root(second)
    return document


def test_builder_uses_structural_roots_and_graph_minimal_serialization() -> None:
    result = embed({"primary": CustomJS(code="primary"), "secondary": CustomJS(code="secondary")})

    assert [root.to_dict() for root in result.roots] == [
        {"key": "primary", "document": 0, "root": 0},
        {"key": "secondary", "document": 0, "root": 1},
    ]
    roots = result.source["documents"][0]["roots"]
    assert "$id" not in roots[0]
    assert "$id" not in roots[1]
    assert result.metadata["embedding"]["static_model_ids"] == "graph-minimal"


def test_fingerprint_normalizes_allocation_dependent_retained_model_ids() -> None:
    first = embed(_equivalent_graph("one"))
    second = embed(_equivalent_graph("two"))

    assert first.source != second.source
    assert first.fingerprint == second.fingerprint


def test_fingerprint_normalizes_integral_json_numbers() -> None:
    first = embed(CustomJS(code="return", args={"value": 1.0}))
    second = embed(CustomJS(code="return", args={"value": 1}))

    assert first.fingerprint == second.fingerprint
    assert first.to_json_string() == first.to_json_string()


def test_result_source_and_metadata_are_detached_from_nested_mutation() -> None:
    result = embed(CustomJS(code="return"), metadata={"host": {"name": "original"}})
    fingerprint = result.fingerprint

    source = result.source
    source["documents"][0]["title"] = "mutated"
    metadata = result.metadata
    metadata["host"]["name"] = "mutated"

    assert result.source["documents"][0]["title"] != "mutated"
    assert result.metadata == {"host": {"name": "original"}, "embedding": result.metadata["embedding"]}
    assert result.fingerprint == fingerprint
    assert EmbedResult.from_dict(result.to_dict()) == result


def test_result_accepts_float_subclasses() -> None:
    result = embed(CustomJS(code="return"))
    actual = EmbedResult(result.source, result.roots, result.requires, {"value": np.float64(1.25)})

    assert actual.metadata == {"value": 1.25}


@pytest.mark.parametrize(
    "value",
    [float("nan"), float("inf"), float("-inf"), 2**53],
)
def test_result_rejects_non_finite_floats_and_unsafe_integers(value: float | int) -> None:
    result = embed(CustomJS(code="return"))
    with pytest.raises(EmbedValidationError, match=r"non-finite|safe integer"):
        EmbedResult(result.source, result.roots, result.requires, {"value": value})


def test_result_rejects_non_string_metadata_keys() -> None:
    result = embed(CustomJS(code="return"))
    with pytest.raises(EmbedValidationError, match="keys must be strings"):
        EmbedResult(result.source, result.roots, result.requires, {1: "value"})


@pytest.mark.parametrize("value", [float(2**53), 1e20, 1e21, 1e22])
def test_result_accepts_large_finite_floats(value: float) -> None:
    result = embed(CustomJS(code="return"))
    actual = EmbedResult(result.source, result.roots, result.requires, {"value": value})

    assert actual.metadata == {"value": value}
    assert isinstance(actual.metadata["value"], float)


@pytest.mark.parametrize(("kwargs", "message"), [
    ({"key": "", "model_id": "model"}, "keys must not be empty"),
    ({"key": "root", "document": 0, "root": "0"}, "root ordinal must be an integer"),
    ({"key": "root", "model_id": 1}, "model_id must be a non-empty string"),
    ({"key": "root", "document": 0, "root": 0, "model_id": "model"}, "requires document/root ordinals"),
    ({"key": "root"}, "requires model_id"),
    ({"key": "root", "document": -1, "root": 0}, "ordinals must be non-negative"),
])
def test_embed_root_rejects_invalid_values(kwargs: dict[str, Any], message: str) -> None:
    with pytest.raises(EmbedValidationError, match=message):
        EmbedRoot(**kwargs)


def test_result_json_helpers_validate_and_round_trip() -> None:
    result = embed(CustomJS(code="return"))

    assert result.to_json() == result.to_dict()
    assert json.loads(result.to_json_string(pretty=True)) == result.to_dict()
    with pytest.raises(EmbedValidationError, match="invalid embed payload JSON"):
        EmbedResult.from_json("not-json")
    with pytest.raises(EmbedValidationError, match="must be a JSON object"):
        EmbedResult.from_json("[]")
    with pytest.raises(EmbedValidationError, match="roots must be objects"):
        EmbedRoot.from_dict([])  # type: ignore[arg-type]


def test_result_json_helpers_escape_lone_surrogates() -> None:
    result = embed(CustomJS(code="return"), metadata={"value": "\ud800"})

    assert "\\ud800" in result.to_json_string()
    assert "\\ud800" in result.to_json_string(pretty=True)
    result.to_json_string().encode("utf-8")
    result.fragment().script.encode("utf-8")


def test_resource_requirement_inputs_are_canonicalized_to_tuples() -> None:
    asset = ResourceAssetRequirement("script", content="void 0")
    extension = ExtensionRequirement("example", [asset])  # type: ignore[arg-type]
    requirements = ResourceRequirements(["bokeh/core"], [extension])  # type: ignore[arg-type]

    assert extension.assets == (asset,)
    assert requirements.components == ("bokeh/core",)
    assert requirements.extensions == (extension,)


def test_fingerprint_does_not_normalize_metadata_that_resembles_a_model_id() -> None:
    original = embed(_equivalent_graph("retained"))

    def retained_id(value: object) -> str | None:
        if isinstance(value, dict):
            model_id = value.get("$id")
            if isinstance(value.get("$type"), str) and isinstance(model_id, str):
                return model_id
            for child in value.values():
                if (found := retained_id(child)) is not None:
                    return found
        elif isinstance(value, list):
            for child in value:
                if (found := retained_id(child)) is not None:
                    return found
        return None

    model_id = retained_id(original.source)
    assert model_id is not None
    actual = EmbedResult(original.source, original.roots, original.requires, {"id": model_id})
    normalized_lookalike = EmbedResult(original.source, original.roots, original.requires, {"id": "model-0"})

    assert actual.fingerprint != normalized_lookalike.fingerprint


def test_result_round_trip_validates_fingerprint_and_schema() -> None:
    result = embed(_plot())
    restored = EmbedResult.from_json(result.to_json_string())
    assert restored == result
    Document.from_json(restored.source["documents"][0])

    invalid = result.to_dict()
    invalid["fingerprint"] = "wrong"
    with pytest.raises(EmbedValidationError, match="fingerprint mismatch"):
        EmbedResult.from_dict(invalid)

    invalid = result.to_dict()
    invalid["schema"] = "bokeh.embed/v2"
    with pytest.raises(EmbedValidationError, match="unsupported embed schema"):
        EmbedResult.from_dict(invalid)

    invalid = result.to_dict()
    invalid.pop("fingerprint")
    with pytest.raises(EmbedValidationError, match="fingerprint must be a non-empty string"):
        EmbedResult.from_dict(invalid)

    invalid = result.to_dict()
    invalid["buffers"] = []
    with pytest.raises(EmbedValidationError, match=r"not part of bokeh\.embed/v1"):
        EmbedResult.from_dict(invalid)

    invalid = result.to_dict()
    invalid["source"]["documents"].append(invalid["source"]["documents"][0])
    with pytest.raises(EmbedValidationError, match="exactly one source document"):
        EmbedResult.from_dict(invalid)

    invalid = result.to_dict()
    invalid["unexpected"] = True
    with pytest.raises(EmbedValidationError, match="unknown fields"):
        EmbedResult.from_dict(invalid)

    invalid = result.to_dict()
    invalid["roots"][0]["unexpected"] = True
    with pytest.raises(EmbedValidationError, match="unknown fields"):
        EmbedResult.from_dict(invalid)


@pytest.mark.parametrize(
    ("mutate", "message"),
    [
        (lambda value: value["roots"][0].update(key=1), "root keys must be strings"),
        (lambda value: value["roots"][0].update(document=0.5), "document ordinal must be an integer"),
        (lambda value: value.update(metadata=[]), "metadata must be an object"),
        (
            lambda value: value["requires"].update(extensions=[{
                "name": "bad",
                "assets": [{"kind": "bogus", "content": "void 0"}],
            }]),
            "kind must be 'script' or 'style'",
        ),
        (
            lambda value: value["requires"].update(extensions=[{
                "name": "bad",
                "assets": [{"kind": "script", "content": "void 0", "nonce": "result"}],
            }]),
            "nonce is host-owned",
        ),
    ],
)
def test_result_python_validation_matches_browser_contract(
    mutate: Callable[[dict[str, Any]], None], message: str,
) -> None:
    value = embed(CustomJS(code="root")).to_dict()
    mutate(value)

    with pytest.raises(EmbedValidationError, match=message):
        EmbedResult.from_dict(value)


@pytest.mark.parametrize("name", ["standalone-keyed-roots", "standalone-compact-roots"])
def test_shared_fixture_decodes_in_python_without_root_ids(name: str) -> None:
    fixture = deepcopy(_fixture(name))
    assert EmbedResult.from_dict(fixture).fingerprint == fixture.pop("fingerprint")
    fixture["bokeh_version"] = __version__
    fixture["source"]["documents"][0]["version"] = __version__
    result = EmbedResult(
        source=fixture["source"],
        roots=tuple(EmbedRoot.from_dict(root) for root in fixture["roots"]),
        requires=ResourceRequirements.from_dict(fixture["requires"]),
        metadata=fixture["metadata"],
        bokeh_version=fixture["bokeh_version"],
    )
    document = Document.from_json(result.source["documents"][0])
    roots = {root.key: document.roots[root.root] for root in result.roots}

    assert isinstance(roots["primary"], CustomJS)
    assert roots["primary"].code == "primary"
    assert roots["secondary"].code == "secondary"
    if name == "standalone-compact-roots":
        shared = roots["primary"].args["shared"]
        assert roots["secondary"].args["shared"] is shared
        assert shared.args["self"] is shared


def test_named_inputs_preserve_order_and_restore_document_title() -> None:
    document = Document(title="Original")
    document.add_root(CustomJS(code="one"))
    document.add_root(CustomJS(code="two"))
    result = embed({"one": document.roots[0], "two": document.roots[1]})

    assert [root.key for root in result.roots] == ["one", "two"]
    assert document.title == "Original"


def test_builder_staging_does_not_change_model_document_ownership() -> None:
    unattached = CustomJS(code="unattached")
    first = CustomJS(code="first")
    second = CustomJS(code="second")
    first_document = Document()
    second_document = Document()
    first_document.add_root(first)
    second_document.add_root(second)

    embed({"unattached": unattached, "first": first, "second": second})

    assert unattached.document is None
    assert first.document is first_document
    assert second.document is second_document


def test_builder_staging_preserves_complete_document_context() -> None:
    theme = Theme(json={"attrs": {"Button": {"button_type": "danger"}}})
    document = Document(title="Original", theme=theme)
    document.config.color_scheme = "dark"
    document.js_on_event(DocumentReady, CustomJS(code="ready"))
    document.add_root(Button(label="themed"))

    result = embed(document)
    decoded = Document.from_json(result.source["documents"][0])

    assert decoded.title == "Original"
    assert decoded.config.color_scheme == "dark"
    assert decoded.roots[0].button_type == "danger"
    assert "callbacks" in result.source["documents"][0]
    assert document.roots[0].document is document
    assert document.theme is theme


def test_builder_discovers_models_reachable_only_from_document_callbacks() -> None:
    document = Document()
    document.add_root(CustomJS(code="root"))
    document.js_on_event(DocumentReady, CustomJS(code="ready", args={"button": Button()}))

    result = embed(document)

    assert "bokeh/widgets" in result.requires.components


def test_builder_discovers_custom_models_reachable_only_from_document_config(
    monkeypatch: pytest.MonkeyPatch, cleanup_extensions: None,
) -> None:
    class CustomNotifications(Notifications):
        __implementation__ = JavaScript("export const value = 1")

    monkeypatch.setattr("bokeh.embed.resources.bundle_models", lambda models: "config-custom-model")
    document = Document()
    document.config.notifications = CustomNotifications()
    document.add_root(CustomJS(code="root"))

    result = embed(document)

    requirement = next(
        extension for extension in result.requires.extensions if extension.name == "bokeh.custom-models"
    )
    assert requirement.assets[0].content == "config-custom-model"


def test_builder_staging_applies_explicit_theme_and_restores_model() -> None:
    button = Button(label="themed")
    previous_theme = button.themed_values()
    theme = Theme(json={"attrs": {"Button": {"button_type": "danger"}}})

    result = embed(button, theme=theme)
    decoded = Document.from_json(result.source["documents"][0])

    assert decoded.roots[0].button_type == "danger"
    assert button.button_type == "default"
    assert button.themed_values() is previous_theme


def test_builder_source_or_curdoc_theme_falls_back_for_detached_models() -> None:
    current = Document(theme=Theme(json={"attrs": {"Button": {"button_type": "danger"}}}))

    with patch_curdoc(current):
        result = embed(Button(label="themed"), theme=ThemePolicy.SOURCE_OR_CURDOC)

    decoded = Document.from_json(result.source["documents"][0])
    assert decoded.roots[0].button_type == "danger"


def test_builder_source_or_curdoc_theme_prefers_complete_source_document() -> None:
    current = Document(theme=Theme(json={"attrs": {"Button": {"button_type": "danger"}}}))
    source = Document(theme=Theme(json={"attrs": {"Button": {"button_type": "success"}}}))
    button = Button(label="themed")
    source.add_root(button)

    with patch_curdoc(current):
        result = embed(button, theme=ThemePolicy.SOURCE_OR_CURDOC)

    decoded = Document.from_json(result.source["documents"][0])
    assert decoded.roots[0].button_type == "success"


def test_builder_source_or_curdoc_theme_falls_back_for_partial_source_document() -> None:
    current = Document(theme=Theme(json={"attrs": {"Button": {"button_type": "danger"}}}))
    source = Document(theme=Theme(json={"attrs": {"Button": {"button_type": "success"}}}))
    button = Button(label="themed")
    source.add_root(button)
    source.add_root(Button(label="other"))

    with patch_curdoc(current):
        result = embed(button, theme=ThemePolicy.SOURCE_OR_CURDOC)

    decoded = Document.from_json(result.source["documents"][0])
    assert decoded.roots[0].button_type == "danger"


def test_builder_staging_restores_ownership_after_serialization_failure(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    model = CustomJS(code="failure")
    document = Document()
    document.add_root(model)

    def fail(*_args: Any, **_kwargs: Any) -> None:
        assert model.document is not document
        raise RuntimeError("serialization failed")

    monkeypatch.setattr(Document, "to_static_json", fail)
    with pytest.raises(RuntimeError, match="serialization failed"):
        embed(model)

    assert model.document is document


def test_builder_rejects_empty_duplicate_and_python_callback_inputs() -> None:
    with pytest.raises(EmbedBuildError, match="no root"):
        embed(Document())

    model = CustomJS(code="root")
    with pytest.raises(EmbedBuildError, match="more than one"):
        embed([model, model])

    plot = _plot()
    plot.on_change("visible", lambda attr, old, new: None)
    with pytest.raises(EmbedBuildError, match="Python callbacks"):
        embed(plot, callback_policy="error")


def test_builder_warns_for_python_callbacks(caplog: pytest.LogCaptureFixture) -> None:
    plot = _plot()
    plot.on_change("visible", lambda attr, old, new: None)

    embed(plot, callback_policy="warn")

    assert "standalone embedding cannot execute Python callbacks" in caplog.text


def test_embed_spec_rejects_inconsistent_public_inputs() -> None:
    model = CustomJS(code="root")
    with pytest.raises(EmbedBuildError, match="equal lengths"):
        EmbedSpec((model,), (), "single")
    with pytest.raises(EmbedBuildError, match="keys must be unique"):
        EmbedSpec((model, CustomJS(code="other")), ("root", "root"), "sequence")
    with pytest.raises(EmbedBuildError, match="serialization must be"):
        EmbedSpec((model,), ("root",), "single", serialization="typo")  # type: ignore[arg-type]

    with pytest.raises(EmbedBuildError, match="at least one model"):
        EmbedSpec((), (), "single")
    with pytest.raises(EmbedBuildError, match="Model instances"):
        EmbedSpec((object(),), ("root",), "single")  # type: ignore[arg-type]
    with pytest.raises(EmbedBuildError, match="non-empty strings"):
        EmbedSpec((model,), ("",), "single")
    with pytest.raises(EmbedBuildError, match="input_shape"):
        EmbedSpec((model,), ("root",), "invalid")  # type: ignore[arg-type]
    with pytest.raises(EmbedBuildError, match="callback_policy"):
        EmbedSpec((model,), ("root",), "single", callback_policy="invalid")  # type: ignore[arg-type]


def test_builder_rejects_invalid_standalone_and_server_inputs() -> None:
    with pytest.raises(EmbedBuildError, match="expects a Model"):
        embed(object())  # type: ignore[arg-type]
    with pytest.raises(EmbedBuildError, match="mapping keys"):
        embed({"": CustomJS(code="root")})
    with pytest.raises(EmbedBuildError, match="WebSocket URL"):
        embed_server("ws://example.test/app")
    with pytest.raises(EmbedBuildError, match=r"HTTP\(S\)"):
        embed_server("data:text/html,unsafe")
    with pytest.raises(EmbedBuildError, match="query or fragment"):
        embed_server("https://example.test/app?tenant=1")
    with pytest.raises(EmbedBuildError, match="query or fragment"):
        embed_server("https://example.test/app#plot")
    with pytest.raises(EmbedBuildError, match="scheme-relative"):
        embed_server("//example.test/app")
    with pytest.raises(EmbedBuildError, match="application URL is required"):
        embed_server("/")
    with pytest.raises(EmbedBuildError, match="root keys"):
        embed_server(roots={"": "model-id"})
    with pytest.raises(EmbedBuildError, match="non-empty ID"):
        embed_server(roots={"root": ""})


def test_builder_flattens_documents_in_sequences_and_accepts_named_themes() -> None:
    document = Document()
    document.add_root(CustomJS(code="first"))
    document.add_root(CustomJS(code="second"))

    result = embed([document], theme="caliber")

    assert [root.key for root in result.roots] == ["root-0:0", "root-0:1"]


def test_resource_requirements_are_exact_for_representative_models() -> None:
    assert embed(_plot()).requires.components == ("bokeh/core", "bokeh/api")
    assert embed(Button()).requires.components == ("bokeh/core", "bokeh/widgets", "bokeh/api")
    assert embed(DataTable()).requires.components == ("bokeh/core", "bokeh/widgets", "bokeh/tables", "bokeh/api")

    webgl = _plot()
    webgl.output_backend = "webgl"
    assert "bokeh/webgl" in embed(webgl).requires.components


def test_builder_captures_inline_custom_model_bundle(
    monkeypatch: pytest.MonkeyPatch, cleanup_extensions: None,
) -> None:
    class InlineCustomJS(CustomJS):
        __implementation__ = JavaScript("export const value = 1")

    monkeypatch.setattr("bokeh.embed.resources.bundle_models", lambda models: "compiled-custom-models")
    result = embed(InlineCustomJS(code="return value"))
    requirement = next(
        extension for extension in result.requires.extensions if extension.name == "bokeh.custom-models"
    )
    assert requirement.assets[0].content == "compiled-custom-models"
    assert result.page(resources="cdn").index("compiled-custom-models") > result.page(resources="cdn").index("bokeh-api")
    with pytest.warns(BokehDeprecationWarning, match=r"components\(\)"):
        with pytest.raises(ValueError, match="custom extension"):
            components(InlineCustomJS(code="return value"))


def test_builder_adapts_external_and_legacy_package_assets(
    monkeypatch: pytest.MonkeyPatch, tmp_path: Path, cleanup_extensions: None,
) -> None:
    class ExternalCustomJS(CustomJS):
        __javascript__ = ["https://example.test/extension.js"]
        __css__ = ["https://example.test/extension.css"]

    package = tmp_path / "legacy-package.js"
    package.write_text("globalThis.legacy_package = true")
    monkeypatch.setattr(
        "bokeh.embed.resources.bundle_extensions",
        lambda objs, resources: [SimpleNamespace(artifact_path=package)],
    )

    result = embed(ExternalCustomJS(code="external"))
    assets = [
        asset
        for extension in result.requires.extensions
        for asset in extension.assets
    ]
    assert ResourceAssetRequirement("script", url="https://example.test/extension.js") in assets
    assert ResourceAssetRequirement("style", url="https://example.test/extension.css") in assets
    assert any(asset.content is not None and "legacy_package" in asset.content for asset in assets)


def test_resources_resolve_none_cdn_inline_and_offline_conflicts(tmp_path: Path) -> None:
    with pytest.raises(ResourceConflictError, match="unknown resource mode"):
        Resources.build("unknown")

    requirements = ResourceRequirements(("bokeh/core", "bokeh/widgets"))
    assert Resources(mode="none").resolve(requirements).assets == ()

    settings.resources = "server-dev"
    try:
        default = Resources.build()
        assert default.mode == "server"
        assert default.minified is False
    finally:
        del settings.resources

    cdn = Resources(mode="cdn").resolve(requirements)
    assert [asset.url for asset in cdn.assets] == [
        f"https://cdn.bokeh.org/bokeh/dev/bokeh-{__version__.split('+')[0]}.min.js",
        f"https://cdn.bokeh.org/bokeh/dev/bokeh-widgets-{__version__.split('+')[0]}.min.js",
    ]

    build_dir = tmp_path / "build"
    (build_dir / "js").mkdir(parents=True)
    (build_dir / "js" / "bokeh.min.js").write_text("globalThis.Bokeh = {}")

    inline = Resources(mode="inline", base_dir=build_dir).resolve(
        ResourceRequirements(("bokeh/core",)),
    )
    assert len(inline.assets) == 1
    assert inline.assets[0].content is not None

    server = Resources(mode="server", root_url="https://example.test/app/").resolve(
        ResourceRequirements(("bokeh/core", "bokeh/api")),
    )
    assert [asset.url for asset in server.assets] == [
        "https://example.test/app/static/js/bokeh.min.js",
        "https://example.test/app/static/js/bokeh-api.min.js",
    ]

    relative = Resources(mode="relative", root_dir=build_dir, base_dir=build_dir).resolve(
        ResourceRequirements(("bokeh/core",)),
    )
    assert relative.assets[0].url == "js/bokeh.min.js"
    absolute = Resources(mode="absolute", base_dir=build_dir).resolve(ResourceRequirements(("bokeh/core",)))
    assert absolute.assets[0].url == str(build_dir / "js" / "bokeh.min.js")

    external = ExtensionRequirement("example", (ResourceAssetRequirement("script", url="https://example.test/ext.js"),))
    with pytest.raises(ResourceConflictError, match="offline resources"):
        Resources(mode="offline", base_dir=build_dir).resolve(
            ResourceRequirements((), (external,)),
        )


def test_relative_resource_urls_use_url_separators(tmp_path: Path, monkeypatch: pytest.MonkeyPatch) -> None:
    build_dir = tmp_path / "build"
    (build_dir / "js").mkdir(parents=True)
    (build_dir / "js" / "bokeh.min.js").write_text("globalThis.Bokeh = {}")
    import bokeh.resources as resources_module
    monkeypatch.setattr(resources_module.os.path, "relpath", lambda path, root: "js\\bokeh.min.js")
    relative = Resources(mode="relative", root_dir=build_dir, base_dir=build_dir).resolve(
        ResourceRequirements(("bokeh/core",)),
    )

    assert relative.assets[0].url == "js/bokeh.min.js"


def test_resource_requirement_union_is_exact_and_deterministic() -> None:
    extension_asset = ResourceAssetRequirement("script", url="https://example.test/ext.js")
    first = ResourceRequirements(
        ("bokeh/core", "bokeh/api"),
        (ExtensionRequirement("shared", (extension_asset,)),),
    )
    second = ResourceRequirements(
        ("bokeh/core", "bokeh/widgets", "bokeh/api"),
        (ExtensionRequirement("shared", (extension_asset,)),),
    )

    combined = ResourceRequirements.union(first, second)

    assert combined.components == ("bokeh/core", "bokeh/widgets", "bokeh/api")
    assert combined.extensions == (ExtensionRequirement("shared", (extension_asset,)),)


def test_resource_policy_reports_csp_and_sri_conflicts() -> None:
    with pytest.raises(ResourceConflictError, match="external_only"):
        Resources(mode="inline", external_only=True)
    with pytest.raises(ResourceConflictError, match="integrity"):
        Resources(mode="server", integrity=True)

    resolved = Resources(mode="cdn", integrity=True).resolve(
        ResourceRequirements(("bokeh/core",)), bokeh_version="3.8.0",
    )
    assert resolved.assets[0].integrity is not None
    assert resolved.assets[0].integrity.startswith("sha384-")
    assert resolved.assets[0].crossorigin == "anonymous"

    assert "bokeh-3.8.0" in resolved.assets[0].url

    external = ExtensionRequirement("example", (
        ResourceAssetRequirement("script", url="https://example.test/extension.js"),
    ))
    with pytest.raises(ResourceConflictError, match="integrity requires an SRI hash"):
        Resources(mode="cdn", integrity=True).resolve(
            ResourceRequirements(extensions=(external,)), bokeh_version="3.8.0",
        )

    result = embed(_plot())
    with pytest.raises(ValueError, match=r"result\.external"):
        result.fragment(resources=Resources(mode="cdn", external_only=True), bootstrap_url="/bootstrap.js")


def test_resource_policy_resolves_standard_embed_bootstrap(tmp_path: Path) -> None:
    server = Resources(
        mode="server", root_url="https://example.test/app/", crossorigin="anonymous",
    ).resolve_embed_bootstrap()
    cdn = Resources(mode="cdn").resolve_embed_bootstrap()
    relative = Resources(
        mode="relative", root_dir=tmp_path, base_dir=tmp_path,
    ).resolve_embed_bootstrap()
    absolute = Resources(mode="absolute", base_dir=tmp_path).resolve_embed_bootstrap()

    assert server.url == "https://example.test/app/static/js/bokeh-embed-bootstrap.min.js"
    assert server.crossorigin == "anonymous"
    assert cdn.url == (
        f"https://cdn.bokeh.org/bokeh/dev/bokeh-embed-bootstrap-{__version__.split('+')[0]}.min.js"
    )
    assert relative.url == "js/bokeh-embed-bootstrap.min.js"
    assert absolute.url == str(tmp_path / "js" / "bokeh-embed-bootstrap.min.js")

    with pytest.raises(ResourceConflictError, match="provide bootstrap_url explicitly"):
        Resources(mode="none", external_only=True).resolve_embed_bootstrap()


def test_typed_renderers_cover_fragment_page_external_and_mime(tmp_path: Path) -> None:
    result = embed({"summary": _plot(), "detail": _plot()})
    fragment = result.fragment(resources="none")

    assert list(fragment.divs) == ["summary", "detail"]
    assert "data-bokeh-root=\"summary\"" in fragment.html
    assert "application/vnd.bokeh.embed+json" in fragment.script
    assert "data-bokeh-embed-bootstrap" in fragment.script
    assert f'data-bokeh-embed="{result.fingerprint}"' in fragment.script
    assert "RenderItem" not in fragment.script
    assert " id=" not in fragment.html
    assert fragment.resources.policy.mode == "none"
    assert fragment.resources.requirements == result.requires
    assert fragment.resources.assets == ()
    assert fragment.build_fingerprint == result.fragment(resources="none").build_fingerprint
    assert fragment.build_fingerprint != result.fragment(resources="cdn").build_fingerprint

    page = result.page(resources="none", title="Result page")
    assert "<title>Result page</title>" in page
    assert page.count("data-bokeh-root=") == 2
    assert "<title></title>" in result.page(resources="none", title="")

    template = tmp_path / "result.html"
    template.write_text("{% block title %}Path template{% endblock %}")
    assert "Path template" in result.page(resources="none", template=template)

    external = result.external("/assets/plot.json", resources="none")
    assert external.payload == result.to_json_string()
    assert "mount_embed_declaration" in external.bootstrap
    assert "fetch(" not in external.bootstrap
    assert "data-bokeh-payload-url=\"/assets/plot.json\"" in external.html
    assert external.build_fingerprint == result.external("/assets/plot.json", resources="none").build_fingerprint

    assert tuple(field.name for field in fields(fragment)) == (
        "result", "mounts", "script", "resources", "build_fingerprint", "html",
    )
    assert tuple(field.name for field in fields(external)) == (
        "result", "payload_url", "mounts", "bootstrap", "resources", "build_fingerprint", "html",
    )

    mime = result._repr_mimebundle_()
    assert mime["application/vnd.bokeh.embed+json"] == result.to_dict()
    assert "text/html" in mime


def test_external_bootstrap_renderers_preserve_csp_nonce() -> None:
    result = embed(CustomJS(code="root"))
    policy = Resources(mode="none", nonce="embed-nonce")

    fragment = result.fragment(resources=policy, bootstrap_url="/bootstrap.js")
    page = result.page(resources=policy, bootstrap_url="/bootstrap.js")
    external = result.external(
        "/payload.json", resources=policy, bootstrap_url="/bootstrap.js",
    )

    assert 'nonce="embed-nonce"' in fragment.script
    assert 'nonce="embed-nonce"' in page
    assert 'nonce="embed-nonce"' in external.bootstrap


def test_custom_bootstrap_cannot_bypass_requested_integrity() -> None:
    result = embed(CustomJS(code="root"))
    policy = Resources(mode="cdn", integrity=True)

    with pytest.raises(ResourceConflictError, match="custom bootstrap_url"):
        result.fragment(resources=policy, bootstrap_url="/bootstrap.js")
    with pytest.raises(ResourceConflictError, match="custom bootstrap_url"):
        result.external("/payload.json", resources=policy, bootstrap_url="/bootstrap.js")


@pytest.mark.parametrize("url", ["data:text/javascript,alert(1)", "javascript:alert(1)", "//evil.test/x.js"])
def test_renderers_reject_unsafe_executable_urls(url: str) -> None:
    result = embed(CustomJS(code="root"))

    with pytest.raises(ValueError, match=r"HTTP\(S\)|scheme-relative"):
        result.fragment(resources="none", bootstrap_url=url)
    with pytest.raises(ValueError, match=r"HTTP\(S\)|scheme-relative"):
        result.external(url, resources="none")


@pytest.mark.parametrize("asset", [
    ResolvedResource("script", url="data:text/javascript,alert(1)"),
    ResolvedResource("style", url="//evil.test/style.css"),
])
def test_resource_rendering_rejects_unsafe_urls(asset: ResolvedResource) -> None:
    with pytest.raises(ValueError, match=r"HTTP\(S\)|scheme-relative"):
        renderers._render_resource(asset)


def test_resource_rendering_allows_windows_paths_only_for_absolute_mode() -> None:
    asset = ResolvedResource("script", url=r"C:\bokeh\bokeh.min.js")
    requirements = ResourceRequirements()
    absolute = ResolvedResources(requirements, Resources(mode="absolute"), __version__, (asset,))
    cdn = ResolvedResources(requirements, Resources(mode="cdn"), __version__, (asset,))

    assert r'src="C:\bokeh\bokeh.min.js"' in renderers._render_resources(absolute)
    with pytest.raises(ValueError, match=r"HTTP\(S\) or be relative"):
        renderers._render_resources(cdn)


def test_inline_resource_end_tags_are_escaped_case_insensitively() -> None:
    script = renderers._render_resource(ResolvedResource("script", content="x</SCRIPT>y"))
    style = renderers._render_resource(ResolvedResource("style", content="x</STYLE>y"))

    assert "</SCRIPT>" not in script
    assert "<\\/script>" in script
    assert "</STYLE>" not in style
    assert "<\\/style>" in style


def test_external_only_renderer_uses_standard_bootstrap_asset() -> None:
    result = embed(CustomJS(code="root"))
    policy = Resources(mode="cdn", external_only=True, crossorigin="anonymous")

    external = result.external("/payload.json", resources=policy)

    assert "bokeh-embed-bootstrap-" in external.bootstrap
    assert ".min.js" in external.bootstrap
    assert 'crossorigin="anonymous"' in external.bootstrap
    assert "mount_embed_declaration" not in external.bootstrap

    with pytest.raises(ResourceConflictError, match="provide bootstrap_url explicitly"):
        result.external("/payload.json", resources=Resources(mode="none", external_only=True))


def test_external_only_renderer_applies_bootstrap_integrity(monkeypatch: pytest.MonkeyPatch) -> None:
    import bokeh.resources as resources_module

    result = embed(CustomJS(code="root"))
    release_result = EmbedResult(
        result.source,
        result.roots,
        result.requires,
        result.metadata,
        bokeh_version="4.0.0",
    )
    hashes = {
        "bokeh-4.0.0.min.js": "core-hash",
        "bokeh-api-4.0.0.min.js": "api-hash",
        "bokeh-embed-bootstrap-4.0.0.min.js": "bootstrap-hash",
    }
    monkeypatch.setattr(resources_module, "get_sri_hashes_for_version", lambda version: hashes)

    external = release_result.external(
        "/payload.json",
        resources=Resources(mode="cdn", integrity=True, external_only=True),
    )

    assert 'integrity="sha384-bootstrap-hash"' in external.bootstrap
    assert 'crossorigin="anonymous"' in external.bootstrap


def test_retained_facades_delegate_and_preserve_useful_shapes() -> None:
    plot = _plot()
    with pytest.warns(BokehDeprecationWarning, match=r"components\(\)"):
        script, div = components(plot)
    assert "bokeh.embed/v1" in script
    assert "data-bokeh-root=\"root\"" in div

    with pytest.warns(BokehDeprecationWarning, match=r"components\(\)"):
        script, divs = components({"left": _plot(), "right": _plot()})
    assert list(divs) == ["left", "right"]
    assert "Bokeh.mount" in script

    with pytest.warns(BokehDeprecationWarning, match=r"file_html\(\)"):
        html = file_html(plot, resources="cdn", title="Facade")
    assert "bokeh.embed/v1" in html
    assert "<title>Facade</title>" in html


def test_save_and_server_facades_use_embed_routes(tmp_path: Path) -> None:
    filename = tmp_path / "saved.html"
    result = save(_plot(), filename=filename, resources="cdn", title="Saved result")
    assert Path(result) == filename
    assert "bokeh.embed/v1" in filename.read_text()

    with pytest.warns(BokehDeprecationWarning, match=r"server_document\(\)"):
        new_session = server_document("https://example.test/app", resources=None)
    assert '\"kind\":\"server\"' in new_session
    assert "mount_embed_declaration" in new_session
    assert "/autoload.js" not in new_session
    with pytest.warns(BokehDeprecationWarning, match=r"server_document\(\)"):
        with_resources = server_document("https://example.test/app")
    assert "https://example.test/app/static/js/bokeh.min.js" in with_resources
    assert "https://example.test/app/static/js/bokeh-api.min.js" in with_resources

    model = _plot()
    with pytest.warns(BokehDeprecationWarning, match=r"server_session\(\)"):
        selected = server_session(model, session_id="session", url="https://example.test/app", resources=None)
    assert model.id in selected
    assert 'data-bokeh-root="root"' in selected


def test_server_result_is_deterministic_structured_and_selective() -> None:
    root = CustomJS(code="server")
    result = embed_server(
        "https://example.test/app/",
        session_id="session",
        roots={"detail": root},
        arguments={"z": "2", "a": "1"},
        headers={"X-Test": "yes"},
    )

    assert result.source["url"] == "https://example.test/app"
    assert result.source["arguments"] == {"a": "1", "z": "2"}
    assert result.roots[0].to_dict() == {"key": "detail", "model_id": root.id}


def test_server_result_infers_its_resource_root_url() -> None:
    result = embed_server("https://example.test/app")
    fragment = result.fragment(resources="server")

    assert "https://example.test/app/static/js/bokeh.min.js" in fragment.html
    assert "https://example.test/app/static/js/bokeh-api.min.js" in fragment.html
    assert result.requires == ResourceRequirements.dynamic_server()
    assert len(result.fragment(resources="none").mounts) == 1

    relative = embed_server("https://example.test/app", relative_urls=True).fragment(resources="server")
    assert 'src="/app/static/js/bokeh.min.js' in relative.html
    assert 'src="https://example.test/app/static/js' not in relative.html

    authenticated = embed_server(
        "https://example.test/app", headers={"Authorization": "Bearer token"}, with_credentials=True,
    )
    assert authenticated.source["headers"] == {"Authorization": "Bearer token"}
    assert authenticated.source["credentials"] == "include"


@pytest.mark.parametrize(
    ("field", "value", "message"),
    [
        ("session_id", "", "session_id must be a non-empty string"),
        ("session_id", 1, "session_id must be a non-empty string"),
        ("token", {}, "token must be a non-empty string"),
        ("relative_urls", "yes", "relative_urls must be a boolean"),
    ],
)
def test_server_result_rejects_malformed_optional_fields(field: str, value: Any, message: str) -> None:
    result = embed_server("https://example.test/app").to_dict()
    result["source"][field] = value

    with pytest.raises(EmbedValidationError, match=message):
        EmbedResult.from_dict(result)
