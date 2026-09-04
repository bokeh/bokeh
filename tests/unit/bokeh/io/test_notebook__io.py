from __future__ import annotations

# Standard library imports
import json
import sys
import types
from unittest.mock import MagicMock, patch

# External imports
import pytest

# Bokeh imports
from bokeh.document import Document
from bokeh.embed import embed_server
from bokeh.embed.artifact import EmbedArtifact
from bokeh.embed.notebook import notebook_content
from bokeh.embed.resources import ResourcePolicy
from bokeh.io.jupyter import DISPLAY_MIME_TYPE, PROTOCOL_VERSION
from bokeh.io.state import State
from bokeh.layouts import column
from bokeh.models import ColumnDataSource, Div, Slider
from bokeh.plotting import figure
from bokeh.resources import Resources

# Module under test
import bokeh.io.notebook as m # isort:skip


@pytest.fixture(autouse=True)
def reset() -> None:
    m._reset_notebook_resources()


def test_show_doc_publishes_one_artifact_owned_output() -> None:
    plot = figure(width=300, height=200)
    state = State()
    with (
        patch("bokeh.io.notebook._use_anywidget", return_value=False),
        patch("bokeh.io.notebook._ensure_notebook_resources", return_value="resource"),
        patch("bokeh.io.notebook._register_notebook_comm_target"),
        patch("bokeh.io.notebook.publish_display_data") as publish,
    ):
        handle = m.show_doc(plot, state)

    publish.assert_called_once()
    data = publish.call_args.args[0]
    payload = data[DISPLAY_MIME_TYPE]
    html = data["text/html"]
    assert payload["protocol_version"] == PROTOCOL_VERSION
    assert payload["kind"] == "artifact"
    assert payload["resource_id"] == "resource"
    assert payload["live_id"] in m._DOCUMENT_VIEW_HANDLES
    assert payload["view_id"] in m._DOCUMENT_VIEW_HANDLES_BY_VIEW
    assert html.count("data-bokeh-artifact-payload") == 1
    assert "data-bokeh-notebook-static-fallback" in html
    assert "docs_json" not in html
    assert "embed_items_notebook" not in html
    assert handle is m._DOCUMENT_VIEW_HANDLES[payload["live_id"]]
    handle.close()
    assert plot not in state.document.roots


def test_show_doc_wraps_sequences_in_one_layout_artifact() -> None:
    first, second = Div(), Div()
    state = State()
    with (
        patch("bokeh.io.notebook._use_anywidget", return_value=False),
        patch("bokeh.io.notebook._ensure_notebook_resources", return_value="resource"),
        patch("bokeh.io.notebook._register_notebook_comm_target"),
        patch("bokeh.io.notebook.publish_display_data"),
    ):
        handle = m.show_doc([first, second], state)

    [root] = state.document.roots
    assert list(root.children) == [first, second]
    handle.close()
    assert state.document.roots == []


def test_repeated_displays_share_output_root_until_final_handle_closes() -> None:
    plot = figure()
    state = State()
    with (
        patch("bokeh.io.notebook._use_anywidget", return_value=False),
        patch("bokeh.io.notebook._ensure_notebook_resources", return_value="resource"),
        patch("bokeh.io.notebook._register_notebook_comm_target"),
        patch("bokeh.io.notebook.publish_display_data"),
    ):
        first = m.show_doc(plot, state)
        second = m.show_doc(plot, state)

    first.close()
    assert plot in state.document.roots
    second.close()
    assert plot not in state.document.roots


def test_preexisting_document_root_is_not_owned_by_output() -> None:
    plot = figure()
    state = State()
    state.document.add_root(plot)
    with (
        patch("bokeh.io.notebook._use_anywidget", return_value=False),
        patch("bokeh.io.notebook._ensure_notebook_resources", return_value="resource"),
        patch("bokeh.io.notebook._register_notebook_comm_target"),
        patch("bokeh.io.notebook.publish_display_data"),
    ):
        handle = m.show_doc(plot, state)

    handle.close()
    assert plot in state.document.roots


def test_handle_eviction_releases_its_output_root() -> None:
    first_plot, second_plot = figure(), figure()
    state = State()
    with (
        patch("bokeh.io.notebook._MAX_RETAINED_VIEW_HANDLES", 1),
        patch("bokeh.io.notebook._use_anywidget", return_value=False),
        patch("bokeh.io.notebook._ensure_notebook_resources", return_value="resource"),
        patch("bokeh.io.notebook._register_notebook_comm_target"),
        patch("bokeh.io.notebook.publish_display_data"),
    ):
        first = m.show_doc(first_plot, state)
        second = m.show_doc(second_plot, state)

    assert first.closed
    assert first_plot not in state.document.roots
    assert second_plot in state.document.roots
    second.close()


