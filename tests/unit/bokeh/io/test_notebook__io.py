from __future__ import annotations

# Standard library imports
import json
import re
import sys
import types
from collections.abc import Callable
from typing import Any, cast
from unittest.mock import MagicMock, patch

# External imports
import pytest

# Bokeh imports
from bokeh.document import Document
from bokeh.embed import embed_server
from bokeh.embed.notebook import notebook_content
from bokeh.embed.result import EmbedResult
from bokeh.io.jupyter import DISPLAY_MIME_TYPE, PROTOCOL_VERSION
from bokeh.layouts import column
from bokeh.model import Model
from bokeh.models import (
    Column,
    ColumnDataSource,
    Div,
    Slider,
)
from bokeh.plotting import figure
from bokeh.resources import Resources

# Module under test
import bokeh.io.notebook as m # isort:skip


@pytest.fixture(autouse=True)
def reset() -> None:
    m._reset_notebook_resources()
    m._NOTEBOOK_CONTEXT_CONFIRMED = False


@pytest.fixture
def document() -> Document:
    return Document()


def test_show_doc_publishes_one_artifact_owned_output(document: Document) -> None:
    plot = figure(width=300, height=200)
    with (
        patch("bokeh.io.doc.curdoc", return_value=document),
        patch("bokeh.io.notebook.anywidget_available", return_value=False),
        patch("bokeh.io.notebook._ensure_notebook_resources", return_value="resource"),
        patch("bokeh.io.notebook._register_notebook_comm_target"),
        patch("bokeh.io.notebook.publish_display_data") as publish,
    ):
        handle = m.show_doc(plot)

    publish.assert_called_once()
    data = publish.call_args.args[0]
    payload = data[DISPLAY_MIME_TYPE]
    html = data["text/html"]
    assert payload["protocol_version"] == PROTOCOL_VERSION
    assert payload["kind"] == "artifact"
    assert payload["resource_id"] == "resource"
    assert payload["live_id"] in m._DOCUMENT_VIEW_HANDLES
    assert payload["view_id"] in m._DOCUMENT_VIEW_HANDLES_BY_VIEW
    assert html.count("data-bokeh-embed-payload") == 1
    assert "data-bokeh-notebook-static-fallback" in html
    assert "docs_json" not in html
    assert "embed_items_notebook" not in html
    assert handle is m._DOCUMENT_VIEW_HANDLES[payload["live_id"]]
    handle.close()
    assert plot not in document.roots


def test_show_doc_wraps_sequences_in_one_layout_artifact(document: Document) -> None:
    first, second = Div(), Div()
    with (
        patch("bokeh.io.doc.curdoc", return_value=document),
        patch("bokeh.io.notebook.anywidget_available", return_value=False),
        patch("bokeh.io.notebook._ensure_notebook_resources", return_value="resource"),
        patch("bokeh.io.notebook._register_notebook_comm_target"),
        patch("bokeh.io.notebook.publish_display_data"),
    ):
        handle = m.show_doc([first, second])

    [root] = document.roots
    assert isinstance(root, Column)
    assert list(root.children) == [first, second]
    handle.close()
    assert document.roots == []


def test_repeated_displays_share_output_root_until_final_handle_closes(document: Document) -> None:
    plot = figure()
    with (
        patch("bokeh.io.doc.curdoc", return_value=document),
        patch("bokeh.io.notebook.anywidget_available", return_value=False),
        patch("bokeh.io.notebook._ensure_notebook_resources", return_value="resource"),
        patch("bokeh.io.notebook._register_notebook_comm_target"),
        patch("bokeh.io.notebook.publish_display_data"),
    ):
        first = m.show_doc(plot)
        second = m.show_doc(plot)

    first.close()
    assert plot in document.roots
    second.close()
    assert plot not in document.roots


