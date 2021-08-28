#-----------------------------------------------------------------------------
# Copyright (c) 2012 - 2021, Anaconda, Inc., and Bokeh Contributors.
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
from __future__ import annotations

import logging # isort:skip
log = logging.getLogger(__name__)

#-----------------------------------------------------------------------------
# Imports
#-----------------------------------------------------------------------------

# Standard library imports
from typing import TYPE_CHECKING, Any, Dict
from urllib.parse import quote_plus

# External imports
from typing_extensions import Literal

if TYPE_CHECKING:
    from tornado.ioloop import IOLoop

# Bokeh imports
from ..core.types import ID
from ..document import Document
from ..resources import DEFAULT_SERVER_HTTP_URL, SessionCoordinates
from ..util.browser import NEW_PARAM, BrowserLike, BrowserTarget
from ..util.token import generate_jwt_token, generate_session_id
from .states import ErrorReason
from .util import server_url_for_websocket_url, websocket_url_for_server_url

if TYPE_CHECKING:
    from ..document.events import DocumentPatchedEvent, SessionCallbackAdded, SessionCallbackRemoved
    from ..models.layouts import LayoutDOM
    from ..protocol.messages.patch_doc import patch_doc
    from ..protocol.messages.server_info_reply import ServerInfo
    from ..server.callbacks import DocumentCallbackGroup
    from .connection import ClientConnection

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

def pull_session(session_id: ID | None = None, url: str = "default", io_loop: IOLoop | None = None,
        arguments: Dict[str, str] | None = None, max_message_size: int = 20*1024*1024) -> ClientSession:
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

        max_message_size (int, optional) :
            Configure the Tornado max websocket message size.
            (default: 20 MB)

    Returns:
        ClientSession :
            A new ``ClientSession`` connected to the server

    '''

    coords = SessionCoordinates(session_id=session_id, url=url)
    session = ClientSession(
        session_id=session_id, websocket_url=websocket_url_for_server_url(coords.url), io_loop=io_loop, arguments=arguments, max_message_size=max_message_size)
    session.pull()
    return session

def push_session(document: Document, session_id: ID | None = None, url: str = "default",
        io_loop: IOLoop | None = None, max_message_size: int = 20*1024*1024) -> ClientSession:
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

        max_message_size (int, optional) :
            Configure the Tornado max websocket message size.
            (default: 20 MB)

    Returns:
        ClientSession
            A new ClientSession connected to the server

    '''
    coords = SessionCoordinates(session_id=session_id, url=url)
    session = ClientSession(session_id=coords.session_id, websocket_url=websocket_url_for_server_url(coords.url), io_loop=io_loop, max_message_size=max_message_size)
    session.push(document)
    return session

