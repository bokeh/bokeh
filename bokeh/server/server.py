''' Provides a Server which instantiates Application instances as clients connect

'''
from __future__ import absolute_import, print_function

import atexit
import logging
log = logging.getLogger(__name__)
import signal

from tornado.httpserver import HTTPServer
from tornado.ioloop import IOLoop
from tornado import netutil

from .tornado import BokehTornado

from bokeh import __version__

from bokeh.application import Application

from bokeh.resources import DEFAULT_SERVER_PORT

def _create_hosts_whitelist(host_list, port):
    if not host_list:
        return ['localhost:' + str(port)]

    hosts = []
    for host in host_list:
        if '*' in host:
            log.warning(
                "Host wildcard %r will allow websocket connections originating "
                "from multiple (or possibly all) hostnames or IPs. Use non-wildcard "
                "values to restrict access explicitly", host)
        if host == '*':
            # do not append the :80 port suffix in that case: any port is
            # accepted
            hosts.append(host)
            continue
        parts = host.split(':')
        if len(parts) == 1:
            if parts[0] == "":
                raise ValueError("Empty host value")
            hosts.append(host+":80")
        elif len(parts) == 2:
            try:
                int(parts[1])
            except ValueError:
                raise ValueError("Invalid port in host value: %s" % host)
            if parts[0] == "":
                raise ValueError("Empty host value")
            hosts.append(host)
        else:
            raise ValueError("Invalid host value: %s" % host)
    return hosts


def _bind_sockets(address, port):
    '''Like tornado.netutil.bind_sockets(), but also returns the
    assigned port number.
    '''
    ss = netutil.bind_sockets(port=port or 0, address=address)
    assert len(ss)
    ports = {s.getsockname()[1] for s in ss}
    assert len(ports) == 1, "Multiple ports assigned??"
    actual_port = ports.pop()
    if port:
        assert actual_port == port
    return ss, actual_port


class Server(object):
    ''' A Server which creates a new Session for each connection, using an Application to initialize each Session.

    Args:
        applications (dict of str: bokeh.application.Application) or bokeh.application.Application:
            mapping from URL paths to Application instances, or a single Application to put at the root URL
            The Application is a factory for Document, with a new Document initialized for each Session.
            Each application should be identified by a path meant to go in a URL, like "/" or "/foo"
    Kwargs:
        num_procs (str):
            Number of worker processes for an app. Default to one. Using 0 will autodetect number of cores
    '''

    def __init__(self, applications, io_loop=None, **kwargs):
        log.info("Starting Bokeh server version %s" % __version__)

        if isinstance(applications, Application):
            self._applications = { '/' : applications }
        else:
            self._applications = applications

        tornado_kwargs = { key: kwargs[key] for key in ['extra_patterns',
                                                        'secret_key',
                                                        'sign_sessions',
                                                        'generate_session_ids',
                                                        'keep_alive_milliseconds',
                                                        'check_unused_sessions_milliseconds',
                                                        'unused_session_lifetime_milliseconds',
                                                        'stats_log_frequency_milliseconds',
                                                        ]
                           if key in kwargs }

        prefix = kwargs.get('prefix')
        if prefix is None:
            prefix = ""
        prefix = prefix.strip("/")
        if prefix:
            prefix = "/" + prefix
        self._prefix = prefix

        self._started = False
        self._stopped = False

        port = kwargs.get('port', DEFAULT_SERVER_PORT)
        self._address = kwargs.get('address') or None

        self._num_procs = kwargs.get('num_procs', 1)
        if self._num_procs != 1:
            assert all(app.safe_to_fork for app in self._applications.values()), (
                      'User code has ran before attempting to run multiple '
                      'processes. This is considered an unsafe operation.')

        sockets, self._port = _bind_sockets(self._address, port)
        try:
            tornado_kwargs['extra_websocket_origins'] = _create_hosts_whitelist(kwargs.get('allow_websocket_origin'), self._port)
            tornado_kwargs['use_index'] = kwargs.get('use_index', True)
            tornado_kwargs['redirect_root'] = kwargs.get('redirect_root', True)

            self._tornado = BokehTornado(self._applications, self.prefix, **tornado_kwargs)
            self._http = HTTPServer(self._tornado, xheaders=kwargs.get('use_xheaders', False))
            self._http.start(self._num_procs)
            self._http.add_sockets(sockets)

        except Exception:
            for s in sockets:
                s.close()
            raise

        # Can only instantiate the IO loop after HTTPServer.start() was
        # called because of `num_procs`, see issue #5524
        if io_loop is None:
            io_loop = IOLoop.current()
        self._loop = io_loop
        self._tornado.initialize(io_loop=io_loop, **tornado_kwargs)

    @property
    def port(self):
        '''The actual port number the server is listening on for HTTP
        requests.
        '''
        return self._port

    @property
    def address(self):
        '''The address the server is listening on for HTTP requests
        (may be empty or None).
        '''
        return self._address

    @property
    def prefix(self):
        return self._prefix

    @property
    def io_loop(self):
        return self._loop

    def start(self):
        ''' Start the Bokeh Server and its background tasks.

        Notes:
            This method does not block and does not affect the state of
            the Tornado I/O loop.  You must start and stop the loop yourself.
        '''
        assert not self._started, "Already started"
        self._started = True
        self._tornado.start()

    def stop(self, wait=True):
        ''' Stop the Bokeh Server.

        Args:
            fast (boolean): whether to wait for orderly cleanup (default: True)

        Returns:
            None
        '''
        assert not self._stopped, "Already stopped"
        self._stopped = True
        self._tornado.stop(wait)

    def run_until_shutdown(self):
        ''' Run the Bokeh Server until shutdown is requested by the user,
        either via a Keyboard interrupt (Ctrl-C) or SIGTERM.
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

    def unlisten(self):
        '''Stop listening on ports (Server will no longer be usable after calling this)

        Returns:
            None
        '''
        self._http.close_all_connections()
        self._http.stop()

    def get_session(self, app_path, session_id):
        '''Gets a session by name (session must already exist)'''

        return self._tornado.get_session(app_path, session_id)

    def get_sessions(self, app_path=None):
        '''Gets all live sessions for an application.'''
        if app_path is not None:
            return self._tornado.get_sessions(app_path)
        all_sessions = []
        for path in self._tornado.app_paths:
            all_sessions += self._tornado.get_sessions(path)
        return all_sessions

    def show(self, app_path, browser=None, new='tab'):
        ''' Opens an app in a browser window or tab.

            Useful for testing server applications on your local desktop but
            should not call when running bokeh-server on an actual server.

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
        from bokeh.util.browser import view
        url = "http://localhost:%d%s%s" % (self.port, self.prefix, app_path)
        view(url, browser=browser, new=new)
