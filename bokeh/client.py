'''

'''
from __future__ import absolute_import, print_function

import logging
import random

log = logging.getLogger(__name__)

from tornado import gen
from tornado.httpclient import HTTPRequest
from tornado.ioloop import IOLoop, PeriodicCallback
from tornado.websocket import websocket_connect

from bokeh.server.exceptions import MessageError, ProtocolError, ValidationError
from bokeh.server.protocol.receiver import Receiver
from bokeh.server.protocol import Protocol

class ClientSession(object):

    def __init__(self, url="ws://localhost:8888/ws", callbacks=None):
        self._request = HTTPRequest(url, headers={"bokeh-protocol-version": "1.0"})
        self._callbacks = callbacks
        self._session_id = None
        self._protocol = Protocol("1.0")
        self._receiver = Receiver(self._protocol)
        self._client = None

    def connect(self):
        loop = IOLoop.instance()
        loop.add_callback(self._run)
        try:
            loop.start()
        except KeyboardInterrupt:
            if self._client is not None:
                self._client.close(1000, "user interruption")

    def send_message(self, message):
        sent = message.send(self._client)
        log.debug("Sent %r [%d bytes]", message, sent)

    @gen.coroutine
    def _run(self):
        yield self._connect_async()
        yield self._worker()

    @gen.coroutine
    def _connect_async(self):
        self._client = yield websocket_connect(self._request)

    @gen.coroutine
    def _worker(self):
        while True:
            fragment = yield self._client.read_message()
            if fragment is None:
                # XXX Tornado doesn't give us the code and reason
                log.info("Connection closed by server")
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
        def wrapper():
            func(self)
        return wrapper

    def _start_callbacks(self):
        for cb, period in self._callbacks:
            if period:
                PeriodicCallback(self._callback_wrapper(cb),
                                 period  * 1000,  # ms
                                 ).start()
            else:
                IOLoop.instance().add_callback(self._callback_wrapper(cb))


def foo(cli):
    msg = Protocol("1.0").create('SERVER-INFO-REQ', cli._session_id)
    cli.send_message(msg)

def bar(cli):
    msg = Protocol("1.0").create('PULL-DOC-REQ', cli._session_id, "some_doc")
    cli.send_message(msg)

def quux(cli):
    log.info("Sending deliberately bogus message")
    cli._client.write_message(b"xx", binary=True)


if __name__ == '__main__':
    logging.basicConfig(level=logging.DEBUG)
    session = ClientSession(callbacks=[(foo, 0.8), (bar, 3.0), (quux, 30.0)])
    session.connect()

