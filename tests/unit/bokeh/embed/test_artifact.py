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
import pytest

# Bokeh imports
from bokeh import __version__
from bokeh.document import Document
from bokeh.embed import (
    ArtifactRoot,
    ArtifactValidationError,
    EmbedArtifact,
    EmbedCompileError,
    EmbedMigrationError,
    EmbedSpec,
    ResourceAssetRequirement,
    ResourceConflictError,
    ResourcePolicy,
    autoload_static,
    components,
    embed,
    embed_server,
    file_html,
    json_item,
    server_document,
    server_session,
)
from bokeh.embed.resources import ExtensionRequirement, ResourceRequirements
from bokeh.io import save
from bokeh.model import Model
from bokeh.models import Button, CustomJS, DataTable
from bokeh.plotting import figure
from bokeh.resources import CDN
from bokeh.util.compiler import JavaScript

FIXTURE_PATH = Path(__file__).parents[4] / "bokehjs" / "test" / "unit" / "embed" / "artifact_fixtures.json"


def _fixture(name: str) -> dict:
    data = json.loads(FIXTURE_PATH.read_text())
    assert data["schema"] == "bokeh.embed.fixtures/v1"
    return next(case["artifact"] for case in data["cases"] if case["name"] == name)


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


def test_compiler_uses_structural_roots_and_graph_minimal_serialization() -> None:
    artifact = embed({"primary": CustomJS(code="primary"), "secondary": CustomJS(code="secondary")})

    assert [root.to_dict() for root in artifact.roots] == [
        {"key": "primary", "document": 0, "root": 0},
        {"key": "secondary", "document": 0, "root": 1},
    ]
    roots = artifact.source["documents"][0]["roots"]
    assert "id" not in roots[0]
    assert "id" not in roots[1]
    assert artifact.metadata["compiler"]["static_model_ids"] == "graph-minimal"


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


@pytest.mark.parametrize("value", [float("nan"), float("inf"), 2**53, 1e20, 1e21])
def test_artifact_rejects_numbers_that_javascript_cannot_fingerprint(value: float | int) -> None:
    artifact = embed(CustomJS(code="return"))
    with pytest.raises(ArtifactValidationError, match=r"finite|safe integer"):
        EmbedArtifact(artifact.source, artifact.roots, artifact.requires, {"value": value})


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
            model_id = value.get("id")
            if value.get("type") == "object" and isinstance(model_id, str):
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
    actual = EmbedArtifact(original.source, original.roots, original.requires, {"id": model_id})
    normalized_lookalike = EmbedArtifact(original.source, original.roots, original.requires, {"id": "model-0"})

    assert actual.fingerprint != normalized_lookalike.fingerprint


def test_artifact_round_trip_validates_fingerprint_and_schema() -> None:
    artifact = embed(_plot())
    assert EmbedArtifact.from_json(artifact.to_json_string()) == artifact

    invalid = artifact.to_dict()
    invalid["fingerprint"] = "wrong"
    with pytest.raises(ArtifactValidationError, match="fingerprint mismatch"):
        EmbedArtifact.from_dict(invalid)

    invalid = artifact.to_dict()
    invalid["schema"] = "bokeh.embed/v2"
    with pytest.raises(ArtifactValidationError, match="unsupported embedding artifact schema"):
        EmbedArtifact.from_dict(invalid)

    invalid = artifact.to_dict()
    invalid.pop("fingerprint")
    with pytest.raises(ArtifactValidationError, match="fingerprint must be a non-empty string"):
        EmbedArtifact.from_dict(invalid)

    invalid = artifact.to_dict()
    invalid["buffers"] = []
    with pytest.raises(ArtifactValidationError, match=r"not part of bokeh\.embed/v1"):
        EmbedArtifact.from_dict(invalid)

    invalid = artifact.to_dict()
    invalid["source"]["documents"].append(invalid["source"]["documents"][0])
    with pytest.raises(ArtifactValidationError, match="exactly one source document"):
        EmbedArtifact.from_dict(invalid)


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
    ],
)
def test_artifact_python_validation_matches_browser_contract(
    mutate: Callable[[dict[str, Any]], None], message: str,
) -> None:
    value = embed(CustomJS(code="root")).to_dict()
    mutate(value)

    with pytest.raises(ArtifactValidationError, match=message):
        EmbedArtifact.from_dict(value)


