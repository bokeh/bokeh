#-----------------------------------------------------------------------------
# Copyright (c) 2012 - 2022, Anaconda, Inc., and Bokeh Contributors.
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
import weakref
from typing import (
    TYPE_CHECKING,
    Any,
    Awaitable,
    Callable,
    Dict,
    Iterable,
    List,
)

# External imports
from tornado import gen

if TYPE_CHECKING:
    from tornado.httputil import HTTPServerRequest
    from tornado.ioloop import IOLoop

# Bokeh imports
from ..application.application import ServerContext, SessionContext
from ..document import Document
from ..protocol.exceptions import ProtocolError
from ..util.token import get_token_payload
from .session import ServerSession

if TYPE_CHECKING:
    from ..application.application import Application
    from ..core.types import ID
    from ..util.token import TokenPayload

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
    def sessions(self) -> List[ServerSession]:
        result: List[ServerSession] = []
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

    .. autoclasstoc::

    '''

    _sessions: Dict[ID, ServerSession]
    _pending_sessions: Dict[ID, gen.Future[ServerSession]]
    _session_contexts: Dict[ID, SessionContext]
    _server_context: BokehServerContext

    def __init__(self, application: Application, io_loop: IOLoop | None = None,
            url: str | None = None, logout_url: str | None = None):
        self._application = application
        self._loop = io_loop
        self._sessions = {}
        self._pending_sessions = {}
        self._session_contexts = {}
        self._server_context = BokehServerContext(self)
        self._url = url
        self._logout_url = logout_url

    @property
    def io_loop(self) -> IOLoop | None:
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

    async def create_session_if_needed(self, session_id: ID, request: HTTPServerRequest | None = None,
            token: str | None = None) -> ServerSession:
        # this is because empty session_ids would be "falsey" and
        # potentially open up a way for clients to confuse us
        if len(session_id) == 0:
            raise ProtocolError("Session ID must not be empty")

        if session_id not in self._sessions and \
           session_id not in self._pending_sessions:
            future = self._pending_sessions[session_id] = gen.Future()

            doc = Document()

            session_context = BokehSessionContext(session_id,
                                                  self.server_context,
                                                  doc,
                                                  logout_url=self._logout_url)
            if request is not None:
                payload = get_token_payload(token) if token else {}
                if ('cookies' in payload and 'headers' in payload
                    and not 'Cookie' in payload['headers']):
                    # Restore Cookie header from cookies dictionary
                    payload['headers']['Cookie'] = '; '.join([
                        f'{k}={v}' for k, v in payload['cookies'].items()
                    ])
                # using private attr so users only have access to a read-only property
                session_context._request = _RequestProxy(request,
                                                         arguments=payload.get('arguments', request.arguments),
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

            self._application.initialize_document(doc)

            session = ServerSession(session_id, doc, io_loop=self._loop, token=token)
            del self._pending_sessions[session_id]
            self._sessions[session_id] = session
            session_context._set_session(session)
            self._session_contexts[session_id] = session_context

            # notify anyone waiting on the pending session
            future.set_result(session)

        if session_id in self._pending_sessions:
            # another create_session_if_needed is working on
            # creating this session
            session = await self._pending_sessions[session_id]
        else:
            session = self._sessions[session_id]

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
                log.trace(f"Session {session.id!r} was successfully discarded")
            else:
                log.warning(f"Session {session.id!r} was scheduled to discard but came back to life")
        await session.with_document_locked(do_discard)

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
        to_discard: List[ServerSession] = []
        for session in self._sessions.values():
            if should_discard_ignoring_block(session) and not session.expiration_blocked:
                to_discard.append(session)

        if len(to_discard) > 0:
            log.debug("Scheduling %s sessions to discard" % len(to_discard))
        # asynchronously reconsider each session
        for session in to_discard:
            if should_discard_ignoring_block(session) and not session.expiration_blocked:
                await self._discard_session(session, should_discard_ignoring_block)

        return None

#-----------------------------------------------------------------------------
# Private API
#-----------------------------------------------------------------------------

class _RequestProxy:

    _arguments: Dict[str, List[bytes]]
    _cookies: Dict[str, str]
    _headers: Dict[str, str | List[str]]

    def __init__(
        self,
        request: HTTPServerRequest,
        arguments: Dict[str, str | List[str]] | None = None,
        cookies: Dict[str, str] | None = None,
        headers: Dict[str, str | List[str]] | None = None,
    ) -> None:
        self._request = request

        if 'bokeh-session-id' in arguments:
            del arguments['bokeh-session-id']
        self._arguments = arguments

        if cookies is not None:
            self._cookies = cookies
        elif hasattr(request, 'cookies'):
            # Django cookies are plain strings, tornado cookies are objects with a value
            self._cookies = {k: v if isinstance(v, str) else v.value for k, v in request.cookies.items()}
        else:
            self._cookies = {}

        if headers is not None:
            self._headers = headers
        elif hasattr(request, 'headers'):
            self._headers = dict(request.headers)
        else:
            self._headers = {}

    @property
    def arguments(self) -> Dict[str, List[bytes]]:
        return self._arguments

    @property
    def cookies(self) -> Dict[str, str]:
        return self._cookies

    @property
    def headers(self) -> Dict[str, str | List[str]]:
        return self._headers

    def __getattr__(self, name: str) -> Any:
        if not name.startswith("_"):
            val = getattr(self._request, name, None)
            if val is not None:
                return val
        return super().__getattr__(name)

#-----------------------------------------------------------------------------
# Code
#-----------------------------------------------------------------------------
