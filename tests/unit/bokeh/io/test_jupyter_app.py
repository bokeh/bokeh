from __future__ import annotations

import asyncio
import socket
import sys
import types
from collections.abc import Iterator
from typing import Any
from unittest.mock import MagicMock, call, patch

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
    assert second.status == "running"

    with patch("bokeh.io.notebook.close_application_views") as close_views:
        second.stop()
        second.stop()
    close_views.assert_called_once_with(second)
    assert _Host.instances[1].stops == 1
    assert second.stopped


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


def test_serve_supports_callable_objects__issue_13395() -> None:
    class ModifyDocument:
        def __init__(self) -> None:
            self.documents: list[Any] = []

        def __call__(self, document: Any) -> None:
            self.documents.append(document)
            document.title = "callable object"

    modify_document = ModifyDocument()
    with patch("bokeh.io.jupyter_app._ASGIServerThread", _Host):
        app = m.serve(modify_document)
    try:
        document = app.asgi.core.applications["/"].application.create_document()

        assert modify_document.documents == [document]
        assert document.title == "callable object"
    finally:
        app.stop()


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
        assert not app.accepts_frontend_proxy
        discovered = f"https://hub.example.test/user/alice/proxy/{app.port}/{app._prefix}/"
        assert app._resolve_browser_url(discovered) == app.url.rstrip("/")
        assert "apps.example.test" in app.asgi.core.websocket_origins
        assert "hub.example.test" not in app.asgi.core.websocket_origins
    finally:
        app.stop()


def test_callable_notebook_url_receives_the_assigned_port() -> None:
    def proxy_url(port: int | None) -> str:
        return "https://apps.example.test/" if port is None else f"https://apps.example.test/proxy/{port}/"

    notebook_url = MagicMock(side_effect=proxy_url)
    with patch("bokeh.io.jupyter_app._ASGIServerThread", _Host):
        app = m.NotebookApplication(_modify_document, notebook_url=notebook_url)
    try:
        assert notebook_url.call_args_list == [call(None), call(app.port)]
        assert app.url == f"https://apps.example.test/proxy/{app.port}/{app._prefix}/"
        assert app.asgi.core.websocket_origins == {"apps.example.test"}
    finally:
        app.stop()


