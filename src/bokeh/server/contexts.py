#-----------------------------------------------------------------------------
# Copyright (c) Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------
''' Provides the Application, Server, and Session context classes.

'''

#-----------------------------------------------------------------------------
# Boilerplate
#-----------------------------------------------------------------------------
from __future__ import annotations

import logging # isort:skip
log = logging.getLogger(__name__)

#-----------------------------------------------------------------------------
# Imports
#-----------------------------------------------------------------------------

# Standard library imports
import asyncio
import weakref
from typing import (
    TYPE_CHECKING,
    Any,
    Awaitable,
    Callable,
    Iterable,
    cast,
)

# Bokeh imports
from ..application.application import ServerContext, SessionContext
from ..document import Document
from ..protocol.exceptions import ProtocolError
from ..util.asyncio import Loop
from ..util.token import get_token_payload
from .session import ServerSession

if TYPE_CHECKING:
    from ..application.application import Application
    from ..core.types import ID
    from ..util.token import TokenPayload
    from .request import RequestLike

#-----------------------------------------------------------------------------
# Globals and constants
#-----------------------------------------------------------------------------

__all__ = (
    'ApplicationContext',
    'BokehServerContext',
    'BokehSessionContext',
)

#-----------------------------------------------------------------------------
# Setup
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# General API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Dev API
#-----------------------------------------------------------------------------

class BokehServerContext(ServerContext):
    def __init__(self, application_context: ApplicationContext) -> None:
        self._application_context = weakref.ref(application_context)

    @property
    def application_context(self) -> ApplicationContext | None:
        return self._application_context()

    @property
    def sessions(self) -> list[ServerSession]:
        result: list[ServerSession] = []
        context = self.application_context
        if context:
            for session in context.sessions:
                result.append(session)
        return result

class BokehSessionContext(SessionContext):

    _session: ServerSession | None
    _request: _RequestProxy | None
    _token: str | None

    def __init__(self, session_id: ID, server_context: ServerContext,
            document: Document, logout_url: str | None = None) -> None:
        self._document = document
        self._session = None
        self._logout_url = logout_url
        super().__init__(server_context, session_id)
        # request arguments used to instantiate this session
        self._request = None
        self._token = None

    def _set_session(self, session: ServerSession) -> None:
        self._session = session

    async def with_locked_document(self, func: Callable[[Document], Awaitable[None]]) -> None:
        if self._session is None:
            # this means we are in on_session_created, so no locking yet,
            # we have exclusive access
            await func(self._document)
        else:
            await self._session.with_document_locked(func, self._document)

    @property
    def destroyed(self) -> bool:
        if self._session is None:
            # this means we are in on_session_created
            return False
        else:
            return self._session.destroyed

    @property
    def document(self) -> Document:
        return self._document

    @property
    def logout_url(self) -> str | None:
        return self._logout_url

    @property
    def request(self) -> _RequestProxy | None:
        return self._request

    @property
    def token_payload(self) -> TokenPayload:
        assert self._token is not None
        return get_token_payload(self._token)

    @property
    def session(self) -> ServerSession | None:
        return self._session


