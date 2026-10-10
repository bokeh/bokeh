#-----------------------------------------------------------------------------
# Copyright (c) Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------
''' Managed ASGI Bokeh applications intended for notebook display. '''

from __future__ import annotations

# Standard library imports
import asyncio
import atexit
import logging
import os
import secrets
import socket
import threading
import time
from collections.abc import Callable, Sequence
from os import PathLike as OSPathLike, fspath
from types import ModuleType
from typing import TYPE_CHECKING, Any
from urllib.parse import urlparse
from uuid import uuid4

log = logging.getLogger(__name__)

if TYPE_CHECKING:
    from ..application import Application
    from ..document import Document
    from ..server.asgi import BokehASGI
    from .notebook import ProxyUrlFunc

__all__ = ("NotebookApplication", "serve")


class _ASGIServerThread:
    ''' Run one ASGI application on a private Uvicorn event loop. '''

    def __init__(self, application: BokehASGI, *, address: str, port: int,
            startup_timeout: float = 10, shutdown_timeout: float = 10,
            **uvicorn_kwargs: Any) -> None:
        try:
            import uvicorn
        except ImportError as error:
            raise RuntimeError(
                "Notebook applications require Uvicorn; install Bokeh with its notebook dependencies",
            ) from error

        self._uvicorn = uvicorn
        self._application = application
        self._address = address
        self._requested_port = port
        self._uvicorn_kwargs = {"log_config": None, "loop": "asyncio", **uvicorn_kwargs}
        self._socket: socket.socket | None = None
        self._port: int | None = None
        self._startup_timeout = startup_timeout
        self._shutdown_timeout = shutdown_timeout
        self._failure: BaseException | None = None
        self._finished = threading.Event()
        self._server: Any | None = None
        self._thread: threading.Thread | None = None

    @property
    def port(self) -> int:
        '''Return the assigned server port.

        Returns:
            The assigned server port.

        '''
        if self._port is None:
            raise RuntimeError("ASGI notebook application has not started")
        return self._port

    def _run(self) -> None:
        try:
            assert self._server is not None
            assert self._socket is not None
            self._server.run(sockets=[self._socket])
        except BaseException as error:
            self._failure = error
        finally:
            if self._socket is not None:
                self._socket.close()
            self._finished.set()

    def start(self) -> None:
        '''Start the private ASGI server thread.

        Returns:
            None

        '''
        self._socket = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        self._socket.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
        try:
            self._socket.bind((self._address, self._requested_port))
            self._socket.listen(128)
        except Exception:
            self._socket.close()
            raise
        port = self._socket.getsockname()[1]
        self._port = port
        config = self._uvicorn.Config(
            self._application,
            host=self._address,
            port=port,
            lifespan="on",
            log_level="warning",
            access_log=False,
            **self._uvicorn_kwargs,
        )
        server = self._uvicorn.Server(config)
        self._server = server
        self._thread = threading.Thread(
            target=self._run,
            name=f"bokeh-notebook-asgi-{port}",
            daemon=True,
        )
        self._thread.start()
        deadline = time.monotonic() + self._startup_timeout
        while not server.started and not self._finished.wait(0.01):
            if time.monotonic() >= deadline:
                server.should_exit = True
                if not self._finished.wait(self._shutdown_timeout):
                    server.force_exit = True
                    self._socket.close()
                    self._finished.wait(self._shutdown_timeout)
                raise TimeoutError(f"ASGI notebook application did not start within {self._startup_timeout:g} seconds")
        if self._failure is not None:
            raise RuntimeError("ASGI notebook application failed during startup") from self._failure
        if not server.started:
            raise RuntimeError("ASGI notebook application stopped during startup")

    def stop(self) -> None:
        '''Stop the private ASGI server thread.

        Returns:
            None

        '''
        if self._finished.is_set():
            if self._failure is not None:
                raise RuntimeError("ASGI notebook application failed") from self._failure
            return
        if self._server is None or self._thread is None:
            if self._socket is not None:
                self._socket.close()
            return
        self._server.should_exit = True
        if not self._finished.wait(self._shutdown_timeout):
            self._server.force_exit = True
            if not self._finished.wait(self._shutdown_timeout):
                if self._socket is not None:
                    self._socket.close()
                raise TimeoutError(f"ASGI notebook application did not stop within {self._shutdown_timeout:g} seconds")
        self._thread.join()
        if self._failure is not None:
            raise RuntimeError("ASGI notebook application failed during shutdown") from self._failure

