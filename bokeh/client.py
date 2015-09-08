'''

'''
from __future__ import absolute_import, print_function

import logging
log = logging.getLogger(__name__)

from tornado import gen
from tornado.httpclient import HTTPRequest
from tornado.ioloop import IOLoop, PeriodicCallback
from tornado.websocket import websocket_connect

from bokeh.server.exceptions import MessageError, ProtocolError, ValidationError
from bokeh.server.protocol.receiver import Receiver
from bokeh.server.protocol import Protocol

class ClientSession(object):

    def __init__(self, url="ws://localhost:8888/ws", callback=None, callback_interval=None):
        self._request = HTTPRequest(url, headers={"bokeh-protocol-version": "1.0"})
        self._callback = callback
        self._callback_interval = callback_interval
        self._session_id = None
        self._protocol = Protocol("1.0")
        self._receiver = Receiver(self._protocol)

    def connect(self):
        IOLoop.instance().add_callback(self._connect_async)
        IOLoop.instance().start()

    def send_message(self, message):
        sent = message.send(self._client)
        log.debug("Sent %r [%d bytes]", message, sent)

    @gen.coroutine
    def _connect_async(self):
        self._client = yield websocket_connect(self._request)
        IOLoop.instance().add_callback(self._worker)

    @gen.coroutine
    def _worker(self):
        while True:
            fragment = yield self._client.read_message()
            if fragment is None:
                break
            try:
                message = yield self._receiver.consume(fragment)
            except (MessageError, ProtocolError, ValidationError) as e:
                log.error("%r", e)
                raise e

            if message:
                log.debug("Received %r", message)
                if message.msgtype is 'ACK':
                    self._session_id = message.header['sessid']
                    self._start_callbacks()

        IOLoop.instance().stop()

    def _callback_wrapper(self, func):
        sessid = self._session_id
        def wrapper(*args, **kw):
            msg = func(sessid)
            self.send_message(msg)
        return wrapper

    def _start_callbacks(self):
        if self._callback and self._callback_interval:
            PeriodicCallback(self._callback_wrapper(self._callback), self._callback_interval).start()
        elif self._callback:
            IOLoop.instance().add_callback(self._callback_wrapper(self._callback))

def foo(session_id):
    #return Protocol("1.0").create('SERVER-INFO-REQ', session_id)
    #return Protocol("1.0").create('PUSH-DOC', session_id, None)
    return Protocol("1.0").create('PULL-DOC-REQ', session_id, "some_doc")

if __name__ == '__main__':
    logging.basicConfig(level=logging.DEBUG)
    session = ClientSession(callback=foo, callback_interval=1000)
    session.connect()



