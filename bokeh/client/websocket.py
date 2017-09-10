''' Provide a low-level wrapper for Tornado Websockets that adds locking
and smooths some compatibility issues.

'''
from __future__ import absolute_import, print_function

from tornado import gen, locks
from tornado.websocket import WebSocketError

class WebSocketClientConnectionWrapper(object):
    ''' Used for compat across Tornado versions and to add write_lock'''

    def __init__(self, socket):
        if socket is None:
            raise ValueError("socket must not be None")
        self._socket = socket
        # write_lock allows us to lock the connection to send multiple
        # messages atomically.
        self.write_lock = locks.Lock()

    @gen.coroutine
    def write_message(self, message, binary=False, locked=True):
        ''' Write a message to the websocket after obtaining the appropriate
        Bokeh Document lock.

        '''
        def write_message_unlocked():
            if self._socket.protocol is None:
                # Tornado is maybe supposed to do this, but in fact it
                # tries to do _socket.protocol.write_message when protocol
                # is None and throws AttributeError or something. So avoid
                # trying to write to the closed socket. There doesn't seem
                # to be an obvious public function to check if the socket
                # is closed.
                raise WebSocketError("Connection to the server has been closed")

            future = self._socket.write_message(message, binary)

            # don't yield this future or we're blocking on ourselves!
            raise gen.Return(future)

        if locked:
            with (yield self.write_lock.acquire()):
                write_message_unlocked()
        else:
            write_message_unlocked()

    def close(self, code=None, reason=None):
        ''' Close the websocket. '''
        return self._socket.close(code, reason)

    def read_message(self, callback=None):
        ''' Read a message from websocket and execute a callback.

        '''
        return self._socket.read_message(callback)