#-----------------------------------------------------------------------------
# Dev API
#-----------------------------------------------------------------------------

APPLICATIONS: dict[str, NotebookApplication] = {}
_KEY_APPLICATIONS: dict[str, NotebookApplication] = {}
_CELL_APPLICATIONS: dict[str, tuple[str, list[NotebookApplication]]] = {}
_APPLICATIONS_LOCK = threading.RLock()
_APPLICATION_START_LOCK = threading.Lock()


def _start_and_register_application(application: NotebookApplication, key: str | None,
        cell_identity: tuple[str, str] | None) -> None:
    # Serialize replacement decisions without holding the registry lock while
    # stopping an app. stop() unregisters under _APPLICATIONS_LOCK, and taking
    # these locks in the opposite order would deadlock with stop_async().
    with _APPLICATION_START_LOCK:
        with _APPLICATIONS_LOCK:
            if key is not None:
                previous = (_KEY_APPLICATIONS.get(key),)
            elif cell_identity is not None:
                cell_id, execution_id = cell_identity
                current = _CELL_APPLICATIONS.get(cell_id)
                previous = tuple(current[1]) if current is not None and current[0] != execution_id else ()
            else:
                previous = ()
        for prior in previous:
            if prior is None or prior is application:
                continue
            try:
                # Stop before binding the new host so a stable explicit port
                # can be reused when a serve cell is executed again.
                prior.stop()
            except Exception:
                log.warning("Could not stop a replaced notebook application", exc_info=True)
        application._host.start()
        with _APPLICATIONS_LOCK:
            APPLICATIONS[application.application_id] = application
            if key is not None:
                _KEY_APPLICATIONS[key] = application
            elif cell_identity is not None:
                cell_id, execution_id = cell_identity
                current = _CELL_APPLICATIONS.get(cell_id)
                siblings = current[1] if current is not None and current[0] == execution_id else []
                siblings.append(application)
                _CELL_APPLICATIONS[cell_id] = (execution_id, siblings)


def _unregister_application(application: NotebookApplication) -> None:
    with _APPLICATIONS_LOCK:
        APPLICATIONS.pop(application.application_id, None)
        for key, current in tuple(_KEY_APPLICATIONS.items()):
            if current is application:
                del _KEY_APPLICATIONS[key]
        for cell_id, (execution_id, applications) in tuple(_CELL_APPLICATIONS.items()):
            remaining = [current for current in applications if current is not application]
            if remaining:
                _CELL_APPLICATIONS[cell_id] = (execution_id, remaining)
            else:
                del _CELL_APPLICATIONS[cell_id]


def _stop_all_applications() -> None:
    with _APPLICATIONS_LOCK:
        applications = tuple(APPLICATIONS.values())
    for application in applications:
        try:
            application.stop()
        except Exception:
            log.debug("Could not stop notebook application at interpreter shutdown", exc_info=True)


atexit.register(_stop_all_applications)

#-----------------------------------------------------------------------------
# General API
#-----------------------------------------------------------------------------


