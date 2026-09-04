from __future__ import annotations

# Standard library imports
from typing import Any
from unittest.mock import patch

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
def reset_applications() -> None:
    m._APPLICATIONS.clear()
    m._CELL_APPLICATIONS.clear()
    _Host.instances.clear()
    yield
    m._APPLICATIONS.clear()
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
    assert second.application_id in m._APPLICATIONS
    assert m._CELL_APPLICATIONS["cell"] is second

    with patch("bokeh.io.notebook._close_application_views") as close_views:
        second.stop()
        second.stop()
    close_views.assert_called_once_with(second)
    assert _Host.instances[1].stops == 1
    assert second.application_id not in m._APPLICATIONS
    assert "cell" not in m._CELL_APPLICATIONS


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


def test_failed_host_start_is_not_registered() -> None:
    class FailingHost(_Host):
        def start(self) -> None:
            raise RuntimeError("cannot bind")

    with (
        patch("bokeh.io.jupyter_app._ASGIServerThread", FailingHost),
        pytest.raises(RuntimeError, match="cannot bind"),
    ):
        m.serve(_modify_document, key="failed")

    assert m._APPLICATIONS == {}
    assert m._CELL_APPLICATIONS == {}


def test_authorized_origin_rejects_persisted_credentials() -> None:
    with pytest.raises(ValueError, match="must not contain credentials"):
        m._authorized_origin("https://user:secret@example.test/notebook/")
    with pytest.raises(ValueError, match="query string or fragment"):
        m._authorized_origin("https://example.test/notebook/?token=secret")
