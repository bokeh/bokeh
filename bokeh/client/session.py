'''

'''
from __future__ import absolute_import, print_function

import logging
log = logging.getLogger(__name__)

from ..document import Document
from ..resources import _SessionCoordinates, DEFAULT_SERVER_HTTP_URL
from ..util.deprecation import deprecated
from ..util.session_id import generate_session_id

DEFAULT_SESSION_ID = "default"

def websocket_url_for_server_url(url):
    if url.startswith("http:"):
        reprotocoled = "ws" + url[4:]
    elif url.startswith("https:"):
        reprotocoled = "wss" + url[5:]
    else:
        raise ValueError("URL has unknown protocol " + url)
    if reprotocoled.endswith("/"):
        return reprotocoled + "ws"
    else:
        return reprotocoled + "/ws"

def server_url_for_websocket_url(url):
    if url.startswith("ws:"):
        reprotocoled = "http" + url[2:]
    elif url.startswith("wss:"):
        reprotocoled = "https" + url[3:]
    else:
        raise ValueError("URL has non-websocket protocol " + url)
    if not reprotocoled.endswith("/ws"):
        raise ValueError("websocket URL does not end in /ws")
    return reprotocoled[:-2]

DEFAULT_SERVER_WEBSOCKET_URL = websocket_url_for_server_url(DEFAULT_SERVER_HTTP_URL)

def push_session(document, session_id=None, url='default', app_path=None, io_loop=None):
    ''' Create a session by pushing the given document to the server,
    overwriting any existing server-side document.

    ``session.document`` in the returned session will be your supplied
    document. While the connection to the server is open, changes made on the
    server side will be applied to this document, and changes made on the
    client side will be synced to the server.

    In a production scenario, the ``session_id`` should be unique for each
    browser tab, which keeps users from stomping on each other. It's neither
    scalable nor secure to use predictable session IDs or to share session
    IDs across users.

    For a notebook running on a single machine, ``session_id`` could be
    something human-readable such as ``"default"`` for convenience.

    If you allow ``push_session()`` to generate a unique ``session_id``, you
    can obtain the generated ID with the ``id`` property on the returned
    ``ClientSession``.

    Args:
        document : (bokeh.document.Document)
            The document to be pushed and set as session.document

        session_id : (string, optional)
            The name of the session, None to autogenerate a random one (default: None)

        url : (str, optional): The URL to a Bokeh application on a Bokeh server
            can also be `"default"` which will connect to the default app URL

        io_loop : (tornado.ioloop.IOLoop, optional)
            The IOLoop to use for the websocket

    Returns:
        ClientSession
            A new ClientSession connected to the server

    '''
    if app_path is not None:
        deprecated((0, 12, 5), "app_path", "url", "Now pass entire app URLS in the url arguments, e.g. 'url=http://foo.com:5010/bar/myapp''")
        url = url + app_path

    coords = _SessionCoordinates(session_id=session_id, url=url)
    session = ClientSession(session_id=coords.session_id, websocket_url=websocket_url_for_server_url(coords.url), io_loop=io_loop)
    session.push(document)
    return session

def pull_session(session_id=None, url='default', app_path=None, io_loop=None):
    ''' Create a session by loading the current server-side document.

    ``session.document`` will be a fresh document loaded from
    the server. While the connection to the server is open,
    changes made on the server side will be applied to this
    document, and changes made on the client side will be
    synced to the server.

    If you don't plan to modify ``session.document`` you probably
    don't need to use this function; instead you can directly
    ``show_session()`` or ``autoload_server()`` without downloading
    the session's document into your process first. It's much
    more efficient to avoid downloading the session if you don't need
    to.

    In a production scenario, the ``session_id`` should be
    unique for each browser tab, which keeps users from
    stomping on each other. It's neither scalable nor secure to
    use predictable session IDs or to share session IDs across
    users.

    For a notebook running on a single machine, ``session_id``
    could be something human-readable such as ``"default"`` for
    convenience.

    If you allow ``pull_session()`` to generate a unique
    ``session_id``, you can obtain the generated ID with the
    ``id`` property on the returned ``ClientSession``.

    Args:
        session_id (string, optional) :
            The name of the session, None to autogenerate a random one (default: None)

        url : (str, optional): The URL to a Bokeh application on a Bokeh server
                can also be `"default"` which will connect to the default app URL

        io_loop (``tornado.ioloop.IOLoop``, optional) :
            The IOLoop to use for the websocket
    Returns:
        ClientSession :
            A new ClientSession connected to the server

    '''
    if app_path is not None:
        deprecated((0, 12, 5), "app_path", "url", "Now pass entire app URLS in the url arguments, e.g. 'url=http://foo.com:5010/bar/myapp'")
        url = url + app_path

    coords = _SessionCoordinates(session_id=session_id, url=url)
    session = ClientSession(session_id=session_id, websocket_url=websocket_url_for_server_url(coords.url), io_loop=io_loop)
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

