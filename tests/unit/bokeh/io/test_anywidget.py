from __future__ import annotations

# Standard library imports
import gc
import json
import weakref
from collections.abc import Iterator
from typing import Any, cast
from unittest.mock import MagicMock, patch

# External imports
import pytest

pytest.importorskip("anywidget", minversion="0.11")

# Bokeh imports
from bokeh.document import Document
from bokeh.embed import embed_server
from bokeh.io.notebook import ApplicationViewHandle, DocumentViewHandle
from bokeh.io.jupyter import ExecutableResourceRecord
from bokeh.models import Div

# Module under test
import bokeh.io._anywidget as m # isort:skip

_FRONTEND_ID = "frontend"
_SECOND_FRONTEND_ID = "frontend-second"


@pytest.fixture(autouse=True)
def close_retained_widgets() -> Iterator[None]:
    yield
    for widget in tuple(m._RETAINED_WIDGETS.values()):
        widget.close()
    m._RETAINED_WIDGETS.clear()


def test_display_widget_uses_standard_widget_mime_bundle() -> None:
    widget = m.display_widget({"kind": "artifact", "view_id": "view"}, "<div></div>", {})
    bundle = widget._repr_mimebundle_()
    assert bundle is not None
    assert bundle[0]["application/vnd.jupyter.widget-view+json"]["model_id"] == widget.model_id
    assert bundle[0]["text/html"] == "<div></div>"
    assert bundle[0]["application/vnd.bokeh.display+json"]["view_id"] == "view"
    assert "application/vnd.bokeh.display+json" not in bundle[1]
    widget.close()


def test_widget_returns_and_rejects_explicit_resource_requests() -> None:
    record = cast(ExecutableResourceRecord, {"payload": {"resource_id": "resources"}, "javascript": "window.Bokeh = {}"})
    widget = m.display_widget({"kind": "artifact"}, "", {"resources": record})
    with patch.object(widget, "send") as send:
        widget._receive(widget, {
            "kind": "request_resource", "frontend_id": _FRONTEND_ID,
            "request_id": "one", "resource_id": "resources",
        }, [])
        widget._receive(widget, {
            "kind": "request_resource", "frontend_id": _FRONTEND_ID,
            "request_id": "two", "resource_id": "missing",
        }, [])

    assert send.call_args_list[0].args[0] == {
        "kind": "resource", "frontend_id": _FRONTEND_ID, "request_id": "one", "record": record,
    }
    assert send.call_args_list[1].args[0]["kind"] == "resource_error"
    assert send.call_args_list[1].args[0]["code"] == "RESOURCE_RECORD_MISSING"
    widget.close()


def test_resource_reply_validates_ids_and_returns_typed_protocol_messages() -> None:
    record = cast(ExecutableResourceRecord, {"payload": {"resource_id": "resources"}, "javascript": "window.Bokeh = {}"})

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
        widget._receive(widget, {"kind": "active", "frontend_id": _FRONTEND_ID}, [])
        root.text = "after"
        widget._receive(widget, {"kind": "resync", "frontend_id": _FRONTEND_ID}, [])

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
    widget._receive(widget, {"kind": "active", "frontend_id": _FRONTEND_ID}, [])

    widget._receive(widget, {"kind": "disposed", "frontend_id": _FRONTEND_ID}, [])

    assert not handle.closed
    assert handle.views == 0
    handle.close()


def test_python_disconnect_preserves_the_saved_widget_output() -> None:
    handle = DocumentViewHandle(Div(), live_id="live", view_id="view")
    widget = m.display_widget({"kind": "artifact"}, "", {}, handle=handle)
    widget._receive(widget, {"kind": "active", "frontend_id": _FRONTEND_ID}, [])

    with patch.object(widget, "close", wraps=widget.close) as close:
        widget.disconnect()
        close.assert_not_called()
        widget._receive(widget, {"kind": "disposed", "frontend_id": _FRONTEND_ID}, [])

    close.assert_called_once_with()
    assert widget._released
    assert not widget._transports
    assert not widget._records


def test_inactive_diagnostic_widget_is_closed_only_when_disposed() -> None:
    widget = m.display_widget({"kind": "artifact"}, "", {})
    with patch.object(widget, "close") as close:
        widget._receive(widget, {"kind": "active", "frontend_id": _FRONTEND_ID}, [])
        widget._receive(widget, {"kind": "inactive", "frontend_id": _FRONTEND_ID}, [])
        close.assert_not_called()

        widget._receive(widget, {"kind": "disposed", "frontend_id": _FRONTEND_ID}, [])
        close.assert_called_once_with()


def test_python_disconnect_retains_a_widget_without_active_frontends() -> None:
    handle = DocumentViewHandle(Div(), live_id="live", view_id="view")
    widget = m.display_widget({"kind": "artifact"}, "", {}, handle=handle)
    model_id = widget.model_id

    with patch.object(widget, "close", wraps=widget.close) as close:
        widget.disconnect()

    close.assert_not_called()
    assert m._RETAINED_WIDGETS[model_id] is widget
    widget.close()


def test_widget_close_is_idempotent_and_releases_anywidget_watchers() -> None:
    widget = m.display_widget({"kind": "artifact"}, "x" * 100_000, {})
    reference = weakref.ref(widget)

    widget.close()
    widget.close()
    del widget
    gc.collect()

    assert reference() is None


