from __future__ import annotations

# Standard library imports
import json
import sys
import types
from pathlib import Path
from unittest.mock import patch

# External imports
import pytest

# Bokeh imports
import bokeh.io.notebook as notebook
from bokeh import __version__
from bokeh.embed.notebook import notebook_content
from bokeh.embed.resources import (
    ResolvedResource,
    ResolvedResources,
    ResourcePolicy,
    ResourceRequirements,
)
from bokeh.io.jupyter import (
    ARTIFACT_MIME_TYPE,
    DISPLAY_MIME_TYPE,
    FILE_MIME_TYPE,
    NOTEBOOK_COMM_TARGET,
    PROTOCOL_VERSION,
    RESOURCE_COMM_TARGET,
    RESOURCES_MIME_TYPE,
    _bokehjs_version,
    display_payload,
    file_payload,
    notebook_info,
    resource_artifact_ids,
    resource_asset_subset,
    resource_javascript,
    resource_payload,
)
from bokeh.io.jupyter_app import _authorized_origin
from bokeh.plotting import figure


@pytest.fixture(autouse=True)
def reset_notebook_resources() -> None:
    notebook._reset_notebook_resources()


def _resolved(mode: str = "cdn") -> ResolvedResources:
    return ResolvedResources(
        ResourceRequirements(),
        ResourcePolicy(mode=mode),
        "4.0.0",
        (
            ResolvedResource("script", url="https://cdn.example/bokeh.js", integrity="sha384-test", crossorigin="anonymous"),
            ResolvedResource("style", content=".bk-test{}", nonce="nonce"),
        ),
    )


def test_python_protocol_constants_come_from_the_packaged_manifest() -> None:
    manifest = json.loads((Path(notebook.__file__).parents[1] / "jupyter/protocol.json").read_text())

    assert PROTOCOL_VERSION == manifest["version"]
    assert ARTIFACT_MIME_TYPE == manifest["mime_types"]["artifact"]
    assert DISPLAY_MIME_TYPE == manifest["mime_types"]["display"]
    assert FILE_MIME_TYPE == manifest["mime_types"]["file"]
    assert RESOURCES_MIME_TYPE == manifest["mime_types"]["resources"]
    assert NOTEBOOK_COMM_TARGET == manifest["comm_targets"]["notebook"]
    assert RESOURCE_COMM_TARGET == manifest["comm_targets"]["resources"]


def test_resource_payload_carries_explicit_policy_requirements_and_assets() -> None:
    resolved = _resolved()
    payload = resource_payload(resolved, 1234)

    assert payload["protocol_version"] == PROTOCOL_VERSION
    assert payload["kind"] == "resources"
    assert payload["mode"] == "cdn"
    assert payload["requirements"] == {"components": ["bokeh/core"], "extensions": []}
    assert payload["policy"]["mode"] == "cdn"
    assert payload["load_timeout"] == 1234
    assert payload["artifacts"][0]["integrity"] == "sha384-test"
    assert payload["artifacts"][1]["nonce"] == "nonce"
    assert all("value" not in artifact for artifact in payload["artifacts"])


def test_resource_identity_ignores_load_timeout_but_not_policy() -> None:
    assert resource_payload(_resolved(), 1000)["resource_id"] == resource_payload(_resolved(), 9000)["resource_id"]
    assert resource_payload(_resolved("cdn"), 1000)["resource_id"] != resource_payload(_resolved("none"), 1000)["resource_id"]


def test_resource_identity_includes_complete_emitted_security_and_module_policy() -> None:
    requirements = ResourceRequirements()
    policies = [
        ResourcePolicy(mode="cdn", nonce="first"),
        ResourcePolicy(mode="cdn", nonce="second"),
        ResourcePolicy(mode="cdn", crossorigin="anonymous"),
        ResourcePolicy(mode="cdn", crossorigin="use-credentials"),
    ]
    assets = [
        ResolvedResource("script", url="https://cdn.example/extension.js", nonce="first"),
        ResolvedResource("script", url="https://cdn.example/extension.js", nonce="second"),
        ResolvedResource("script", url="https://cdn.example/extension.js", integrity="sha384-one", crossorigin="anonymous"),
        ResolvedResource("script", url="https://cdn.example/extension.js", integrity="sha384-two", crossorigin="anonymous", module=True),
    ]
    resolved = [
        ResolvedResources(requirements, policy, "4.0.0", (asset,))
        for policy, asset in zip(policies, assets, strict=True)
    ]

    artifact_ids = [resource_artifact_ids(item)[0] for item in resolved]
    resource_ids = [resource_payload(item, 1000)["resource_id"] for item in resolved]
    assert len(set(artifact_ids)) == len(artifact_ids)
    assert len(set(resource_ids)) == len(resource_ids)


