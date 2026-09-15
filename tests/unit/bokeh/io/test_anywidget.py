from __future__ import annotations

# Standard library imports
import json
from typing import Any
from unittest.mock import MagicMock, patch

# External imports
import pytest

pytest.importorskip("anywidget", minversion="0.11")

# Bokeh imports
from bokeh.document import Document
from bokeh.embed import embed_server
from bokeh.io.notebook import ApplicationViewHandle, DocumentViewHandle
from bokeh.models import Div

# Module under test
import bokeh.io._anywidget as m # isort:skip


def test_display_widget_uses_standard_widget_mime_bundle() -> None:
    widget = m.display_widget({"kind": "artifact", "view_id": "view"}, "<div></div>", {})
    bundle = widget._repr_mimebundle_()
    assert bundle is not None
    assert bundle[0]["application/vnd.jupyter.widget-view+json"]["model_id"] == widget.model_id
    assert bundle[0]["text/html"] == "<div></div>"
    assert bundle[1]["application/vnd.bokeh.display+json"]["view_id"] == "view"
    widget.close()


def test_widget_returns_and_rejects_explicit_resource_requests() -> None:
    record = {"payload": {"resource_id": "resources"}, "javascript": "window.Bokeh = {}"}
    widget = m.display_widget({"kind": "artifact"}, "", {"resources": record})
    with patch.object(widget, "send") as send:
        widget._receive(widget, {
            "kind": "request_resource", "request_id": "one", "resource_id": "resources",
        }, [])
        widget._receive(widget, {
            "kind": "request_resource", "request_id": "two", "resource_id": "missing",
        }, [])

    assert send.call_args_list[0].args[0] == {"kind": "resource", "request_id": "one", "record": record}
    assert send.call_args_list[1].args[0]["kind"] == "resource_error"
    assert send.call_args_list[1].args[0]["code"] == "RESOURCE_RECORD_MISSING"
    widget.close()


def test_resource_reply_validates_ids_and_returns_typed_protocol_messages() -> None:
    record = {"payload": {"resource_id": "resources"}, "javascript": "window.Bokeh = {}"}

    assert m._resource_reply("one", "resources", {"resources": record}) == {
        "kind": "resource",
        "request_id": "one",
        "record": record,
    }
    assert m._resource_reply("two", "missing", {"resources": record}) == {
        "kind": "resource_error",
        "request_id": "two",
        "code": "RESOURCE_RECORD_MISSING",
        "message": "The shared BokehJS resource missing is unavailable.",
    }
    assert m._resource_reply(None, None, {})["request_id"] == ""


def test_widget_ready_connects_revisioned_artifact_transport() -> None:
    root = Div(text="before")
    document = Document()
    document.add_root(root)
    handle = DocumentViewHandle(root, live_id="live", view_id="view")
    handle._attach(document)
    widget = m.display_widget({"kind": "artifact", "live_id": "live"}, "", {}, handle=handle)
    sent: list[tuple[Any, list[bytes] | None]] = []

    def send(data: Any, buffers: list[bytes] | None = None) -> None:
        sent.append((data, buffers))

    with patch.object(widget, "send", side_effect=send):
        widget._receive(widget, {"kind": "ready"}, [])
        root.text = "after"
        widget._receive(widget, {"kind": "resync"}, [])

    assert sent[0][0]["kind"] == "snapshot"
    assert json.loads(sent[0][0]["artifact"])["schema"] == "bokeh.embed/v1"
    assert sent[1][0]["kind"] == "patch"
    assert sent[1][0]["revision"] == 1
    assert sent[2][0]["kind"] == "snapshot"
    assert sent[2][0]["revision"] == 1
    assert "after" in sent[2][0]["artifact"]
    handle.close()


def test_widget_disposal_disconnects_without_closing_python_owner() -> None:
    root = Div()
    handle = DocumentViewHandle(root, live_id="live", view_id="view")
    widget = m.display_widget({"kind": "artifact"}, "", {}, handle=handle)
    widget._receive(widget, {"kind": "ready"}, [])

    widget._receive(widget, {"kind": "disposed"}, [])

    assert not handle.closed
    assert handle.views == 0
    handle.close()