def test_shared_fixture_decodes_in_python_without_root_ids() -> None:
    fixture = deepcopy(_fixture("standalone-keyed-roots"))
    assert EmbedArtifact.from_dict(fixture).fingerprint == fixture.pop("fingerprint")
    fixture["bokeh_version"] = __version__
    fixture["source"]["documents"][0]["version"] = __version__
    artifact = EmbedArtifact(
        source=fixture["source"],
        roots=tuple(ArtifactRoot.from_dict(root) for root in fixture["roots"]),
        requires=ResourceRequirements.from_dict(fixture["requires"]),
        metadata=fixture["metadata"],
        bokeh_version=fixture["bokeh_version"],
    )
    document = Document.from_json(artifact.source["documents"][0])
    roots = {root.key: document.roots[root.root] for root in artifact.roots}

    assert isinstance(roots["primary"], CustomJS)
    assert roots["primary"].code == "primary"
    assert roots["secondary"].code == "secondary"


def test_named_inputs_preserve_order_and_restore_document_title() -> None:
    document = Document(title="Original")
    document.add_root(CustomJS(code="one"))
    document.add_root(CustomJS(code="two"))
    artifact = embed({"one": document.roots[0], "two": document.roots[1]})

    assert [root.key for root in artifact.roots] == ["one", "two"]
    assert document.title == "Original"


def test_compiler_rejects_empty_duplicate_and_python_callback_inputs() -> None:
    with pytest.raises(EmbedCompileError, match="no root"):
        embed(Document())

    model = CustomJS(code="root")
    with pytest.raises(EmbedCompileError, match="more than one"):
        embed([model, model])

    plot = _plot()
    plot.on_change("visible", lambda attr, old, new: None)
    with pytest.raises(EmbedCompileError, match="Python callbacks"):
        embed(plot, callback_policy="error")


def test_embed_spec_rejects_inconsistent_public_inputs() -> None:
    model = CustomJS(code="root")
    with pytest.raises(EmbedCompileError, match="equal lengths"):
        EmbedSpec((model,), (), "single")
    with pytest.raises(EmbedCompileError, match="keys must be unique"):
        EmbedSpec((model, CustomJS(code="other")), ("root", "root"), "sequence")
    with pytest.raises(EmbedCompileError, match="serialization must be"):
        EmbedSpec((model,), ("root",), "single", serialization="typo")  # type: ignore[arg-type]


def test_resource_requirements_are_exact_for_representative_models() -> None:
    assert embed(_plot()).requires.components == ("bokeh/core", "bokeh/api")
    assert embed(Button()).requires.components == ("bokeh/core", "bokeh/widgets", "bokeh/api")
    assert embed(DataTable()).requires.components == ("bokeh/core", "bokeh/widgets", "bokeh/tables", "bokeh/api")

    webgl = _plot()
    webgl.output_backend = "webgl"
    assert "bokeh/webgl" in embed(webgl).requires.components


def test_compiler_captures_inline_custom_model_bundle(
    monkeypatch: pytest.MonkeyPatch, cleanup_extensions: None,
) -> None:
    class InlineCustomJS(CustomJS):
        __implementation__ = JavaScript("export const value = 1")

    monkeypatch.setattr("bokeh.embed.resources.bundle_models", lambda models: "compiled-custom-models")
    artifact = embed(InlineCustomJS(code="return value"))
    requirement = next(
        extension for extension in artifact.requires.extensions if extension.name == "bokeh.custom-models"
    )
    assert requirement.assets[0].content == "compiled-custom-models"
    assert artifact.page(resources="cdn").index("compiled-custom-models") > artifact.page(resources="cdn").index("bokeh-api")
    with pytest.raises(EmbedMigrationError, match="custom extension"):
        components(InlineCustomJS(code="return value"))


def test_compiler_adapts_external_and_legacy_package_assets(
    monkeypatch: pytest.MonkeyPatch, tmp_path: Path, cleanup_extensions: None,
) -> None:
    class ExternalCustomJS(CustomJS):
        __javascript__ = ["https://example.test/extension.js"]
        __css__ = ["https://example.test/extension.css"]

    package = tmp_path / "legacy-package.js"
    package.write_text("globalThis.legacy_package = true")
    monkeypatch.setattr(
        "bokeh.embed.resources._bundle_extensions",
        lambda objs, resources: [SimpleNamespace(artifact_path=package)],
    )

    artifact = embed(ExternalCustomJS(code="external"))
    assets = [
        asset
        for extension in artifact.requires.extensions
        for asset in extension.assets
    ]
    assert ResourceAssetRequirement("script", url="https://example.test/extension.js") in assets
    assert ResourceAssetRequirement("style", url="https://example.test/extension.css") in assets
    assert any(asset.content is not None and "legacy_package" in asset.content for asset in assets)


