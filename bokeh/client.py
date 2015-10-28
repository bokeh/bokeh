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
from bokeh.resources import DEFAULT_SERVER_WEBSOCKET_URL
import uuid

from .document import Document, ModelChangedEvent, RootAddedEvent, RootRemovedEvent

DEFAULT_SESSION_ID = "default"

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

    def __init__(self, session, io_loop=None, url=DEFAULT_SERVER_WEBSOCKET_URL):
        '''
          Opens a websocket connection to the server.
        '''
        self._url = url
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

    def send_message(self, message):
        sent = message.send(self._socket)
        log.debug("Sent %r [%d bytes]", message, sent)

    def _send_patch_document(self, session_id, event):
        msg = self._protocol.create('PATCH-DOC', [event])
        self.send_message(msg)

    def _send_message_wait_for_reply(self, message):
        waiter = self.WAITING_FOR_REPLY(message.header['msgid'])
        self._state = waiter
        self.send_message(message)
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
                log.debug("Got PATCH-DOC, applying to session")
                self._session._handle_patch(message)
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

    def _tell_session_about_disconnect(self):
        if self._session:
            self._session._notify_disconnected()

def push_session(document, session_id=DEFAULT_SESSION_ID, io_loop=None, url=DEFAULT_SERVER_WEBSOCKET_URL):
    """Create a session by pushing the given document to the server, overwriting any existing server-side document.

       session.document in the returned session will be your supplied document. While the
       connection to the server is open, changes made on the server side will be applied
       to this document, and changes made on the client side will be synced
       to the server.

       Args:
            document : bokeh.document.Document
                The document to be pushed and set as session.document
            session_id : string, optional
                The name of the session (omit to use 'default', None to use random unique id)
            io_loop : tornado.ioloop.IOLoop, optional
                The IOLoop to use for the websocket
            url : str, optional
                The websocket URL to connect to
       Returns:
            session : ClientSession
                A new ClientSession connected to the server
    """
    session = ClientSession(session_id=session_id, io_loop=io_loop, url=url)
    session.push(document)
    return session

def pull_session(session_id=DEFAULT_SESSION_ID, io_loop=None, url=DEFAULT_SERVER_WEBSOCKET_URL):
    """Create a session by loading the current server-side document.

       session.document will be a fresh document loaded from the server. While the
       connection to the server is open, changes made on the server side will be
       applied to this document, and changes made on the client side will be synced
       to the server.

       Args:
            session_id : string, optional
                The name of the session (omit to use 'default', None to use random unique id)
            io_loop : tornado.ioloop.IOLoop, optional
                The IOLoop to use for the websocket
            url : str, optional
                The websocket URL to connect to
       Returns:
            session : ClientSession
                A new ClientSession connected to the server
    """
    session = ClientSession(session_id=session_id, io_loop=io_loop, url=url)
    session.pull()
    return session

class ClientSession(object):
    """Represents a websocket connection to a server-side session.

    Each server session stores a Document, which is kept in sync
    with the document in this ClientSession instance.
    Always call either pull() or push() immediately after
    creating the session, if you construct a session by hand.

    """

    def __init__(self, session_id=DEFAULT_SESSION_ID, io_loop=None, url=DEFAULT_SERVER_WEBSOCKET_URL):
        '''
          A connection which attaches to a particular named session on the server.

          Always call either pull() or push() immediately after creating the session
          (until these are called session.document will be None).

          The bokeh.client.push_session() and bokeh.client.pull_session() functions
          will construct a ClientSession and push or pull in one step, so they are
          a good way to obtain a ClientSession.

          Args:
            session_id : string, optional
                The name of the session (omit to use 'default', None to use random unique id)
            io_loop : tornado.ioloop.IOLoop, optional
                The IOLoop to use for the websocket
            url : str, optional
                The websocket URL to connect to
        '''
        self._document = None
        self._id = self._ensure_session_id(session_id)

        self._connection = ClientConnection(session=self, io_loop=io_loop, url=url)

        self._current_patch = None

    def _attach_document(self, document):
        self._document = document
        self._document.on_change(self._document_changed)

    def pull(self):
        """ Pull the server's state and set it as session.document.

            If this is called more than once, session.document will
            be the same object instance but its contents will be overwritten.
            Automatically calls connect() before pulling.
        """
        self.connect()
        if self._document is None:
            doc = Document()
        else:
            doc = self._document
        self._connection.pull_doc(doc)
        if self._document is None:
            self._attach_document(doc)

    def push(self, document=None):
        """ Push the given document to the server and record it as session.document.

            If this is called more than once, the Document has to be the same (or None
            to mean "session.document").
            Automatically calls connect() before pushing.

        Args:
            document : bokeh.document.Document, optional
                The document which will be kept in sync with the server document.
                None to use session.document or create a new document.
        """
        if self._document is None:
            if document is None:
                doc = Document()
            else:
                doc = document
        else:
            if document is None:
                doc = self._document
            else:
                raise ValueError("Cannot push() a different document from existing session.document")

        self.connect()
        self._connection.push_doc(doc)
        if self._document is None:
            self._attach_document(doc)

    @classmethod
    def _ensure_session_id(cls, session_id=DEFAULT_SESSION_ID):
        # if someone explicitly sets session_id=None that means make one up
        if session_id is None:
            session_id = str(uuid.uuid4())
        return session_id

    @property
    def document(self):
        """bokeh.document.Document which will be kept in sync with the server document

        This is initialized when pull() or push() succeeds. It will be None until then.
        """
        return self._document

    @property
    def id(self):
        return self._id

    @property
    def connected(self):
        return self._connection.connected

    def connect(self):
        self._connection.connect()

    def close(self, why="closed"):
        self._connection.close(why)

    def loop_until_closed(self):
        self._connection.loop_until_closed()

    def request_server_info(self):
        '''
        Ask for information about the server.

        Returns:
            A dictionary of server attributes.
        '''
        return self._connection.request_server_info()

    def force_roundtrip(self):
        ''' Used in unit testing to force a request/reply pair in order to avoid races '''
        self._connection.force_roundtrip()

    def _notify_disconnected(self):
        '''Called by the ClientConnection we are using to notify us of disconnect'''
        if self._document is not None:
            self._document.remove_on_change(self._document_changed)

    def _document_changed(self, event):
        if self._current_patch is not None and self._current_patch.should_suppress_on_change(event):
            log.debug("Not sending notification back to server for a change it requested")
            return

        # TODO (havocp): our "change sync" protocol is flawed
        # because if both sides change the same attribute at the
        # same time, they will each end up with the state of the
        # other and their final states will differ.
        self._connection._send_patch_document(self._id, event)

    def _handle_patch(self, message):
        self._current_patch = message
        try:
            message.apply_to_document(self.document)
        finally:
            self._current_patch = None
