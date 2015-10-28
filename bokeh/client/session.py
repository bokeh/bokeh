'''

'''
from __future__ import absolute_import, print_function

import logging

log = logging.getLogger(__name__)

from .connection import ClientConnection

from bokeh.resources import DEFAULT_SERVER_WEBSOCKET_URL
from bokeh.document import Document
import uuid

DEFAULT_SESSION_ID = "default"

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