def test_preexisting_document_root_is_not_owned_by_output(document: Document) -> None:
    plot = figure()
    document.add_root(plot)
    with (
        patch("bokeh.io.doc.curdoc", return_value=document),
        patch("bokeh.io.notebook.anywidget_available", return_value=False),
        patch("bokeh.io.notebook._ensure_notebook_resources", return_value="resource"),
        patch("bokeh.io.notebook._register_notebook_comm_target"),
        patch("bokeh.io.notebook.publish_display_data"),
    ):
        handle = m.show_doc(plot)

    handle.close()
    assert plot in document.roots


def test_handle_eviction_releases_its_output_root(document: Document) -> None:
    first_plot, second_plot = figure(), figure()
    with (
        patch("bokeh.io.doc.curdoc", return_value=document),
        patch("bokeh.io.notebook._MAX_RETAINED_VIEW_HANDLES", 1),
        patch("bokeh.io.notebook.anywidget_available", return_value=False),
        patch("bokeh.io.notebook._ensure_notebook_resources", return_value="resource"),
        patch("bokeh.io.notebook._register_notebook_comm_target"),
        patch("bokeh.io.notebook.publish_display_data"),
    ):
        first = m.show_doc(first_plot)
        second = m.show_doc(second_plot)

    assert first.closed
    assert first_plot not in document.roots
    assert second_plot in document.roots
    second.close()


def test_show_doc_releases_an_added_root_when_setup_fails(document: Document) -> None:
    plot = figure()
    with (
        patch("bokeh.io.doc.curdoc", return_value=document),
        patch("bokeh.embed.notebook.notebook_content", side_effect=RuntimeError("setup failed")),
        pytest.raises(RuntimeError, match="setup failed"),
    ):
        m.show_doc(plot)

    assert plot not in document.roots


def test_automatic_mimebundle_has_one_static_artifact_and_no_live_owner() -> None:
    plot = figure()
    with (
        patch("bokeh.io.notebook.notebook_environment", return_value=True),
        patch("bokeh.io.notebook.is_marimo_runtime", return_value=False),
        patch("bokeh.io.notebook.anywidget_available", return_value=False),
        patch("bokeh.io.notebook._ensure_notebook_resources", return_value="resource"),
    ):
        bundle = m.notebook_mimebundle(plot)

    assert bundle is not None
    data, metadata = bundle
    assert data[DISPLAY_MIME_TYPE]["kind"] == "artifact"
    assert "live_id" not in data[DISPLAY_MIME_TYPE]
    assert data["text/html"].count("data-bokeh-embed-payload") == 1
    assert metadata[DISPLAY_MIME_TYPE]["automatic"] is True


def test_standard_jupyter_prefers_html_when_anywidget_is_installed() -> None:
    with (
        patch("bokeh.io.notebook.notebook_environment", return_value=True),
        patch("bokeh.io.notebook.is_marimo_runtime", return_value=False),
        patch("bokeh.io.notebook._is_colab_runtime", return_value=False),
        patch("bokeh.io.notebook.anywidget_available", return_value=True),
    ):
        bundle = m.notebook_mimebundle(figure(), resources=Resources(mode="none"))

    assert bundle is not None
    data, _metadata = bundle
    assert "application/vnd.jupyter.widget-view+json" not in data
    assert "text/html" in data
    assert DISPLAY_MIME_TYPE in data


def test_each_saved_display_carries_its_resource_record_after_reexecution() -> None:
    plot = figure()
    with (
        patch("bokeh.io.notebook.notebook_environment", return_value=True),
        patch("bokeh.io.notebook.anywidget_available", return_value=False),
    ):
        first = m.notebook_mimebundle(plot, resources=Resources(mode="none"))
        second = m.notebook_mimebundle(plot, resources=Resources(mode="none"))

    assert first is not None
    assert second is not None
    first_payload = first[0][DISPLAY_MIME_TYPE]
    second_payload = second[0][DISPLAY_MIME_TYPE]
    assert first_payload["resource_records"]
    assert second_payload["resource_records"]
    assert first_payload["resource_records"][-1]["payload"]["resource_id"] == first_payload["resource_id"]
    assert second_payload["resource_records"][-1]["payload"]["resource_id"] == second_payload["resource_id"]
    assert all("javascript" not in record for record in first_payload["resource_records"])
    assert first[0]["text/html"].count("data-bokeh-notebook-resource-record") == len(first_payload["resource_records"])


