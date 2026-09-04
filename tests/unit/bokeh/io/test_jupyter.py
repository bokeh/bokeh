from __future__ import annotations

# Standard library imports
import json
import sys
from pathlib import Path
from typing import Literal

# External imports
import pytest

# Bokeh imports
from bokeh import __version__
from bokeh.embed import embed_server
from bokeh.embed.notebook import notebook_content
from bokeh.embed.resources import (
    ResolvedResource,
    ResolvedResources,
    ResourcePolicy,
    ResourceRequirements,
)
from bokeh.plotting import figure

# Module under test
import bokeh.io.jupyter as m # isort:skip


def _resolved(mode: Literal["cdn", "none"] = "cdn") -> ResolvedResources:
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
    manifest = json.loads((Path(m.__file__).parents[1] / "jupyter/protocol.json").read_text())

    assert m.PROTOCOL_VERSION == manifest["version"]
    assert m.ARTIFACT_MIME_TYPE == manifest["mime_types"]["artifact"]
    assert m.DISPLAY_MIME_TYPE == manifest["mime_types"]["display"]
    assert m.FILE_MIME_TYPE == manifest["mime_types"]["file"]
    assert m.RESOURCES_MIME_TYPE == manifest["mime_types"]["resources"]
    assert m.NOTEBOOK_COMM_TARGET == manifest["comm_targets"]["notebook"]
    assert m.RESOURCE_COMM_TARGET == manifest["comm_targets"]["resources"]


def test_resource_payload_carries_explicit_policy_requirements_and_assets() -> None:
    resolved = _resolved()
    payload = m._resource_payload(resolved, 1234)

    assert payload["protocol_version"] == m.PROTOCOL_VERSION
    assert payload["kind"] == "resources"
    assert payload["mode"] == "cdn"
    assert payload["requirements"] == {"components": ["bokeh/core"], "extensions": []}
    assert payload["policy"]["mode"] == "cdn"
    assert payload["load_timeout"] == 1234
    assert payload["artifacts"][0].get("integrity") == "sha384-test"
    assert payload["artifacts"][1].get("nonce") == "nonce"
    assert all("value" not in artifact for artifact in payload["artifacts"])


def test_resource_identity_ignores_load_timeout_but_not_policy() -> None:
    assert m._resource_payload(_resolved(), 1000)["resource_id"] == m._resource_payload(_resolved(), 9000)["resource_id"]
    assert m._resource_payload(_resolved("cdn"), 1000)["resource_id"] != m._resource_payload(_resolved("none"), 1000)["resource_id"]


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

    artifact_ids = [m._resource_artifact_ids(item)[0] for item in resolved]
    resource_ids = [m._resource_payload(item, 1000)["resource_id"] for item in resolved]
    assert len(set(artifact_ids)) == len(artifact_ids)
    assert len(set(resource_ids)) == len(resource_ids)


def test_resource_subset_and_portable_owner_are_consistent() -> None:
    resolved = _resolved()
    ids = m._resource_artifact_ids(resolved)
    subset = m._resource_asset_subset(resolved, {ids[1]})
    payload = m._resource_payload(resolved, 5000, assets=subset)
    javascript = m._resource_javascript(payload, subset)

    assert subset == (resolved.assets[1],)
    assert payload["artifacts"][0]["kind"] == "css"
    assert ".bk-test{}" in javascript
    assert "root.Bokeh?.embed?.resource_loader" in javascript
    assert "loader.ensure" in javascript
    assert "data-bokeh-notebook-resource" in javascript
    assert "_bokeh_notebook_" not in javascript


def test_display_payload_references_artifact_without_copying_graph() -> None:
    artifact, _ = notebook_content(figure(), live=True)
    payload = m._display_payload(artifact, "resource", "view", live_id="live")

    assert payload == {
        "protocol_version": m.PROTOCOL_VERSION,
        "kind": "artifact",
        "resource_id": "resource",
        "bokeh_version": m._bokehjs_version(__version__),
        "python_version": __version__,
        "artifact_fingerprint": artifact.fingerprint,
        "source_kind": "standalone",
        "view_id": "view",
        "connect_timeout": 10_000,
        "live_id": "live",
    }
    assert "documents" not in payload
    assert "render_items" not in payload


def test_display_payload_keeps_managed_application_identity_and_url_together() -> None:
    artifact = embed_server("http://127.0.0.1:4312/app")
    with pytest.raises(ValueError, match="application_id and application_url"):
        m._display_payload(artifact, "resource", "view", application_id="application")


def test_file_payload_only_accepts_safe_notebook_relative_paths() -> None:
    assert m._file_payload("reports/plot.html") == {
        "protocol_version": m.PROTOCOL_VERSION,
        "kind": "file",
        "path": "reports/plot.html",
    }
    for path in (
        "", "/private/output.html", "C:/private/output.html", "../output.html",
        "reports/../../output.html", r"reports\output.html",
    ):
        with pytest.raises(ValueError, match="safe paths relative"):
            m._file_payload(path)


def test_notebook_info_is_bounded_and_has_no_renderer_handshake() -> None:
    info = m.notebook_info()

    assert info["bokeh_version"] == __version__
    assert info["python_version"] == f"{sys.version_info.major}.{sys.version_info.minor}.{sys.version_info.micro}"
    assert info["python_executable"] == sys.executable
    assert info["bokeh_package_path"] == str(Path(m.__file__).parents[1])
    assert info["protocol_version"] == m.PROTOCOL_VERSION
    assert info["artifact_mime_type"] == m.ARTIFACT_MIME_TYPE
    assert info["display_mime_type"] == m.DISPLAY_MIME_TYPE
    assert info["file_mime_type"] == m.FILE_MIME_TYPE
    assert info["resources_mime_type"] == m.RESOURCES_MIME_TYPE
    assert "frontend_renderer" not in info
    assert "document_mime_type" not in info
    html = info._repr_html_()
    assert "Renderer negotiated per output" in html
    assert "Artifact MIME type" in html
    assert "data:image/svg+xml;base64," in html


def test_notebook_info_html_escapes_diagnostic_values() -> None:
    info = m.notebook_info()
    info["bokeh_version"] = '<script type="text/javascript">alert(1)</script>'

    html = info._repr_html_()

    assert '<script type="text/javascript">' not in html
    assert "&lt;script type=&#34;text/javascript&#34;&gt;alert(1)&lt;/script&gt;" in html