@pytest.mark.parametrize("policy", [
    ResourcePolicy(mode="inline"),
    ResourcePolicy(mode="offline"),
    ResourcePolicy(mode="cdn", nonce="csp-nonce", crossorigin="anonymous"),
    ResourcePolicy(mode="none"),
])
def test_notebook_resource_resolution_preserves_explicit_host_policy(policy: ResourcePolicy) -> None:
    artifact, _ = notebook_content(figure())
    with patch("bokeh.io.notebook._publish_resource_record", return_value="resource") as publish:
        assert notebook._ensure_notebook_resources(artifact, policy) == "resource"

    resolved = publish.call_args.args[0]
    assert resolved.policy is policy
    if policy.mode == "none":
        assert resolved.assets == ()


def test_resource_subset_and_portable_owner_are_consistent() -> None:
    resolved = _resolved()
    ids = resource_artifact_ids(resolved)
    subset = resource_asset_subset(resolved, {ids[1]})
    payload = resource_payload(resolved, 5000, assets=subset)
    javascript = resource_javascript(payload, subset)

    assert subset == (resolved.assets[1],)
    assert payload["artifacts"][0]["kind"] == "css"
    assert ".bk-test{}" in javascript
    assert "root.Bokeh?.embed?.resource_loader" in javascript
    assert "loader.ensure" in javascript
    assert "data-bokeh-notebook-resource" in javascript
    assert "_bokeh_notebook_" not in javascript


def test_display_payload_references_artifact_without_copying_graph() -> None:
    artifact, _ = notebook_content(figure(), live=True)
    payload = display_payload(artifact, "resource", "view", live_id="live")

    assert payload == {
        "protocol_version": PROTOCOL_VERSION,
        "kind": "artifact",
        "resource_id": "resource",
        "bokeh_version": _bokehjs_version(__version__),
        "python_version": __version__,
        "artifact_fingerprint": artifact.fingerprint,
        "source_kind": "standalone",
        "view_id": "view",
        "connect_timeout": 10_000,
        "live_id": "live",
    }
    assert "documents" not in payload
    assert "render_items" not in payload


def test_file_payload_only_accepts_safe_notebook_relative_paths() -> None:
    assert file_payload("reports/plot.html") == {
        "protocol_version": PROTOCOL_VERSION,
        "kind": "file",
        "path": "reports/plot.html",
    }
    for path in (
        "", "/private/output.html", "C:/private/output.html", "../output.html",
        "reports/../../output.html", r"reports\output.html",
    ):
        with pytest.raises(ValueError, match="safe paths relative"):
            file_payload(path)


def test_notebook_info_is_bounded_and_has_no_renderer_handshake() -> None:
    info = notebook_info()

    assert info["bokeh_version"] == __version__
    assert info["python_version"] == f"{sys.version_info.major}.{sys.version_info.minor}.{sys.version_info.micro}"
    assert info["python_executable"] == sys.executable
    assert info["bokeh_package_path"] == str(Path(notebook.__file__).parents[1])
    assert info["protocol_version"] == PROTOCOL_VERSION
    assert info["artifact_mime_type"] == ARTIFACT_MIME_TYPE
    assert info["display_mime_type"] == DISPLAY_MIME_TYPE
    assert info["file_mime_type"] == FILE_MIME_TYPE
    assert info["resources_mime_type"] == RESOURCES_MIME_TYPE
    assert "frontend_renderer" not in info
    assert "document_mime_type" not in info
    html = info._repr_html_()
    assert "Renderer negotiated per output" in html
    assert "Artifact MIME type" in html
    assert "data:image/svg+xml;base64," in html


def test_marimo_and_colab_detection_are_host_capabilities(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setitem(sys.modules, "google.colab", object())
    assert notebook._is_colab_runtime()

    marimo = types.ModuleType("marimo")
    runtime = types.ModuleType("marimo._runtime")
    context = types.ModuleType("marimo._runtime.context")
    context.runtime_context_installed = lambda: True  # type: ignore[attr-defined]
    monkeypatch.setitem(sys.modules, "marimo", marimo)
    monkeypatch.setitem(sys.modules, "marimo._runtime", runtime)
    monkeypatch.setitem(sys.modules, "marimo._runtime.context", context)
    assert notebook._is_marimo_runtime()


def test_marimo_without_anywidget_has_actionable_install_error() -> None:
    with (
        patch("bokeh.io.notebook._is_marimo_runtime", return_value=True),
        patch("bokeh.io.notebook._anywidget_available", return_value=False),
        pytest.raises(RuntimeError, match=r"pip install bokeh\[notebook\]"),
    ):
        notebook._require_marimo_anywidget()


def test_authorized_origin_rejects_persisted_credentials() -> None:
    with pytest.raises(ValueError, match="must not contain credentials"):
        _authorized_origin("https://user:secret@example.test/notebook/")
    with pytest.raises(ValueError, match="query string or fragment"):
        _authorized_origin("https://example.test/notebook/?token=secret")
