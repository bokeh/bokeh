from __future__ import annotations

# Standard library imports
import copy
from unittest.mock import MagicMock, patch

# External imports
import nbformat
import pytest

# Bokeh imports
from bokeh.embed import embed, embed_server
from bokeh.io.jupyter import DISPLAY_MIME_TYPE, RESOURCES_MIME_TYPE, display_payload
from bokeh.io.jupyter_export import (
    _TRANSIENT_EXPORTS,
    BokehPngPreprocessor,
    _reset_export_correlation,
    _set_export_correlation,
    _store_export_snapshots,
    _take_export_snapshots,
)
from bokeh.io.notebook import _static_fallback
from bokeh.plotting import figure


@pytest.fixture(autouse=True)
def clear_transient() -> None:
    _TRANSIENT_EXPORTS.clear()


def _output(artifact=None, *, view_id: str = "view"):
    artifact = artifact or embed(figure())
    return nbformat.v4.new_output(
        "display_data",
        data={
            "text/html": artifact.fragment(resources="none").html + _static_fallback("fallback"),
            DISPLAY_MIME_TYPE: display_payload(artifact, "resources", view_id),
        },
    )


def _notebook(output=None):
    cell = nbformat.v4.new_code_cell("show(plot)", outputs=[output or _output()])
    cell.metadata["trusted"] = True
    return nbformat.v4.new_notebook(cells=[cell])


def _image() -> MagicMock:
    image = MagicMock(width=300, height=200)
    image.save.side_effect = lambda target, format: target.write(b"png")
    return image


def test_transient_snapshots_require_exact_path_and_export_correlation() -> None:
    artifact = embed(figure())
    _store_export_snapshots("folder/test.ipynb", "export-identifier-0001", [{
        "view_id": "view", "artifact_json": artifact.to_json_string(), "width": 321.4,
    }])
    resources = {"metadata": {"name": "test", "path": "/tmp/folder"}}

    assert _take_export_snapshots(resources, "wrong-identifier-001") == {}
    assert _take_export_snapshots(resources, "export-identifier-0001")["view"]["width"] == 321

    _store_export_snapshots("folder/test.ipynb", "export-identifier-0002", [{
        "view_id": "view", "artifact_json": artifact.to_json_string(), "width": 321.4,
    }], os_path="/tmp/folder/test.ipynb")
    snapshots = _take_export_snapshots(resources, "export-identifier-0002")
    assert snapshots["view"]["width"] == 321
    assert _take_export_snapshots(resources, "export-identifier-0002") == {}


def test_context_correlation_propagates_to_preprocessor_lookup() -> None:
    _store_export_snapshots("test.ipynb", "export-identifier-0003", [{"view_id": "view", "error": "failure"}])
    token = _set_export_correlation("export-identifier-0003")
    try:
        assert _take_export_snapshots({"metadata": {"name": "test"}}) == {"view": {"error": "failure"}}
    finally:
        _reset_export_correlation(token)


def test_invalid_correlation_ids_are_rejected() -> None:
    with pytest.raises(ValueError, match="correlation ID"):
        _store_export_snapshots("test.ipynb", "spaces are unsafe", [])


def test_saved_artifact_is_captured_through_common_page_and_playwright() -> None:
    notebook = _notebook()
    preprocessor = BokehPngPreprocessor(require_trusted=False)
    with (
        patch("bokeh.embed.artifact.EmbedArtifact.page", return_value="<html>artifact page</html>") as page,
        patch("bokeh.io.jupyter_export._get_screenshot_as_png_from_html", return_value=_image()) as screenshot,
    ):
        result, _ = preprocessor.preprocess(copy.deepcopy(notebook), {"output_extension": ".html", "metadata": {"name": "test"}})

    html = result.cells[0].outputs[0].data["text/html"]
    assert 'data-bokeh-notebook-export-state="saved-notebook"' in html
    page.assert_called_once_with(resources="inline")
    assert screenshot.call_args.kwargs["backend"] == "playwright"


