from __future__ import annotations

# Standard library imports
import sys
from collections.abc import Iterator
from typing import Any
from unittest.mock import MagicMock, patch

# External imports
import pytest

# Module under test
import bokeh.io.jupyter_app as m # isort:skip


class _Host:
    instances: list[_Host] = []

    def __init__(self, application: Any, *, address: str, port: int, **kwargs: Any) -> None:
        del application, kwargs
        self.address = address
        self.port = port or 4300 + len(self.instances)
        self.starts = 0
        self.stops = 0
        self.instances.append(self)

    def start(self) -> None:
        self.starts += 1

    def stop(self) -> None:
        self.stops += 1


@pytest.fixture(autouse=True)
def reset_applications() -> Iterator[None]:
    m.APPLICATIONS.clear()
    m._KEY_APPLICATIONS.clear()
    m._CELL_APPLICATIONS.clear()
    _Host.instances.clear()
    yield
    m.APPLICATIONS.clear()
    m._KEY_APPLICATIONS.clear()
    m._CELL_APPLICATIONS.clear()


def _modify_document(_document: Any) -> None:
    pass


def test_serve_replaces_a_reexecuted_cell_owner_and_stops_cleanly() -> None:
    with patch("bokeh.io.jupyter_app._ASGIServerThread", _Host):
        first = m.serve(_modify_document, key="cell")
        second = m.serve(_modify_document, key="cell")

    assert first.stopped
    assert _Host.instances[0].starts == 1
    assert _Host.instances[0].stops == 1
    assert second.application_id in m.APPLICATIONS
    assert m._KEY_APPLICATIONS["cell"] is second

    with patch("bokeh.io.notebook.close_application_views") as close_views:
        second.stop()
        second.stop()
    close_views.assert_called_once_with(second)
    assert _Host.instances[1].stops == 1
    assert second.application_id not in m.APPLICATIONS
    assert "cell" not in m._KEY_APPLICATIONS


def test_multiple_apps_in_one_execution_coexist_and_reexecution_replaces_them() -> None:
    with (
        patch("bokeh.io.jupyter_app._ASGIServerThread", _Host),
        patch("bokeh.io.notebook.notebook_cell_identity", return_value=("cell", "first")),
    ):
        first = m.serve(_modify_document)
        sibling = m.serve(_modify_document)

    assert not first.stopped
    assert not sibling.stopped

    with (
        patch("bokeh.io.jupyter_app._ASGIServerThread", _Host),
        patch("bokeh.io.notebook.notebook_cell_identity", return_value=("cell", "second")),
    ):
        replacement = m.serve(_modify_document)

    assert first.stopped
    assert sibling.stopped
    assert replacement.status == "running"
    replacement.stop()


def test_notebook_application_rejects_non_loopback_binding_and_persisted_tokens() -> None:
    with pytest.raises(ValueError, match="must bind to loopback"):
        m.NotebookApplication(_modify_document, address="0.0.0.0")
    with pytest.raises(ValueError, match="query string or fragment"):
        m.NotebookApplication(_modify_document, notebook_url="https://example.test/lab/?token=secret")


def test_notebook_application_accepts_only_its_frontend_jupyter_proxy_route() -> None:
    with patch("bokeh.io.jupyter_app._ASGIServerThread", _Host):
        app = m.NotebookApplication(_modify_document)
    try:
        url = f"https://hub.example.test/user/alice/proxy/{app.port}/{app._prefix}/"
        assert app._resolve_browser_url(url) == url.rstrip("/")
        assert app._resolve_browser_url(url.rstrip("/")) == url.rstrip("/")
        assert app._resolve_browser_url(app.url.rstrip("/")) == app.url.rstrip("/")
        assert "hub.example.test" in app.asgi.core.websocket_origins
        with pytest.raises(ValueError, match="invalid Jupyter application proxy URL"):
            app._resolve_browser_url(f"https://hub.example.test/user/alice/proxy/{app.port}/other/")
    finally:
        app.stop()


