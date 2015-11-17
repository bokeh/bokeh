'''

'''
from __future__ import absolute_import, print_function

import logging

log = logging.getLogger(__name__)

from .connection import ClientConnection

from bokeh.resources import DEFAULT_SERVER_WEBSOCKET_URL, DEFAULT_SERVER_HTTP_URL, server_url_for_websocket_url
from bokeh.document import Document, SessionCallbackAdded, SessionCallbackRemoved, PeriodicCallback, TimeoutCallback
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

def _encode_query_param(s):
    try:
        import urllib
        return urllib.quote_plus(s)
    except:
        # python 3
        import urllib.parse as parse
        return parse.quote_plus(s)

_new_param = {'tab': 2, 'window': 1}

def show_session(session_id=None, server_url=None,
                 session=None, browser=None, new="tab", controller=None):
        """ Open a browser displaying a session document.

        Args:

        session_id (str, optional) : session ID to open (default: DEFAULT_SESSION_ID)

        server_url (str, optional) : server base URL to open the session on (default: DEFAULT_HTTP_SERVER_URL)

        session (ClientSession, optional) : session to get session ID and server URL from
            If you specify this, you don't need to specify session_id and server_url

        browser (str, optional) : browser to show with (default: None)
            For systems that support it, the **browser** argument allows
            specifying which browser to display in, e.g. "safari", "firefox",
            "opera", "windows-default" (see the ``webbrowser`` module
            documentation in the standard lib for more details).

        new (str, optional) : new file output mode (default: "tab")
            For file-based output, opens or raises the browser window
            showing the current output file.  If **new** is 'tab', then
            opens a new tab. If **new** is 'window', then opens a new window.
        """

        if session_id is None:
            if session is not None:
                session_id = session.id
            else:
                session_id = DEFAULT_SESSION_ID

        if server_url is None:
            if session is not None:
                server_url = server_url_for_websocket_url(session._connection.url)
            else:
                server_url = DEFAULT_SERVER_HTTP_URL

        if controller is None:
            import bokeh.browserlib as browserlib
            controller = browserlib.get_browser_controller(browser=browser)

        controller.open(server_url + "?bokeh-session-id=" + _encode_query_param(session_id),
                        new=_new_param[new])

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
        self._callbacks = {}

    def _attach_document(self, document):
        self._document = document
        self._document.on_change(self._document_changed)

        for cb in self._document.session_callbacks:
            self._add_periodic_callback(cb)

    def _add_periodic_callback(self, callback):
        ''' Add callback so it can be invoked on a session periodically accordingly to period.

        NOTE: periodic callbacks can only work within a session. It'll take no effect when bokeh output is html or notebook

        '''
        from tornado import ioloop
        cb = self._callbacks[callback.id] = ioloop.PeriodicCallback(
            callback.callback, callback.period, io_loop=self._connection._loop
        )
        cb.start()

    def _remove_periodic_callback(self, callback):
        ''' Remove a callback added earlier with add_periodic_callback()

            Throws an error if the callback wasn't added

        '''
        self._callbacks.pop(callback.id).stop()

    def _add_timeout_callback(self, callback):
        ''' Add callback so it can be invoked on a session after timeout

        NOTE: timeout callbacks can only work within a session. It'll take no effect when bokeh output is html or notebook

        '''
        cb = self._connection._loop.call_later(callback.timeout, callback.callback)
        self._callbacks[callback.id] = cb

    def _remove_timeout_callback(self, callback):
        ''' Remove a callback added earlier with _add_timeout_callback()

            Throws an error if the callback wasn't added

        '''
        cb = self._callbacks.pop(callback.id)
        self._connection._loop.remove_timeout(cb)

    def pull(self):
        """ Pull the server's state and set it as session.document.

            If this is called more than once, session.document will
            be the same object instance but its contents will be overwritten.
            Automatically calls connect() before pulling.
        """
        self.connect()
        if not self._connection.connected:
            raise IOError("Cannot pull session document because we failed to connect to the server (to start the server, try the 'bokeh serve' command)")

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
        if not self._connection.connected:
            raise IOError("Cannot push session document because we failed to connect to the server (to start the server, try the 'bokeh serve' command)")
        self._connection.push_doc(doc)
        if self._document is None:
            self._attach_document(doc)


    def show(self, browser=None, new="tab"):
        """ Open a browser displaying this session.

        Args:

        browser (str, optional) : browser to show with (default: None)
            For systems that support it, the **browser** argument allows
            specifying which browser to display in, e.g. "safari", "firefox",
            "opera", "windows-default" (see the ``webbrowser`` module
            documentation in the standard lib for more details).

        new (str, optional) : new file output mode (default: "tab")
            For file-based output, opens or raises the browser window
            showing the current output file.  If **new** is 'tab', then
            opens a new tab. If **new** is 'window', then opens a new window.
"""
        show_session(session=self)

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

        if isinstance(event, SessionCallbackAdded):
            if isinstance(event.callback, PeriodicCallback):
                self._add_periodic_callback(event.callback)
            elif isinstance(event.callback, TimeoutCallback):
                self._add_timeout_callback(event.callback)
            else:
                raise ValueError("Expected callback of type PeriodicCallback or TimeoutCallback, got: %s" % event.callback)

            return

        elif isinstance(event, SessionCallbackRemoved):
            if isinstance(event.callback, PeriodicCallback):
                self._remove_periodic_callback(event.callback)
            elif isinstance(event.callback, TimeoutCallback):
                self._remove_timeout_callback(event.callback)
            else:
                raise ValueError("Expected callback of type PeriodicCallback or TimeoutCallback, got: %s" % event.callback)

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