class ApplicationContext:
    ''' Server-side holder for ``bokeh.application.Application`` plus any associated data.
        This holds data that's global to all sessions, while ``ServerSession`` holds
        data specific to an "instance" of the application.

    '''

    _sessions: dict[ID, ServerSession]
    _pending_sessions: dict[ID, asyncio.Task[ServerSession]]
    _session_contexts: dict[ID, SessionContext]
    _server_context: BokehServerContext

    def __init__(self, application: Application, io_loop: Loop | None = None,
            url: str | None = None, logout_url: str | None = None):
        self._application = application
        self._loop = io_loop
        self._sessions = {}
        self._pending_sessions = {}
        self._session_contexts = {}
        self._server_context = BokehServerContext(self)
        self._url = url
        self._logout_url = logout_url

    def _requires_worker_initialization(self) -> bool:
        from ..application.handlers.document_lifecycle import DocumentLifecycleHandler
        return any(not isinstance(handler, DocumentLifecycleHandler) for handler in self._application._handlers)

    @property
    def io_loop(self) -> Loop | None:
        return self._loop

    @property
    def application(self) -> Application:
        return self._application

    @property
    def url(self) -> str | None:
        return self._url

    @property
    def server_context(self) -> BokehServerContext:
        return self._server_context

    @property
    def sessions(self) -> Iterable[ServerSession]:
        return self._sessions.values()

    def run_load_hook(self) -> None:
        try:
            self._application.on_server_loaded(self.server_context)
        except Exception as e:
            log.error(f"Error in server loaded hook {e!r}", exc_info=True)

    def run_unload_hook(self) -> None:
        try:
            self._application.on_server_unloaded(self.server_context)
        except Exception as e:
            log.error(f"Error in server unloaded hook {e!r}", exc_info=True)

    async def create_session_if_needed(self, session_id: ID, request: RequestLike | None = None,
            token: str | None = None) -> ServerSession:
        # this is because empty session_ids would be "falsey" and
        # potentially open up a way for clients to confuse us
        if len(session_id) == 0:
            raise ProtocolError("Session ID must not be empty")

        if session_id in self._sessions:
            return self._sessions[session_id]

        pending = self._pending_sessions.get(session_id)
        if pending is None:
            pending = self._pending_sessions[session_id] = asyncio.create_task(
                self._create_session(session_id, request, token),
            )
            pending.add_done_callback(lambda task: self._session_creation_done(session_id, task))

        # Session initialization belongs to the application context, not to
        # whichever HTTP or websocket request happened to start it. A dropped
        # request must not cancel work that other waiters may still need.
        return await asyncio.shield(pending)

    def _session_creation_done(self, session_id: ID, task: asyncio.Task[ServerSession]) -> None:
        if self._pending_sessions.get(session_id) is task:
            del self._pending_sessions[session_id]

        if not task.cancelled() and (exception := task.exception()) is not None:
            log.error("Failed to create session %r: %s", session_id, exception, exc_info=exception)

    def _cancel_pending_sessions(self) -> tuple[asyncio.Task[ServerSession], ...]:
        pending = tuple(self._pending_sessions.values())
        for task in pending:
            task.cancel()
        return pending

    async def _shutdown_pending_sessions(self) -> None:
        if pending := self._cancel_pending_sessions():
            await asyncio.gather(*pending, return_exceptions=True)

    async def _initialize_document_async(self, doc: Document) -> None:
        if not self._requires_worker_initialization():
            # Preserve immediate creation for an empty Application. The
            # lifecycle handler does not execute user document code.
            self._application.initialize_document(doc)
            return

        worker = asyncio.create_task(asyncio.to_thread(self._application.initialize_document, doc))
        try:
            await asyncio.shield(worker)
        except asyncio.CancelledError:
            # Executor work cannot be stopped once running. Keep the session
            # creation task alive until it has finished so orderly shutdown can
            # run application unload hooks after initialization code exits.
            try:
                await worker
            except Exception as error:
                log.error("Failed to initialize cancelled session: %s", error, exc_info=error)
            raise

    async def _create_session(self, session_id: ID, request: RequestLike | None = None,
            token: str | None = None) -> ServerSession:
        doc = Document()

        session_context = BokehSessionContext(session_id,
                                              self.server_context,
                                              doc,
                                              logout_url=self._logout_url)
        if request is not None:
            payload = get_token_payload(token) if token else {}
            if ('cookies' in payload and 'headers' in payload
                and 'Cookie' not in payload['headers']):
                # Restore Cookie header from cookies dictionary
                payload['headers']['Cookie'] = '; '.join([
                    f'{k}={v}' for k, v in payload['cookies'].items()
                ])
            # using private attr so users only have access to a read-only property
            session_context._request = _RequestProxy(request,
                                                     arguments=payload.get('arguments'),
                                                     cookies=payload.get('cookies'),
                                                     headers=payload.get('headers'))
        session_context._token = token

        # expose the session context to the document
        # use the _attribute to set the public property .session_context
        doc._session_context = weakref.ref(session_context)

        try:
            await self._application.on_session_created(session_context)
        except Exception as e:
            log.error("Failed to run session creation hooks %r", e, exc_info=True)

        # Application code is arbitrary synchronous Python and can be
        # expensive. Keeping it on the event-loop thread prevents the
        # server from accepting unrelated HTTP and websocket work.
        await self._initialize_document_async(doc)

        io_loop = self._loop or asyncio.get_running_loop()
        session = ServerSession(session_id, doc, io_loop=io_loop, token=token)
        self._sessions[session_id] = session
        session_context._set_session(session)
        self._session_contexts[session_id] = session_context
        return session

    def get_session(self, session_id: ID) -> ServerSession:
        if session_id in self._sessions:
            session = self._sessions[session_id]
            return session
        else:
            raise ProtocolError("No such session " + session_id)

    async def _discard_session(self, session: ServerSession, should_discard: Callable[[ServerSession], bool]) -> None:
        if session.connection_count > 0:
            raise RuntimeError("Should not be discarding a session with open connections")
        log.debug("Discarding session %r last in use %r milliseconds ago", session.id, session.milliseconds_since_last_unsubscribe)

        session_context = self._session_contexts[session.id]

        # session.destroy() wants the document lock so it can shut down the document
        # callbacks.
        def do_discard() -> None:
            # while we awaited for the document lock, the discard-worthiness of the
            # session may have changed.
            # However, since we have the document lock, our own lock will cause the
            # block count to be 1. If there's any other block count besides our own,
            # we want to skip session destruction though.
            if should_discard(session) and session.expiration_blocked_count == 1:
                session.destroy()
                del self._sessions[session.id]
                del self._session_contexts[session.id]
                log.debug("Session %r was successfully discarded", session.id)
            else:
                log.warning(f"Session {session.id!r} was scheduled to discard but came back to life")
        await cast(Awaitable[None], session.with_document_locked(do_discard))

        # session lifecycle hooks are supposed to be called outside the document lock,
        # we only run these if we actually ended up destroying the session.
        if session_context.destroyed:
            try:
                await self._application.on_session_destroyed(session_context)
            except Exception as e:
                log.error("Failed to run session destroy hooks %r", e, exc_info=True)

        return None

    async def _cleanup_sessions(self, unused_session_linger_milliseconds: int) -> None:
        def should_discard_ignoring_block(session: ServerSession) -> bool:
            return session.connection_count == 0 and \
                (session.milliseconds_since_last_unsubscribe > unused_session_linger_milliseconds or \
                 session.expiration_requested)
        # build a temp list to avoid trouble from self._sessions changes
        to_discard: list[ServerSession] = []
        for session in self._sessions.values():
            if should_discard_ignoring_block(session) and not session.expiration_blocked:
                to_discard.append(session)

        if len(to_discard) > 0:
            log.debug(f"Scheduling {len(to_discard)} sessions to discard")
        # asynchronously reconsider each session
        for session in to_discard:
            if should_discard_ignoring_block(session) and not session.expiration_blocked:
                await self._discard_session(session, should_discard_ignoring_block)

        return None