def test_notebook_output_preserves_nonce_on_every_script() -> None:
    with (
        patch("bokeh.io.notebook.notebook_environment", return_value=True),
        patch("bokeh.io.notebook.anywidget_available", return_value=False),
    ):
        bundle = m.notebook_mimebundle(figure(), resources=Resources(mode="cdn", nonce="csp-nonce"))

    assert bundle is not None
    scripts = re.findall(r"<script\b[^>]*>", bundle[0]["text/html"])
    assert scripts
    assert all('nonce="csp-nonce"' in script for script in scripts)


def test_colab_static_output_uses_one_common_isolated_artifact_fragment() -> None:
    with (
        patch("bokeh.io.notebook.notebook_environment", return_value=True),
        patch("bokeh.io.notebook.is_marimo_runtime", return_value=False),
        patch("bokeh.io.notebook._is_colab_runtime", return_value=True),
        patch("bokeh.io.notebook.anywidget_available", return_value=False),
        patch("bokeh.io.notebook._ensure_notebook_resources") as ensure,
    ):
        bundle = m.notebook_mimebundle(figure(), resources=Resources(mode="inline"))

    assert bundle is not None
    data, _metadata = bundle
    assert data[DISPLAY_MIME_TYPE]["kind"] == "artifact"
    assert data["text/html"].count("data-bokeh-embed-payload") == 1
    assert "Bokeh.mount_embed_declaration" in data["text/html"]
    assert len(data["text/html"]) > 100_000
    ensure.assert_not_called()


def test_colab_connected_output_requires_anywidget(document: Document) -> None:
    with (
        patch("bokeh.io.doc.curdoc", return_value=document),
        patch("bokeh.io.notebook.anywidget_available", return_value=False),
        patch("bokeh.io.notebook._is_colab_runtime", return_value=True),
        pytest.raises(RuntimeError, match="Connected Bokeh output in Colab requires AnyWidget"),
    ):
        m.show_doc(figure())


@pytest.mark.parametrize("policy", [
    Resources(mode="inline"),
    Resources(mode="offline"),
    Resources(mode="cdn", nonce="csp-nonce", crossorigin="anonymous"),
    Resources(mode="none"),
])
def test_notebook_resource_resolution_preserves_explicit_host_policy(policy: Resources) -> None:
    artifact, _ = notebook_content(figure())
    with patch("bokeh.io.notebook._publish_resource_record", return_value="resource") as publish:
        assert m._ensure_notebook_resources(artifact, policy) == "resource"

    resolved = publish.call_args.args[0]
    assert resolved.policy is policy
    if policy.mode == "none":
        assert resolved.assets == ()


