''' Provide a web socket handler for the Bokeh Server application.

'''
from __future__ import absolute_import, print_function

import logging
import random
import time

log = logging.getLogger(__name__)

from tornado import gen
from tornado.websocket import WebSocketHandler, WebSocketClosedError

from ..exceptions import MessageError, ProtocolError, ValidationError
from ..core.server_session import ServerSession
from ..protocol import Protocol
from ..protocol.message import Message
from ..protocol.receiver import Receiver
from ..protocol.server_handler import ServerHandler


class WSHandler(WebSocketHandler):
    ''' Implements a custom Tornado WebSocketHandler for the Bokeh Server.

    '''
    MAX_FAILURES = 3

    def __init__(self, server, *args, **kw):
        self._server = server
        super(WSHandler, self).__init__(server, *args, **kw)

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

        self._server.client_connected(self.session)

        msg = self.session.protocol.create('ACK', self.session.id)
        self.send_message(msg)

    @gen.coroutine
    def on_message(self, fragment):
        ''' Process an individual wire protocol fragment.

        Args:
            fragment (unicode or bytes) : wire fragment to process

        '''
        try:
            message = yield self.receiver.consume(fragment)
        except (MessageError, ProtocolError, ValidationError) as e:
            self._protocol_error(str(e))
            raise gen.Return(None)

        if message is None:
            # Partial message
            raise gen.Return(None)

        log.debug("Received %r", message)

        # Example blocking background stuff
        msgid = message.header['msgid']
        def do_background_stuff():
            delay = random.random() * 2.0
            log.info("start working for %.2f s. on %s", delay, msgid)
            time.sleep(delay)
            log.info("work finished on %s", msgid)
            return "done"

        # This will wait for the background stuff to finish
        # but let other coroutines run in parallel (including
        # responses to other messages on this connection)
        res = yield self._server.run_in_background(do_background_stuff)
        assert res == "done"   # Got the return value

        try:
            work = yield self.handler.handle(message, self.session)
        except ProtocolError as e: # TODO (other exceptions?)
            self._protocol_error(str(e))
            raise gen.Return(None)

        if work:
            if isinstance(work, Message):
                self.send_message(work)
            else:
                item, docid = work
                self.session[docid].workon(item)

        raise gen.Return(None)

    def _protocol_error(self, message):
        log.error("Protocol error: %s, closing connection", message)
        # According to RFC 6455, "1002 indicates that an endpoint is
        # terminating the connection due to a protocol error".
        self.close(1002, message)

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
        self._server.client_lost(self.session)

