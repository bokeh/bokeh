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

    def __init__(self, io_loop=None, url=DEFAULT_SERVER_URL):
        '''
          Opens a websocket connection to the server.
        '''
        self._url = url
        self._sessions = set()
        self._protocol = Protocol("1.0")
        self._receiver = Receiver(self._protocol)
        self._socket = None
        self._state = self.NOT_YET_CONNECTED()
        if io_loop is None:
            io_loop = IOLoop.current()
        self._loop = io_loop
        self._until_predicate = None
        self._protocol = Protocol("1.0")
        self._server_info = None

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
            self._tell_sessions_about_disconnect()
            self._state = self.DISCONNECTED()
        else:
            def closed():
                return isinstance(self._state, self.DISCONNECTED)
            self._loop_until(closed)

    def send_message(self, message):
        sent = message.send(self._socket)
        log.debug("Sent %r [%d bytes]", message, sent)

    def _send_patch_document(self, sessionid, document, obj, updates):
        msg = self._protocol.create('PATCH-DOC', sessionid, document, obj, updates)
        self.send_message(msg)

    def _send_message_wait_for_reply(self, message):
        waiter = self.WAITING_FOR_REPLY(message.header['msgid'])
        self._state = waiter
        self.send_message(message)
        def have_reply_or_disconnected():
            return self._state != waiter or waiter.reply is not None
        self._loop_until(have_reply_or_disconnected)
        return waiter.reply

    def push_session(self, doc, sessionid=DEFAULT_SESSION_ID):
        ''' Create a session by pushing the given document to the server, overwriting any existing server-side doc

        Args:
            doc : bokeh.document.Document
                The Document to initialize the session with.

            sessionid : string, optional
                The name of the session (None to use a random unique name)

        Returns:
            session :  a ClientSession with the given document and ID
        '''
        session = ClientSession(self, doc, sessionid)
        msg = self._protocol.create('PUSH-DOC', session.id, session.document)
        reply = self._send_message_wait_for_reply(msg)
        if reply is None:
            raise RuntimeError("Connection to server was lost")
        elif reply.header['msgtype'] == 'ERROR':
            raise RuntimeError("Failed to push document: " + reply.content['text'])
        else:
            return session

    def pull_session(self, sessionid=DEFAULT_SESSION_ID):
        ''' Create a session by pulling the document from the given session on the server '''
        raise NotImplementedError("todo")

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
        self._tell_sessions_about_disconnect()
        yield self._transition(self.DISCONNECTED())

    @gen.coroutine
    def _connect_async(self):
        request = HTTPRequest(self._url, headers={"bokeh-protocol-version": "1.0" })
        self._socket = yield websocket_connect(request)
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
                log.debug("Got PATCH-DOC, applying to %d sessions", len(self._sessions))
                for session in self._sessions:
                    session._handle_patch(message)
            else:
                log.debug("Ignoring %r", message)
            # we don't know about whatever message we got, ignore it.
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

    def _register_session(self, session):
        self._sessions.add(session)

    def _tell_sessions_about_disconnect(self):
        for session in self._sessions:
            session._notify_disconnected()
        self._sessions.clear()

class ClientSession(object):

    def __init__(self, connection, doc, sessionid=DEFAULT_SESSION_ID):
        '''
          Attaches to a particular named session on the server.
        '''
        self._connection = connection
        self._document = doc
        self._id = self._ensure_session_id(sessionid)
        self._document.on_change(self._document_changed)
        # registering may remove the on_change above as side effect
        self._connection._register_session(self)
        self._current_patch = None

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

    def _notify_disconnected(self):
        '''Called by the ClientConnection we are using to notify us of disconnect'''
        self._document.remove_on_change(self._document_changed)

    def _document_changed(self, doc, model, attr, old, new):
        if self._current_patch is not None and self._current_patch.should_suppress_on_change(model, attr, new):
            log.debug("Not sending notification back to server for a change it requested")
            return

        # TODO (havocp): our "change sync" protocol is flawed
        # because if both sides change the same attribute at the
        # same time, they will each end up with the state of the
        # other and their final states will differ.
        self._connection._send_patch_document(self._id, doc, model, { attr : new })

    def _handle_patch(self, message):
        self._current_patch = message
        try:
            message.apply_to_document(self.document)
        finally:
            self._current_patch = None
