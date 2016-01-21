''' Provide a web socket handler for the Bokeh Server application.

'''
from __future__ import absolute_import, print_function

import logging
log = logging.getLogger(__name__)

import codecs

from six.moves.urllib.parse import urlparse

from tornado import gen, locks
from tornado.websocket import WebSocketHandler, WebSocketClosedError
from tornado.concurrent import Future

from ..exceptions import MessageError, ProtocolError, ValidationError
from ..protocol import Protocol
from ..protocol.message import Message
from ..protocol.receiver import Receiver
from ..protocol.server_handler import ServerHandler

from bokeh.util.session_id import check_session_id_signature

class WSHandler(WebSocketHandler):
    ''' Implements a custom Tornado WebSocketHandler for the Bokeh Server.

    '''
    def __init__(self, tornado_app, *args, **kw):
        self.receiver = None
        self.handler = None
        self.connection = None
        self.application_context = kw['application_context']
        self.latest_pong = -1
        # write_lock allows us to lock the connection to send multiple
        # messages atomically.
        self.write_lock = locks.Lock()
        # Note: tornado_app is stored as self.application
        super(WSHandler, self).__init__(tornado_app, *args, **kw)

    def initialize(self, application_context, bokeh_websocket_path):
        pass

    def check_origin(self, origin):
        from ..tornado import check_whitelist
        parsed_origin = urlparse(origin)
        origin_host = parsed_origin.netloc.lower()

        allowed_hosts = self.application.websocket_origins

        allowed = check_whitelist(origin_host, allowed_hosts)
        if allowed:
            return True
        else:
            log.error("Refusing websocket connection from Origin '%s'; \
                      use --allow-websocket-origin=%s to permit this; currently we allow origins %r",
                      origin, origin_host, allowed_hosts)
            return False

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

        if not check_session_id_signature(session_id,
                                          signed=self.application.sign_sessions,
                                          secret_key=self.application.secret_key):
            log.error("Session id had invalid signature: %r", session_id)
            raise ProtocolError("Invalid session ID")

        def on_fully_opened(future):
            e = future.exception()
            if e is not None:
                # this isn't really an error (unless we have a
                # bug), it just means a client disconnected
                # immediately, most likely.
                log.debug("Failed to fully open connection %r", e)

        future = self._async_open(session_id, proto_version)
        self.application.io_loop.add_future(future,
                                            on_fully_opened)

    @gen.coroutine
    def _async_open(self, session_id, proto_version):
        try:
            yield self.application_context.create_session_if_needed(session_id)
            session = self.application_context.get_session(session_id)

            protocol = Protocol(proto_version)
            self.receiver = Receiver(protocol)
            log.debug("Receiver created for %r", protocol)

            self.handler = ServerHandler()
            log.debug("ServerHandler created for %r", protocol)

            self.connection = self.application.new_connection(protocol, self, self.application_context, session)
            log.info("ServerConnection created")

        except ProtocolError as e:
            log.error("Could not create new server session, reason: %s", e)
            self.close()
            raise e

        msg = self.connection.protocol.create('ACK')
        yield self.send_message(msg)

        raise gen.Return(None)

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

        # We shouldn't throw exceptions from on_message because
        # the caller is just Tornado and it doesn't know what to
        # do with them other than report them as an unhandled
        # Future

        try:
            message = yield self._receive(fragment)
        except Exception as e:
            # If you go look at self._receive, it's catching the
            # expected error types... here we have something weird.
            log.error("Unhandled exception receiving a message: %r: %r", e, fragment, exc_info=True)
            self._internal_error("server failed to parse a message")

        try:
            if message:

                #log.debug("Received message: %r", message)
                work = yield self._handle(message)

                #log.debug("work from message %r was %r", message, work)

                if work:
                    yield self._schedule(work)
        except Exception as e:
            log.error("Handler or its work threw an exception: %r: %r", e, message, exc_info=True)
            self._internal_error("server failed to handle a message")

        raise gen.Return(None)

    def on_pong(self, data):
        # if we get an invalid integer or utf-8 back, either we
        # sent a buggy ping or the client is evil/broken.
        try:
            self.latest_pong = int(codecs.decode(data, 'utf-8'))
        except UnicodeDecodeError:
            log.error("received invalid unicode in pong %r", data, exc_info=True)
        except ValueError:
            log.error("received invalid integer in pong %r", data, exc_info=True)

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

    @gen.coroutine
    def write_message(self, message, binary=False, locked=True):
        ''' Override parent write_message with a version that consistently returns Future across Tornado versions '''
        def write_message_unlocked():
            future = super(WSHandler, self).write_message(message, binary)
            if future is None:
                # tornado >= 4.3 gives us a Future, simulate that
                # with this fake Future on < 4.3
                future = Future()
                future.set_result(None)
            # don't yield this future or we're blocking on ourselves!
            raise gen.Return(future)
        if locked:
            with (yield self.write_lock.acquire()):
                write_message_unlocked()
        else:
            write_message_unlocked()


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
            self._internal_error("expected a Message not " + repr(work))

        raise gen.Return(None)

    def _internal_error(self, message):
        log.error("Bokeh Server internal error: %s, closing connection", message)
        self.close(10000, message)

    def _protocol_error(self, message):
        log.error("Bokeh Server protocol error: %s, closing connection", message)
        self.close(10001, message)