def test_widget_forwards_the_browser_application_url_to_its_owner() -> None:
    local_url = "http://127.0.0.1:4321/bokeh-notebook/nonce/"
    browser_url = "https://hub.example.test/user/alice/proxy/4321/bokeh-notebook/nonce/"
    app = MagicMock(application_id="application")
    app._resolve_browser_url.return_value = browser_url.rstrip("/")
    artifact = embed_server(local_url, metadata={"notebook_application_id": "application"})
    handle = ApplicationViewHandle(app, "view", artifact)
    widget = m.display_widget({
        "kind": "artifact",
        "application_id": "application",
        "application_url": local_url,
    }, "", {}, handle=handle)

    with patch.object(widget, "send") as send:
        widget._receive(widget, {"kind": "ready", "application_url": browser_url}, [])

    app._resolve_browser_url.assert_called_once_with(browser_url)
    assert send.call_args.args[0]["kind"] == "ready"
    assert "artifact" in send.call_args.args[0]
    handle.close()


def test_widget_reconnect_after_page_reload_receives_a_fresh_snapshot() -> None:
    root = Div(text="before")
    document = Document()
    document.add_root(root)
    handle = DocumentViewHandle(root, live_id="live", view_id="view")
    handle._attach(document)
    widget = m.display_widget({"kind": "artifact"}, "", {}, handle=handle)
    sent: list[dict[str, Any]] = []

    with patch.object(widget, "send", side_effect=lambda data, buffers=None: sent.append(data)):
        widget._receive(widget, {"kind": "ready"}, [])
        root.text = "after-reload"
        # A hard page reload cannot reliably notify Python that its old view
        # disappeared. The new widget manager repeats ``ready`` on the same
        # backend comm and must still receive a current snapshot.
        widget._receive(widget, {"kind": "ready"}, [])

    assert handle.views == 1
    assert sent[-1]["kind"] == "snapshot"
    assert "after-reload" in sent[-1]["artifact"]
    handle.close()


def test_show_doc_uses_anywidget_without_duplicate_mime_outputs() -> None:
    from bokeh.io.notebook import show_doc
    from bokeh.plotting import figure

    plot = figure()
    document = Document()
    widget = MagicMock()
    with (
        patch("bokeh.io.doc.curdoc", return_value=document),
        patch("bokeh.io.notebook._use_anywidget", return_value=True),
        patch("bokeh.io.notebook._ensure_notebook_resources", return_value="resources") as ensure,
        patch("bokeh.io.notebook.publish_display_data") as publish,
        patch("bokeh.io._anywidget.display_widget", return_value=widget) as make_widget,
        patch("IPython.display.display") as display,
    ):
        handle = show_doc(plot)

    ensure.assert_called_once()
    assert ensure.call_args.args[0].schema == "bokeh.embed/v1"
    assert ensure.call_args.kwargs["publish"] is False
    publish.assert_not_called()
    display.assert_called_once_with(widget)
    assert make_widget.call_args.args[0]["kind"] == "artifact"
    assert make_widget.call_args.kwargs["handle"] is handle
    handle.close()


def test_marimo_static_representation_uses_anywidget() -> None:
    from bokeh.io.notebook import notebook_mimebundle
    from bokeh.plotting import figure

    widget = MagicMock()
    widget._repr_mimebundle_.return_value = ({"application/vnd.jupyter.widget-view+json": {"model_id": "widget"}}, {})
    with (
        patch("bokeh.io.notebook.notebook_environment", return_value=True),
        patch("bokeh.io.notebook.is_marimo_runtime", return_value=True),
        patch("bokeh.io.notebook.anywidget_available", return_value=True),
        patch("bokeh.io.notebook._ensure_notebook_resources", return_value="resources"),
        patch("bokeh.io._anywidget.display_widget", return_value=widget),
    ):
        bundle = notebook_mimebundle(figure())

    assert bundle == widget._repr_mimebundle_.return_value
