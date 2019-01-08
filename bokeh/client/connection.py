#-----------------------------------------------------------------------------
# Copyright (c) 2012 - 2019, Anaconda, Inc., and Bokeh Contributors.
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
from __future__ import absolute_import, division, print_function, unicode_literals

import logging
log = logging.getLogger(__name__)

#-----------------------------------------------------------------------------
# Imports
#-----------------------------------------------------------------------------

# Standard library imports

# External imports
from six.moves.urllib.parse import quote_plus

from tornado import gen
from tornado.httpclient import HTTPRequest
from tornado.ioloop import IOLoop
from tornado.websocket import websocket_connect, WebSocketError

# Bokeh imports
from ..protocol import Protocol
from ..protocol.exceptions import MessageError, ProtocolError, ValidationError
from ..protocol.receiver import Receiver
from .states import NOT_YET_CONNECTED, CONNECTED_BEFORE_ACK, CONNECTED_AFTER_ACK, DISCONNECTED, WAITING_FOR_REPLY
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

class ClientConnection(object):
    ''' A Bokeh low-level class used to implement ``ClientSession``; use ``ClientSession`` to connect to the server.

    '''

    def __init__(self, session, websocket_url, io_loop=None, arguments=None):
        ''' Opens a websocket connection to the server.

        '''
        self._url = websocket_url
        self._session = session
        self._arguments = arguments
        self._protocol = Protocol("1.0")
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

    @gen.coroutine
    def send_message(self, message):
        if self._socket is None:
            log.info("We're disconnected, so not sending message %r", message)
        else:
            try:
                sent = yield message.send(self._socket)
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

        raise gen.Return(None)

    # Private methods ---------------------------------------------------------

    def _versioned_url(self):
        versioned_url = "%s?bokeh-protocol-version=1.0&bokeh-session-id=%s" % (self._url, self._session.id)
        if self._arguments is not None:
            for key, value in self._arguments.items():
                versioned_url += "&{}={}".format(quote_plus(str(key)), quote_plus(str(value)))
        return versioned_url

    @gen.coroutine
    def _connect_async(self):
        versioned_url = self._versioned_url()
        request = HTTPRequest(versioned_url)
        try:
            socket = yield websocket_connect(request)
            self._socket = WebSocketClientConnectionWrapper(socket)
        except Exception as e:
            log.info("Failed to connect to server: %r", e)

        if self._socket is None:
            yield self._transition_to_disconnected()
        else:
            yield self._transition(CONNECTED_BEFORE_ACK())

    @gen.coroutine
    def _handle_messages(self):
        message = yield self._pop_message()
        if message is None:
            yield self._transition_to_disconnected()
        else:
            if message.msgtype == 'PATCH-DOC':
                log.debug("Got PATCH-DOC, applying to session")
                self._session._handle_patch(message)
            else:
                log.debug("Ignoring %r", message)
            # we don't know about whatever message we got, ignore it.
            yield self._next()

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
            log.debug("Stopping client loop in state %s due to True from %s",
                      self._state.__class__.__name__, self._until_predicate.__name__)
            self._until_predicate = None
            self._loop.stop()
            raise gen.Return(None)
        else:
            log.debug("Running state " + self._state.__class__.__name__)
            yield self._state.run(self)

    @gen.coroutine
    def _pop_message(self):
        while True:
            if self._socket is None:
                raise gen.Return(None)

            # log.debug("Waiting for fragment...")
            fragment = None
            try:
                fragment = yield self._socket.read_message()
            except Exception as e:
                # this happens on close, so debug level since it's "normal"
                log.debug("Error reading from socket %r", e)
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
                log.error("%r", e, exc_info=True)
                self.close(why="error parsing message from server")

    def _send_message_wait_for_reply(self, message):
        waiter = WAITING_FOR_REPLY(message.header['msgid'])
        self._state = waiter

        send_result = []
        def message_sent(future):
            send_result.append(future)
        self._loop.add_future(self.send_message(message), message_sent)

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
        self.send_message(msg)

    def _send_request_server_info(self):
        msg = self._protocol.create('SERVER-INFO-REQ')
        reply = self._send_message_wait_for_reply(msg)
        if reply is None:
            raise RuntimeError("Did not get a reply to server info request before disconnect")
        return reply.content

    def _tell_session_about_disconnect(self):
        if self._session:
            self._session._notify_disconnected()

    @gen.coroutine
    def _transition(self, new_state):
        log.debug("transitioning to state " + new_state.__class__.__name__)
        self._state = new_state
        yield self._next()

    @gen.coroutine
    def _transition_to_disconnected(self):
        self._tell_session_about_disconnect()
        yield self._transition(DISCONNECTED())

    @gen.coroutine
    def _wait_for_ack(self):
        message = yield self._pop_message()
        if message and message.msgtype == 'ACK':
            log.debug("Received %r", message)
            yield self._transition(CONNECTED_AFTER_ACK())
        elif message is None:
            yield self._transition_to_disconnected()
        else:
            raise ProtocolError("Received %r instead of ACK" % message)

#-----------------------------------------------------------------------------
# Private API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Code
#-----------------------------------------------------------------------------
