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
        self._lock = locks.Lock()

    @property
    def document(self):
        return self._document

    @property
    def id(self):
        return self._id

    # TODO just copied from document, not used
    @gen.coroutine
    def workon(self, executor, task, *args, **kw):
        with (yield self._lock.acquire()):
            res = yield executor.submit(task, *args, **kw)
        raise gen.Return(res)

    @classmethod
    def pull(cls, message, connection, session):
        # TODO hold the lock
        try:
            log.debug("Pulling Document for session %r", session.id)
            # TODO implement sending the document
            return connection.ok(message)
        except Exception as e:
            text = "Error pulling Document"
            log.error(text)
            return connection.error(message, text)

    @classmethod
    def push(cls, message, connection, session):
        # TODO hold the lock
        try:
            log.debug("Pushing Document")
            # TODO implement replacing everything in the session doc
            return connection.ok(message)
        except Exception as e:
            text = "Error pushing Document"
            log.error(text)
            return connection.error(message, text)