def test_released_widgets_without_disposal_are_bounded() -> None:
    first_handle = DocumentViewHandle(Div(), live_id="first", view_id="first")
    second_handle = DocumentViewHandle(Div(), live_id="second", view_id="second")
    first = m.display_widget({"kind": "artifact"}, "", {}, handle=first_handle)
    second = m.display_widget({"kind": "artifact"}, "", {}, handle=second_handle)
    first_reference = weakref.ref(first)

    with patch.object(m, "_MAX_RETAINED_WIDGETS", 1):
        first.disconnect()
        second.disconnect()

    assert getattr(first, "comm", None) is None
    del first
    gc.collect()
    assert first_reference() is None
    assert list(m._RETAINED_WIDGETS) == [second.model_id]
    second._receive(second, {"kind": "disposed", "frontend_id": _FRONTEND_ID}, [])
    assert not m._RETAINED_WIDGETS


def test_automatic_widgets_without_disposal_are_bounded() -> None:
    with patch.object(m, "_MAX_RETAINED_WIDGETS", 1):
        first = m.display_widget({"kind": "artifact"}, "", {})
        first_reference = weakref.ref(first)
        second = m.display_widget({"kind": "artifact"}, "", {})

    assert getattr(first, "comm", None) is None
    del first
    gc.collect()
    assert first_reference() is None
    assert list(m._RETAINED_WIDGETS) == [second.model_id]
    second.close()


def test_widget_keeps_the_kernel_local_application_url_out_of_its_payload() -> None:
    local_url = "http://127.0.0.1:4321/bokeh-notebook/nonce/"
    browser_url = "https://jupyter.example/proxy/4321/bokeh-notebook/nonce"
    app = MagicMock(application_id="application")
    app._resolve_browser_url.return_value = browser_url
    artifact = embed_server(local_url, metadata={"notebook_application_id": "application"})
    handle = ApplicationViewHandle(app, "view", artifact)
    widget = m.display_widget({
        "kind": "artifact",
        "application_id": "application",
    }, "", {}, handle=handle)

    with patch.object(widget, "send") as send:
        widget._receive(widget, {"kind": "active", "frontend_id": _FRONTEND_ID}, [])
        widget._receive(widget, {
            "kind": "application_url", "frontend_id": _FRONTEND_ID, "application_url": browser_url,
        }, [])

    app._resolve_browser_url.assert_called_once_with(browser_url)
    assert send.call_args.args[0]["kind"] == "ready"
    assert "artifact" in send.call_args.args[0]
    assert send.call_args.args[0]["frontend_id"] == _FRONTEND_ID
    handle.close()


def test_widget_new_view_after_page_reload_receives_a_fresh_snapshot() -> None:
    root = Div(text="before")
    document = Document()
    document.add_root(root)
    handle = DocumentViewHandle(root, live_id="live", view_id="view")
    handle._attach(document)
    widget = m.display_widget({"kind": "artifact"}, "", {}, handle=handle)
    sent: list[dict[str, Any]] = []

    with patch.object(widget, "send", side_effect=lambda data, buffers=None: sent.append(data)):
        widget._receive(widget, {"kind": "active", "frontend_id": _FRONTEND_ID}, [])
        root.text = "after-reload"
        widget._receive(widget, {"kind": "active", "frontend_id": _SECOND_FRONTEND_ID}, [])

    assert handle.views == 2
    assert sent[-1]["kind"] == "snapshot"
    assert "after-reload" in sent[-1]["artifact"]
    widget._receive(widget, {"kind": "inactive", "frontend_id": _FRONTEND_ID}, [])
    assert handle.views == 1
    handle.close()


def test_widget_prunes_frontends_that_stop_renewing_their_lease(monkeypatch: pytest.MonkeyPatch) -> None:
    root = Div()
    handle = DocumentViewHandle(root, live_id="live", view_id="view")
    widget = m.display_widget({"kind": "artifact"}, "", {}, handle=handle)

    now = 0.0
    monkeypatch.setattr(m, "monotonic", lambda: now)
    widget._receive(widget, {"kind": "active", "frontend_id": _FRONTEND_ID}, [])
    now = m._TRANSPORT_LEASE_SECONDS + 1
    widget._receive(widget, {"kind": "active", "frontend_id": _SECOND_FRONTEND_ID}, [])

    assert handle.views == 1
    assert _FRONTEND_ID not in widget._transports
    assert _SECOND_FRONTEND_ID in widget._transports
    handle.close()


def test_widget_bounds_frontend_transports() -> None:
    root = Div()
    handle = DocumentViewHandle(root, live_id="live", view_id="view")
    widget = m.display_widget({"kind": "artifact"}, "", {}, handle=handle)

    with patch("bokeh.io._anywidget.monotonic", return_value=0.0):
        for index in range(m._MAX_TRANSPORTS + 1):
            widget._receive(widget, {"kind": "active", "frontend_id": f"frontend-{index}"}, [])

    assert handle.views == m._MAX_TRANSPORTS
    assert "frontend-0" not in widget._transports
    handle.close()


def test_show_doc_uses_anywidget_without_duplicate_mime_outputs() -> None:
    from bokeh.io.notebook import show_doc
    from bokeh.plotting import figure

    plot = figure()
    document = Document()
    widget = MagicMock()
    with (
        patch("bokeh.io.doc.curdoc", return_value=document),
        patch("bokeh.io.notebook.is_marimo_runtime", return_value=True),
        patch("bokeh.io.notebook.anywidget_available", return_value=True),
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