#-----------------------------------------------------------------------------
# Private API
#-----------------------------------------------------------------------------

class _RequestProxy:

    _arguments: dict[str, list[bytes]]
    _cookies: dict[str, str]
    _headers: dict[str, str | list[str]]

    def __init__(
        self,
        request: RequestLike,
        arguments: dict[str, bytes | list[bytes]] | None = None,
        cookies: dict[str, str] | None = None,
        headers: dict[str, str | list[str]] | None = None,
    ) -> None:
        self._request = request

        if arguments is not None:
            self._arguments = {key: value if isinstance(value, list) else [value] for key, value in arguments.items()}
        elif hasattr(request, 'arguments'):
            self._arguments = dict(request.arguments)
        else:
            self._arguments = {}
        if 'bokeh-session-id' in self._arguments:
            del self._arguments['bokeh-session-id']

        if cookies is not None:
            self._cookies = cookies
        elif hasattr(request, 'cookies'):
            # Django cookies are plain strings, tornado cookies are objects with a value
            request_cookies = cast(dict[str, Any], request.cookies)
            self._cookies = {k: v if isinstance(v, str) else v.value for k, v in request_cookies.items()}
        else:
            self._cookies = {}

        if headers is not None:
            self._headers = headers
        elif hasattr(request, 'headers'):
            self._headers = dict(request.headers)
        else:
            self._headers = {}

    @property
    def arguments(self) -> dict[str, list[bytes]]:
        return self._arguments

    @property
    def cookies(self) -> dict[str, str]:
        return self._cookies

    @property
    def headers(self) -> dict[str, str | list[str]]:
        return self._headers

    def __getattr__(self, name: str) -> Any:
        if not name.startswith("_"):
            val = getattr(self._request, name, None)
            if val is not None:
                return val
        raise AttributeError(name)

#-----------------------------------------------------------------------------
# Code
#-----------------------------------------------------------------------------
