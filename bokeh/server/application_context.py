''' Provides the ``ApplicationContext`` class.

'''
from __future__ import absolute_import

import logging
log = logging.getLogger(__name__)

from .session import ServerSession
from .exceptions import ProtocolError

class ApplicationContext(object):
    ''' Server-side holder for bokeh.application.Application plus any associated data.
        This holds data that's global to all sessions, while ServerSession holds
        data specific to an "instance" of the application.
    '''

    def __init__(self, application, io_loop=None):
        self._application = application
        self._loop = io_loop
        self._sessions = dict()

    @property
    def application(self):
        return self._application

    def create_session_if_needed(self, session_id):
        # this is because empty session_ids would be "falsey" and
        # potentially open up a way for clients to confuse us
        if len(session_id) == 0:
            raise ProtocolError("Session ID must not be empty")

        if session_id not in self._sessions:
            doc = self._application.create_document()
            session = ServerSession(session_id, doc, io_loop=self._loop)
            self._sessions[session_id] = session

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
        del self._sessions[session.id]

    def cleanup_sessions(self, unused_session_linger_seconds):
        to_discard = []
        for session in self._sessions.values():
            if session.connection_count == 0 and \
               session.seconds_since_last_unsubscribe > unused_session_linger_seconds:
                to_discard.append(session)
        for session in to_discard:
            self.discard_session(session)
