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

'''
from __future__ import absolute_import, print_function

import atexit
import logging
log = logging.getLogger(__name__)
import signal
import sys

import tornado
from tornado.httpserver import HTTPServer
from tornado.ioloop import IOLoop

from .. import __version__
from ..application import Application
from ..core.properties import Bool, Int, List, String
from ..resources import DEFAULT_SERVER_PORT
from ..util.options import Options

from .util import bind_sockets, create_hosts_whitelist
from .tornado import BokehTornado

# This class itself is intentionally undocumented (it is used to generate
# documentation elsewhere)
class _ServerOpts(Options):

    num_procs = Int(default=1, help="""
    The number of worker processes to start for the HTTP server. If an explicit
    ``io_loop`` is also configured, then ``num_procs=1`` is the only compatible
    value. Use ``BaseServer`` to coordinate an explicit ``IOLoop`` with a
    multi-process HTTP server.

    A value of 0 will auto detect number of cores.

    Note that due to limitations inherent in Tornado, Windows does not support
    ``num_procs`` values greater than one! In this case consider running
    multiple Bokeh server instances behind a load balancer.
    """)

    address = String(default=None, help="""
    The address the server should listen on for HTTP requests.
    """)

    port = Int(default=DEFAULT_SERVER_PORT, help="""
    The port number the server should listen on for HTTP requests.
    """)

    prefix = String(default="", help="""
    A URL prefix to use for all Bokeh server paths.
    """)

    allow_websocket_origin = List(String, default=None, help="""
    A list of hosts that can connect to the websocket.

    This is typically required when embedding a Bokeh server app in an external
    web site using :func:`~bokeh.embed.server_document` or similar.

    If None, "localhost" is used.
    """)

    use_xheaders = Bool(default=False, help="""
    Whether to have the Bokeh server override the remote IP and URI scheme
    and protocol for all requests with ``X-Real-Ip``, ``X-Forwarded-For``,
    ``X-Scheme``, ``X-Forwarded-Proto`` headers (if they are provided).
    """)


class BaseServer(object):
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

    '''

    def __init__(self, io_loop, tornado_app, http_server):
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
    def io_loop(self):
        ''' The Tornado ``IOLoop`` that this Bokeh Server is running on.

        '''
        return self._loop

    def start(self):
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

    def stop(self, wait=True):
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

    def unlisten(self):
        ''' Stop listening on ports. The server will no longer be usable after
        calling this function.

        Returns:
            None

        '''
        self._http.close_all_connections()
        self._http.stop()

    def run_until_shutdown(self):
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

    def get_session(self, app_path, session_id):
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

    def get_sessions(self, app_path=None):
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
        all_sessions = []
        for path in self._tornado.app_paths:
            all_sessions += self._tornado.get_sessions(path)
        return all_sessions

    def show(self, app_path, browser=None, new='tab'):
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
                "opera", "windows-default" (see the ``webbrowser`` module
                documentation in the standard lib for more details).

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
        url = "http://%s:%d%s%s" % (address_string, self.port, self.prefix, app_path)

        from bokeh.util.browser import view
        view(url, browser=browser, new=new)

    _atexit_ran = False
    def _atexit(self):
        if self._atexit_ran:
            return
        self._atexit_ran = True

        log.debug("Shutdown: cleaning up")
        if not self._stopped:
            self.stop(wait=False)

    def _sigterm(self, signum, frame):
        print("Received signal %d, shutting down" % (signum,))
        # Tell self._loop.start() to return.
        self._loop.add_callback_from_signal(self._loop.stop)

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

    '''

    def __init__(self, applications, io_loop=None, http_server_kwargs=None, **kwargs):
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
                an Application will be created for it using FunctionHandler.

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
        log.info("Starting Bokeh server version %s (running on Tornado %s)" % (__version__, tornado.version))

        from bokeh.application.handlers.function import FunctionHandler

        if callable(applications):
            applications = Application(FunctionHandler(applications))

        if isinstance(applications, Application):
            applications = { '/' : applications }

        for k, v in list(applications.items()):
            if callable(v):
                applications[k] = Application(FunctionHandler(v))

        opts = _ServerOpts(kwargs)
        self._port = opts.port
        self._address = opts.address
        self._prefix = opts.prefix

        if opts.num_procs != 1:
            assert all(app.safe_to_fork for app in applications.values()), (
                      'User application code has run before attempting to start '
                      'multiple processes. This is considered an unsafe operation.')

        if opts.num_procs > 1 and io_loop is not None:
            raise RuntimeError(
                "Setting both num_procs and io_loop in Server is incompatible. Use BaseServer to coordinate an explicit IOLoop and multi-process HTTPServer"
            )

        if opts.num_procs > 1 and sys.platform == "win32":
            raise RuntimeError("num_procs > 1 not supported on Windows")

        if http_server_kwargs is None:
            http_server_kwargs = {}
        http_server_kwargs.setdefault('xheaders', opts.use_xheaders)

        sockets, self._port = bind_sockets(self.address, self.port)

        extra_websocket_origins = create_hosts_whitelist(opts.allow_websocket_origin, self.port)
        try:
            tornado_app = BokehTornado(applications, extra_websocket_origins=extra_websocket_origins, prefix=self.prefix, **kwargs)

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

        super(Server, self).__init__(io_loop, tornado_app, http_server)

    @property
    def prefix(self):
        ''' The configured URL prefix to use for all Bokeh server paths.

        '''
        return self._prefix

    @property
    def port(self):
        ''' The configured port number that the server listens on for HTTP
        requests.

        '''
        return self._port

    @property
    def address(self):
        ''' The configured address that the server listens on for HTTP
        requests.

        '''
        return self._address
