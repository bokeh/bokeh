''' Implements a very low level facility for communicating with a Bokeh
Server. Users will always want to use ``bokeh.client.session`` instead.

'''
from __future__ import absolute_import, print_function

import logging

log = logging.getLogger(__name__)

from tornado import gen, locks
from tornado.httpclient import HTTPRequest
from tornado.ioloop import IOLoop
from tornado.websocket import websocket_connect, WebSocketError
from tornado.concurrent import Future

from bokeh.server.exceptions import MessageError, ProtocolError, ValidationError
from bokeh.server.protocol.receiver import Receiver
from bokeh.server.protocol import Protocol

class _WebSocketClientConnectionWrapper(object):
    ''' Used for compat across Tornado versions and to add write_lock'''

    def __init__(self, socket):
        if socket is None:
            raise ValueError("socket must not be None")
        self._socket = socket
        # write_lock allows us to lock the connection to send multiple
        # messages atomically.
        self.write_lock = locks.Lock()

    @gen.coroutine
    def write_message(self, message, binary=False, locked=True):
        def write_message_unlocked():
            if self._socket.protocol is None:
                # Tornado is maybe supposed to do this, but in fact it
                # tries to do _socket.protocol.write_message when protocol
                # is None and throws AttributeError or something. So avoid
                # trying to write to the closed socket. There doesn't seem
                # to be an obvious public function to check if the socket
                # is closed.
                raise WebSocketError("Connection to the server has been closed")

            future = self._socket.write_message(message, binary)
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

    def close(self, code=None, reason=None):
        return self._socket.close(code, reason)

    def read_message(self, callback=None):
        return self._socket.read_message(callback)

class ClientConnection(object):
    """ A Bokeh-private class used to implement ClientSession; use ClientSession to connect to the server."""

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

    class WAITING_FOR_REPLY(object):
        def __init__(self, reqid):
            self._reqid = reqid
            self._reply = None

        @property
        def reply(self):
            return self._reply

        @gen.coroutine
        def run(self, connection):
            message = yield connection._pop_message()
            if message is None:
                yield connection._transition_to_disconnected()
            elif 'reqid' in message.header and message.header['reqid'] == self._reqid:
                self._reply = message
                yield connection._transition(connection.CONNECTED_AFTER_ACK())
            else:
                yield connection._next()

    def __init__(self, session, websocket_url, io_loop=None):
        '''
          Opens a websocket connection to the server.
        '''
        self._url = websocket_url
        self._session = session
        self._protocol = Protocol("1.0")
        self._receiver = Receiver(self._protocol)
        self._socket = None
        self._state = self.NOT_YET_CONNECTED()
        if io_loop is None:
            # We can't use IOLoop.current because then we break
            # when running inside a notebook since ipython also uses it
            io_loop = IOLoop()
        self._loop = io_loop
        self._until_predicate = None
        self._protocol = Protocol("1.0")
        self._server_info = None

    @property
    def url(self):
        return self._url

    @property
    def io_loop(self):
        return self._loop

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

    def loop_until_closed(self):
        if isinstance(self._state, self.NOT_YET_CONNECTED):
            # we don't use self._transition_to_disconnected here
            # because _transition is a coroutine
            self._tell_session_about_disconnect()
            self._state = self.DISCONNECTED()
        else:
            def closed():
                return isinstance(self._state, self.DISCONNECTED)
            self._loop_until(closed)

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

    def _send_patch_document(self, session_id, event):
        msg = self._protocol.create('PATCH-DOC', [event])
        self.send_message(msg)

    def _send_message_wait_for_reply(self, message):
        waiter = self.WAITING_FOR_REPLY(message.header['msgid'])
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

    def push_doc(self, document):
        ''' Push a document to the server, overwriting any existing server-side doc.

        Args:
            document : bokeh.document.Document
              the Document to push to the server
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

    def pull_doc(self, document):
        ''' Pull a document from the server, overwriting the passed-in document
        Args:
            document : bokeh.document.Document
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

    def _send_request_server_info(self):
        msg = self._protocol.create('SERVER-INFO-REQ')
        reply = self._send_message_wait_for_reply(msg)
        if reply is None:
            raise RuntimeError("Did not get a reply to server info request before disconnect")
        return reply.content

    def request_server_info(self):
        '''
        Ask for information about the server.

        Returns:
            A dictionary of server attributes.
        '''
        if self._server_info is None:
            self._server_info = self._send_request_server_info()
        return self._server_info

    def force_roundtrip(self):
        '''
        Force a round-trip request/reply to the server, sometimes needed to avoid race conditions.

        Outside of test suites, this method probably hurts performance and shouldn't be needed.

        Returns:
           None
        '''
        self._send_request_server_info()

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
    def _transition(self, new_state):
        log.debug("transitioning to state " + new_state.__class__.__name__)
        self._state = new_state
        yield self._next()

    @gen.coroutine
    def _transition_to_disconnected(self):
        self._tell_session_about_disconnect()
        yield self._transition(self.DISCONNECTED())

    @gen.coroutine
    def _connect_async(self):
        versioned_url = "%s?bokeh-protocol-version=1.0&bokeh-session-id=%s" % (self._url, self._session.id)
        request = HTTPRequest(versioned_url)
        try:
            socket = yield websocket_connect(request)
            self._socket = _WebSocketClientConnectionWrapper(socket)
        except Exception as e:
            log.info("Failed to connect to server: %r", e)

        if self._socket is None:
            yield self._transition_to_disconnected()
        else:
            yield self._transition(self.CONNECTED_BEFORE_ACK())


    @gen.coroutine
    def _wait_for_ack(self):
        message = yield self._pop_message()
        if message and message.msgtype == 'ACK':
            log.debug("Received %r", message)
            yield self._transition(self.CONNECTED_AFTER_ACK())
        elif message is None:
            yield self._transition_to_disconnected()
        else:
            raise ProtocolError("Received %r instead of ACK" % message)

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

    def _tell_session_about_disconnect(self):
        if self._session:
            self._session._notify_disconnected()