def test_resource_policies_resolve_none_cdn_inline_and_offline_conflicts() -> None:
    with pytest.raises(ResourceConflictError, match="unknown resource policy"):
        ResourcePolicy.build("unknown")

    requirements = ResourceRequirements(("bokeh/core", "bokeh/widgets"))
    assert ResourcePolicy(mode="none").resolve(requirements).assets == ()

    cdn = ResourcePolicy(mode="cdn").resolve(requirements)
    assert [asset.url for asset in cdn.assets] == [
        f"https://cdn.bokeh.org/bokeh/dev/bokeh-{__version__.split('+')[0]}.min.js",
        f"https://cdn.bokeh.org/bokeh/dev/bokeh-widgets-{__version__.split('+')[0]}.min.js",
    ]

    inline = ResourcePolicy(mode="inline", base_dir=FIXTURE_PATH.parents[3] / "build").resolve(
        ResourceRequirements(("bokeh/core",)),
    )
    assert len(inline.assets) == 1
    assert inline.assets[0].content is not None

    server = ResourcePolicy(mode="server", root_url="https://example.test/app/").resolve(
        ResourceRequirements(("bokeh/core", "bokeh/api")),
    )
    assert [asset.url for asset in server.assets] == [
        "https://example.test/app/static/js/bokeh.min.js",
        "https://example.test/app/static/js/bokeh-api.min.js",
    ]

    build_dir = FIXTURE_PATH.parents[3] / "build"
    relative = ResourcePolicy(mode="relative", root_dir=build_dir, base_dir=build_dir).resolve(
        ResourceRequirements(("bokeh/core",)),
    )
    assert relative.assets[0].url == "js/bokeh.min.js"
    absolute = ResourcePolicy(mode="absolute", base_dir=build_dir).resolve(ResourceRequirements(("bokeh/core",)))
    assert absolute.assets[0].url == str(build_dir / "js" / "bokeh.min.js")

    external = ExtensionRequirement("example", (ResourceAssetRequirement("script", url="https://example.test/ext.js"),))
    with pytest.raises(ResourceConflictError, match="offline policy"):
        ResourcePolicy(mode="offline", base_dir=FIXTURE_PATH.parents[3] / "build").resolve(
            ResourceRequirements(extensions=(external,)),
        )


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
        ResourcePolicy(mode="inline", external_only=True)
    with pytest.raises(ResourceConflictError, match="integrity"):
        ResourcePolicy(mode="server", integrity=True)

    resolved = ResourcePolicy(mode="cdn", integrity=True).resolve(
        ResourceRequirements(("bokeh/core",)), bokeh_version="3.8.0",
    )
    assert resolved.assets[0].integrity is not None
    assert resolved.assets[0].integrity.startswith("sha384-")
    assert resolved.assets[0].crossorigin == "anonymous"

    assert "bokeh-3.8.0" in resolved.assets[0].url

    external = ExtensionRequirement("example", (
        ResourceAssetRequirement("script", url="https://example.test/extension.js"),
    ))
    with pytest.raises(ResourceConflictError, match="integrity policy requires an SRI hash"):
        ResourcePolicy(mode="cdn", integrity=True).resolve(
            ResourceRequirements(extensions=(external,)), bokeh_version="3.8.0",
        )

    artifact = embed(_plot())
    with pytest.raises(ValueError, match=r"artifact\.external"):
        artifact.fragment(resources=ResourcePolicy(mode="cdn", external_only=True), bootstrap_url="/bootstrap.js")


def test_typed_renderers_cover_fragment_page_external_and_mime(tmp_path: Path) -> None:
    artifact = embed({"summary": _plot(), "detail": _plot()})
    fragment = artifact.fragment(resources="none")

    assert list(fragment.divs) == ["summary", "detail"]
    assert "data-bokeh-root=\"summary\"" in fragment.html
    assert "application/vnd.bokeh.embed+json" in fragment.script
    assert "data-bokeh-artifact-bootstrap" in fragment.script
    assert f'data-bokeh-artifact="{artifact.fingerprint}"' in fragment.script
    assert "RenderItem" not in fragment.script
    assert " id=" not in fragment.html
    assert fragment.resources.policy.mode == "none"
    assert fragment.resources.requirements == artifact.requires
    assert fragment.resources.assets == ()
    assert fragment.build_fingerprint == artifact.fragment(resources="none").build_fingerprint
    assert fragment.build_fingerprint != artifact.fragment(resources="cdn").build_fingerprint

    page = artifact.page(resources="none", title="Artifact page")
    assert "<title>Artifact page</title>" in page
    assert page.count("data-bokeh-root=") == 2

    template = tmp_path / "artifact.html"
    template.write_text("{% block title %}Path template{% endblock %}")
    assert "Path template" in artifact.page(resources="none", template=template)

    external = artifact.external("/assets/plot.json", resources="none")
    assert external.payload == artifact.to_json_string()
    assert "mount_artifact_declaration" in external.bootstrap
    assert "fetch(" not in external.bootstrap
    assert "data-bokeh-payload-url=\"/assets/plot.json\"" in external.html
    assert external.build_fingerprint == artifact.external("/assets/plot.json", resources="none").build_fingerprint

    assert tuple(field.name for field in fields(fragment)) == (
        "artifact", "mounts", "script", "resources", "build_fingerprint", "html",
    )
    assert tuple(field.name for field in fields(external)) == (
        "artifact", "payload_url", "mounts", "bootstrap", "resources", "build_fingerprint", "html",
    )

    mime = artifact._repr_mimebundle_()
    assert mime["application/vnd.bokeh.embed+json"] == artifact.to_dict()
    assert "text/html" in mime


