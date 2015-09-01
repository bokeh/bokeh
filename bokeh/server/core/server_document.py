'''

'''
from __future__ import absolute_import

from tornado import gen
from tornado.queues import Queue

class ServerDocument(object):

    def __init__(self, docid):
        self._docid = docid
        self._queue = Queue
        self._stopped = False

    def stop_worker(self):
        self._stopped = True

    @gen.coroutine
    def workon(self, item):
        yield self._queue.put(item)

    @gen.coroutine
    def worker(self):
        # TODO (bev) stopping logic
        while True:
            item = yield self._queue.get()
            try:
                yield item()
            finally:
                self._queue.task_done()