def test_marimo_and_colab_detection_are_host_capabilities(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setitem(sys.modules, "google.colab", object())
    assert m._is_colab_runtime()

    marimo = types.ModuleType("marimo")
    runtime = types.ModuleType("marimo._runtime")
    context = types.ModuleType("marimo._runtime.context")
    context.runtime_context_installed = lambda: True  # type: ignore[attr-defined]
    monkeypatch.setitem(sys.modules, "marimo", marimo)
    monkeypatch.setitem(sys.modules, "marimo._runtime", runtime)
    monkeypatch.setitem(sys.modules, "marimo._runtime.context", context)
    assert m.is_marimo_runtime()


def test_notebook_environment_remembers_a_notebook_cell_identity_for_callbacks() -> None:
    shell = MagicMock(kernel=object())
    shell.get_parent.return_value = {
        "metadata": {},
        "header": {"msg_id": "console", "msg_type": "execute_request"},
        "content": {"allow_stdin": True},
    }
    with (
        patch("IPython.get_ipython", return_value=shell),
        patch("bokeh.io.notebook.is_marimo_runtime", return_value=False),
        patch("bokeh.io.notebook._is_colab_runtime", return_value=False),
    ):
        assert not m.notebook_environment()

    shell.get_parent.return_value = {
        "metadata": {"cellId": "cell"},
        "header": {"msg_id": "execution"},
    }
    with (
        patch("IPython.get_ipython", return_value=shell),
        patch("bokeh.io.notebook.is_marimo_runtime", return_value=False),
        patch("bokeh.io.notebook._is_colab_runtime", return_value=False),
    ):
        assert m.notebook_environment()

    shell.get_parent.return_value = {
        "metadata": {},
        "header": {"msg_id": "widget", "msg_type": "comm_msg"},
        "content": {},
    }
    with (
        patch("IPython.get_ipython", return_value=shell),
        patch("bokeh.io.notebook.is_marimo_runtime", return_value=False),
        patch("bokeh.io.notebook._is_colab_runtime", return_value=False),
    ):
        assert m.notebook_environment()


def test_notebook_environment_is_primed_before_the_first_widget_callback() -> None:
    callbacks: list[Callable[..., None]] = []
    shell = MagicMock(kernel=object())
    shell.events.register.side_effect = lambda name, callback: callbacks.append(callback)
    shell.get_parent.return_value = {
        "metadata": {},
        "header": {"msg_id": "setup", "msg_type": "execute_request"},
        "content": {"allow_stdin": True},
    }
    with (
        patch("IPython.get_ipython", return_value=shell),
        patch("bokeh.io.notebook.is_marimo_runtime", return_value=False),
        patch("bokeh.io.notebook._is_colab_runtime", return_value=False),
        patch.object(m, "_NOTEBOOK_CONTEXT_SHELL", None),
    ):
        m._initialize_notebook_context()
        callbacks[0]()
        shell.get_parent.return_value = {
            "metadata": {},
            "header": {"msg_id": "widget", "msg_type": "comm_msg"},
            "content": {},
        }
        assert m.notebook_environment()

def test_notebook_environment_detects_headless_execution() -> None:
    shell = MagicMock(kernel=object())
    shell.get_parent.return_value = {
        "metadata": {},
        "header": {"msg_id": "nbclient", "msg_type": "execute_request"},
        "content": {"allow_stdin": False},
    }
    with (
        patch("IPython.get_ipython", return_value=shell),
        patch("bokeh.io.notebook.is_marimo_runtime", return_value=False),
        patch("bokeh.io.notebook._is_colab_runtime", return_value=False),
    ):
        assert m.notebook_environment()


def test_legacy_colab_import_hook_is_ignored(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setitem(sys.modules, "google.colab._import_hooks._bokeh", types.ModuleType("_bokeh"))

    install = getattr(m, "install_notebook_hook")

    assert install("jupyter", object(), object(), object(), overwrite=True) is None


def test_marimo_without_anywidget_has_actionable_install_error() -> None:
    with (
        patch("bokeh.io.notebook.is_marimo_runtime", return_value=True),
        patch("bokeh.io.notebook.anywidget_available", return_value=False),
        pytest.raises(RuntimeError, match=r"pip install bokeh\[notebook\]"),
    ):
        m._require_marimo_anywidget()


class TestDocumentViewHandle:
    def test_connect_sends_revisioned_artifact_snapshot(self) -> None:
        plot = figure()
        document = Document()
        document.add_root(plot)
        comm = MagicMock(comm_id="comm")
        handle = m.DocumentViewHandle(plot, live_id="live", view_id="view")
        handle._attach(document)

        handle._connect(comm)

        snapshot = comm.send.call_args.args[0]
        assert snapshot["kind"] == "snapshot"
        assert snapshot["revision"] == 0
        assert snapshot["resource_id"].startswith("bokeh-")
        artifact = json.loads(snapshot["artifact"])
        assert artifact["schema"] == "bokeh.embed/v1"
        assert artifact["metadata"]["embedding"]["model_ids"] == "protocol-full"
        assert artifact["source"]["documents"][0]["roots"][0]["id"] == plot.id
        handle.close()

    def test_live_updates_are_single_revisioned_patch_messages(self) -> None:
        source = ColumnDataSource(data={"x": [1, 2]})
        document = Document()
        document.add_root(source)
        comm = MagicMock(comm_id="comm")
        handle = m.DocumentViewHandle(source, live_id="live", view_id="view")
        handle._attach(document)
        handle._connect(comm)
        comm.reset_mock()

        with handle:
            source.data = {"x": [3, 4]}
            source.stream({"x": [5]})

        comm.send.assert_called_once()
        envelope = comm.send.call_args.args[0]
        assert envelope["kind"] == "patch"
        assert envelope["revision"] == 1
        assert envelope["content"]["events"]
        assert isinstance(envelope["buffer_ids"], list)
        handle.close()

    def test_scalar_changes_do_not_recompute_model_references(self) -> None:
        root = Div(text="before")
        document = Document()
        document.add_root(root)
        original = Model.references
        with patch.object(Model, "references", autospec=True, side_effect=original) as references:
            handle = m.DocumentViewHandle(root, live_id="live", view_id="view")
            handle._attach(document)
            references.reset_mock()

            root.text = "after"

        references.assert_not_called()
        handle.close()

    def test_newly_referenced_models_send_later_updates(self) -> None:
        root = column(Div())
        document = Document()
        document.add_root(root)
        comm = MagicMock(comm_id="comm")
        handle = m.DocumentViewHandle(root, live_id="live", view_id="view")
        handle._attach(document)
        handle._connect(comm)
        child = Div()

        root.children = [child]
        comm.reset_mock()
        child.text = "updated"

        comm.send.assert_called_once()
        assert comm.send.call_args.args[0]["kind"] == "patch"
        handle.close()

    def test_resync_returns_fresh_snapshot_at_current_revision(self) -> None:
        source = Div(text="before")
        document = Document()
        document.add_root(source)
        comm = MagicMock(comm_id="comm")
        handle = m.DocumentViewHandle(source, live_id="live", view_id="view")
        handle._attach(document)
        handle._connect(comm)
        source.text = "after"
        comm.reset_mock()

        handle._receive("comm", {"content": {"data": {"kind": "resync"}}})

        snapshot = comm.send.call_args.args[0]
        assert snapshot["kind"] == "snapshot"
        assert snapshot["revision"] == 1
        assert snapshot["resource_id"].startswith("bokeh-")
        assert "after" in snapshot["artifact"]
        handle.close()

    def test_resync_negotiates_resources_added_by_live_models(self) -> None:
        plot = figure()
        layout = column(plot)
        document = Document()
        document.add_root(layout)
        comm = MagicMock(comm_id="comm")
        handle = m.DocumentViewHandle(layout, live_id="live", view_id="view")
        handle._attach(document)
        handle._connect(comm)
        initial = comm.send.call_args.args[0]

        layout.children = [plot, Slider(start=0, end=1, value=0)]
        comm.reset_mock()
        handle._receive("comm", {"content": {"data": {"kind": "resync"}}})

        updated = comm.send.call_args.args[0]
        artifact = json.loads(updated["artifact"])
        assert "bokeh/widgets" in artifact["requires"]["components"]
        assert updated["resource_id"] != initial["resource_id"]
        handle.close()

    def test_broadcast_serializes_binary_buffers_once_for_all_frontends(self) -> None:
        root = Div()
        handle = m.DocumentViewHandle(root, live_id="live", view_id="view")
        first = MagicMock()
        second = MagicMock()
        handle._comms = {"first": first, "second": second}
        buffer = MagicMock(id="buffer", to_bytes=MagicMock(return_value=b"binary"))
        message = MagicMock(content={"events": []}, buffers=[buffer])

        with patch("bokeh.protocol.patch_doc", return_value=message):
            handle._broadcast([MagicMock()])

        buffer.to_bytes.assert_called_once_with()
        assert first.send.call_args.kwargs["buffers"] is second.send.call_args.kwargs["buffers"]

    def test_one_comm_close_does_not_destroy_other_views(self) -> None:
        plot = figure()
        document = Document()
        document.add_root(plot)
        first = MagicMock(comm_id="first")
        second = MagicMock(comm_id="second")
        handle = m.DocumentViewHandle(plot, live_id="live", view_id="view")
        handle._attach(document)
        handle._connect(first)
        handle._connect(second)

        first.on_close.call_args.args[0]({})

        assert not handle.closed
        assert handle.views == 1
        handle.close()
        second.close.assert_called_once()

    def test_close_is_idempotent_and_releases_all_ownership(self) -> None:
        plot = figure()
        document = Document()
        document.add_root(plot)
        comm = MagicMock(comm_id="comm")
        handle = m.DocumentViewHandle(plot, live_id="live", view_id="view")
        handle._attach(document)
        m._retain_document_handle(handle)
        handle._connect(comm)
        comm.reset_mock()

        handle.close()
        handle.close()

        assert handle.closed
        assert "live" not in m._DOCUMENT_VIEW_HANDLES
        assert "view" not in m._DOCUMENT_VIEW_HANDLES_BY_VIEW
        comm.close.assert_called_once()


def test_comm_release_message_closes_the_output_owner() -> None:
    pytest.importorskip("IPython")
    targets: dict[str, object] = {}
    shell = MagicMock()
    shell.kernel.comm_manager.register_target.side_effect = lambda target, callback: targets.setdefault(target, callback)
    plot = figure()
    handle = m.DocumentViewHandle(plot, live_id="live", view_id="view")
    m._retain_document_handle(handle)
    comm = MagicMock()

    with patch("IPython.get_ipython", return_value=shell):
        import bokeh.io.notebook as module
        module._NOTEBOOK_COMM_KERNEL = None
        module._register_notebook_comm_target()
    callback = cast(Callable[[Any, dict[str, Any]], None], targets["bokeh.notebook.v1"])
    callback(comm, {"content": {"data": {"kind": "release", "view_id": "view"}}})

    assert handle.closed
    comm.send.assert_called_once_with({"kind": "released", "view_id": "view"})
    comm.close.assert_called_once()


def test_show_hosted_app_uses_server_artifact_and_view_ownership() -> None:
    app = MagicMock()
    app.stopped = False
    app.url = "http://127.0.0.1:4321/app"
    app.application_id = "application"
    with (
        patch("bokeh.io.notebook.anywidget_available", return_value=False),
        patch("bokeh.io.notebook._ensure_notebook_resources", return_value="resource"),
        patch("bokeh.io.notebook._register_notebook_comm_target"),
        patch("bokeh.io.notebook.publish_display_data") as publish,
    ):
        handle = m.show_hosted_app(app)

    assert isinstance(handle, m.ApplicationViewHandle)
    data = publish.call_args.args[0]
    payload = data[DISPLAY_MIME_TYPE]
    assert payload["kind"] == "artifact"
    assert payload["source_kind"] == "server"
    assert payload["application_id"] == "application"
    assert "application_url" not in payload
    assert payload["view_id"] in m._APPLICATION_VIEW_HANDLES
    assert "data-bokeh-embed-payload" not in data["text/html"]
    assert "data-bokeh-notebook-static-fallback" in data["text/html"]
    handle.close()


def test_application_view_accepts_only_a_transient_frontend_application_url() -> None:
    local_url = "http://127.0.0.1:4321/bokeh-notebook/nonce/"
    browser_url = "https://jupyter.example/proxy/4321/bokeh-notebook/nonce"
    app = MagicMock(application_id="application")
    app._resolve_browser_url.return_value = browser_url
    artifact = embed_server(local_url, metadata={"notebook_application_id": "application"})
    handle = m.ApplicationViewHandle(app, "view", artifact)
    comm = MagicMock(comm_id="comm")

    handle._connect(comm)
    configure = comm.send.call_args.args[0]
    callback = comm.on_msg.call_args.args[0]
    callback({"content": {"data": {"kind": "application_url", "application_url": browser_url}}})

    message = comm.send.call_args.args[0]
    returned = EmbedResult.from_dict(json.loads(message["artifact"]))
    assert configure["kind"] == "configure"
    assert EmbedResult.from_dict(json.loads(configure["artifact"])) == artifact
    assert message["kind"] == "ready"
    assert returned.source["url"] == browser_url
    app._resolve_browser_url.assert_called_once_with(browser_url)
    handle.close()
