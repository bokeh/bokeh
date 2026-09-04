from __future__ import annotations

# Standard library imports
import json
from pathlib import Path

# External imports
import pytest

# Bokeh imports
import bokeh

ROOT = Path(__file__).parents[4]
FRONTEND = ROOT / "src" / "bokeh" / "jupyter" / "frontend"
requires_source = pytest.mark.skipif(not FRONTEND.is_dir(), reason="frontend source tree was removed")


@requires_source
def test_frontend_plugin_is_only_composition_root() -> None:
    plugin = FRONTEND / "src" / "plugin.ts"
    assert len(plugin.read_text().splitlines()) < 40
    for module in ("context.ts", "kernel.ts", "renderers.ts", "notebook.ts", "export.ts", "runtime.ts", "protocol.ts"):
        assert (FRONTEND / "src" / module).is_file()


@requires_source
def test_composite_build_runs_protocol_and_source_tests_before_packaging() -> None:
    package = json.loads((FRONTEND / "package.json").read_text())
    build = package["scripts"]["build"]
    assert "check:protocol" in build
    assert "test:source" in build
    assert build.index("test:source") < build.index("jupyter labextension build")
    assert package["scripts"]["test:source"] == "vitest run"
    assert "vitest" in package["devDependencies"]
    assert "jsdom" in package["devDependencies"]


@requires_source
def test_frontend_has_direct_failure_disposal_and_buffer_coverage() -> None:
    tests = "\n".join(path.read_text() for path in sorted((FRONTEND / "test").glob("*.test.ts")))
    assert "cancels and disposes a mount before readiness" in tests
    assert "bounds pre-render patch history" in tests
    assert "rejects the removed document-data lifecycle" in tests
    assert "explicit resource requirements and policy" in tests


@requires_source
def test_runtime_uses_common_mount_and_revisioned_receiver_only() -> None:
    runtime = (FRONTEND / "src" / "runtime.ts").read_text()
    notebook = (ROOT / "bokehjs" / "src" / "lib" / "embed" / "notebook.ts").read_text()
    assert "runtime.mount(" in runtime
    assert "runtime.when_mounted(" in runtime
    assert "when_mounted" in runtime
    assert "publish_mount_error" in runtime
    assert "view_lookup" in runtime
    assert "create_notebook_patch_receiver" in runtime
    assert "embed_items_notebook" not in runtime
    assert "documentData" not in runtime
    assert "Receiver" not in notebook
    assert "document.apply_json_patch" in notebook


@requires_source
def test_generated_notebook_sources_have_no_private_loader_or_global_view_registry() -> None:
    sources = "\n".join(
        path.read_text()
        for path in [
            FRONTEND / "src" / "runtime.ts",
            ROOT / "src" / "bokeh" / "core" / "_templates" / "portable_resources.js.jinja",
        ]
    )
    for stale in (
        "Bokeh.index",
        "Bokeh.documents",
        "view_manager",
        "_bokeh_notebook_artifacts",
        "_bokeh_notebook_resource_promises",
        "_bokeh_notebook_core_load",
    ):
        assert stale not in sources
    assert "resource_loader" in sources


@requires_source
def test_export_frontend_uses_per_request_correlation() -> None:
    source = (FRONTEND / "src" / "export.ts").read_text()
    assert "randomUUID" in source
    assert "export_id" in source
    assert "bokeh-notebook/export/" in source
    assert "window.open" in source


@requires_source
def test_anywidget_history_is_revisioned_and_bounded() -> None:
    source = (FRONTEND / "src" / "anywidget.ts").read_text()
    assert "ANYWIDGET_MAX_PENDING_PATCHES = 64" in source
    assert "ANYWIDGET_MAX_PENDING_BYTES = 8 * 1024 * 1024" in source
    assert 'model.send({kind: "resync"})' in source
    assert "Number.isSafeInteger(data.revision)" in source


@requires_source
def test_notebook_browser_automation_is_playwright_only() -> None:
    source = (ROOT / "src" / "bokeh" / "io" / "jupyter_export.py").read_text()
    assert 'values=["playwright"]' in source
    assert "Selenium" not in source
    assert "selenium" not in source


def test_wheel_contains_built_notebook_adapters_without_legacy_protocol() -> None:
    package = Path(bokeh.__file__).parent / "jupyter"
    anywidget = (package / "anywidget.js").read_text()
    labextension = package / "labextension"
    javascript = "\n".join(path.read_text() for path in sorted((labextension / "static").glob("*.js")))

    assert json.loads((labextension / "package.json").read_text())["name"] == "@bokeh/bokeh-jupyter"
    assert "application/vnd.bokeh.display+json" in javascript
    assert "PAYLOAD_INVALID" in anywidget
    assert "application/vnd.bokeh.document+json" not in anywidget + javascript
    assert "embed_items_notebook" not in anywidget + javascript
    assert "Bokeh.index" not in anywidget + javascript
    assert "Bokeh.documents" not in anywidget + javascript
    assert "view_manager" not in anywidget + javascript
    assert "_bokeh_notebook_artifacts" not in anywidget + javascript
