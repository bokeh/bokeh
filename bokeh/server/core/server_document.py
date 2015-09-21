'''

'''
from __future__ import absolute_import

import logging
log = logging.getLogger(__name__)

from tornado import gen, locks

class ServerDocument(object):

    def __init__(self, doc):
        self._docid = docid
        self._lock = locks.Lock()

    @gen.coroutine
    def workon(self, executor, task, *args, **kw):
        with (yield self._lock.acquire()):
            res = yield executor.submit(task, *args, **kw)
        raise gen.Return(res)

    @classmethod
    def pull(cls, message, session):
        try:
            docid = message.content['docid']
            log.debug("Pulling Document %r", docid)
            doc = cls(docid)
            session.add_document(doc)
            return session.ok(message)
        except Exception as e:
            text = "Error pulling Document"
            log.error(text)
            return session.error(message, text)

    @classmethod
    def push(cls, message, session):
        try:
            log.debug("Pushing Document")
            session.storage.push_doc(message)
            return session.ok(message)
        except Exception as e:
            text = "Error pushing Document"
            log.error(text)
            return session.error(message, text)

    @property
    def id(self):
        return self._docid