def test_automatic_mimebundle_has_one_static_artifact_and_no_live_owner() -> None:
    plot = figure()
    with (
        patch("bokeh.io.notebook.notebook_environment", return_value=True),
        patch("bokeh.io.notebook._is_marimo_runtime", return_value=False),
        patch("bokeh.io.notebook._ensure_notebook_resources", return_value="resource"),
    ):
        bundle = m.notebook_mimebundle(plot)

    assert bundle is not None
    data, metadata = bundle
    assert data[DISPLAY_MIME_TYPE]["kind"] == "artifact"
    assert "live_id" not in data[DISPLAY_MIME_TYPE]
    assert data["text/html"].count("data-bokeh-artifact-payload") == 1
    assert metadata[DISPLAY_MIME_TYPE]["automatic"] is True


def test_colab_static_output_uses_one_common_isolated_artifact_fragment() -> None:
    with (
        patch("bokeh.io.notebook.notebook_environment", return_value=True),
        patch("bokeh.io.notebook._is_marimo_runtime", return_value=False),
        patch("bokeh.io.notebook._is_colab_runtime", return_value=True),
        patch("bokeh.io.notebook._anywidget_available", return_value=False),
        patch("bokeh.io.notebook._ensure_notebook_resources") as ensure,
    ):
        bundle = m.notebook_mimebundle(figure(), resources=Resources(mode="inline"))

    assert bundle is not None
    data, _metadata = bundle
    assert data[DISPLAY_MIME_TYPE]["kind"] == "artifact"
    assert data["text/html"].count("data-bokeh-artifact-payload") == 1
    assert "Bokeh.mount_artifact_declaration" in data["text/html"]
    assert len(data["text/html"]) > 100_000
    ensure.assert_not_called()


def test_colab_connected_output_requires_anywidget() -> None:
    with (
        patch("bokeh.io.notebook._use_anywidget", return_value=False),
        patch("bokeh.io.notebook._is_colab_runtime", return_value=True),
        pytest.raises(RuntimeError, match="Connected Bokeh output in Colab requires AnyWidget"),
    ):
        m.show_doc(figure(), State())


@pytest.mark.parametrize("policy", [
    ResourcePolicy(mode="inline"),
    ResourcePolicy(mode="offline"),
    ResourcePolicy(mode="cdn", nonce="csp-nonce", crossorigin="anonymous"),
    ResourcePolicy(mode="none"),
])
def test_notebook_resource_resolution_preserves_explicit_host_policy(policy: ResourcePolicy) -> None:
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
    assert m._is_marimo_runtime()


def test_marimo_without_anywidget_has_actionable_install_error() -> None:
    with (
        patch("bokeh.io.notebook._is_marimo_runtime", return_value=True),
        patch("bokeh.io.notebook._anywidget_available", return_value=False),
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
        assert artifact["metadata"]["compiler"]["model_ids"] == "protocol-full"
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
        m._DOCUMENT_VIEW_HANDLES["live"] = handle
        m._DOCUMENT_VIEW_HANDLES_BY_VIEW["view"] = handle
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
    m._DOCUMENT_VIEW_HANDLES["live"] = handle
    m._DOCUMENT_VIEW_HANDLES_BY_VIEW["view"] = handle
    comm = MagicMock()

    with patch("IPython.get_ipython", return_value=shell):
        import bokeh.io.notebook as module
        module._NOTEBOOK_COMM_KERNEL = None
        module._register_notebook_comm_target()
    callback = targets["bokeh.notebook.v1"]
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
        patch("bokeh.io.notebook._use_anywidget", return_value=False),
        patch("bokeh.io.notebook._ensure_notebook_resources", return_value="resource"),
        patch("bokeh.io.notebook._register_notebook_comm_target"),
        patch("bokeh.io.notebook.publish_display_data") as publish,
    ):
        handle = m.show_hosted_app(app, State())

    assert isinstance(handle, m.ApplicationViewHandle)
    data = publish.call_args.args[0]
    payload = data[DISPLAY_MIME_TYPE]
    assert payload["kind"] == "artifact"
    assert payload["source_kind"] == "server"
    assert payload["application_id"] == "application"
    assert payload["application_url"] == app.url
    assert payload["view_id"] in m._APPLICATION_VIEW_HANDLES
    assert data["text/html"].count("data-bokeh-artifact-payload") == 1
    handle.close()


def test_application_view_returns_a_refingerprinted_browser_artifact() -> None:
    local_url = "http://127.0.0.1:4321/bokeh-notebook/nonce/"
    browser_url = "https://hub.example.test/user/alice/proxy/4321/bokeh-notebook/nonce/"
    app = MagicMock(application_id="application")
    app._resolve_browser_url.return_value = browser_url.rstrip("/")
    artifact = embed_server(local_url, metadata={"notebook_application_id": "application"})
    handle = m.ApplicationViewHandle(app, "view", artifact)
    comm = MagicMock(comm_id="comm")

    handle._connect(comm, browser_url)

    message = comm.send.call_args.args[0]
    returned = EmbedArtifact.from_dict(json.loads(message["artifact"]))
    assert message["kind"] == "ready"
    assert returned.source["url"] == browser_url.rstrip("/")
    assert returned.fingerprint != artifact.fingerprint
    handle.close()
