from __future__ import annotations

# Standard library imports
import asyncio
import copy
import json
from collections.abc import Iterator
from inspect import unwrap
from typing import Any
from unittest.mock import MagicMock, patch

# External imports
import pytest

pytest.importorskip("nbconvert")
nbformat = pytest.importorskip("nbformat")
Config = pytest.importorskip("traitlets.config").Config

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


class ProduceBokehOutput(m.Preprocessor):
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
        m.set_export_correlation("spaces are unsafe")
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


def test_transient_snapshot_expiry_removes_stale_entries_and_its_timer() -> None:
    timer = MagicMock()
    m._TRANSIENT_EXPORTS.append((1.0, {"test.ipynb"}, "export-identifier-0103", {}, 0))
    m._TRANSIENT_EXPORT_TIMER = timer
    with (
        patch("bokeh.io.jupyter_export.time.monotonic", return_value=1.0 + m._TRANSIENT_EXPORT_TTL + 1),
        patch("bokeh.io.jupyter_export.threading.current_thread", return_value=timer),
    ):
        m._expire_export_snapshots()

    assert m._TRANSIENT_EXPORTS == []
    assert m._TRANSIENT_EXPORT_TIMER is None


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


def test_bokeh_export_captures_signature_before_preprocessors_mutate_notebook(tmp_path: Any) -> None:
    notebook = nbformat.v4.new_notebook(cells=[nbformat.v4.new_code_cell("%%time\nshow(plot)")])
    notary = m.NotebookNotary(data_dir=str(tmp_path), db_file=str(tmp_path / "signatures.db"))
    notary.sign(notebook)
    config = Config({"HTMLExporter": {"preprocessors": [ProduceBokehOutput]}})
    exporter = m.BokehHTMLExporter(config=config)

    with (
        patch("bokeh.io.jupyter_export.NotebookNotary", return_value=notary),
        patch("bokeh.embed.result.EmbedResult.page", return_value="<html></html>"),
        patch("bokeh.io.jupyter_export.get_screenshot_as_png_from_html", return_value=_image()),
    ):
        html, _ = exporter.from_notebook_node(notebook)

    assert "data-bokeh-notebook-png-fallback" in html


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


def test_snapshot_handler_stores_valid_frontend_state() -> None:
    pytest.importorskip("jupyter_server")
    from bokeh.jupyter import _ExportSnapshotsHandler

    handler = MagicMock()
    handler.request.body = b"{}"
    handler.get_json_body.return_value = {
        "path": "folder/plot.ipynb",
        "export_id": "export-identifier-0041",
        "snapshots": [{"view_id": "view", "artifact_json": "{}"}],
    }
    handler.contents_manager._get_os_path.return_value = "/tmp/folder/plot.ipynb"
    with patch("bokeh.jupyter.store_export_snapshots") as store:
        asyncio.run(unwrap(_ExportSnapshotsHandler.post)(handler))

    store.assert_called_once_with(
        "folder/plot.ipynb",
        "export-identifier-0041",
        [{"view_id": "view", "artifact_json": "{}"}],
        os_path="/tmp/folder/plot.ipynb",
    )
    handler.set_header.assert_called_once_with("Cache-Control", "no-store")
    handler.finish.assert_called_once_with({"accepted": 1})


@pytest.mark.parametrize("body", [
    None,
    {"path": "plot.txt", "export_id": "export-identifier-0041", "snapshots": []},
    {"path": "plot.ipynb", "export_id": "export-identifier-0041", "snapshots": "invalid"},
    {"path": "plot.ipynb", "export_id": "invalid", "snapshots": []},
    {"path": "plot.ipynb", "export_id": "export-identifier-0041", "snapshots": [None]},
])
def test_snapshot_handler_rejects_invalid_frontend_state(body: Any) -> None:
    pytest.importorskip("jupyter_server")
    from tornado import web

    from bokeh.jupyter import _ExportSnapshotsHandler

    handler = MagicMock()
    handler.request.body = b"{}"
    handler.get_json_body.return_value = body
    with pytest.raises(web.HTTPError) as error:
        asyncio.run(unwrap(_ExportSnapshotsHandler.post)(handler))
    assert error.value.status_code == 400


def test_snapshot_handler_enforces_serialized_byte_limits() -> None:
    pytest.importorskip("jupyter_server")
    from tornado import web

    import bokeh.jupyter as jupyter

    handler = MagicMock()
    handler.request.body = b"too large"
    with (
        patch.object(jupyter, "_MAX_TRANSIENT_EXPORT_BYTES", 1),
        pytest.raises(web.HTTPError) as error,
    ):
        asyncio.run(unwrap(jupyter._ExportSnapshotsHandler.post)(handler))
    assert error.value.status_code == 413

    handler.request.body = b"{}"
    handler.get_json_body.return_value = {
        "path": "plot.ipynb",
        "export_id": "export-identifier-0041",
        "snapshots": [{"view_id": "view", "error": "too large"}],
    }
    with (
        patch.object(jupyter, "_MAX_TRANSIENT_EXPORT_BYTES", 1),
        pytest.raises(web.HTTPError) as error,
    ):
        asyncio.run(unwrap(jupyter._ExportSnapshotsHandler.post)(handler))
    assert error.value.status_code == 413


