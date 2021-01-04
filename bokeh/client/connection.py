#-----------------------------------------------------------------------------
# Copyright (c) 2012 - 2020, Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------
''' Implements a very low level facility for communicating with a Bokeh
Server.

Users will always want to use :class:`~bokeh.client.session.ClientSession`
instead for standard usage.

'''

#-----------------------------------------------------------------------------
# Boilerplate
#-----------------------------------------------------------------------------
import logging # isort:skip
log = logging.getLogger(__name__)

#-----------------------------------------------------------------------------
# Imports
#-----------------------------------------------------------------------------

# External imports
from tornado.httpclient import HTTPClientError, HTTPRequest
from tornado.ioloop import IOLoop
from tornado.websocket import WebSocketError, websocket_connect

# Bokeh imports
from ..protocol import Protocol
from ..protocol.exceptions import MessageError, ProtocolError, ValidationError
from ..protocol.receiver import Receiver
from ..util.string import format_url_query_arguments
from ..util.tornado import fixup_windows_event_loop_policy
from .states import (
    CONNECTED_AFTER_ACK,
    CONNECTED_BEFORE_ACK,
    DISCONNECTED,
    NOT_YET_CONNECTED,
    WAITING_FOR_REPLY,
    ErrorReason,
)
from .websocket import WebSocketClientConnectionWrapper

#-----------------------------------------------------------------------------
# Globals and constants
#-----------------------------------------------------------------------------

__all__ = (
    'ClientConnection',
)

#-----------------------------------------------------------------------------
# General API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Dev API
#-----------------------------------------------------------------------------