def show_session(session_id=None, url='default', app_path=None, session=None, browser=None, new="tab", controller=None):
        ''' Open a browser displaying a session document.

        If you have a session from ``pull_session()`` or ``push_session`` you
        can ``show_session(session=mysession)``. If you don't need to open a
        connection to the server yourself, you can show a new session in a
        browser by providing just the ``url``.

        Args:
            session_id (string, optional) :
               The name of the session, None to autogenerate a random one (default: None)

            url : (str, optional): The URL to a Bokeh application on a Bokeh server
                can also be `"default"` which will connect to the default app URL

            session (ClientSession, optional) : session to get session ID and server URL from
                If you specify this, you don't need to specify session_id and url

            browser (str, optional) : browser to show with (default: None)
                For systems that support it, the **browser** argument allows
                specifying which browser to display in, e.g. "safari", "firefox",
                "opera", "windows-default" (see the ``webbrowser`` module
                documentation in the standard lib for more details).

            new (str, optional) : new file output mode (default: "tab")
                For file-based output, opens or raises the browser window
                showing the current output file.  If **new** is 'tab', then
                opens a new tab. If **new** is 'window', then opens a new window.

        '''

        if app_path is not None:
            deprecated((0, 12, 5), "app_path", "url", "Now pass entire app URLS in the url arguments, e.g. 'url=http://foo.com:5010/bar/myapp'")
            url = url + app_path

        if session is not None:
            server_url = server_url_for_websocket_url(session._connection.url)
            session_id = session.id
        else:
            coords = _SessionCoordinates(session_id=session_id, url=url)
            server_url = coords.url
            session_id = coords.session_id

        if controller is None:
            from bokeh.util.browser import get_browser_controller
            controller = get_browser_controller(browser=browser)

        controller.open(server_url + "?bokeh-session-id=" + _encode_query_param(session_id),
                        new=_new_param[new])

class ClientSession(object):
    ''' Represents a websocket connection to a server-side session.

    Each server session stores a Document, which is kept in sync
    with the document in this ClientSession instance.
    Always call either pull() or push() immediately after
    creating the session, if you construct a session by hand.

    '''

    def __init__(self, session_id=None, websocket_url=DEFAULT_SERVER_WEBSOCKET_URL, io_loop=None):
        '''
        A connection which attaches to a particular named session on the server.

        Always call either pull() or push() immediately after creating the session
        (until these are called session.document will be None).

        The bokeh.client.push_session() and bokeh.client.pull_session() functions
        will construct a ClientSession and push or pull in one step, so they are
        a good way to obtain a ClientSession.

        Args:
            session_id (str) :
                The name of the session or None to generate one

            websocket_url (str) :
                Websocket URL to connect to

            io_loop (``tornado.ioloop.IOLoop``, optional) :
                The IOLoop to use for the websocket
        '''
        self._document = None
        self._id = self._ensure_session_id(session_id)

        from ._connection import ClientConnection
        self._connection = ClientConnection(session=self, io_loop=io_loop, websocket_url=websocket_url)

        from ..server.callbacks import _DocumentCallbackGroup
        self._callbacks = _DocumentCallbackGroup(self._connection.io_loop)

    def _attach_document(self, document):
        self._document = document
        self._document.on_change_dispatch_to(self)

        self._callbacks.add_session_callbacks(self._document.session_callbacks)

    def pull(self):
        ''' Pull the server's state and set it as session.document.

            If this is called more than once, session.document will
            be the same object instance but its contents will be overwritten.

            Automatically calls :func:`connect` before pulling.

        '''
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
        ''' Push the given document to the server and record it as session.document.

        If this is called more than once, the Document has to be the same (or None
        to mean "session.document").

        .. note::
            Automatically calls :func:`~connect` before pushing.

        Args:
            document (:class:`~bokeh.document.Document`, optional) :
                The document which will be kept in sync with the server document.
                None to use session.document or create a new document.

        '''
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

    def show(self, obj=None, browser=None, new="tab"):
        ''' Open a browser displaying this session.

        Args:
            obj (LayoutDOM object, optional) : a Layout (Row/Column),
                Plot or Widget object to display. The object will be added
                to the session's document.

            browser (str, optional) : browser to show with (default: None)
                For systems that support it, the **browser** argument allows
                specifying which browser to display in, e.g. "safari", "firefox",
                "opera", "windows-default" (see the ``webbrowser`` module
                documentation in the standard lib for more details).

            new (str, optional) : new file output mode (default: "tab")
                For file-based output, opens or raises the browser window
                showing the current output file.  If **new** is 'tab', then
                opens a new tab. If **new** is 'window', then opens a new window.

        '''
        if obj and obj not in self.document.roots:
            self.document.add_root(obj)
        show_session(session=self, browser=browser, new=new)

    @classmethod
    def _ensure_session_id(cls, session_id):
        if session_id is None:
            session_id = generate_session_id()
        return session_id

    @property
    def document(self):
        ''' :class:`~bokeh.document.Document` which will be kept in sync with the server document

        This is initialized when :func:`pull` or :func:`push` succeeds. It will be None until then.

        '''
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
        ''' Ask for information about the server.

        Returns:
            A dictionary of server attributes.

        '''
        return self._connection.request_server_info()

    def force_roundtrip(self):
        ''' Used in unit testing to force a request/reply pair in order to avoid races

        '''
        self._connection.force_roundtrip()

    def _notify_disconnected(self):
        ''' Called by the ClientConnection we are using to notify us of disconnect.

        '''
        if self._document is not None:
            self._document.remove_on_change(self)
            self._callbacks.remove_all_callbacks()

    def _document_patched(self, event):
        if event.setter is self:
            log.debug("Not sending notification back to server for a change it requested")
            return

        # TODO (havocp): our "change sync" protocol is flawed
        # because if both sides change the same attribute at the
        # same time, they will each end up with the state of the
        # other and their final states will differ.
        self._connection._send_patch_document(self._id, event)

    def _handle_patch(self, message):
        message.apply_to_document(self.document, self)

    def _session_callback_added(self, event):
        self._callbacks.add_session_callback(event.callback)

    def _session_callback_removed(self, event):
        self._callbacks.remove_session_callback(event.callback)
