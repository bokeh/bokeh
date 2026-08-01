#-----------------------------------------------------------------------------
# Copyright (c) Anaconda, Inc. and contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------
''' Framework-neutral state and lifecycle management for Bokeh servers. '''

from __future__ import annotations

# Standard library imports
import asyncio
import logging
from collections.abc import (
    Awaitable,
    Callable,
    Iterable,
    Mapping,
    Sequence,
)
from os import PathLike as OSPathLike
from os.path import isdir
from typing import (
    TYPE_CHECKING,
    Any,
    Protocol as TypingProtocol,
    cast,
)
from urllib.parse import urljoin

# Bokeh imports
from ..application import Application
from ..resources import Resources
from ..settings import settings
from ..util.asyncio import _AsyncPeriodic
from ..util.token import (
    check_token_signature,
    generate_jwt_token,
    generate_session_id,
    get_session_id,
)
from .connection import ServerConnection
from .contexts import ApplicationContext

if TYPE_CHECKING:
    from ..application.handlers.function import ModifyDoc
    from ..core.types import ID, PathLike
    from ..document import Document
    from .request import RequestLike
    from .session import ServerSession
    from .transport import WebSocketTransport

log = logging.getLogger(__name__)

DEFAULT_CHECK_UNUSED_MS = 17_000
DEFAULT_KEEP_ALIVE_MS = 37_000
DEFAULT_STATS_LOG_FREQ_MS = 15_000
DEFAULT_UNUSED_LIFETIME_MS = 15_000
DEFAULT_SESSION_TOKEN_EXPIRATION = 300
DEFAULT_WEBSOCKET_MAX_MESSAGE_SIZE_BYTES = 20*1024*1024

__all__ = (
    "BokehServerCore",
    "SessionError",
    "create_session",
)


class SessionError(Exception):
    ''' An HTTP-compatible error raised while resolving a server session. '''

    def __init__(self, status: int, reason: str) -> None:
        super().__init__(reason)
        self.status = status
        self.reason = reason


class SessionConfig(TypingProtocol):
    @property
    def secret_key(self) -> bytes | None: ...
    @property
    def sign_sessions(self) -> bool: ...
    @property
    def generate_session_ids(self) -> bool: ...
    @property
    def session_token_expiration(self) -> int: ...
    @property
    def include_headers(self) -> list[str] | None: ...
    @property
    def exclude_headers(self) -> list[str] | None: ...
    @property
    def include_cookies(self) -> list[str] | None: ...
    @property
    def exclude_cookies(self) -> list[str] | None: ...


async def create_session(config: SessionConfig, context: ApplicationContext, request: RequestLike) -> ServerSession:
    '''Resolve, validate, and create a session from an HTTP request.'''
    token = _argument(request, "bokeh-token")
    session_id = cast("ID | None", _argument(request, "bokeh-session-id"))
    header_session_id = request.headers.get("Bokeh-Session-Id")
    if header_session_id is not None:
        if session_id is not None:
            raise SessionError(403, "session ID was provided as an argument and header")
        session_id = cast("ID", header_session_id)

    if token is not None:
        if session_id is not None:
            raise SessionError(403, "Both token and session ID were provided")
        session_id = get_session_id(token)
    elif session_id is None:
        if not config.generate_session_ids:
            raise SessionError(403, "No bokeh-session-id provided")
        session_id = generate_session_id(secret_key=config.secret_key, signed=config.sign_sessions)

    if token is None:
        headers = _filtered_headers(config, request)
        cookies = _filtered_cookies(config, request)
        included_headers = {name.lower() for name in config.include_headers or ()}
        if "cookie" not in included_headers:
            for name in list(headers):
                if name.lower() == "cookie":
                    del headers[name]
        payload: dict[str, Any] = {
            "headers": headers,
            "cookies": cookies,
            "arguments": dict(request.arguments),
        }
        payload.update(await context.application.process_request_async(request))
        token = generate_jwt_token(
            session_id,
            secret_key=config.secret_key,
            signed=config.sign_sessions,
            expiration=config.session_token_expiration,
            extra_payload=payload,
        )

    if not check_token_signature(token, secret_key=config.secret_key, signed=config.sign_sessions):
        raise SessionError(403, "Invalid token or session ID")
    return await context.create_session_if_needed(session_id, request, token)


