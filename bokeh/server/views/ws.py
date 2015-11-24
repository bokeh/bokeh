''' Provide a web socket handler for the Bokeh Server application.

'''
from __future__ import absolute_import, print_function

import logging
log = logging.getLogger(__name__)

import random
import time


from tornado import gen
from tornado.websocket import WebSocketHandler, WebSocketClosedError
from tornado.concurrent import Future

from ..exceptions import MessageError, ProtocolError, ValidationError
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
        self.receiver = None
        self.handler = None
        self.connection = None
        self.application_context = kw['application_context']
        # Note: tornado_app is stored as self.application
        super(WSHandler, self).__init__(tornado_app, *args, **kw)

    def initialize(self, application_context, bokeh_websocket_path):
        pass

    def check_origin(self, origin):
        # Allow ANY site to open our websocket...
        # this is to make the autoload embed work.
        # Potentially, we should limit this somehow
        # or make it configurable.
        return True

    def open(self):
        ''' Initialize a connection to a client.

        '''
        log.info('WebSocket connection opened')

        proto_version = self.get_argument("bokeh-protocol-version", default=None)
        if proto_version is None:
            self.close()
            raise ProtocolError("No bokeh-protocol-version specified")

        session_id = self.get_argument("bokeh-session-id", default=None)
        if session_id is None:
            self.close()
            raise ProtocolError("No bokeh-session-id specified")

        try:
            self.application_context.create_session_if_needed(session_id)
            session = self.application_context.get_session(session_id)

            protocol = Protocol(proto_version)
            self.receiver = Receiver(protocol)
            log.debug("Receiver created created for %r", protocol)

            self.handler = ServerHandler()
            log.debug("ServerHandler created created for %r", protocol)

            self.connection = self.application.new_connection(protocol, self, self.application_context, session)
            log.info("ServerConnection created")

        except ProtocolError as e:
            log.error("Could not create new server session, reason: %s", e)
            self.close()
            raise e

        def on_ack_sent(future):
            e = future.exception()
            if e is not None:
                # this isn't really an error (unless we have a
                # bug), it just means a client disconnected
                # immediately, most likely.
                log.debug("Failed to send ack %r", e)

        msg = self.connection.protocol.create('ACK')
        self.application.io_loop.add_future(self.send_message(msg), on_ack_sent)

    @gen.coroutine
    def on_message(self, fragment):
        ''' Process an individual wire protocol fragment.

            The websocket RFC specifies opcodes for distinguishing
            text frames from binary frames. Tornado passes us either
            a text or binary string depending on that opcode, we have
            to look at the type of the fragment to see what we got.

        Args:
            fragment (unicode or bytes) : wire fragment to process

        '''

        message = yield self._receive(fragment)

        if message:

            #log.debug("Received message: %r", message)
            work = yield self._handle(message)

            #log.debug("work from message %r was %r", message, work)

            if work:
                yield self._schedule(work)

        raise gen.Return(None)

    @gen.coroutine
    def send_message(self, message):
        ''' Send a Bokeh Server protocol message to the connected client.

        Args:
            message (Message) : a message to send

        '''
        try:
            yield message.send(self)
        except WebSocketClosedError:
            # on_close() is / will be called anyway
            log.warn("Failed sending message as connection was closed")
        raise gen.Return(None)

    def write_message(self, message, binary=False):
        ''' Override parent write_message with a version that consistently returns Future across Tornado versions '''
        future = super(WSHandler, self).write_message(message, binary)
        if future is None:
            # tornado >= 4.3 gives us a Future, simulate that
            # with this fake Future on < 4.3
            future = Future()
            future.set_result(None)
        return future

    def on_close(self):
        ''' Clean up when the connection is closed.

        '''
        log.info('WebSocket connection closed: code=%s, reason=%r',
                 self.close_code, self.close_reason)
        if self.connection is not None:
            self.application.client_lost(self.connection)

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
            work = yield self.handler.handle(message, self.connection)
            raise gen.Return(work)
        except (MessageError, ProtocolError, ValidationError) as e: # TODO (other exceptions?)
            self._internal_error(str(e))
            raise gen.Return(None)

    @gen.coroutine
    def _schedule(self, work):
        if isinstance(work, Message):
            yield self.send_message(work)
        else:
            self._internal_error("expected a Message")

        raise gen.Return(None)

    def _internal_error(self, message):
        log.error("Bokeh Server internal error: %s, closing connection", message)
        self.close(10000, message)

    def _protocol_error(self, message):
        log.error("Bokeh Server protocol error: %s, closing connection", message)
        self.close(10001, message)

