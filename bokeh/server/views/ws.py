''' Provide a web socket handler for the Bokeh Server application.

'''
from __future__ import absolute_import, print_function

import logging
log = logging.getLogger(__name__)

from tornado import gen
from tornado.websocket import WebSocketHandler

from ..exceptions import MessageError, ProtocolError, ValidationError
from ..core.server_session import ServerSession
from ..protocol import Protocol
from ..protocol.message import Message
from ..protocol.receiver import Receiver
from ..protocol.server_handler import ServerHandler

class WSHandler(WebSocketHandler):
    ''' Implements a custom Tornado WebSocketHandler for the Bokeh Server.

    '''

    clients = set()

    def __init__(self, *args, **kw):
        super(WSHandler, self).__init__(*args, **kw)
        self.session = None

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

        self.clients.add(self)

        msg = self.session.protocol.create('ACK', self.session.id)
        self.send_message(msg)

    @gen.coroutine
    def on_message(self, fragment):
        ''' Process an individual wire protocol fragment.

        Args:
            fragment (UTF-8 or bytes) : wire fragment to process

        '''
        try:
            message = yield self.receiver.consume(fragment)
        except (MessageError, ProtocolError, ValidationError) as e:
            log.error(e)
            # TODO (bev) : if self.receiver.failures > MAX FAILUES
            raise gen.Return(None)

        if message is None:
            raise gen.Return(None)

        log.debug("Received %r", message)

        try:
            work = yield self.handler.handle(message, self.session)
        except ProtocolError as e:
            log.error(e)
            raise gen.Return(None)

        if work:
            if isinstance(work, Message):
                self.send_message(work)
            else:
                item, docid = work
                self.session[docid].workon(item)

        raise gen.Return(None)

    def send_message(self, message):
        ''' Send a Bokeh Server protocol message to the connected client.

        Args:
            message (Message) : a message to send

        '''
        sent = message.send(self)
        log.debug("Sent %r [%d bytes]", message, sent)

    def on_close(self):
        ''' Clean up when the connection is closed.

        '''
        log.info('WebSocket connection closed')
        if self in self.clients:
            self.clients.remove(self)

