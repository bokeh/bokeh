#-----------------------------------------------------------------------------
# Copyright (c) 2012 - 2023, Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------
''' Provide basic Bokeh server objects that use a Tornado ``HTTPServer`` and
``BokeTornado`` Tornado Application to service Bokeh Server Applications.
There are two public classes in this module:

:class:`~bokeh.server.server.BaseServer`
    This is a lightweight class to explicitly coordinate the components needed
    to run a Bokeh server (A :class:`~bokeh.server.tornado.BokehTornado`
    instance, and Tornado ``HTTPServer`` and a Tornado ``IOLoop``)

:class:`~bokeh.server.server.Server`
    This higher-level convenience class only needs to be configured with Bokeh
    :class:`~bokeh.application.application.Application` instances, and will
    automatically create and coordinate the lower level Tornado components.

See :ref:`ug_server_introduction` for general information on the Bokeh server.

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
import atexit
import signal
import socket
import sys
from types import FrameType
from typing import TYPE_CHECKING, Any, Mapping

# External imports
from tornado import netutil, version as tornado_version
from tornado.httpserver import HTTPServer
from tornado.ioloop import IOLoop

# Bokeh imports
from .. import __version__
from ..core import properties as p
from ..core.properties import (
    Bool,
    Int,
    Nullable,
    String,
)
from ..resources import DEFAULT_SERVER_PORT, server_url
from ..util.options import Options
from .tornado import DEFAULT_WEBSOCKET_MAX_MESSAGE_SIZE_BYTES, BokehTornado
from .util import bind_sockets, create_hosts_allowlist

if TYPE_CHECKING:
    from ..application.application import Application
    from ..application.handlers.function import ModifyDoc
    from ..core.types import ID
    from ..util.browser import BrowserTarget
    from .session import ServerSession

#-----------------------------------------------------------------------------
# Globals and constants
#-----------------------------------------------------------------------------

__all__ = (
    'BaseServer',
    'Server',
)

#-----------------------------------------------------------------------------
# Dev API
#-----------------------------------------------------------------------------

class BaseServer:
    ''' Explicitly coordinate the level Tornado components required to run a
    Bokeh server:

    * A Tornado ``IOLoop`` to run the Bokeh server machinery.

    * a ``BokehTornado`` Tornado application that defines the Bokeh server
      machinery.

    * a Tornado ``HTTPServer`` to direct HTTP requests

    All three of these components must be passed to ``BaseServer``, which will
    initialize the ``BokehTornado`` instance on the ``io_loop``. The
    ``http_server`` must have been previously created and initialized with the
    ``BokehTornado`` instance.

    .. autoclasstoc::

    '''

    def __init__(self, io_loop: IOLoop, tornado_app: BokehTornado, http_server: HTTPServer) -> None:
        ''' Create a ``BaseServer`` instance.

        Args:
            io_loop (IOLoop) :
                A Tornado ``IOLoop`` to run the Bokeh Tornado application on.

            tornado_app (BokehTornado) :
                An instance of the Bokeh Tornado application that generates
                Bokeh Documents and Sessions.

            http_server (HTTPServer) :
                A Tornado ``HTTPServer`` to service HTTP requests for Bokeh
                applications. Should have already be configured with the
                ``tornado_app`` when created.

        '''

        self._started = False
        self._stopped = False

        self._http = http_server
        self._loop = io_loop
        self._tornado = tornado_app

        self._tornado.initialize(io_loop)

    @property
    def io_loop(self) -> IOLoop:
        ''' The Tornado ``IOLoop`` that this Bokeh Server is running on.

        '''
        return self._loop

    def start(self) -> None:
        ''' Install the Bokeh Server and its background tasks on a Tornado
        ``IOLoop``.

        This method does *not* block and does *not* affect the state of the
        Tornado ``IOLoop``  You must start and stop the loop yourself, i.e.
        this method is typically useful when you are already explicitly
        managing an ``IOLoop`` yourself.

        To start a Bokeh server and immediately "run forever" in a blocking
        manner, see :func:`~bokeh.server.server.BaseServer.run_until_shutdown`.

        '''
        assert not self._started, "Already started"
        self._started = True
        self._tornado.start()

    def stop(self, wait: bool = True) -> None:
        ''' Stop the Bokeh Server.

        This stops and removes all Bokeh Server ``IOLoop`` callbacks, as well
        as stops the ``HTTPServer`` that this instance was configured with.

        Args:
            fast (bool):
                Whether to wait for orderly cleanup (default: True)

        Returns:
            None

        '''
        assert not self._stopped, "Already stopped"
        self._stopped = True
        self._tornado.stop(wait)
        self._http.stop()

    def unlisten(self) -> None:
        ''' Stop listening on ports. The server will no longer be usable after
        calling this function.

        .. note::
            This function is mostly useful for tests

        Returns:
            None

        '''
        self._http.stop()
        self.io_loop.add_callback(self._http.close_all_connections)

    def run_until_shutdown(self) -> None:
        ''' Run the Bokeh Server until shutdown is requested by the user,
        either via a Keyboard interrupt (Ctrl-C) or SIGTERM.

        Calling this method will start the Tornado ``IOLoop`` and block
        all execution in the calling process.

        Returns:
            None

        '''
        if not self._started:
            self.start()
        # Install shutdown hooks
        atexit.register(self._atexit)
        signal.signal(signal.SIGTERM, self._sigterm)
        try:
            self._loop.start()
        except KeyboardInterrupt:
            print("\nInterrupted, shutting down")
        self.stop()

    def get_session(self, app_path: str, session_id: ID) -> ServerSession:
        ''' Get an active a session by name application path and session ID.

        Args:
            app_path (str) :
                The configured application path for the application to return
                a session for.

            session_id (str) :
                The session ID of the session to retrieve.

        Returns:
            ServerSession

        '''
        return self._tornado.get_session(app_path, session_id)

    def get_sessions(self, app_path: str | None = None) -> list[ServerSession]:
        ''' Gets all currently active sessions for applications.

        Args:
            app_path (str, optional) :
                The configured application path for the application to return
                sessions for. If None, return active sessions for all
                applications. (default: None)

        Returns:
            list[ServerSession]

        '''
        if app_path is not None:
            return self._tornado.get_sessions(app_path)
        all_sessions: list[ServerSession] = []
        for path in self._tornado.app_paths:
            all_sessions += self._tornado.get_sessions(path)
        return all_sessions

    def show(self, app_path: str, browser: str | None = None, new: BrowserTarget = "tab") -> None:
        ''' Opens an app in a browser window or tab.

        This method is useful for testing or running Bokeh server applications
        on a local machine but should not call when running Bokeh server for
        an actual deployment.

        Args:
            app_path (str) : the app path to open
                The part of the URL after the hostname:port, with leading slash.

            browser (str, optional) : browser to show with (default: None)
                For systems that support it, the **browser** argument allows
                specifying which browser to display in, e.g. "safari", "firefox",
                "opera", "windows-default" (see the :doc:`webbrowser <python:library/webbrowser>`
                module documentation in the standard lib for more details).

            new (str, optional) : window or tab (default: "tab")
                If ``new`` is 'tab', then opens a new tab.
                If ``new`` is 'window', then opens a new window.

        Returns:
            None

        '''
        if not app_path.startswith("/"):
            raise ValueError("app_path must start with a /")


        address_string = 'localhost'
        if self.address is not None and self.address != '':
            address_string = self.address
        url = f"http://{address_string}:{self.port}{self.prefix}{app_path}"

        from bokeh.util.browser import view
        view(url, browser=browser, new=new)

    _atexit_ran = False
    def _atexit(self) -> None:
        if self._atexit_ran:
            return
        self._atexit_ran = True

        log.debug("Shutdown: cleaning up")
        if not self._stopped:
            self.stop(wait=False)

    def _sigterm(self, signum: int, frame: FrameType | None) -> None:
        print(f"Received signal {signum}, shutting down")
        # Tell self._loop.start() to return.
        self._loop.add_callback_from_signal(self._loop.stop)

    @property
    def port(self) -> int | None:
        ''' The configured port number that the server listens on for HTTP requests
        '''
        sock = next(
            sock for sock in self._http._sockets.values()
            if sock.family in (socket.AF_INET, socket.AF_INET6)
        )
        return sock.getsockname()[1]

    @property
    def address(self) -> str | None:
        ''' The configured address that the server listens on for HTTP requests
        '''
        sock = next(
            sock for sock in self._http._sockets.values()
            if sock.family in (socket.AF_INET, socket.AF_INET6)
        )
        return sock.getsockname()[0]

    @property
    def prefix(self) -> str:
        ''' The configured URL prefix to use for all Bokeh server paths. '''
        return self._tornado.prefix

    @property
    def index(self) -> str | None:
        ''' A path to a Jinja2 template to use for index at "/" '''
        return self._tornado.index

#-----------------------------------------------------------------------------
# General API
#-----------------------------------------------------------------------------

class Server(BaseServer):
    ''' A high level convenience class to run a Bokeh server.

    This class can automatically coordinate the three the base level
    components required to run a Bokeh server:

    * A Tornado ``IOLoop`` to run the Bokeh server machinery.

    * a ``BokehTornado`` Tornado application that defines the Bokeh server
      machinery.

    * a Tornado ``HTTPServer`` to direct HTTP requests

    This high level ``Server`` class has some limitations. In particular, it is
    not possible to set an explicit ``io_loop`` and ``num_procs`` other than 1
    at the same time. To do that, it is necessary to use ``BaseServer`` and
    coordinate the three components above explicitly.

    .. autoclasstoc::

    '''

    def __init__(self, applications: Mapping[str, Application | ModifyDoc] | Application | ModifyDoc,
            io_loop: IOLoop | None = None, http_server_kwargs: dict[str, Any] | None = None, **kwargs: Any) -> None:
        ''' Create a ``Server`` instance.

        Args:
            applications (dict[str, Application] or Application or callable) :
                A mapping from URL paths to Application instances, or a single
                Application to put at the root URL.

                The Application is a factory for Documents, with a new Document
                initialized for each Session. Each application is identified
                by a path that corresponds to a URL, like "/" or "/myapp"

                If a single Application is provided, it is mapped to the URL
                path "/" automatically.

                As a convenience, a callable may also be provided, in which
                an Application will be created for it using
                ``FunctionHandler``.

            io_loop (IOLoop, optional) :
                An explicit Tornado ``IOLoop`` to run Bokeh Server code on. If
                None, ``IOLoop.current()`` will be used (default: None)

            http_server_kwargs (dict, optional) :
                Extra arguments passed to ``tornado.httpserver.HTTPServer``.

                E.g. ``max_buffer_size`` to specify the maximum upload size.
                More details can be found at:

                http://www.tornadoweb.org/en/stable/httpserver.html#http-server

                If None, no extra arguments are passed (default: None)

        Additionally, the following options may be passed to configure the
        operation of ``Server``:

        .. bokeh-options:: _ServerOpts
            :module: bokeh.server.server

        Any remaining keyword arguments will be passed as-is to
        ``BokehTornado``.

        '''
        log.info(f"Starting Bokeh server version {__version__} (running on Tornado {tornado_version})")

        opts = _ServerOpts(kwargs)

        if opts.num_procs > 1 and io_loop is not None:
            raise RuntimeError(
                "Setting both num_procs and io_loop in Server is incompatible. Use BaseServer to coordinate an explicit IOLoop and multi-process HTTPServer"
            )

        if opts.num_procs > 1 and sys.platform == "win32":
            raise RuntimeError("num_procs > 1 not supported on Windows")

        if opts.unix_socket and sys.platform == "win32":
            raise RuntimeError("Unix sockets are not supported on windows.")

        if http_server_kwargs is None:
            http_server_kwargs = {}
        http_server_kwargs.setdefault('xheaders', opts.use_xheaders)

        if opts.ssl_certfile:
            log.info("Configuring for SSL termination")
            import ssl
            context = ssl.create_default_context(ssl.Purpose.CLIENT_AUTH)
            context.load_cert_chain(certfile=opts.ssl_certfile, keyfile=opts.ssl_keyfile, password=opts.ssl_password)
            http_server_kwargs['ssl_options'] = context

        if opts.unix_socket:
            sockets = [netutil.bind_unix_socket(opts.unix_socket)]
            self._unix_socket = opts.unix_socket
            self._address, self._port = None, None
            if opts.allow_websocket_origin:
                extra_websocket_origins = create_hosts_allowlist(opts.allow_websocket_origin, None)
            else:
                extra_websocket_origins = []
        else:
            sockets, self._port = bind_sockets(opts.address, opts.port)
            self._address = opts.address

            extra_websocket_origins = create_hosts_allowlist(opts.allow_websocket_origin, self.port)

        self._absolute_url = server_url(self._address, self._port, opts.ssl_certfile is not None)

        try:
            tornado_app = BokehTornado(applications,
                                       extra_websocket_origins=extra_websocket_origins,
                                       absolute_url=self._absolute_url,
                                       prefix=opts.prefix,
                                       index=opts.index,
                                       websocket_max_message_size_bytes=opts.websocket_max_message_size,
                                       **kwargs)

            if opts.num_procs != 1:
                assert all(app_context.application.safe_to_fork for app_context in tornado_app.applications.values()), (
                      'User application code has run before attempting to start '
                      'multiple processes. This is considered an unsafe operation.')

            http_server = HTTPServer(tornado_app, **http_server_kwargs)

            http_server.start(opts.num_procs)
            http_server.add_sockets(sockets)

        except Exception:
            for s in sockets:
                s.close()
            raise

        # Can only refer to IOLoop after HTTPServer.start() is called, see #5524
        if io_loop is None:
            io_loop = IOLoop.current()

        super().__init__(io_loop, tornado_app, http_server)

    @property
    def port(self) -> int | None:
        ''' The configured port number that the server listens on for HTTP
        requests.
        '''
        return self._port

    @property
    def unix_socket(self) -> str:
        ''' The configured unix socket that the server listens to.

        '''
        return self._unix_socket

    @property
    def address(self) -> str | None:
        ''' The configured address that the server listens on for HTTP
        requests.

        '''
        return self._address

#-----------------------------------------------------------------------------
# Private API
#-----------------------------------------------------------------------------

# This class itself is intentionally undocumented (it is used to generate
# documentation elsewhere)
class _ServerOpts(Options):

    num_procs: int = Int(default=1, help="""
    The number of worker processes to start for the HTTP server. If an explicit
    ``io_loop`` is also configured, then ``num_procs=1`` is the only compatible
    value. Use ``BaseServer`` to coordinate an explicit ``IOLoop`` with a
    multi-process HTTP server.

    A value of 0 will auto detect number of cores.

    Note that due to limitations inherent in Tornado, Windows does not support
    ``num_procs`` values greater than one! In this case consider running
    multiple Bokeh server instances behind a load balancer.
    """)  # type: ignore[assignment]

    address : str | None = Nullable(String, help="""
    The address the server should listen on for HTTP requests.
    """)  # type: ignore[assignment]

    port: int = Int(default=DEFAULT_SERVER_PORT, help="""
    The port number the server should listen on for HTTP requests.
    """)  # type: ignore[assignment]

    unix_socket : str | None = Nullable(String, help="""
    The unix socket the server should bind to. Other network args
    such as port, address, ssl options etc are incompatible with unix sockets.
    Unix socket support is not available on windows.
    """)  # type: ignore[assignment]

    prefix: str = String(default="", help="""
    A URL prefix to use for all Bokeh server paths.
    """)  # type: ignore[assignment]

    index: str | None = Nullable(String, help="""
    A path to a Jinja2 template to use for the index "/"
    """)  # type: ignore[assignment]

    allow_websocket_origin: list[str] | None = Nullable(p.List(String), help="""
    A list of hosts that can connect to the websocket.

    This is typically required when embedding a Bokeh server app in an external
    web site using :func:`~bokeh.embed.server_document` or similar.

    If None, "localhost" is used.
    """)  # type: ignore[assignment]

    use_xheaders: bool = Bool(default=False, help="""
    Whether to have the Bokeh server override the remote IP and URI scheme
    and protocol for all requests with ``X-Real-Ip``, ``X-Forwarded-For``,
    ``X-Scheme``, ``X-Forwarded-Proto`` headers (if they are provided).
    """)  # type: ignore[assignment]

    ssl_certfile: str | None = Nullable(String, help="""
    The path to a certificate file for SSL termination.
    """)  # type: ignore[assignment]

    ssl_keyfile: str | None = Nullable(String, help="""
    The path to a private key file for SSL termination.
    """)  # type: ignore[assignment]

    ssl_password: str | None = Nullable(String, help="""
    A password to decrypt the SSL keyfile, if necessary.
    """)  # type: ignore[assignment]

    websocket_max_message_size: int = Int(default=DEFAULT_WEBSOCKET_MAX_MESSAGE_SIZE_BYTES, help="""
    Set the Tornado ``websocket_max_message_size`` value.
    """)  # type: ignore[assignment]

#-----------------------------------------------------------------------------
# Code
#-----------------------------------------------------------------------------