def test_current_frontend_artifact_wins_over_saved_state() -> None:
    saved = embed(figure(title="saved"))
    current = embed(figure(title="current"))
    notebook = _notebook(_output(saved))
    _store_export_snapshots("test.ipynb", "export-identifier-0004", [{
        "view_id": "view", "artifact_json": current.to_json_string(), "width": 444,
    }])
    token = _set_export_correlation("export-identifier-0004")
    try:
        with (
            patch("bokeh.embed.artifact.EmbedArtifact.page", return_value="<html></html>") as page,
            patch("bokeh.io.jupyter_export._get_screenshot_as_png_from_html", return_value=_image()),
        ):
            result, _ = BokehPngPreprocessor(require_trusted=False).preprocess(
                copy.deepcopy(notebook), {"output_extension": ".html", "metadata": {"name": "test"}},
            )
    finally:
        _reset_export_correlation(token)

    html = result.cells[0].outputs[0].data["text/html"]
    assert 'data-bokeh-notebook-export-state="current-frontend"' in html
    captured = page.call_args.args[0] if page.call_args.args else None
    assert captured is None  # bound method patch proves the common renderer route without leaking internals


def test_server_artifact_uses_static_fallback_without_frontend_snapshot() -> None:
    notebook = _notebook(_output(embed_server("http://127.0.0.1:4321/app")))
    with patch("bokeh.io.jupyter_export._get_screenshot_as_png_from_html") as screenshot:
        result, _ = BokehPngPreprocessor(require_trusted=False).preprocess(
            notebook, {"output_extension": ".html", "metadata": {"name": "test"}},
        )

    assert "fallback" in result.cells[0].outputs[0].data["text/html"]
    screenshot.assert_not_called()


def test_untrusted_artifact_is_never_executed() -> None:
    notebook = _notebook()
    notebook.cells[0].metadata["trusted"] = False
    with patch("bokeh.io.jupyter_export._get_screenshot_as_png_from_html") as screenshot:
        result, _ = BokehPngPreprocessor(require_trusted=True).preprocess(
            notebook, {"output_extension": ".html", "metadata": {"name": "test"}},
        )

    assert "notebook is untrusted" in result.cells[0].outputs[0].data["text/html"]
    screenshot.assert_not_called()


def test_resource_owner_outputs_are_removed_from_export() -> None:
    notebook = _notebook()
    notebook.cells[0].outputs.insert(0, nbformat.v4.new_output(
        "display_data", data={RESOURCES_MIME_TYPE: {"kind": "resources"}, "application/javascript": "secret"},
    ))
    with (
        patch("bokeh.embed.artifact.EmbedArtifact.page", return_value="<html></html>"),
        patch("bokeh.io.jupyter_export._get_screenshot_as_png_from_html", return_value=_image()),
    ):
        result, _ = BokehPngPreprocessor(require_trusted=False).preprocess(
            notebook, {"output_extension": ".html", "metadata": {"name": "test"}},
        )

    assert len(result.cells[0].outputs) == 1
    assert "application/javascript" not in result.cells[0].outputs[0].data


def test_anywidget_output_metadata_preserves_saved_artifact_export() -> None:
    artifact = embed(figure())
    output = nbformat.v4.new_output(
        "display_data",
        data={
            "application/vnd.jupyter.widget-view+json": {"model_id": "widget"},
            "text/html": artifact.fragment(resources="none").html,
        },
        metadata={DISPLAY_MIME_TYPE: display_payload(artifact, "resources", "view")},
    )
    with (
        patch("bokeh.embed.artifact.EmbedArtifact.page", return_value="<html></html>"),
        patch("bokeh.io.jupyter_export._get_screenshot_as_png_from_html", return_value=_image()),
    ):
        result, _ = BokehPngPreprocessor(require_trusted=False).preprocess(
            _notebook(output), {"output_extension": ".html", "metadata": {"name": "test"}},
        )

    assert "data-bokeh-notebook-png-fallback" in result.cells[0].outputs[0].data["text/html"]


def test_server_extension_registers_snapshot_and_correlated_export_routes() -> None:
    from bokeh.jupyter import (
        _CorrelatedNbconvertFileHandler,
        _ExportSnapshotsHandler,
        _load_jupyter_server_extension,
    )

    serverapp = MagicMock()
    serverapp.config.HTMLExporter.preprocessors = []
    serverapp.web_app.settings = {"base_url": "/prefix/"}
    _load_jupyter_server_extension(serverapp)

    handlers = serverapp.web_app.add_handlers.call_args.args[1]
    assert handlers[0] == ("/prefix/bokeh-notebook/export-snapshots", _ExportSnapshotsHandler)
    assert handlers[1][1] is _CorrelatedNbconvertFileHandler
    assert "bokeh-notebook/export" in handlers[1][0]
    assert "bokeh.io.jupyter_export.BokehPngPreprocessor" in serverapp.config.HTMLExporter.preprocessors