class NotebookApplication:
    ''' A running ASGI Bokeh application that can be shown in any later cell.

    Each call to ``show(app)`` creates an independent browser session. Clearing
    one output closes only that view and session. The ASGI application remains
    alive until :meth:`stop` is called or the kernel exits.

    Args:
        application:
            An Application, document-modifying callable, imported Python
            module, ``.py`` or ``.ipynb`` path, or directory-style app.
        notebook_url:
            An optional public notebook URL or proxy URL callback. JupyterLab
            and Notebook 7 discover their browser route automatically when
            this is omitted and ``jupyter-server-proxy`` is installed.
        port:
            The loopback port, or zero to allocate an unused port.
        key:
            An optional stable replacement key. Starting another application
            with the same key stops this application first.
        address:
            The loopback address on which to host the application.
        extra_websocket_origins:
            Additional ``host[:port]`` patterns allowed to open WebSockets.
        uvicorn_kwargs:
            Additional keyword arguments for the private Uvicorn host.
        server_kwargs:
            Additional keyword arguments for :class:`~bokeh.server.asgi.BokehASGI`.

    '''

    def __init__(self, application: Application | Callable[[Document], None] | ModuleType | str | OSPathLike[str], *,
            notebook_url: str | ProxyUrlFunc | None = None, port: int = 0, key: str | None = None,
            address: str = "127.0.0.1", extra_websocket_origins: Sequence[str] | None = None,
            uvicorn_kwargs: dict[str, Any] | None = None,
            **server_kwargs: Any) -> None:
        from ..server.asgi import BokehASGI
        from .notebook import (
            DEFAULT_JUPYTER_URL,
            notebook_cell_identity,
            server_url,
            update_notebook_url_from_env,
        )

        if address not in ("127.0.0.1", "localhost"):
            raise ValueError("Notebook applications must bind to loopback and use a trusted proxy for remote access")

        if isinstance(application, (str, OSPathLike, ModuleType)):
            from ..command.util import build_single_handler_application

            if isinstance(application, ModuleType):
                if application.__file__ is None:
                    raise ValueError(f"Python module {application.__name__!r} has no source file")
                path = application.__file__
            else:
                path = fspath(application)
            application = build_single_handler_application(path)

        configured_url: str | ProxyUrlFunc | None
        if notebook_url is not None or os.environ.get("JUPYTER_BOKEH_EXTERNAL_URL"):
            configured_url = update_notebook_url_from_env(notebook_url or DEFAULT_JUPYTER_URL)
        else:
            configured_url = None
        self._accept_frontend_proxy = configured_url is None

        if callable(configured_url):
            origins = [_authorized_origin(configured_url(None))]
        elif configured_url is not None:
            origins = [_authorized_origin(configured_url)]
        else:
            origins = ["127.0.0.1:*", "localhost:*"]
        if extra_websocket_origins is not None:
            if isinstance(extra_websocket_origins, str) or not all(isinstance(origin, str) for origin in extra_websocket_origins):
                raise TypeError("extra_websocket_origins must be a sequence of host[:port] strings")
            origins = list(dict.fromkeys([*origins, *extra_websocket_origins]))

        self._application_id = uuid4().hex
        self._prefix = f"bokeh-notebook/{secrets.token_urlsafe(24)}"
        self._stopped = False
        self._stopping = False
        self._stop_error: BaseException | None = None
        self._stop_lock = threading.Lock()
        self._asgi = BokehASGI(
            application,
            prefix=self._prefix,
            extra_websocket_origins=origins,
            secret_key=secrets.token_bytes(32),
            sign_sessions=True,
            **server_kwargs,
        )
        self._host = _ASGIServerThread(
            self._asgi,
            address=address,
            port=port,
            **(uvicorn_kwargs or {}),
        )
        try:
            _start_and_register_application(self, key, None if key is not None else notebook_cell_identity())
        except Exception:
            self._stopped = True
            raise

        try:
            if callable(configured_url):
                base_url = configured_url(self._host.port)
            elif configured_url is not None:
                base_url = server_url(configured_url, self._host.port)
            else:
                base_url = f"http://127.0.0.1:{self._host.port}/"
            _authorized_origin(base_url)
            self._url = f"{base_url.rstrip('/')}/{self._prefix}/"
        except BaseException:
            try:
                self.stop()
            except BaseException:
                log.debug("Could not stop notebook application after setup failed", exc_info=True)
            raise

    def __repr__(self) -> str:
        return f"NotebookApplication(status={self.status!r}, port={self.port})"

    @property
    def application_id(self) -> str:
        '''Return the identifier used by notebook application views.

        Returns:
            The application identifier.

        '''
        return self._application_id

    @property
    def accepts_frontend_proxy(self) -> bool:
        '''Report whether the frontend may discover a Jupyter proxy route.

        Returns:
            Whether automatic frontend proxy discovery is enabled.

        '''
        return self._accept_frontend_proxy

    @property
    def asgi(self) -> BokehASGI:
        '''Return the hosted :class:`~bokeh.server.asgi.BokehASGI` application.

        Returns:
            The hosted ASGI application.

        '''
        return self._asgi

    @property
    def sessions(self) -> list[Any]:
        '''Return the active Bokeh server sessions for this application.

        Returns:
            The active server sessions.

        '''
        return self._asgi.core.get_sessions("/")

    @property
    def port(self) -> int:
        '''Return the loopback port assigned to this application.

        Returns:
            The assigned loopback port.

        '''
        return self._host.port

    @property
    def status(self) -> str:
        '''Return the current application lifecycle status.

        Returns:
            The current lifecycle status.

        '''
        return "failed" if self._stop_error is not None else "stopped" if self._stopped else "stopping" if self._stopping else "running"

    @property
    def stopped(self) -> bool:
        '''Report whether this application has stopped.

        Returns:
            Whether the application has stopped.

        '''
        return self._stopped

    @property
    def url(self) -> str:
        '''Return the kernel-local URL for this application.

        Returns:
            The kernel-local application URL.

        '''
        if self._stopped:
            raise RuntimeError("This notebook application has been stopped; call serve(...) to create a new one")
        return self._url

    def _resolve_browser_url(self, value: Any) -> str:
        if not self._accept_frontend_proxy or value is None:
            return self._url.rstrip("/")
        if not isinstance(value, str):
            raise ValueError("the notebook frontend returned a non-string application URL")
        if value.rstrip("/") == self._url.rstrip("/"):
            return self._url.rstrip("/")
        parsed = urlparse(value)
        expected_path = f"/proxy/{self.port}/{self._prefix}/"
        if (
            parsed.scheme not in ("http", "https")
            or not parsed.netloc
            or parsed.hostname is None
            or parsed.username is not None
            or parsed.password is not None
            or parsed.query
            or parsed.fragment
            or not parsed.path.rstrip("/").endswith(expected_path.rstrip("/"))
        ):
            raise ValueError("the notebook frontend returned an invalid Jupyter application proxy URL")
        self._asgi.core.websocket_origins.add(parsed.netloc)
        return value.rstrip("/")

    def stop(self) -> None:
        ''' Stop the ASGI host and wait for orderly Bokeh session shutdown.

        Returns:
            None

        '''
        with self._stop_lock:
            if self._stopped:
                return
            self._stopping = True
            error: BaseException | None = None
            try:
                from .notebook import close_application_views

                close_application_views(self)
            except BaseException as close_error:
                error = close_error
            try:
                self._host.stop()
            except BaseException as stop_error:
                if error is None:
                    error = stop_error
                else:
                    log.warning("Notebook application host also failed during shutdown", exc_info=True)
            finally:
                self._stop_error = error
                self._stopping = False
                self._stopped = True
                _unregister_application(self)
            if error is not None:
                raise error

    async def stop_async(self) -> None:
        ''' Asynchronously stop the application without blocking the notebook event loop.

        Returns:
            None

        '''
        await asyncio.to_thread(self.stop)


