from __future__ import annotations

# Standard library imports
from typing import Any
from unittest.mock import patch

# External imports
import pytest

# Bokeh imports
from bokeh.io.jupyter_app import (
    _APPLICATIONS,
    _CELL_APPLICATIONS,
    NotebookApplication,
    serve,
)


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
    _APPLICATIONS.clear()
    _CELL_APPLICATIONS.clear()
    _Host.instances.clear()
    yield
    _APPLICATIONS.clear()
    _CELL_APPLICATIONS.clear()


def _modify_document(_document: Any) -> None:
    pass


def test_serve_replaces_a_reexecuted_cell_owner_and_stops_cleanly() -> None:
    with patch("bokeh.io.jupyter_app._ASGIServerThread", _Host):
        first = serve(_modify_document, key="cell")
        second = serve(_modify_document, key="cell")

    assert first.stopped
    assert _Host.instances[0].starts == 1
    assert _Host.instances[0].stops == 1
    assert second.application_id in _APPLICATIONS
    assert _CELL_APPLICATIONS["cell"] is second

    with patch("bokeh.io.notebook._close_application_views") as close_views:
        second.stop()
        second.stop()
    close_views.assert_called_once_with(second)
    assert _Host.instances[1].stops == 1
    assert second.application_id not in _APPLICATIONS
    assert "cell" not in _CELL_APPLICATIONS


def test_notebook_application_rejects_non_loopback_binding_and_persisted_tokens() -> None:
    with pytest.raises(ValueError, match="must bind to loopback"):
        NotebookApplication(_modify_document, address="0.0.0.0")
    with pytest.raises(ValueError, match="query string or fragment"):
        NotebookApplication(_modify_document, notebook_url="https://example.test/lab/?token=secret")


def test_failed_host_start_is_not_registered() -> None:
    class FailingHost(_Host):
        def start(self) -> None:
            raise RuntimeError("cannot bind")

    with (
        patch("bokeh.io.jupyter_app._ASGIServerThread", FailingHost),
        pytest.raises(RuntimeError, match="cannot bind"),
    ):
        serve(_modify_document, key="failed")

    assert _APPLICATIONS == {}
    assert _CELL_APPLICATIONS == {}
