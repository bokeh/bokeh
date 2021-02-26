#-----------------------------------------------------------------------------
# Copyright (c) 2012 - 2021, Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------
''' Provides the Application, Server, and Session context classes.

'''

#-----------------------------------------------------------------------------
# Boilerplate
#-----------------------------------------------------------------------------
import logging # isort:skip
log = logging.getLogger(__name__)

#-----------------------------------------------------------------------------
# Imports
#-----------------------------------------------------------------------------

# External imports
from tornado import gen

# Bokeh imports
from ..application.application import ServerContext, SessionContext
from ..document import Document
from ..protocol.exceptions import ProtocolError
from ..util.token import get_token_payload
from ..util.tornado import _CallbackGroup
from .session import ServerSession

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
    def __init__(self, application_context):
        self.application_context = application_context
        self._callbacks = _CallbackGroup(self.application_context.io_loop)

    def _remove_all_callbacks(self):
        self._callbacks.remove_all_callbacks()

    @property
    def sessions(self):
        result = []
        for session in self.application_context.sessions:
            result.append(session)
        return result

    def add_next_tick_callback(self, callback):
        return self._callbacks.add_next_tick_callback(callback)

    def remove_next_tick_callback(self, callback_id):
        self._callbacks.remove_next_tick_callback(callback_id)

    def add_timeout_callback(self, callback, timeout_milliseconds):
        return self._callbacks.add_timeout_callback(callback, timeout_milliseconds)

    def remove_timeout_callback(self, callback_id):
        self._callbacks.remove_timeout_callback(callback_id)

    def add_periodic_callback(self, callback, period_milliseconds):
        return self._callbacks.add_periodic_callback(callback, period_milliseconds)

    def remove_periodic_callback(self, callback_id):
        self._callbacks.remove_periodic_callback(callback_id)

class BokehSessionContext(SessionContext):
    def __init__(self, session_id, server_context, document, logout_url=None):
        self._document = document
        self._session = None
        self._logout_url = logout_url
        super().__init__(server_context, session_id)
        # request arguments used to instantiate this session
        self._request = None
        self._token = None

    def _set_session(self, session):
        self._session = session

    async def with_locked_document(self, func):
        if self._session is None:
            # this means we are in on_session_created, so no locking yet,
            # we have exclusive access
            await func(self._document)
        else:
            await self._session.with_document_locked(func, self._document)

    @property
    def destroyed(self):
        if self._session is None:
            # this means we are in on_session_created
            return False
        else:
            return self._session.destroyed

    @property
    def logout_url(self):
        return self._logout_url

    @property
    def request(self):
        return self._request

    @property
    def token_payload(self):
        return get_token_payload(self._token)

    @property
    def session(self):
        return self._session


class ApplicationContext:
    ''' Server-side holder for ``bokeh.application.Application`` plus any associated data.
        This holds data that's global to all sessions, while ``ServerSession`` holds
        data specific to an "instance" of the application.
    '''

    def __init__(self, application, io_loop=None, url=None, logout_url=None):
        self._application = application
        self._loop = io_loop
        self._sessions = dict()
        self._pending_sessions = dict()
        self._session_contexts = dict()
        self._server_context = None
        self._url = url
        self._logout_url = logout_url

    @property
    def io_loop(self):
        return self._loop

    @property
    def application(self):
        return self._application

    @property
    def url(self):
        return self._url

    @property
    def server_context(self):
        if self._server_context is None:
            self._server_context = BokehServerContext(self)
        return self._server_context

    @property
    def sessions(self):
        return self._sessions.values()

    def run_load_hook(self):
        try:
            self._application.on_server_loaded(self.server_context)
        except Exception as e:
            log.error("Error in server loaded hook %r", e, exc_info=True)

    def run_unload_hook(self):
        try:
            self._application.on_server_unloaded(self.server_context)
        except Exception as e:
            log.error("Error in server unloaded hook %r", e, exc_info=True)

        self.server_context._remove_all_callbacks()

    async def create_session_if_needed(self, session_id, request=None, token=None):
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
                # using private attr so users only have access to a read-only property
                session_context._request = _RequestProxy(request,
                                                         cookies=payload.get('cookies'),
                                                         headers=payload.get('headers'))
            session_context._token = token

            # expose the session context to the document
            # use the _attribute to set the public property .session_context
            doc._session_context = session_context

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

    def get_session(self, session_id):
        if session_id in self._sessions:
            session = self._sessions[session_id]
            return session
        else:
            raise ProtocolError("No such session " + session_id)

    async def _discard_session(self, session, should_discard):
        if session.connection_count > 0:
            raise RuntimeError("Should not be discarding a session with open connections")
        log.debug("Discarding session %r last in use %r milliseconds ago", session.id, session.milliseconds_since_last_unsubscribe)

        session_context = self._session_contexts[session.id]

        # session.destroy() wants the document lock so it can shut down the document
        # callbacks.
        def do_discard():
            # while we awaited for the document lock, the discard-worthiness of the
            # session may have changed.
            # However, since we have the document lock, our own lock will cause the
            # block count to be 1. If there's any other block count besides our own,
            # we want to skip session destruction though.
            if should_discard(session) and session.expiration_blocked_count == 1:
                session.destroy()
                del self._sessions[session.id]
                del self._session_contexts[session.id]
                log.trace("Session %r was successfully discarded", session.id)
            else:
                log.warning("Session %r was scheduled to discard but came back to life", session.id)
        await session.with_document_locked(do_discard)

        # session lifecycle hooks are supposed to be called outside the document lock,
        # we only run these if we actually ended up destroying the session.
        if session_context.destroyed:
            try:
                await self._application.on_session_destroyed(session_context)
            except Exception as e:
                log.error("Failed to run session destroy hooks %r", e, exc_info=True)

        return None

    async def _cleanup_sessions(self, unused_session_linger_milliseconds):
        def should_discard_ignoring_block(session):
            return session.connection_count == 0 and \
                (session.milliseconds_since_last_unsubscribe > unused_session_linger_milliseconds or \
                 session.expiration_requested)
        # build a temp list to avoid trouble from self._sessions changes
        to_discard = []
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
    def __init__(self, request, cookies=None, headers=None):
        self._request = request

        arguments = dict(request.arguments)
        if 'bokeh-session-id' in arguments: del arguments['bokeh-session-id']
        self._arguments = arguments
        if cookies is not None:
            self._cookies = cookies
        elif hasattr(request, 'cookies'):
            # Django cookies are plain strings, tornado cookies are objects with a value
            self._cookies = {k: v if isinstance(v, str) else v.value
                             for k, v in request.cookies.items()}
        else:
            self._cookies = {}

        if headers is not None:
            self._headers = headers
        elif hasattr(request, 'headers'):
            self._headers = dict(request.headers)
        else:
            self._headers = {}

    @property
    def arguments(self):
        return self._arguments

    @property
    def cookies(self):
        return self._cookies

    @property
    def headers(self):
        return self._headers

    def __getattr__(self, name):
        if not name.startswith("_"):
            val = getattr(self._request, name, None)
            if val is not None:
                return val
        return super().__getattr__(name)

#-----------------------------------------------------------------------------
# Code
#-----------------------------------------------------------------------------
