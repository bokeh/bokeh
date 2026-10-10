from __future__ import annotations

# Standard library imports
import asyncio
import copy
import json
from collections.abc import Iterator
from typing import Any
from unittest.mock import MagicMock, patch

# External imports
import pytest
from nbconvert.preprocessors import Preprocessor
from traitlets.config import Config

nbformat = pytest.importorskip("nbformat")

# Bokeh imports
from bokeh.embed import embed, embed_server
from bokeh.io.jupyter import DISPLAY_MIME_TYPE, RESOURCES_MIME_TYPE, display_payload
from bokeh.io.notebook import static_fallback
from bokeh.plotting import figure

# Module under test
import bokeh.io.jupyter_export as m # isort:skip


@pytest.fixture(autouse=True)
def clear_transient() -> Iterator[None]:
    m._TRANSIENT_EXPORTS.clear()
    if m._TRANSIENT_EXPORT_TIMER is not None:
        m._TRANSIENT_EXPORT_TIMER.cancel()
        m._TRANSIENT_EXPORT_TIMER = None
    yield
    if m._TRANSIENT_EXPORT_TIMER is not None:
        m._TRANSIENT_EXPORT_TIMER.cancel()
        m._TRANSIENT_EXPORT_TIMER = None


def _output(artifact=None, *, view_id: str = "view"):
    artifact = artifact or embed(figure())
    return nbformat.v4.new_output(
        "display_data",
        data={
            "text/html": artifact.fragment(resources="none").html + static_fallback("fallback"),
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


class ProduceBokehOutput(Preprocessor):
    def preprocess_cell(self, cell: Any, resources: dict[str, Any], index: int) -> tuple[Any, dict[str, Any]]:
        del index
        if cell.get("cell_type") == "code":
            cell["outputs"] = [_output()]
        return cell, resources


def test_transient_snapshots_require_exact_path_and_export_correlation() -> None:
    artifact = embed(figure())
    m.store_export_snapshots("folder/test.ipynb", "export-identifier-0001", [{
        "view_id": "view", "artifact_json": artifact.to_json_string(), "width": 321.4,
    }])
    resources = {"metadata": {"name": "test", "path": "/tmp/folder"}}

    assert m._take_export_snapshots(resources, "wrong-identifier-001") == {}
    assert m._take_export_snapshots(resources, "export-identifier-0001")["view"]["width"] == 321

    m.store_export_snapshots("folder/test.ipynb", "export-identifier-0002", [{
        "view_id": "view", "artifact_json": artifact.to_json_string(), "width": 321.4,
    }], os_path="/tmp/folder/test.ipynb")
    snapshots = m._take_export_snapshots(resources, "export-identifier-0002")
    assert snapshots["view"]["width"] == 321
    assert m._take_export_snapshots(resources, "export-identifier-0002") == {}


def test_context_correlation_propagates_to_preprocessor_lookup() -> None:
    m.store_export_snapshots("test.ipynb", "export-identifier-0003", [{"view_id": "view", "error": "failure"}])
    token = m.set_export_correlation("export-identifier-0003")
    try:
        assert m._take_export_snapshots({"metadata": {"name": "test"}}) == {"view": {"error": "failure"}}
    finally:
        m.reset_export_correlation(token)


def test_invalid_correlation_ids_are_rejected() -> None:
    with pytest.raises(ValueError, match="correlation ID"):
        m.store_export_snapshots("test.ipynb", "spaces are unsafe", [])


def test_transient_snapshot_store_has_a_total_byte_cap_and_scheduled_expiry() -> None:
    with (
        patch.object(m, "_TRANSIENT_EXPORT_BYTES_LIMIT", 8),
        patch("bokeh.io.jupyter_export.threading.Timer") as timer,
    ):
        m.store_export_snapshots("test.ipynb", "export-identifier-0101", [{"view_id": "one", "error": "123456"}])
        m.store_export_snapshots("test.ipynb", "export-identifier-0102", [{"view_id": "two", "error": "abcdef"}])

    assert [entry[2] for entry in m._TRANSIENT_EXPORTS] == ["export-identifier-0102"]
    assert timer.call_args.args == (m._TRANSIENT_EXPORT_TTL, m._expire_export_snapshots)
    assert timer.return_value.daemon is True
    timer.return_value.start.assert_called()


def test_artifact_payload_is_parsed_from_its_declared_script() -> None:
    assert m._artifact_payload('<script data-other>ignored</script><script nonce="test" data-bokeh-embed-payload>{"value":"ok"}</script>') == '{"value":"ok"}'
    assert m._artifact_payload('<script data-bokeh-embed-payload-malformed>{}</script>') is None


def test_saved_artifact_is_captured_through_common_page_and_playwright() -> None:
    notebook = _notebook()
    preprocessor = m.BokehPNGPreprocessor(require_trusted=False)
    with (
        patch("bokeh.embed.result.EmbedResult.page", return_value="<html>artifact page</html>") as page,
        patch("bokeh.io.jupyter_export.get_screenshot_as_png_from_html", return_value=_image()) as screenshot,
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
    current_snapshot = current.to_dict()
    m.store_export_snapshots("test.ipynb", "export-identifier-0004", [{
        "view_id": "view", "artifact_json": json.dumps(current_snapshot), "width": 444,
    }])
    token = m.set_export_correlation("export-identifier-0004")
    try:
        with (
            patch("bokeh.embed.result.EmbedResult.page", return_value="<html></html>") as page,
            patch("bokeh.io.jupyter_export.get_screenshot_as_png_from_html", return_value=_image()),
        ):
            result, _ = m.BokehPNGPreprocessor(require_trusted=False).preprocess(
                copy.deepcopy(notebook), {"output_extension": ".html", "metadata": {"name": "test"}},
            )
    finally:
        m.reset_export_correlation(token)

    html = result.cells[0].outputs[0].data["text/html"]
    assert 'data-bokeh-notebook-export-state="current-frontend"' in html
    captured = page.call_args.args[0] if page.call_args.args else None
    assert captured is None  # bound method patch proves the common renderer route without leaking internals


def test_server_artifact_uses_static_fallback_without_frontend_snapshot() -> None:
    notebook = _notebook(_output(embed_server("http://127.0.0.1:4321/app")))
    with patch("bokeh.io.jupyter_export.get_screenshot_as_png_from_html") as screenshot:
        result, _ = m.BokehPNGPreprocessor(require_trusted=False).preprocess(
            notebook, {"output_extension": ".html", "metadata": {"name": "test"}},
        )

    assert "fallback" in result.cells[0].outputs[0].data["text/html"]
    screenshot.assert_not_called()


def test_untrusted_artifact_is_never_executed() -> None:
    notebook = _notebook()
    notebook.cells[0].metadata["trusted"] = False
    with patch("bokeh.io.jupyter_export.get_screenshot_as_png_from_html") as screenshot:
        result, _ = m.BokehPNGPreprocessor(require_trusted=True).preprocess(
            notebook, {"output_extension": ".html", "metadata": {"name": "test"}},
        )

    assert "notebook is untrusted" in result.cells[0].outputs[0].data["text/html"]
    screenshot.assert_not_called()


def test_cell_metadata_does_not_bypass_notebook_signature_trust() -> None:
    notebook = _notebook()
    with (
        patch.object(m.BokehPNGPreprocessor, "_check_signature", return_value=False),
        patch("bokeh.io.jupyter_export.get_screenshot_as_png_from_html") as screenshot,
    ):
        result, _ = m.BokehPNGPreprocessor(require_trusted=True).preprocess(
            notebook,
            {"config_dir": "/tmp/jupyter", "output_extension": ".html", "metadata": {"name": "test"}},
        )

    assert "notebook is untrusted" in result.cells[0].outputs[0].data["text/html"]
    screenshot.assert_not_called()


def test_signature_store_is_closed() -> None:
    notary = MagicMock()
    notary.check_signature.return_value = True
    with patch("bokeh.io.jupyter_export.NotebookNotary", return_value=notary):
        assert m.BokehPNGPreprocessor()._check_signature(_notebook())

    notary.close.assert_called_once_with()


def test_real_notebook_signature_survives_jupyter_trust_metadata(tmp_path: Any) -> None:
    notebook = _notebook()
    notebook.cells[0].metadata.pop("trusted", None)
    notary = m.NotebookNotary(data_dir=str(tmp_path), db_file=str(tmp_path / "signatures.db"))
    notary.sign(notebook)
    notebook.cells[0].metadata["trusted"] = True

    with patch("bokeh.io.jupyter_export.NotebookNotary", return_value=notary):
        assert m.BokehPNGPreprocessor()._check_signature(notebook)


def test_bokeh_export_converts_outputs_created_by_earlier_preprocessors() -> None:
    notebook = nbformat.v4.new_notebook(cells=[nbformat.v4.new_code_cell("show(plot)")])
    config = Config({"HTMLExporter": {"preprocessors": [ProduceBokehOutput]}})
    exporter = m.BokehHTMLExporter(config=config)
    with (
        patch.object(m.BokehPNGPreprocessor, "_check_signature", return_value=True),
        patch("bokeh.embed.result.EmbedResult.page", return_value="<html></html>"),
        patch("bokeh.io.jupyter_export.get_screenshot_as_png_from_html", return_value=_image()),
    ):
        html, _ = exporter.from_notebook_node(notebook)

    assert "data-bokeh-notebook-png-fallback" in html


def test_resource_owner_outputs_are_removed_from_export() -> None:
    notebook = _notebook()
    notebook.cells[0].outputs.insert(0, nbformat.v4.new_output(
        "display_data", data={RESOURCES_MIME_TYPE: {"kind": "resources"}, "application/javascript": "secret"},
    ))
    with (
        patch("bokeh.embed.result.EmbedResult.page", return_value="<html></html>"),
        patch("bokeh.io.jupyter_export.get_screenshot_as_png_from_html", return_value=_image()),
    ):
        result, _ = m.BokehPNGPreprocessor(require_trusted=False).preprocess(
            notebook, {"output_extension": ".html", "metadata": {"name": "test"}},
        )

    assert len(result.cells[0].outputs) == 1
    assert "application/javascript" not in result.cells[0].outputs[0].data


def test_anywidget_output_data_preserves_saved_artifact_export() -> None:
    artifact = embed(figure())
    output = nbformat.v4.new_output(
        "display_data",
        data={
            "application/vnd.jupyter.widget-view+json": {"model_id": "widget"},
            "text/html": artifact.fragment(resources="none").html,
            DISPLAY_MIME_TYPE: display_payload(artifact, "resources", "view"),
        },
    )
    with (
        patch("bokeh.embed.result.EmbedResult.page", return_value="<html></html>"),
        patch("bokeh.io.jupyter_export.get_screenshot_as_png_from_html", return_value=_image()),
    ):
        result, _ = m.BokehPNGPreprocessor(require_trusted=False).preprocess(
            _notebook(output), {"output_extension": ".html", "metadata": {"name": "test"}},
        )

    assert "data-bokeh-notebook-png-fallback" in result.cells[0].outputs[0].data["text/html"]


def test_server_extension_registers_snapshot_and_correlated_export_routes() -> None:
    pytest.importorskip("jupyter_server")
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
    assert serverapp.config.HTMLExporter.preprocessors == []


def test_correlated_html_route_selects_bokeh_exporter_and_propagates_context() -> None:
    from jupyter_server.nbconvert.handlers import NbconvertFileHandler

    from bokeh.jupyter import _CorrelatedNbconvertFileHandler

    observed: list[str | None] = []

    async def convert(_handler: Any, format: str, path: str) -> None:
        assert format == "bokeh"
        assert path == "plot.ipynb"
        observed.append(await asyncio.to_thread(m._EXPORT_CORRELATION_ID.get))

    handler = object.__new__(_CorrelatedNbconvertFileHandler)
    handler.get_argument = MagicMock(return_value="export-identifier-0042")
    with patch.object(NbconvertFileHandler, "get", new=convert):
        asyncio.run(handler.get("html", "plot.ipynb"))

    assert observed == ["export-identifier-0042"]
    assert m._EXPORT_CORRELATION_ID.get() is None