def _argument(request: RequestLike, name: str) -> str | None:
    values = request.arguments.get(name)
    if not values:
        return None
    return values[-1].decode("utf-8")


def _filtered_headers(config: SessionConfig, request: RequestLike) -> dict[str, str]:
    allowed: Iterable[str]
    if config.include_headers is None:
        excluded = {name.lower() for name in config.exclude_headers or ()}
        allowed = (name for name in request.headers if name.lower() not in excluded)
    else:
        allowed = config.include_headers
    return {name: request.headers[name] for name in allowed if name in request.headers}


def _filtered_cookies(config: SessionConfig, request: RequestLike) -> dict[str, str]:
    allowed: Iterable[str]
    if config.include_cookies is None:
        excluded = set(config.exclude_cookies or ())
        allowed = (name for name in request.cookies if name not in excluded)
    else:
        allowed = config.include_cookies
    return {name: request.cookies[name].value for name in allowed if name in request.cookies}


class BokehServerCore(SessionConfig):
    ''' Transport-independent Bokeh application, session, and connection state. '''

    def __init__(
        self,
        applications: Mapping[str, Application | ModifyDoc | PathLike] | Application | ModifyDoc | PathLike,
        *,
        absolute_url: str | None = None,
        prefix: str | None = None,
        extra_websocket_origins: Sequence[str] | None = None,
        secret_key: bytes | None = settings.secret_key_bytes(),
        sign_sessions: bool = settings.sign_sessions(),
        generate_session_ids: bool = True,
        keep_alive_milliseconds: int = DEFAULT_KEEP_ALIVE_MS,
        check_unused_sessions_milliseconds: int = DEFAULT_CHECK_UNUSED_MS,
        unused_session_lifetime_milliseconds: int = DEFAULT_UNUSED_LIFETIME_MS,
        stats_log_frequency_milliseconds: int = DEFAULT_STATS_LOG_FREQ_MS,
        include_headers: list[str] | None = None,
        include_cookies: list[str] | None = None,
        exclude_headers: list[str] | None = None,
        exclude_cookies: list[str] | None = None,
        session_token_expiration: int = DEFAULT_SESSION_TOKEN_EXPIRATION,
        logout_url: str | None = None,
    ) -> None:
        from ..application.handlers.directory import DirectoryHandler
        from ..application.handlers.document_lifecycle import DocumentLifecycleHandler
        from ..application.handlers.function import FunctionHandler
        from ..application.handlers.script import ScriptHandler

        def as_application(spec: Application | ModifyDoc | PathLike) -> Application:
            if isinstance(spec, Application):
                return spec
            if isinstance(spec, (str, OSPathLike)):
                handler = DirectoryHandler(filename=spec) if isdir(spec) else ScriptHandler(filename=spec)
                if handler.failed:
                    raise RuntimeError(f"Error loading {spec}:\n\n{handler.error}\n{handler.error_detail}")
                return Application(handler)
            if callable(spec):
                return Application(FunctionHandler(spec))
            raise TypeError(f"Expected an Application, callable, or script path, got {type(spec).__name__}")

        if isinstance(applications, (Application, str, OSPathLike)) or callable(applications):
            applications = {"/": as_application(applications)}
        else:
            applications = dict(applications)

        normalized: dict[str, Application] = {}
        for url, app in applications.items():
            if not url.startswith("/"):
                raise ValueError(f"Application path {url!r} must start with a slash")
            if url != "/":
                url = url.rstrip("/")
            app = as_application(app)
            if all(not isinstance(handler, DocumentLifecycleHandler) for handler in app._handlers):
                app.add(DocumentLifecycleHandler())
            normalized[url] = app

        if keep_alive_milliseconds < 0:
            raise ValueError("keep_alive_milliseconds must be >= 0")
        if check_unused_sessions_milliseconds <= 0:
            raise ValueError("check_unused_sessions_milliseconds must be > 0")
        if unused_session_lifetime_milliseconds <= 0:
            raise ValueError("unused_session_lifetime_milliseconds must be > 0")
        if stats_log_frequency_milliseconds <= 0:
            raise ValueError("stats_log_frequency_milliseconds must be > 0")
        if session_token_expiration <= 0:
            raise ValueError("session_token_expiration must be > 0")
        if exclude_cookies and include_cookies:
            raise ValueError("Declare either an include or an exclude list for the cookies, not both.")
        if exclude_headers and include_headers:
            raise ValueError("Declare either an include or an exclude list for the headers, not both.")

        prefix = "" if prefix is None else prefix.strip("/")
        self._prefix = f"/{prefix}" if prefix else ""
        self._absolute_url = absolute_url
        self._websocket_origins = set(extra_websocket_origins or ())
        self._secret_key = secret_key
        self._sign_sessions = sign_sessions
        self._generate_session_ids = generate_session_ids
        self._session_token_expiration = session_token_expiration
        self._include_headers = include_headers
        self._exclude_headers = exclude_headers
        self._include_cookies = include_cookies
        self._exclude_cookies = exclude_cookies
        self._keep_alive_milliseconds = keep_alive_milliseconds
        self._check_unused_sessions_milliseconds = check_unused_sessions_milliseconds
        self._unused_session_lifetime_milliseconds = unused_session_lifetime_milliseconds
        self._stats_log_frequency_milliseconds = stats_log_frequency_milliseconds

        self._applications: dict[str, ApplicationContext] = {}
        for url, app in normalized.items():
            app_logout_url = logout_url
            if app_logout_url is not None:
                app_logout_url = urljoin(self._prefix + "/", app_logout_url.lstrip("/"))
            self._applications[url] = ApplicationContext(app, url=url, logout_url=app_logout_url)

        self._loop: asyncio.AbstractEventLoop | None = None
        self._clients: set[ServerConnection] = set()
        self._jobs: list[_AsyncPeriodic] = []
        self._started = False
        self._stopping = False
        self._stop_task: asyncio.Task[None] | None = None

    @property
    def applications(self) -> Mapping[str, ApplicationContext]:
        return self._applications

    @property
    def app_paths(self) -> set[str]:
        return set(self._applications)

    @property
    def prefix(self) -> str:
        return self._prefix

    @property
    def websocket_origins(self) -> set[str]:
        return self._websocket_origins

    @property
    def secret_key(self) -> bytes | None:
        return self._secret_key

    @property
    def sign_sessions(self) -> bool:
        return self._sign_sessions

    @property
    def generate_session_ids(self) -> bool:
        return self._generate_session_ids

    @property
    def session_token_expiration(self) -> int:
        return self._session_token_expiration

    @property
    def include_headers(self) -> list[str] | None:
        return self._include_headers

    @property
    def exclude_headers(self) -> list[str] | None:
        return self._exclude_headers

    @property
    def include_cookies(self) -> list[str] | None:
        return self._include_cookies

    @property
    def exclude_cookies(self) -> list[str] | None:
        return self._exclude_cookies

    def initialize(self, loop: asyncio.AbstractEventLoop) -> None:
        if self._loop is not None and self._loop is not loop:
            raise RuntimeError("BokehServerCore is already bound to another event loop")
        self._loop = loop
        for context in self._applications.values():
            context._loop = loop

    async def start(self) -> None:
        if self._stopping:
            raise RuntimeError("Bokeh server core is stopping")
        if self._started:
            return
        if self._loop is None:
            self.initialize(asyncio.get_running_loop())
        assert self._loop is not None
        self._started = True

        self._jobs = [
            _AsyncPeriodic(self._log_stats, self._stats_log_frequency_milliseconds, self._loop),
            _AsyncPeriodic(self._cleanup_sessions, self._check_unused_sessions_milliseconds, self._loop),
        ]
        if self._keep_alive_milliseconds:
            self._jobs.append(_AsyncPeriodic(self._keep_alive, self._keep_alive_milliseconds, self._loop))
        for job in self._jobs:
            job.start()
        for context in self._applications.values():
            context.run_load_hook()

    async def stop(self) -> None:
        if self._stop_task is not None:
            await asyncio.shield(self._stop_task)
            return
        if not self._started:
            return
        self._stopping = True
        task = self._stop_task = asyncio.create_task(self._stop())
        task.add_done_callback(self._stop_done)
        await asyncio.shield(task)

    async def _stop(self) -> None:
        try:
            jobs = tuple(self._jobs)
            for job in jobs:
                job.stop()
            self._jobs.clear()
            pending_sessions = tuple(
                task
                for context in self._applications.values()
                for task in context._cancel_pending_sessions()
            )

            async def wait_for_pending_sessions() -> None:
                if pending_sessions:
                    await asyncio.gather(*pending_sessions, return_exceptions=True)

            await asyncio.gather(
                *(job.wait() for job in jobs),
                wait_for_pending_sessions(),
            )
            for connection in list(self._clients):
                self.client_lost(connection)
            await asyncio.gather(*(context._shutdown_sessions() for context in self._applications.values()))
            for context in self._applications.values():
                context.run_unload_hook()

            if not self._clients and all(not list(context.sessions) for context in self._applications.values()):
                self._loop = None
                for context in self._applications.values():
                    context._loop = None
        finally:
            self._started = False
            self._stopping = False

    def _stop_done(self, task: asyncio.Task[None]) -> None:
        if self._stop_task is task:
            self._stop_task = None
        if task.cancelled():
            self._started = False
            self._stopping = False
        else:
            # Retrieve failures even when the caller awaiting stop() was itself
            # cancelled. Awaiting the completed task still propagates them to
            # any other caller.
            task.exception()

    def _require_running(self) -> None:
        if self._stopping:
            raise RuntimeError("Bokeh server core is stopping")
        if not self._started:
            raise RuntimeError("Bokeh server core is not running")

    def resources(self, absolute_url: str | bool | None = None, *, root_path: str = "") -> Resources:
        mode = settings.resources(default="server")
        if mode in ("server", "server-dev"):
            if absolute_url is True:
                absolute_url = self._absolute_url
            if absolute_url is None or absolute_url is False:
                absolute_url = "/"
            resource_path = root_path.rstrip("/") + self._prefix
            return Resources(mode=mode, root_url=urljoin(absolute_url, resource_path))
        return Resources(mode=mode)

    async def create_session(self, context: ApplicationContext, request: RequestLike) -> ServerSession:
        self._require_running()
        return await create_session(self, context, request)

    async def create_session_if_needed(self, context: ApplicationContext, session_id: ID,
            request: RequestLike | None = None, token: str | None = None) -> ServerSession:
        self._require_running()
        return await context.create_session_if_needed(session_id, request, token)

    def new_connection(self, transport: WebSocketTransport, session: ServerSession) -> ServerConnection:
        self._require_running()
        connection = ServerConnection(transport, session)
        self._clients.add(connection)
        return connection

    def client_lost(self, connection: ServerConnection) -> None:
        self._clients.discard(connection)
        connection.detach_session()

    def get_session(self, app_path: str, session_id: ID) -> ServerSession:
        if app_path not in self._applications:
            raise ValueError(f"Application {app_path} does not exist on this server")
        return self._applications[app_path].get_session(session_id)

    def get_sessions(self, app_path: str) -> list[ServerSession]:
        if app_path not in self._applications:
            raise ValueError(f"Application {app_path} does not exist on this server")
        return list(self._applications[app_path].sessions)

    async def update_sessions(
        self,
        app_path: str,
        update_document: Callable[[Document], None | Awaitable[None]],
    ) -> None:
        ''' Update every active document for an application.

        ``update_document`` is called once for each session that exists when
        this method starts. Each call receives that session's
        :class:`~bokeh.document.document.Document` with its document lock held.
        Synchronous and asynchronous callbacks are both supported, and
        different sessions are updated concurrently.

        Sessions created after this method takes its snapshot are not updated.
        Only sessions in this server process are included.

        Args:
            app_path:
                The configured application path whose sessions are updated.

            update_document:
                A callable that mutates one session document.

        '''
        self._require_running()
        sessions = self.get_sessions(app_path)
        updates = (
            cast(Awaitable[None], session.with_document_locked(update_document, session.document))
            for session in sessions
        )
        await asyncio.gather(*updates)

    async def _cleanup_sessions(self) -> None:
        for context in self._applications.values():
            await context._cleanup_sessions(self._unused_session_lifetime_milliseconds)

    def _log_stats(self) -> None:
        if log.isEnabledFor(logging.DEBUG):
            log.debug("%d clients connected", len(self._clients))
            for path, context in self._applications.items():
                sessions = list(context.sessions)
                unused = sum(session.connection_count == 0 for session in sessions)
                log.debug("%s has %d sessions with %d unused", path, len(sessions), unused)

    def _keep_alive(self) -> None:
        for connection in list(self._clients):
            connection.send_ping()
