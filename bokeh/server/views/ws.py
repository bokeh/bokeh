''' Provide a web socket handler for the Bokeh Server application.

'''
from __future__ import absolute_import, print_function

import logging
log = logging.getLogger(__name__)

import random
import time


from tornado import gen
from tornado.websocket import WebSocketHandler, WebSocketClosedError

from ..exceptions import MessageError, ProtocolError, ValidationError
from ..core.server_session import ServerSession
from ..core.server_task import ServerTask
from ..protocol import Protocol
from ..protocol.message import Message
from ..protocol.receiver import Receiver
from ..protocol.server_handler import ServerHandler

def do_background_stuff(msgid):
    delay = random.random() * 2.0
    log.info("start working for %.2f s. on %s", delay, msgid)
    time.sleep(delay)
    log.info("work finished on %s", msgid)
    return "done"

class WSHandler(WebSocketHandler):
    ''' Implements a custom Tornado WebSocketHandler for the Bokeh Server.

    '''
    def __init__(self, tornado_app, *args, **kw):
        self._tornado_app = tornado_app
        super(WSHandler, self).__init__(tornado_app, *args, **kw)

    def open(self):
        ''' Initialize a connection to a client.

        '''
        log.info('WebSocket connection opened')

        proto_version = self.request.headers.get("bokeh-protocol-version", None)
        if not proto_version:
            self.close()
            raise ProtocolError("No protocol version specified")

        try:
            protocol = Protocol(proto_version)
            self.receiver = Receiver(protocol)
            log.debug("Receiver created created for %r", protocol)

            self.handler = ServerHandler(protocol)
            log.debug("ServerHandler created created for %r", protocol)

            self.session = ServerSession(protocol)
            log.info("ServerSession created (id: %s)", self.session.id)

        except ProtocolError as e:
            log.error("Could not create new server session, reason: %s", e)
            self.close()
            raise

        self._tornado_app.client_connected(self.session)

        msg = self.session.protocol.create('ACK', self.session.id)
        self.send_message(msg)

    @gen.coroutine
    def on_message(self, fragment):
        ''' Process an individual wire protocol fragment.

        Args:
            fragment (unicode or bytes) : wire fragment to process

        '''

        message = yield self._receive(fragment)

        if message:

            log.debug("Received message: %r", message)
            work = yield self._handle(message)

            if work:
                yield self._schedule(work)

        raise gen.Return(None)

    def send_message(self, message):
        ''' Send a Bokeh Server protocol message to the connected client.

        Args:
            message (Message) : a message to send

        '''
        try:
            sent = message.send(self)
        except WebSocketClosedError:
            # on_close() is / will be called anyway
            log.warn("Failed sending message as connection was closed")
            pass
        else:
            log.debug("Sent %r [%d bytes]", message, sent)

    def on_close(self):
        ''' Clean up when the connection is closed.

        '''
        log.info('WebSocket connection closed: code=%s, reason=%r',
                 self.close_code, self.close_reason)
        self._tornado_app.client_lost(self.session)

    @gen.coroutine
    def _receive(self, fragment):
        # Receive fragments until a complete message is assembled
        try:
            message = yield self.receiver.consume(fragment)
            raise gen.Return(message)
        except (MessageError, ProtocolError, ValidationError) as e:
            self._protocol_error(str(e))
            raise gen.Return(None)

    @gen.coroutine
    def _handle(self, message):
        # Handle the message, possibly resulting in work to do
        try:
            work = yield self.handler.handle(message, self.session)
            raise gen.Return(work)
        except (MessageError, ProtocolError, ValidationError) as e: # TODO (other exceptions?)
            self._internal_error(str(e))
            raise gen.Return(None)

    @gen.coroutine
    def _schedule(self, work):
        if isinstance(work, Message):
            self.send_message(work)

        elif isinstance(work, ServerTask):
            work = yield work(self._tornado_app.executor)

        else:
            self._internal_error("expected a Message or Task")
            raise gen.Return(None)

        raise gen.Return(None)


    def _internal_error(self, message):
        log.error("Bokeh Server internal error: %s, closing connection", message)
        self.close(10000, message)

    def _protocol_error(self, message):
        log.error("Bokeh Server protocol error: %s, closing connection", message)
        self.close(10001, message)