def test_explicit_notebook_url_takes_precedence_over_frontend_discovery() -> None:
    with patch("bokeh.io.jupyter_app._ASGIServerThread", _Host):
        app = m.NotebookApplication(_modify_document, notebook_url="https://apps.example.test/base/")
    try:
        discovered = f"https://hub.example.test/user/alice/proxy/{app.port}/{app._prefix}/"
        assert app._resolve_browser_url(discovered) == app.url.rstrip("/")
        assert "apps.example.test" in app.asgi.core.websocket_origins
        assert "hub.example.test" not in app.asgi.core.websocket_origins
    finally:
        app.stop()


def test_jupyterhub_environment_builds_the_public_proxy_url(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setenv("JUPYTER_BOKEH_EXTERNAL_URL", "https://our-hub.edu")
    monkeypatch.setenv("JUPYTERHUB_SERVICE_PREFIX", "/user/homer@donuts.edu/")
    with patch("bokeh.io.jupyter_app._ASGIServerThread", _Host):
        app = m.NotebookApplication(_modify_document)
    try:
        assert app.url == f"https://our-hub.edu/user/homer@donuts.edu/proxy/{app.port}/{app._prefix}/"
        assert "our-hub.edu" in app.asgi.core.websocket_origins
    finally:
        app.stop()


def test_additional_websocket_origins_are_merged_with_notebook_origins() -> None:
    with patch("bokeh.io.jupyter_app._ASGIServerThread", _Host):
        app = m.NotebookApplication(
            _modify_document,
            extra_websocket_origins=["apps.example.test:443", "localhost:*"],
        )
    try:
        assert {"127.0.0.1:*", "localhost:*", "apps.example.test:443"}.issubset(
            app.asgi.core.websocket_origins,
        )
    finally:
        app.stop()


def test_shutdown_timeout_closes_the_listening_socket() -> None:
    with patch.dict(sys.modules, {"uvicorn": MagicMock()}):
        host = m._ASGIServerThread(MagicMock(), address="127.0.0.1", port=0, shutdown_timeout=0)
    host._socket = MagicMock()
    host._server = MagicMock(should_exit=False, force_exit=False)
    host._thread = MagicMock()

    with pytest.raises(TimeoutError, match="did not stop"):
        host.stop()

    host._socket.close.assert_called_once_with()


def test_failed_host_start_is_not_registered() -> None:
    class FailingHost(_Host):
        def start(self) -> None:
            raise RuntimeError("cannot bind")

    with (
        patch("bokeh.io.jupyter_app._ASGIServerThread", FailingHost),
        pytest.raises(RuntimeError, match="cannot bind"),
    ):
        m.serve(_modify_document, key="failed")

    assert m.APPLICATIONS == {}
    assert m._CELL_APPLICATIONS == {}


def test_failed_stop_is_terminal_and_unregisters_the_application() -> None:
    class FailingStopHost(_Host):
        def stop(self) -> None:
            self.stops += 1
            raise RuntimeError("cannot stop")

    with patch("bokeh.io.jupyter_app._ASGIServerThread", FailingStopHost):
        app = m.serve(_modify_document, key="failed-stop")

    with pytest.raises(RuntimeError, match="cannot stop"):
        app.stop()

    assert app.stopped
    assert app.status == "failed"
    assert app.application_id not in m.APPLICATIONS
    assert "failed-stop" not in m._KEY_APPLICATIONS
    app.stop()
    assert _Host.instances[0].stops == 1


def test_authorized_origin_rejects_persisted_credentials() -> None:
    with pytest.raises(ValueError, match="must not contain credentials"):
        m._authorized_origin("https://user:secret@example.test/notebook/")
    with pytest.raises(ValueError, match="query string or fragment"):
        m._authorized_origin("https://example.test/notebook/?token=secret")
