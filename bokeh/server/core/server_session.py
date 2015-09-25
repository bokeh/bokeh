''' Provides the ``ServerSession`` class.

'''
from __future__ import absolute_import

import logging
log = logging.getLogger(__name__)

from tornado import gen, locks

class ServerSession(object):
    ''' Hosts an application "instance" (an instantiated Document) for one or more connections.

    '''

    def __init__(self, sessionid, document):
        if sessionid is None:
            raise ValueError("Sessions must have an id")
        if document is None:
            raise ValueError("Sessions must have a document")
        self._id = sessionid
        self._document = document
        self._subscribed_connections = set()
        self._lock = locks.Lock()

    @property
    def document(self):
        return self._document

    @property
    def id(self):
        return self._id

    def subscribe(self, connection):
        """This should only be called by ServerConnection.subscribe_session or our book-keeping will be broken"""
        self._subscribed_connections.add(connection)

    def unsubscribe(self, connection):
        """This should only be called by ServerConnection.unsubscribe_session or our book-keeping will be broken"""
        self._subscribed_connections.discard(connection)

    @property
    def connection_count(self):
        return len(self._subscribed_connections)

    @classmethod
    @gen.coroutine
    def pull(cls, message, connection, session):
        # TODO implement me
        raise gen.Return(connection.error(message, "pull not implemented"))

    @classmethod
    @gen.coroutine
    def push(cls, message, connection, session):
        with (yield session._lock.acquire()):
            try:
                log.debug("pushing message to session document")
                message.push_to_document(session.document)
            except Exception as e:
                text = "Error pushing document"
                log.error("error pushing document %r", e)
                raise gen.Return(connection.error(message, text))

            raise gen.Return(connection.ok(message))