def test_server_extension_points_and_correlated_route_validation() -> None:
    pytest.importorskip("jupyter_server")
    from tornado import web

    from bokeh.jupyter import (
        _CorrelatedNbconvertFileHandler,
        _jupyter_server_extension_points,
    )

    assert _jupyter_server_extension_points() == [{"module": "bokeh.jupyter"}]
    handler = object.__new__(_CorrelatedNbconvertFileHandler)
    handler.get_argument = MagicMock(return_value="invalid")
    with pytest.raises(web.HTTPError) as error:
        asyncio.run(handler.get("html", "plot.ipynb"))
    assert error.value.status_code == 400


def test_correlated_html_route_selects_bokeh_exporter_and_propagates_context() -> None:
    pytest.importorskip("jupyter_server")
    from jupyter_server.nbconvert.handlers import NbconvertFileHandler

    from bokeh.jupyter import _CorrelatedNbconvertFileHandler

    export_id = "export-identifier-0042"
    m.store_export_snapshots("plot.ipynb", export_id, [{"view_id": "view", "error": "captured frontend"}])
    observed: list[str] = []

    async def convert(_handler: Any, format: str, path: str) -> None:
        assert format == "bokeh"
        assert path == "plot.ipynb"
        result, _ = await asyncio.to_thread(
            m.BokehPNGPreprocessor(require_trusted=False).preprocess,
            _notebook(),
            {"metadata": {"name": "plot"}},
        )
        observed.append(result.cells[0].outputs[0].data["text/html"])

    handler = object.__new__(_CorrelatedNbconvertFileHandler)
    handler.get_argument = MagicMock(return_value=export_id)
    with patch.object(NbconvertFileHandler, "get", new=convert):
        asyncio.run(handler.get("html", "plot.ipynb"))

    assert "captured frontend" in observed[0]

    m.store_export_snapshots("plot.ipynb", export_id, [{"view_id": "view", "error": "not correlated"}])
    assert m._take_export_snapshots({"metadata": {"name": "plot"}}) == {}


def test_preprocessor_ignores_non_html_and_non_bokeh_outputs() -> None:
    preprocessor = m.BokehPNGPreprocessor(require_trusted=False)
    notebook = nbformat.v4.new_notebook(cells=[nbformat.v4.new_markdown_cell("text")])
    assert preprocessor.preprocess(copy.deepcopy(notebook), {"output_extension": ".pdf"})[0] == notebook

    cell = nbformat.v4.new_code_cell(outputs=[
        nbformat.v4.new_output("stream", name="stdout", text="hello"),
        nbformat.v4.new_output("display_data", data={"text/plain": "plain"}),
    ])
    preprocessor._trusted = True
    preprocessor._transient = {}
    processed, _ = preprocessor.preprocess_cell(cell, {}, 0)
    assert processed.outputs == cell.outputs
    markdown = nbformat.v4.new_markdown_cell("text")
    assert preprocessor.preprocess_cell(markdown, {}, 0)[0] == markdown


def test_preprocessor_reports_unexpected_capture_failures() -> None:
    preprocessor = m.BokehPNGPreprocessor(require_trusted=False)
    with patch.object(preprocessor, "_capture", side_effect=RuntimeError("failure")):
        result, _ = preprocessor.preprocess(
            _notebook(), {"output_extension": ".html", "metadata": {"name": "test"}},
        )

    html = result.cells[0].outputs[0].data["text/html"]
    assert "could not be converted to PNG" in html
    assert "RuntimeError" in html


def test_capture_rejects_invalid_or_unusable_artifacts() -> None:
    preprocessor = m.BokehPNGPreprocessor(require_trusted=False)
    preprocessor._transient = {}
    with pytest.raises(m._PngUnavailable, match="no embedding artifact"):
        preprocessor._capture(None, "view")
    with pytest.raises(m._PngUnavailable, match="invalid embedding artifact"):
        preprocessor._capture('<script data-bokeh-embed-payload>{"invalid": true}</script>', "view")
    with pytest.raises(m._PngUnavailable, match="no embedding artifact"):
        preprocessor._capture("<div>no artifact</div>", "view")

    preprocessor._transient = {"view": {"artifact_json": None}}
    with pytest.raises(m._PngUnavailable, match="no embedding artifact"):
        preprocessor._capture("", "view")

    preprocessor._transient = {"view": {"artifact_json": embed_server("http://localhost:5006").to_json_string()}}
    with pytest.raises(m._PngUnavailable, match="no current standalone frontend snapshot"):
        preprocessor._capture("", "view")

    empty = embed(figure()).to_dict()
    empty["roots"] = []
    preprocessor._transient = {"view": {"artifact_json": json.dumps(empty)}}
    with pytest.raises(m._PngUnavailable, match="no rendered roots"):
        preprocessor._capture("", "view")


def test_capture_enforces_png_byte_limit() -> None:
    preprocessor = m.BokehPNGPreprocessor(require_trusted=False, max_bytes=1)
    preprocessor._transient = {}
    image = _image()
    image.save.side_effect = lambda target, format: target.write(b"too large")
    with (
        patch("bokeh.embed.result.EmbedResult.page", return_value="<html></html>"),
        patch("bokeh.io.jupyter_export.get_screenshot_as_png_from_html", return_value=image),
        pytest.raises(m._PngUnavailable, match="PNG exceeds"),
    ):
        preprocessor._capture(_output().data["text/html"], "view")


def test_signature_failure_and_fallback_default_are_safe() -> None:
    preprocessor = m.BokehPNGPreprocessor()
    with patch("bokeh.io.jupyter_export.NotebookNotary", side_effect=RuntimeError("unavailable")):
        assert not preprocessor._check_signature(_notebook())
    assert "default recovery" in preprocessor._fallback_only(None, "default recovery")
