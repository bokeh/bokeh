'''

'''
from __future__ import absolute_import, print_function

from tornado import gen

class NOT_YET_CONNECTED(object):
    @gen.coroutine
    def run(self, connection):
        yield connection._connect_async()

class CONNECTED_BEFORE_ACK(object):
    @gen.coroutine
    def run(self, connection):
        yield connection._wait_for_ack()

class CONNECTED_AFTER_ACK(object):
    @gen.coroutine
    def run(self, connection):
        yield connection._handle_messages()

class DISCONNECTED(object):
    @gen.coroutine
    def run(self, connection):
        raise gen.Return(None)

class WAITING_FOR_REPLY(object):
    def __init__(self, reqid):
        self._reqid = reqid
        self._reply = None

    @property
    def reply(self):
        return self._reply

    @property
    def reqid(self):
        return self._reqid

    @gen.coroutine
    def run(self, connection):
        message = yield connection._pop_message()
        if message is None:
            yield connection._transition_to_disconnected()
        elif 'reqid' in message.header and message.header['reqid'] == self.reqid:
            self._reply = message
            yield connection._transition(CONNECTED_AFTER_ACK())
        else:
            yield connection._next()