def show_session(
            session_id: ID | None = None,
            url: str = "default",
            session: ClientSession | None = None,
            browser: str | None = None,
            new: BrowserTarget = "tab",
            controller: BrowserLike | None = None) -> None:
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
                "opera", "windows-default" (see the :doc:`webbrowser <python:library/webbrowser>`
                module documentation in the standard lib for more details).

            new (str, optional) : new file output mode (default: "tab")
                For file-based output, opens or raises the browser window
                showing the current output file.  If **new** is 'tab', then
                opens a new tab. If **new** is 'window', then opens a new window.

        '''
        if session is not None:
            server_url = server_url_for_websocket_url(session._connection.url)
            session_id = session.id
        else:
            coords = SessionCoordinates(session_id=session_id, url=url)
            server_url = coords.url
            session_id = coords.session_id

        if controller is None:
            from bokeh.util.browser import get_browser_controller
            controller = get_browser_controller(browser=browser)

        controller.open(server_url + "?bokeh-session-id=" + quote_plus(session_id),
                        new=NEW_PARAM[new])

class ClientSession:
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

    .. autoclasstoc::

    '''

    _document: Document | None
    _id: ID
    _connection: ClientConnection
    _callbacks: DocumentCallbackGroup

    def __init__(self, session_id: ID | None = None, websocket_url: str = DEFAULT_SERVER_WEBSOCKET_URL,
            io_loop: IOLoop | None = None, arguments: Dict[str, str] | None = None, max_message_size: int = 20*1024*1024):
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

            max_message_size (int, optional) :
                Configure the Tornado max websocket message size.
                (default: 20 MB)

        '''
        self._document = None
        self._id = self._ensure_session_id(session_id)

        from .connection import ClientConnection
        self._connection = ClientConnection(session=self, io_loop=io_loop, websocket_url=websocket_url, arguments=arguments, max_message_size=max_message_size)

        from ..server.callbacks import DocumentCallbackGroup
        self._callbacks = DocumentCallbackGroup(self._connection.io_loop)

    def __enter__(self) -> ClientSession:
        '''

        '''
        return self

    def __exit__(self, exc_type: Any, exc_value: Any, exc_traceback: Any) -> None:
        '''

        '''
        self.close()

    # Properties --------------------------------------------------------------

    @property
    def connected(self) -> bool:
        ''' Whether this session is currently connected. '''
        return self._connection.connected

    @property
    def error_reason(self) -> ErrorReason | None:
        return self._connection.error_reason

    @property
    def error_code(self) -> int | None:
        return self._connection.error_code

    @property
    def error_detail(self) -> str:
        return self._connection.error_detail

    @property
    def url(self) -> str:
        return self._connection.url

    @property
    def document(self) -> Document:
        ''' A |Document| that will be kept in sync with the corresponding
        ``Document`` on the server.

        This value is initialized when :func:`pull` or :func:`push` succeeds.
        It will be ``None`` until then.

        '''
        return self._document

    @property
    def id(self) -> ID:
        ''' A unique ID for this session. '''
        return self._id

    @property
    def token(self) -> str:
        ''' A JWT token to authenticate the session. '''
        return generate_jwt_token(self.id)

    # Public methods ----------------------------------------------------------

    def connect(self) -> None:
        ''' Connect to a Bokeh server at the configured URL. '''
        self._connection.connect()

    def close(self, why: str = "closed") -> None:
        ''' Close the connection to the server. '''
        self._connection.close(why)

    def force_roundtrip(self) -> None:
        ''' Force a round-trip request/reply to the server, sometimes needed to
        avoid race conditions. Mostly useful for testing.

        Outside of test suites, this method hurts performance and should not be
        needed.

        Returns:
           None

        '''
        self._connection.force_roundtrip()

    def check_connection_errors(self) -> None:
        ''' Raises an error, when the connection could not have been
        established.

        Should be used, after a call to connect.

        Returns:
            None

        '''
        if not self.connected:
            if self.error_reason is ErrorReason.HTTP_ERROR:
                if self.error_code == 404:
                    raise OSError(f"Check your application path! The given Path is not valid: {self.url}")
                raise OSError(f"We received an HTTP-Error. Disconnected with error code: {self.error_code}, given message: {self.error_detail}")
            raise OSError("We failed to connect to the server (to start the server, try the 'bokeh serve' command)")

    def pull(self) -> None:
        ''' Pull the server's state and set it as session.document.

        If this is called more than once, session.document will be the same
        object instance but its contents will be overwritten.

        Automatically calls :func:`connect` before pulling.

        '''
        self.connect()
        self.check_connection_errors()

        if self.document is None:
            doc = Document()
        else:
            doc = self.document
        self._connection.pull_doc(doc)
        if self.document is None:
            self._attach_document(doc)

    def push(self, document: Document | None = None) -> None:
        ''' Push the given document to the server and record it as ``session.document``.

        If this is called more than once, the Document has to be the same (or None
        to mean ``session.document``).

        .. note::
            Automatically calls :func:`~connect` before pushing.

        Args:
            document (|Document|, optional) :
                The document that will be kept in sync with the server document.
                None to use ``session.document`` or create a new document.

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
        self.check_connection_errors()
        self._connection.push_doc(doc)
        if self._document is None:
            self._attach_document(doc)

    def request_server_info(self) -> ServerInfo:
        ''' Ask for information about the server.

        Returns:
            A dictionary of server attributes.

        '''
        return self._connection.request_server_info()

    def show(self, obj: LayoutDOM | None = None, browser: str | None = None,
            new: Literal["tab", "window"] = "tab") -> None:
        ''' Open a browser displaying this session.

        Args:
            obj (LayoutDOM object, optional) : a Layout (Row/Column),
                Plot or Widget object to display. The object will be added
                to the session's document.

            browser (str, optional) : browser to show with (default: None)
                For systems that support it, the **browser** argument allows
                specifying which browser to display in, e.g. "safari", "firefox",
                "opera", "windows-default" (see the :doc:`webbrowser <python:library/webbrowser>`
                module documentation in the standard lib for more details).

            new (str, optional) : new file output mode (default: "tab")
                For file-based output, opens or raises the browser window
                showing the current output file.  If **new** is 'tab', then
                opens a new tab. If **new** is 'window', then opens a new window.

        '''
        if obj and obj not in self.document.roots:
            self.document.add_root(obj)
        show_session(session=self, browser=browser, new=new)

    # Internal methods --------------------------------------------------------

    def _attach_document(self, document: Document) -> None:
        self._document = document
        self._document.callbacks.on_change_dispatch_to(self)

        self._callbacks.add_session_callbacks(self._document.session_callbacks)

    def _document_patched(self, event: DocumentPatchedEvent) -> None:
        if event.setter is self:
            log.debug("Not sending notification back to server for a change it requested")
            return

        # TODO (havocp): our "change sync" protocol is flawed
        # because if both sides change the same attribute at the
        # same time, they will each end up with the state of the
        # other and their final states will differ.
        self._connection._send_patch_document(self._id, event)

    @classmethod
    def _ensure_session_id(cls, session_id: ID | None) -> ID:
        if session_id is None:
            session_id = generate_session_id()
        return session_id

    def _handle_patch(self, message: patch_doc) -> None:
        message.apply_to_document(self.document, self)

    def _loop_until_closed(self) -> None:
        ''' Execute a blocking loop that runs and executes event callbacks
        until the connection is closed (e.g. by hitting Ctrl-C).

        This function is intended to facilitate testing ONLY.

        '''
        self._connection.loop_until_closed()

    def _notify_disconnected(self) -> None:
        ''' Called by the ClientConnection we are using to notify us of disconnect.

        '''
        if self.document is not None:
            self.document.remove_on_change(self)
            self._callbacks.remove_all_callbacks()

    def _session_callback_added(self, event: SessionCallbackAdded) -> None:
        self._callbacks.add_session_callback(event.callback)

    def _session_callback_removed(self, event: SessionCallbackRemoved) -> None:
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