def test_jupyterhub_environment_builds_the_public_proxy_url(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setenv("JUPYTER_BOKEH_EXTERNAL_URL", "https://our-hub.edu")
    monkeypatch.setenv("JUPYTERHUB_SERVICE_PREFIX", "/user/homer@donuts.edu/")
    with patch("bokeh.io.jupyter_app._ASGIServerThread", _Host):
        app = m.NotebookApplication(_modify_document)
    try:
        assert not app.accepts_frontend_proxy
        assert app.url == f"https://our-hub.edu/user/homer@donuts.edu/proxy/{app.port}/{app._prefix}/"
        assert "our-hub.edu" in app.asgi.core.websocket_origins
    finally:
        app.stop()


@pytest.mark.parametrize("url", [
    "ftp://hub.example.test{path}",
    "https:///missing-host{path}",
    "https://user:secret@hub.example.test{path}",
    "https://hub.example.test{path}?token=secret",
    "https://hub.example.test{path}#fragment",
])
def test_application_rejects_invalid_frontend_proxy_urls(url: str) -> None:
    with patch("bokeh.io.jupyter_app._ASGIServerThread", _Host):
        app = m.NotebookApplication(_modify_document)
    try:
        path = f"/proxy/{app.port}/{app._prefix}/"
        with pytest.raises(ValueError, match="invalid Jupyter application proxy URL"):
            app._resolve_browser_url(url.format(path=path))
    finally:
        app.stop()


def test_additional_websocket_origins_are_merged_with_notebook_origins() -> None:
    with patch("bokeh.io.jupyter_app._ASGIServerThread", _Host):
        app = m.NotebookApplication(
            _modify_document,
            extra_websocket_origins=["apps.example.test", "apps.example.test:443", "localhost:*"],
        )
    try:
        assert {"127.0.0.1:*", "localhost:*", "apps.example.test", "apps.example.test:443"}.issubset(
            app.asgi.core.websocket_origins,
        )
    finally:
        app.stop()


def test_shutdown_timeout_closes_the_listening_socket() -> None:
    with patch.dict(sys.modules, {"uvicorn": MagicMock()}):
        host = m._ASGIServerThread(MagicMock(), address="127.0.0.1", port=0, shutdown_timeout=0)
    listening = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    listening.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
    listening.bind(("127.0.0.1", 0))
    listening.listen()
    address = listening.getsockname()
    host._socket = listening
    host._server = MagicMock(should_exit=False, force_exit=False)
    host._thread = MagicMock()

    with pytest.raises(TimeoutError, match="did not stop"):
        host.stop()

    replacement = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    try:
        replacement.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
        replacement.bind(address)
    finally:
        replacement.close()


def test_host_requires_uvicorn() -> None:
    with (
        patch.dict(sys.modules, {"uvicorn": None}),
        pytest.raises(RuntimeError, match="require Uvicorn"),
    ):
        m._ASGIServerThread(MagicMock(), address="127.0.0.1", port=0)


@pytest.mark.parametrize(("shutdown_finished", "forced"), [
    (True, False),
    (False, True),
])
def test_host_start_timeout_requests_shutdown(shutdown_finished: bool, forced: bool) -> None:
    uvicorn = MagicMock()
    server = MagicMock(started=False, should_exit=False, force_exit=False)
    uvicorn.Server.return_value = server
    with patch.dict(sys.modules, {"uvicorn": uvicorn}):
        host = m._ASGIServerThread(
            MagicMock(), address="127.0.0.1", port=0, startup_timeout=0, shutdown_timeout=1,
        )
    sock = MagicMock()
    sock.getsockname.return_value = ("127.0.0.1", 4300)
    thread = MagicMock()
    finished = MagicMock()
    finished.wait.side_effect = [False, shutdown_finished, shutdown_finished]
    host._finished = finished

    with (
        patch("bokeh.io.jupyter_app.socket.socket", return_value=sock),
        patch("bokeh.io.jupyter_app.threading.Thread", return_value=thread),
        pytest.raises(TimeoutError, match="did not start"),
    ):
        host.start()

    assert server.should_exit
    assert server.force_exit is forced
    assert sock.close.called is forced
    assert host.port == 4300


@pytest.mark.parametrize(("failure", "message"), [
    (RuntimeError("server failed"), "failed during startup"),
    (None, "stopped during startup"),
])
def test_host_reports_startup_termination(failure: BaseException | None, message: str) -> None:
    uvicorn = MagicMock()
    server = MagicMock(started=False)
    uvicorn.Server.return_value = server
    with patch.dict(sys.modules, {"uvicorn": uvicorn}):
        host = m._ASGIServerThread(MagicMock(), address="127.0.0.1", port=0)
    sock = MagicMock()
    sock.getsockname.return_value = ("127.0.0.1", 4300)
    host._failure = failure
    host._finished.set()

    with (
        patch("bokeh.io.jupyter_app.socket.socket", return_value=sock),
        patch("bokeh.io.jupyter_app.threading.Thread"),
        pytest.raises(RuntimeError, match=message),
    ):
        host.start()


@pytest.mark.parametrize(("wait_results", "forced"), [
    ([True], False),
    ([False, True], True),
])
def test_host_stops_gracefully_or_forces_exit(wait_results: list[bool], forced: bool) -> None:
    with patch.dict(sys.modules, {"uvicorn": MagicMock()}):
        host = m._ASGIServerThread(MagicMock(), address="127.0.0.1", port=0)
    host._server = MagicMock(should_exit=False, force_exit=False)
    host._thread = MagicMock()
    host._finished = MagicMock()
    host._finished.is_set.return_value = False
    host._finished.wait.side_effect = wait_results

    host.stop()

    assert host._server.should_exit
    assert host._server.force_exit is forced
    host._thread.join.assert_called_once_with()


def test_host_surfaces_a_failure_during_shutdown() -> None:
    with patch.dict(sys.modules, {"uvicorn": MagicMock()}):
        host = m._ASGIServerThread(MagicMock(), address="127.0.0.1", port=0)
    host._server = MagicMock(should_exit=False)
    host._thread = MagicMock()
    host._finished = MagicMock()
    host._finished.is_set.return_value = False
    host._finished.wait.return_value = True
    host._failure = RuntimeError("server failed")

    with pytest.raises(RuntimeError, match="failed during shutdown"):
        host.stop()

    host._thread.join.assert_called_once_with()


def test_host_reports_prestart_and_thread_failures() -> None:
    with patch.dict(sys.modules, {"uvicorn": MagicMock()}):
        host = m._ASGIServerThread(MagicMock(), address="127.0.0.1", port=0)
    with pytest.raises(RuntimeError, match="has not started"):
        _ = host.port

    host._server = MagicMock()
    host._server.run.side_effect = RuntimeError("server failed")
    host._socket = MagicMock()
    host._run()

    assert isinstance(host._failure, RuntimeError)
    host._socket.close.assert_called_once_with()
    assert host._finished.is_set()


def test_host_closes_a_socket_when_binding_or_prestart_stop_fails() -> None:
    with patch.dict(sys.modules, {"uvicorn": MagicMock()}):
        host = m._ASGIServerThread(MagicMock(), address="127.0.0.1", port=0)
    sock = MagicMock()
    sock.bind.side_effect = OSError("cannot bind")
    with (
        patch("bokeh.io.jupyter_app.socket.socket", return_value=sock),
        pytest.raises(OSError, match="cannot bind"),
    ):
        host.start()
    sock.close.assert_called_once_with()

    host._socket = MagicMock()
    host.stop()
    host._socket.close.assert_called_once_with()


def test_host_surfaces_a_failure_that_finished_before_stop() -> None:
    with patch.dict(sys.modules, {"uvicorn": MagicMock()}):
        host = m._ASGIServerThread(MagicMock(), address="127.0.0.1", port=0)
    host._failure = RuntimeError("server failed")
    host._finished.set()
    with pytest.raises(RuntimeError, match="ASGI notebook application failed"):
        host.stop()


def test_failed_host_start_is_not_registered() -> None:
    class FailingHost(_Host):
        def start(self) -> None:
            raise RuntimeError("cannot bind")

    with (
        patch("bokeh.io.jupyter_app._ASGIServerThread", FailingHost),
        pytest.raises(RuntimeError, match="cannot bind"),
    ):
        m.serve(_modify_document, key="failed")
    assert not m.APPLICATIONS

    with patch("bokeh.io.jupyter_app._ASGIServerThread", _Host):
        replacement = m.serve(_modify_document, key="failed")
    assert replacement.status == "running"
    replacement.stop()


def test_replacement_and_interpreter_cleanup_tolerate_stop_failures() -> None:
    with patch("bokeh.io.jupyter_app._ASGIServerThread", _Host):
        first = m.serve(_modify_document, key="replace")
    first.stop = MagicMock(side_effect=RuntimeError("cannot stop"))  # type: ignore[method-assign]
    with patch("bokeh.io.jupyter_app._ASGIServerThread", _Host):
        replacement = m.serve(_modify_document, key="replace")
    assert replacement.status == "running"

    replacement.stop = MagicMock(side_effect=RuntimeError("cannot stop"))  # type: ignore[method-assign]
    m._stop_all_applications()


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
    app.stop()
    assert _Host.instances[0].stops == 1


def test_application_accepts_paths() -> None:
    built = MagicMock()
    with (
        patch("bokeh.command.util.build_single_handler_application", return_value=built) as build,
        patch("bokeh.io.jupyter_app._ASGIServerThread", _Host),
    ):
        app = m.NotebookApplication("application.py")
    build.assert_called_once_with("application.py")
    app.stop()


def test_application_accepts_modules_with_source_files() -> None:
    built = MagicMock()
    module = types.ModuleType("application")
    module.__file__ = "/tmp/application.py"
    with (
        patch("bokeh.command.util.build_single_handler_application", return_value=built) as build,
        patch("bokeh.io.jupyter_app._ASGIServerThread", _Host),
    ):
        app = m.NotebookApplication(module)
    build.assert_called_once_with("/tmp/application.py")
    app.stop()


def test_application_rejects_sourceless_modules() -> None:
    module = types.ModuleType("application")
    module.__file__ = None
    with pytest.raises(ValueError, match="has no source file"):
        m.NotebookApplication(module)


def test_application_rejects_bad_origins() -> None:
    with pytest.raises(TypeError, match="sequence"):
        m.NotebookApplication(_modify_document, extra_websocket_origins="example.test")
    with pytest.raises(ValueError, match="Invalid port"):
        m.NotebookApplication(_modify_document, extra_websocket_origins=["example.test:invalid"])


def test_application_setup_failure_stops_the_started_host() -> None:
    with (
        patch("bokeh.io.jupyter_app._ASGIServerThread", _Host),
        patch("bokeh.io.jupyter_app._authorized_origin", side_effect=ValueError("invalid origin")),
        pytest.raises(ValueError, match="invalid origin"),
    ):
        m.NotebookApplication(_modify_document)

    assert _Host.instances[0].stops == 1


def test_application_setup_failure_preserves_the_original_error_when_cleanup_fails() -> None:
    class FailingStopHost(_Host):
        def stop(self) -> None:
            self.stops += 1
            raise RuntimeError("cleanup failed")

    with (
        patch("bokeh.io.jupyter_app._ASGIServerThread", FailingStopHost),
        patch("bokeh.io.jupyter_app._authorized_origin", side_effect=ValueError("invalid origin")),
        pytest.raises(ValueError, match="invalid origin"),
    ):
        m.NotebookApplication(_modify_document)

    assert _Host.instances[0].stops == 1


def test_application_repr_async_stop_and_stopped_url() -> None:
    with patch("bokeh.io.jupyter_app._ASGIServerThread", _Host):
        app = m.NotebookApplication(_modify_document)
    assert "status='running'" in repr(app)
    with pytest.raises(ValueError, match="non-string"):
        app._resolve_browser_url(object())

    asyncio.run(app.stop_async())
    with pytest.raises(RuntimeError, match="has been stopped"):
        _ = app.url


def test_application_reports_view_cleanup_before_host_cleanup() -> None:
    class FailingStopHost(_Host):
        def stop(self) -> None:
            raise RuntimeError("host failure")

    with patch("bokeh.io.jupyter_app._ASGIServerThread", FailingStopHost):
        app = m.NotebookApplication(_modify_document)
    with (
        patch("bokeh.io.notebook.close_application_views", side_effect=ValueError("view failure")),
        pytest.raises(ValueError, match="view failure"),
    ):
        app.stop()

    assert app.stopped


def test_authorized_origin_rejects_persisted_credentials() -> None:
    with pytest.raises(ValueError, match="valid origin"):
        m._authorized_origin("file:///tmp/application")
    with pytest.raises(ValueError, match="must not contain credentials"):
        m._authorized_origin("https://user:secret@example.test/notebook/")
    with pytest.raises(ValueError, match="query string or fragment"):
        m._authorized_origin("https://example.test/notebook/?token=secret")