def test_external_bootstrap_renderers_preserve_csp_nonce() -> None:
    artifact = embed(CustomJS(code="root"))
    policy = ResourcePolicy(mode="none", nonce="artifact-nonce")

    fragment = artifact.fragment(resources=policy, bootstrap_url="/bootstrap.js")
    page = artifact.page(resources=policy, bootstrap_url="/bootstrap.js")
    external = artifact.external(
        "/artifact.json", resources=policy, bootstrap_url="/bootstrap.js",
    )

    assert 'nonce="artifact-nonce"' in fragment.script
    assert 'nonce="artifact-nonce"' in page
    assert 'nonce="artifact-nonce"' in external.bootstrap


def test_retained_facades_delegate_and_preserve_useful_shapes() -> None:
    plot = _plot()
    script, div = components(plot)
    assert "bokeh.embed/v1" in script
    assert "data-bokeh-root=\"root\"" in div

    script, divs = components({"left": _plot(), "right": _plot()})
    assert list(divs) == ["left", "right"]
    assert "Bokeh.mount" in script

    html = file_html(plot, resources=CDN, title="Facade")
    assert "bokeh.embed/v1" in html
    assert "<title>Facade</title>" in html


def test_save_and_server_facades_use_artifact_routes(tmp_path: Path) -> None:
    filename = tmp_path / "saved.html"
    result = save(_plot(), filename=filename, resources=CDN, title="Saved artifact")
    assert Path(result) == filename
    assert "bokeh.embed/v1" in filename.read_text()

    new_session = server_document("https://example.test/app", resources=None)
    assert '\"kind\":\"server\"' in new_session
    assert "mount_artifact_declaration" in new_session
    assert "/autoload.js" not in new_session
    with_resources = server_document("https://example.test/app")
    assert "https://example.test/app/static/js/bokeh.min.js" in with_resources
    assert "https://example.test/app/static/js/bokeh-api.min.js" in with_resources

    model = _plot()
    selected = server_session(model, session_id="session", url="https://example.test/app", resources=None)
    assert model.id in selected
    assert 'data-bokeh-root="root"' in selected


def test_removed_contracts_raise_actionable_migration_errors() -> None:
    plot = _plot()
    with pytest.raises(EmbedMigrationError, match=r"embed\(model\)\.external"):
        autoload_static(plot, CDN, "/assets/plot.json")
    with pytest.raises(EmbedMigrationError, match=r"embed\(model\)\.to_json"):
        json_item(plot)
    with pytest.raises(EmbedMigrationError, match="fragment"):
        components(plot, False)
    with pytest.raises(EmbedMigrationError, match="fragment"):
        components(plot, wrap_script=False)


def test_server_artifact_is_deterministic_structured_and_selective() -> None:
    root = CustomJS(code="server")
    artifact = embed_server(
        "https://example.test/app/",
        session_id="session",
        roots={"detail": root},
        arguments={"z": "2", "a": "1"},
        headers={"X-Test": "yes"},
    )

    assert artifact.source["url"] == "https://example.test/app"
    assert artifact.source["arguments"] == {"a": "1", "z": "2"}
    assert artifact.roots[0].to_dict() == {"key": "detail", "model_id": root.id}
    assert artifact.requires == ResourceRequirements.dynamic_server()
    assert len(artifact.fragment(resources="none").mounts) == 1

    with pytest.raises(EmbedCompileError, match="mutually exclusive"):
        embed_server("https://example.test/app", headers={"X": "1"}, with_credentials=True)
