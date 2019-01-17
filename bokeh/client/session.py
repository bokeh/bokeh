#-----------------------------------------------------------------------------
# Copyright (c) 2012 - 2019, Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------
''' Provide a session object to service Bokeh documents in external Python
clients to a Bokeh server.

Use-Cases
~~~~~~~~~

A client session has two primary uses:

* Implementing automated testing infrastructure around Bokeh server
  applications.

* Creating and customizing specific sessions of a Bokeh server application
  (running *in the Bokeh server*) before passing them on to a specific
  viewer.

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

# Bokeh imports
from ..document import Document
from ..resources import _SessionCoordinates, DEFAULT_SERVER_HTTP_URL
from ..util.browser import NEW_PARAM
from ..util.session_id import generate_session_id
from ..util.string import format_docstring
from .util import server_url_for_websocket_url, websocket_url_for_server_url

#-----------------------------------------------------------------------------
# Globals and constants
#-----------------------------------------------------------------------------

DEFAULT_SESSION_ID = "default"

DEFAULT_SERVER_WEBSOCKET_URL = websocket_url_for_server_url(DEFAULT_SERVER_HTTP_URL)

__all__ = (
    'ClientSession',
    'pull_session',
    'push_session',
    'show_session',
)

#-----------------------------------------------------------------------------
# General API
#-----------------------------------------------------------------------------

def pull_session(session_id=None, url='default', io_loop=None, arguments=None):
    ''' Create a session by loading the current server-side document.

    ``session.document`` will be a fresh document loaded from
    the server. While the connection to the server is open,
    changes made on the server side will be applied to this
    document, and changes made on the client side will be
    synced to the server.

    If you don't plan to modify ``session.document`` you probably
    don't need to use this function; instead you can directly
    ``show_session()`` or ``server_session()`` without downloading
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
            The ``IOLoop`` to use for the websocket

        arguments (dict[str, str], optional) :
            A dictionary of key/values to be passed as HTTP request arguments
            to Bokeh application code (default: None)

            Note that should only be provided when pulling new sessions.
            If ``session_id`` is not None, or a session with ``session_id``
            already exists, these arguments will have no effect.

    Returns:
        ClientSession :
            A new ``ClientSession`` connected to the server

    '''

    coords = _SessionCoordinates(session_id=session_id, url=url)
    session = ClientSession(session_id=session_id, websocket_url=websocket_url_for_server_url(coords.url), io_loop=io_loop, arguments=arguments)
    session.pull()
    return session

def push_session(document, session_id=None, url='default', io_loop=None):
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
    coords = _SessionCoordinates(session_id=session_id, url=url)
    session = ClientSession(session_id=coords.session_id, websocket_url=websocket_url_for_server_url(coords.url), io_loop=io_loop)
    session.push(document)
    return session

def show_session(session_id=None, url='default', session=None, browser=None, new="tab", controller=None):
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

        controller.open(server_url + "?bokeh-session-id=" + quote_plus(session_id),
                        new=NEW_PARAM[new])

class ClientSession(object):
    ''' Represents a websocket connection to a server-side session.

    Each server session stores a Document, which is kept in sync with the
    corresponding Document for this ``ClientSession`` instance. Updates on
    either side of the connection will automatically propagate to the other
    side, as long as the connection is open.

    ClientSession objects can (and usually should) be used as a context manager
    so that the session is properly closed:

    .. code-block:: python

        with pull_session(url=app_url) as mysession:
            # customize session here
            script = server_session(session_id=mysession.id, url=app_url)
            return render_template("embed.html", script=script, template="Flask")

    If you do not use ``ClientSession`` in this way, it is up to you to ensure
    that ``mysession.close()`` is called.

    '''

    def __init__(self, session_id=None, websocket_url=DEFAULT_SERVER_WEBSOCKET_URL, io_loop=None, arguments=None):
        ''' A connection which attaches to a particular named session on the
        server.

        Always call either pull() or push() immediately after creating the
        session (until these are called ``session.document`` will be ``None``).

        The :func:`~bokeh.client.session.push_session` and
        :func:`~bokeh.client.session.pull_session()` functions will construct a
        ``ClientSession`` and push or pull in one step, so they are a good way to
        obtain a ``ClientSession``.

        Args:
            session_id (str) :
                The name of the session or None to generate one

            websocket_url (str) :
                Websocket URL to connect to

            io_loop (IOLoop, optional) :
                The IOLoop to use for the websocket

            arguments (dict[str, str], optional) :
                A dictionary of key/values to be passed as HTTP request
                arguments to Bokeh application code (default: None)

                Note that should only be provided when pulling new sessions.
                If ``session_id`` is not None, or a session with ``session_id``
                already exists, these arguments will have no effect.

        '''
        self._document = None
        self._id = self._ensure_session_id(session_id)

        from .connection import ClientConnection
        self._connection = ClientConnection(session=self, io_loop=io_loop, websocket_url=websocket_url, arguments=arguments)

        from ..server.callbacks import _DocumentCallbackGroup
        self._callbacks = _DocumentCallbackGroup(self._connection.io_loop)

    def __enter__(self):
        '''

        '''
        return self

    def __exit__(self, exc_type, exc_value, exc_traceback):
        '''

        '''
        self.close()

    # Properties --------------------------------------------------------------

    @property
    def connected(self):
        ''' Whether this session is currently connected. '''
        return self._connection.connected

    @property
    def document(self):
        ''' A :class:`~bokeh.document.Document` that will be kept in sync with
        the corresponding Document on the server.

        This value is initialized when :func:`pull` or :func:`push` succeeds.
        It will be ``None`` until then.

        '''
        return self._document

    @property
    def id(self):
        ''' A unique ID for this session. '''
        return self._id

    # Public methods ----------------------------------------------------------

    def connect(self):
        ''' Connect to a Bokeh server at the configured URL. '''
        self._connection.connect()

    def close(self, why="closed"):
        ''' Close the connection to the server. '''
        self._connection.close(why)

    def force_roundtrip(self):
        ''' Force a round-trip request/reply to the server, sometimes needed to
        avoid race conditions. Mostly useful for testing.

        Outside of test suites, this method hurts performance and should not be
        needed.

        Returns:
           None

        '''
        self._connection.force_roundtrip()

    def loop_until_closed(self, suppress_warning=False):
        ''' Execute a blocking loop that runs and executes event callbacks
        until the connection is closed (e.g. by hitting Ctrl-C).

        While this method can be used to run Bokeh application code "outside"
        the Bokeh server, this practice is HIGHLY DISCOURAGED for any real
        use case. This function is intented to facilitate testing ONLY.

        '''

        suppress_warning # shut up flake

        from bokeh.util.deprecation import deprecated
        deprecated("ClientSession.loop_until_closed is deprecated, and will be removed in an eventual 2.0 release. "
                   "Run Bokeh applications directly on a Bokeh server instead. See:\n\n"
                   "    https//docs.bokeh.org/en/latest/docs/user_guide/server.html\n")

        self._connection.loop_until_closed()

    def pull(self):
        ''' Pull the server's state and set it as session.document.

        If this is called more than once, session.document will be the same
        object instance but its contents will be overwritten.

        Automatically calls :func:`connect` before pulling.

        '''
        self.connect()
        if not self.connected:
            raise IOError("Cannot pull session document because we failed to connect to the server (to start the server, try the 'bokeh serve' command)")

        if self.document is None:
            doc = Document()
        else:
            doc = self.document
        self._connection.pull_doc(doc)
        if self.document is None:
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
        if self.document is None:
            if document is None:
                doc = Document()
            else:
                doc = document
        else:
            if document is None:
                doc = self.document
            else:
                raise ValueError("Cannot push() a different document from existing session.document")

        self.connect()
        if not self.connected:
            raise IOError("Cannot push session document because we failed to connect to the server (to start the server, try the 'bokeh serve' command)")
        self._connection.push_doc(doc)
        if self._document is None:
            self._attach_document(doc)

    def request_server_info(self):
        ''' Ask for information about the server.

        Returns:
            A dictionary of server attributes.

        '''
        return self._connection.request_server_info()

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

    # Internal methods --------------------------------------------------------

    def _attach_document(self, document):
        self._document = document
        self._document.on_change_dispatch_to(self)

        self._callbacks.add_session_callbacks(self._document.session_callbacks)

    def _document_patched(self, event):
        if event.setter is self:
            log.debug("Not sending notification back to server for a change it requested")
            return

        # TODO (havocp): our "change sync" protocol is flawed
        # because if both sides change the same attribute at the
        # same time, they will each end up with the state of the
        # other and their final states will differ.
        self._connection._send_patch_document(self._id, event)

    @classmethod
    def _ensure_session_id(cls, session_id):
        if session_id is None:
            session_id = generate_session_id()
        return session_id

    def _handle_patch(self, message):
        message.apply_to_document(self.document, self)

    def _notify_disconnected(self):
        ''' Called by the ClientConnection we are using to notify us of disconnect.

        '''
        if self.document is not None:
            self.document.remove_on_change(self)
            self._callbacks.remove_all_callbacks()

    def _session_callback_added(self, event):
        self._callbacks.add_session_callback(event.callback)

    def _session_callback_removed(self, event):
        self._callbacks.remove_session_callback(event.callback)

#-----------------------------------------------------------------------------
# Dev API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Private API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Code
#-----------------------------------------------------------------------------

__doc__ = format_docstring(__doc__)
