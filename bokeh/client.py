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
import uuid

from .document import Document

DEFAULT_SERVER_URL = "ws://localhost:8888/ws?token=grizzleblizzle"
DEFAULT_SESSION_ID = "default"

class ClientConnection(object):

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

    def __init__(self, io_loop=None, url=DEFAULT_SERVER_URL):
        '''
          Opens a websocket connection to the server.
        '''
        self._url = url
        self._protocol = Protocol("1.0")
        self._receiver = Receiver(self._protocol)
        self._socket = None
        self._state = self.NOT_YET_CONNECTED()
        if io_loop is None:
            io_loop = IOLoop.current()
        self._loop = io_loop
        self._until_predicate = None

    @property
    def connected(self):
        """True if we've connected the websocket and exchanged initial handshake messages."""
        return isinstance(self._state, self.CONNECTED_AFTER_ACK)

    def connect(self):
        def connected_or_closed():
            # we should be looking at the same state here as the 'connected' property above, so connected
            # means both connected and that we did our initial message exchange
            return isinstance(self._state, self.CONNECTED_AFTER_ACK) or isinstance(self._state, self.DISCONNECTED)
        self._loop_until(connected_or_closed)

    def close(self, why="closed"):
        if self._socket is not None:
            self._socket.close(1000, why)
        self.loop_until_closed()

    def loop_until_closed(self):
        if isinstance(self._state, self.NOT_YET_CONNECTED):
            self._state = self.DISCONNECTED()
        else:
            def closed():
                return isinstance(self._state, self.DISCONNECTED)
            self._loop_until(closed)

    def send_message(self, message):
        sent = message.send(self._socket)
        log.debug("Sent %r [%d bytes]", message, sent)


    def _loop_until(self, predicate):
        self._until_predicate = predicate
        try:
            # this runs self._next ONE time, but
            # self._next re-runs itself until
            # the predicate says to quit.
            self._loop.add_callback(self._next)
            self._loop.start()
        except KeyboardInterrupt:
            self.close("user interruption")

    @gen.coroutine
    def _next(self):
        if self._until_predicate is not None and self._until_predicate():
            log.debug("Stopping client loop in state " + self._state.__class__.__name__)
            self._until_predicate = None
            self._loop.stop()
            raise gen.Return(None)
        else:
            log.debug("Running state " + self._state.__class__.__name__)
            yield self._state.run(self)

    @gen.coroutine
    def _transition(self, new_state):
        log.debug("transitioning to state " + new_state.__class__.__name__)
        self._state = new_state
        yield self._next()

    @gen.coroutine
    def _connect_async(self):
        request = HTTPRequest(self._url, headers={"bokeh-protocol-version": "1.0" })
        self._socket = yield websocket_connect(request)
        yield self._transition(self.CONNECTED_BEFORE_ACK())

    @gen.coroutine
    def _wait_for_ack(self):
        message = yield self._pop_message()
        if message and message.msgtype is 'ACK':
            log.debug("Received %r", message)
            yield self._transition(self.CONNECTED_AFTER_ACK())
        elif message is None:
            yield self._transition(self.DISCONNECTED())
        else:
            raise ProtocolError("Received %r instead of ACK" % message)

    @gen.coroutine
    def _handle_messages(self):
        message = yield self._pop_message()
        if message is None:
            yield self._transition(self.DISCONNECTED())
        else:
            # TODO do something with these messages :-)
            yield self._next()

    @gen.coroutine
    def _pop_message(self):
        while True:
            # log.debug("Waiting for fragment...")
            fragment = yield self._socket.read_message()
            # log.debug("... got fragment %r", fragment)
            if fragment is None:
                # XXX Tornado doesn't give us the code and reason
                log.info("Connection closed by server")
                raise gen.Return(None)
            try:
                message = yield self._receiver.consume(fragment)
                if message is not None:
                    log.debug("Received message %r" % message)
                    raise gen.Return(message)
            except (MessageError, ProtocolError, ValidationError) as e:
                log.error("%r", e)
                raise e

class ClientSession(object):

    def __init__(self, connection, sessionid):
        '''
          Attaches to a particular named session on the server.
        '''
        self._connection = connection
        self._id = self._ensure_session_id(sessionid)
        self._document = Document()

    @classmethod
    def _ensure_session_id(cls, sessionid=DEFAULT_SESSION_ID):
        if sessionid is None:
            sessionid = str(uuid.uuid4())
        return sessionid

    @property
    def document(self):
        return self._document

    @property
    def id(self):
        return self._id

def test_main():
    from bokeh.application import Application
    from bokeh.server.server import Server

    logging.basicConfig(level=logging.DEBUG)

    application = Application()
    server = Server(application)
    # we don't have to start the server because it
    # uses the same main loop as the client, below

    connection = ClientConnection()
    connection.connect()
    msg = Protocol("1.0").create('SERVER-INFO-REQ')
    connection.send_message(msg)
    msg = Protocol("1.0").create('PULL-DOC-REQ', 'fakesessionid')
    connection.send_message(msg)
    log.info("Sending deliberately bogus message")
    connection._socket.write_message(b"xx", binary=True)

    connection.loop_until_closed()