class ClientConnection:
    ''' A Bokeh low-level class used to implement ``ClientSession``; use ``ClientSession`` to connect to the server.

    '''

    def __init__(self, session, websocket_url, io_loop=None, arguments=None):
        ''' Opens a websocket connection to the server.

        '''
        self._url = websocket_url
        self._session = session
        self._arguments = arguments
        self._protocol = Protocol()
        self._receiver = Receiver(self._protocol)
        self._socket = None
        self._state = NOT_YET_CONNECTED()
        if io_loop is None:
            # We can't use IOLoop.current because then we break
            # when running inside a notebook since ipython also uses it
            io_loop = IOLoop()
        self._loop = io_loop
        self._until_predicate = None
        self._server_info = None

    # Properties --------------------------------------------------------------

    @property
    def connected(self):
        ''' Whether we've connected the Websocket and have exchanged initial
        handshake messages.

        '''
        return isinstance(self._state, CONNECTED_AFTER_ACK)

    @property
    def io_loop(self):
        ''' The Tornado ``IOLoop`` this connection is using. '''
        return self._loop


    @property
    def url(self):
        ''' The URL of the websocket this Connection is to. '''
        return self._url

    @property
    def error_reason(self):
        ''' The reason of the connection loss encoded as a ``DISCONNECTED.ErrorReason`` enum value '''
        if not isinstance(self._state, DISCONNECTED):
            return None
        return self._state.error_reason

    @property
    def error_code(self):
        ''' If there was an error that caused a disconnect, this property holds
        the error code. None otherwise.

        '''
        if not isinstance(self._state, DISCONNECTED):
            return 0
        return self._state.error_code

    @property
    def error_detail(self):
        ''' If there was an error that caused a disconnect, this property holds
        the error detail. Empty string otherwise.

        '''
        if not isinstance(self._state, DISCONNECTED):
            return ""
        return self._state.error_detail

    # Internal methods --------------------------------------------------------

    def connect(self):
        def connected_or_closed():
            # we should be looking at the same state here as the 'connected' property above, so connected
            # means both connected and that we did our initial message exchange
            return isinstance(self._state, CONNECTED_AFTER_ACK) or isinstance(self._state, DISCONNECTED)
        self._loop_until(connected_or_closed)

    def close(self, why="closed"):
        ''' Close the Websocket connection.

        '''
        if self._socket is not None:
            self._socket.close(1000, why)

    def force_roundtrip(self):
        ''' Force a round-trip request/reply to the server, sometimes needed to
        avoid race conditions. Mostly useful for testing.

        Outside of test suites, this method hurts performance and should not be
        needed.

        Returns:
           None

        '''
        self._send_request_server_info()

    def loop_until_closed(self):
        ''' Execute a blocking loop that runs and executes event callbacks
        until the connection is closed (e.g. by hitting Ctrl-C).

        While this method can be used to run Bokeh application code "outside"
        the Bokeh server, this practice is HIGHLY DISCOURAGED for any real
        use case.

        '''
        if isinstance(self._state, NOT_YET_CONNECTED):
            # we don't use self._transition_to_disconnected here
            # because _transition is a coroutine
            self._tell_session_about_disconnect()
            self._state = DISCONNECTED()
        else:
            def closed():
                return isinstance(self._state, DISCONNECTED)
            self._loop_until(closed)

    def pull_doc(self, document):
        ''' Pull a document from the server, overwriting the passed-in document

        Args:
            document : (Document)
              The document to overwrite with server content.

        Returns:
            None

        '''
        msg = self._protocol.create('PULL-DOC-REQ')
        reply = self._send_message_wait_for_reply(msg)
        if reply is None:
            raise RuntimeError("Connection to server was lost")
        elif reply.header['msgtype'] == 'ERROR':
            raise RuntimeError("Failed to pull document: " + reply.content['text'])
        else:
            reply.push_to_document(document)

    def push_doc(self, document):
        ''' Push a document to the server, overwriting any existing server-side doc.

        Args:
            document : (Document)
                A Document to push to the server

        Returns:
            The server reply

        '''
        msg = self._protocol.create('PUSH-DOC', document)
        reply = self._send_message_wait_for_reply(msg)
        if reply is None:
            raise RuntimeError("Connection to server was lost")
        elif reply.header['msgtype'] == 'ERROR':
            raise RuntimeError("Failed to push document: " + reply.content['text'])
        else:
            return reply

    def request_server_info(self):
        ''' Ask for information about the server.

        Returns:
            A dictionary of server attributes.

        '''
        if self._server_info is None:
            self._server_info = self._send_request_server_info()
        return self._server_info

    async def send_message(self, message):
        if self._socket is None:
            log.info("We're disconnected, so not sending message %r", message)
        else:
            try:
                sent = await message.send(self._socket)
                log.debug("Sent %r [%d bytes]", message, sent)
            except WebSocketError as e:
                # A thing that happens is that we detect the
                # socket closing by getting a None from
                # read_message, but the network socket can be down
                # with many messages still in the read buffer, so
                # we'll process all those incoming messages and
                # get write errors trying to send change
                # notifications during that processing.

                # this is just debug level because it's completely normal
                # for it to happen when the socket shuts down.
                log.debug("Error sending message to server: %r", e)

                # error is almost certainly because
                # socket is already closed, but be sure,
                # because once we fail to send a message
                # we can't recover
                self.close(why="received error while sending")

                # don't re-throw the error - there's nothing to
                # do about it.

        return None

    # Private methods ---------------------------------------------------------

    async def _connect_async(self):
        formatted_url = format_url_query_arguments(self._url, self._arguments)
        request = HTTPRequest(formatted_url)
        try:
            socket = await websocket_connect(request, subprotocols=["bokeh", self._session.token])
            self._socket = WebSocketClientConnectionWrapper(socket)
        except HTTPClientError as e:
            await self._transition_to_disconnected(DISCONNECTED(ErrorReason.HTTP_ERROR, e.code, e.message))
            return
        except Exception as e:
            log.info("Failed to connect to server: %r", e)

        if self._socket is None:
            await self._transition_to_disconnected(DISCONNECTED(ErrorReason.NETWORK_ERROR, None, "Socket invalid."))
        else:
            await self._transition(CONNECTED_BEFORE_ACK())

    async def _handle_messages(self):
        message = await self._pop_message()
        if message is None:
            await self._transition_to_disconnected(DISCONNECTED(ErrorReason.HTTP_ERROR, 500, "Internal server error."))
        else:
            if message.msgtype == 'PATCH-DOC':
                log.debug("Got PATCH-DOC, applying to session")
                self._session._handle_patch(message)
            else:
                log.debug("Ignoring %r", message)
            # we don't know about whatever message we got, ignore it.
            await self._next()

    def _loop_until(self, predicate):
        self._until_predicate = predicate
        try:
            # this runs self._next ONE time, but
            # self._next re-runs itself until
            # the predicate says to quit.
            self._loop.spawn_callback(self._next)
            self._loop.start()
        except KeyboardInterrupt:
            self.close("user interruption")

    async def _next(self):
        if self._until_predicate is not None and self._until_predicate():
            log.debug("Stopping client loop in state %s due to True from %s",
                      self._state.__class__.__name__, self._until_predicate.__name__)
            self._until_predicate = None
            self._loop.stop()
            return None
        else:
            log.debug("Running state " + self._state.__class__.__name__)
            await self._state.run(self)

    async def _pop_message(self):
        while True:
            if self._socket is None:
                return None

            # log.debug("Waiting for fragment...")
            fragment = None
            try:
                fragment = await self._socket.read_message()
            except Exception as e:
                # this happens on close, so debug level since it's "normal"
                log.debug("Error reading from socket %r", e)
            # log.debug("... got fragment %r", fragment)
            if fragment is None:
                # XXX Tornado doesn't give us the code and reason
                log.info("Connection closed by server")
                return None
            try:
                message = await self._receiver.consume(fragment)
                if message is not None:
                    log.debug("Received message %r" % message)
                    return message
            except (MessageError, ProtocolError, ValidationError) as e:
                log.error("%r", e, exc_info=True)
                self.close(why="error parsing message from server")

    def _send_message_wait_for_reply(self, message):
        waiter = WAITING_FOR_REPLY(message.header['msgid'])
        self._state = waiter

        send_result = []
        async def handle_message(message, send_result):
            result = await self.send_message(message)
            send_result.append(result)
        self._loop.spawn_callback(handle_message, message, send_result)

        def have_send_result_or_disconnected():
            return len(send_result) > 0 or self._state != waiter
        self._loop_until(have_send_result_or_disconnected)

        def have_reply_or_disconnected():
            return self._state != waiter or waiter.reply is not None
        self._loop_until(have_reply_or_disconnected)

        return waiter.reply

    def _send_patch_document(self, session_id, event):
        # XXX This will cause the client to always send all columns when a CDS
        # is mutated in place. Additionally we set use_buffers=False below as
        # well, to suppress using the binary array transport. Real Bokeh server
        # apps running inside a server can handle these updates much more
        # efficiently
        from bokeh.document.events import ColumnDataChangedEvent
        if hasattr(event, 'hint') and isinstance(event.hint, ColumnDataChangedEvent):
            event.hint.cols = None
        msg = self._protocol.create('PATCH-DOC', [event], use_buffers=False)
        self._loop.spawn_callback(self.send_message, msg)

    def _send_request_server_info(self):
        msg = self._protocol.create('SERVER-INFO-REQ')
        reply = self._send_message_wait_for_reply(msg)
        if reply is None:
            raise RuntimeError("Did not get a reply to server info request before disconnect")
        return reply.content

    def _tell_session_about_disconnect(self):
        if self._session:
            self._session._notify_disconnected()

    async def _transition(self, new_state):
        log.debug("transitioning to state " + new_state.__class__.__name__)
        self._state = new_state
        await self._next()

    async def _transition_to_disconnected(self, dis_state):
        self._tell_session_about_disconnect()
        await self._transition(dis_state)

    async def _wait_for_ack(self):
        message = await self._pop_message()
        if message and message.msgtype == 'ACK':
            log.debug("Received %r", message)
            await self._transition(CONNECTED_AFTER_ACK())
        elif message is None:
            await self._transition_to_disconnected(DISCONNECTED(ErrorReason.HTTP_ERROR, 500, "Internal server error."))
        else:
            raise ProtocolError("Received %r instead of ACK" % message)

#-----------------------------------------------------------------------------
# Private API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Code
#-----------------------------------------------------------------------------

fixup_windows_event_loop_policy()
