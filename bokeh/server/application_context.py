''' Provides the ``ApplicationContext`` class.

'''
from __future__ import absolute_import

import logging
log = logging.getLogger(__name__)

from tornado import gen

from .session import ServerSession
from .exceptions import ProtocolError

from bokeh.application.application import ServerContext, SessionContext
from bokeh.document import Document
from bokeh.util.tornado import _CallbackGroup

class BokehServerContext(ServerContext):
    def __init__(self, application_context):
        self.application_context = application_context
        self._callbacks = _CallbackGroup(self.application_context.io_loop)

    def _remove_all_callbacks(self):
        self._callbacks.remove_all_callbacks()

    @property
    def sessions(self):
        result = []
        for session in self.application_context.sessions():
            result.append(session.session_context)
        return result

    @property
    def develop_mode(self):
        return self.application_context.develop

    def add_callback(self, callback):
        self._callbacks.add_next_tick_callback(callback)

    def remove_callback(self, callback):
        self._callbacks.remove_next_tick_callback(callback)

    def add_timeout_callback(self, callback, timeout_milliseconds):
        self._callbacks.add_timeout_callback(callback, timeout_milliseconds)

    def remove_timeout_callback(self, callback):
        self._callbacks.remove_timeout_callback(callback)

    def add_periodic_callback(self, callback, period_milliseconds):
        self._callbacks.add_periodic_callback(callback, period_milliseconds)

    def remove_periodic_callback(self, callback):
        self._callbacks.remove_periodic_callback(callback)

class _ReleasingDocLockManager(object):
    def __init__(self, doc, lock):
        self._doc = doc
        self._lock = lock

    def __exit__(self, type, value, traceback):
        if self._lock is not None:
            self._lock.release()

    def __enter__(self):
        return self._doc

class BokehSessionContext(SessionContext):
    def __init__(self, session_id, server_context, document):
        self._document = document
        self._session = None
        super(BokehSessionContext, self).__init__(server_context,
                                                  session_id)

    def set_session(self, session):
        self._session = session

    @gen.coroutine
    def locked_document(self):
        if self._session is None:
            # this means we are in on_session_created, so no locking yet,
            # we have exclusive access
            raise gen.Return(_ReleasingDocLockManager(doc=self._document,
                                                      lock=None))
        else:
            # TODO while we wait for the lock, we should prevent the
            # session from being discarded (waiting here should hold
            # the session alive). That way apps don't have to worry
            # about sessions disappearing out from under them while
            # waiting for the session document.
            yield self._lock.acquire()
            raise gen.Return(_ReleasingDocLockManager(doc=self._document,
                                                      lock=self._session._lock))

    @property
    def destroyed(self):
        if self._session is None:
            # this means we are in on_session_created
            return False
        else:
            return self._session.destroyed

class ApplicationContext(object):
    ''' Server-side holder for bokeh.application.Application plus any associated data.
        This holds data that's global to all sessions, while ServerSession holds
        data specific to an "instance" of the application.
    '''

    def __init__(self, application, develop=False, io_loop=None):
        self._application = application
        self._develop = develop
        self._loop = io_loop
        self._sessions = dict()
        self._session_contexts = dict()
        self._server_context = BokehServerContext(self)

    @property
    def io_loop(self):
        return self._loop

    @property
    def application(self):
        return self._application

    @property
    def develop(self):
        return self._develop

    @property
    def server_context(self):
        return self._server_context

    @property
    def sessions(self):
        return self._sessions.values()

    def run_load_hook(self):
        try:
            self._application.on_server_loaded(self._server_context)
        except Exception as e:
            log.error("Error in server loaded hook %r", e, exc_info=True)

    def run_unload_hook(self):
        try:
            self._application.on_server_unloaded(self._server_context)
        except Exception as e:
            log.error("Error in server unloaded hook %r", e, exc_info=True)

        self._server_context._remove_all_callbacks()

    def create_session_if_needed(self, session_id):
        # this is because empty session_ids would be "falsey" and
        # potentially open up a way for clients to confuse us
        if len(session_id) == 0:
            raise ProtocolError("Session ID must not be empty")

        if session_id not in self._sessions:
            doc = Document()

            session_context = BokehSessionContext(session_id,
                                                  self._server_context,
                                                  doc)
            try:
                self._application.on_session_created(session_context)
            except Exception as e:
                log.error("Failed to run session creation hooks %r", e, exc_info=True)

            self._application.initialize_document(doc)

            session = ServerSession(session_id, doc, io_loop=self._loop)
            self._sessions[session_id] = session
            session_context.set_session(session)
            self._session_contexts[session_id] = session_context

        return self._sessions[session_id]

    def get_session(self, session_id):
        if session_id in self._sessions:
            session = self._sessions[session_id]
            return session
        else:
            raise ProtocolError("No such session " + session_id)

    def discard_session(self, session):
        if session.connection_count > 0:
            raise RuntimeError("Should not be discarding a session with open connections")
        log.debug("Discarding session %r last in use %r seconds ago", session.id, session.seconds_since_last_unsubscribe)

        # TODO this really should take the session lock,
        # which means we have to be a coroutine, and when
        # we get the lock we check it's still ok to destroy
        # this session.
        try:
            self._application.on_session_destroyed(self._session_contexts[session.id])
        except Exception as e:
            log.error("Failed to run session destroy hooks %r", e, exc_info=True)

        session.destroy()
        del self._sessions[session.id]
        del self._session_contexts[session.id]

    def cleanup_sessions(self, unused_session_linger_seconds):
        to_discard = []
        for session in self._sessions.values():
            if session.connection_count == 0 and \
               session.seconds_since_last_unsubscribe > unused_session_linger_seconds:
                to_discard.append(session)
        for session in to_discard:
            self.discard_session(session)