def serve(application: Application | Callable[[Document], None] | ModuleType | str | OSPathLike[str], *,
        notebook_url: str | ProxyUrlFunc | None = None, port: int = 0, key: str | None = None,
        extra_websocket_origins: Sequence[str] | None = None,
        **server_kwargs: Any) -> NotebookApplication:
    ''' Start a managed ASGI notebook application for later ``show`` calls.

    Args:
        application:
            An Application, document-modifying callable, imported Python
            module, ``.py`` or ``.ipynb`` path, or directory-style app.
        notebook_url:
            Optional public proxy URL or callable for notebook hosts that
            cannot resolve kernel-local ports. JupyterLab and Notebook 7
            discover their browser route automatically when
            ``jupyter-server-proxy`` is installed.
        port:
            Loopback port, or zero to allocate an unused port.
        key:
            Optional stable replacement key. Starting another application with
            the same key stops this application first. Jupyter cell IDs are
            used automatically when available.
        extra_websocket_origins:
            Additional ``host[:port]`` patterns allowed to open WebSockets.
        server_kwargs:
            Additional keyword arguments for :class:`~bokeh.server.asgi.BokehASGI`.

    Returns:
        A managed :class:`NotebookApplication`.
    '''
    return NotebookApplication(
        application,
        notebook_url=notebook_url,
        port=port,
        key=key,
        extra_websocket_origins=extra_websocket_origins,
        **server_kwargs,
    )


def _authorized_origin(value: str) -> str:
    parsed = urlparse(value if "://" in value else f"http://{value}")
    if parsed.scheme not in ("http", "https") or not parsed.netloc:
        raise ValueError(f"notebook_url did not produce a valid origin: {value!r}")
    if parsed.username is not None or parsed.password is not None:
        raise ValueError(
            "notebook_url must not contain credentials; use cookie- or header-based proxy authentication instead",
        )
    if parsed.query or parsed.fragment:
        raise ValueError(
            "notebook_url must not contain a query string or fragment because notebook output is persisted; "
            "use cookie- or header-based proxy authentication instead",
        )
    return parsed.netloc
