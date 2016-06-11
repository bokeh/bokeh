''' Provides the Bokeh Server Tornado application.

'''
from __future__ import absolute_import, print_function

import logging
log = logging.getLogger(__name__)

import atexit
# NOTE: needs PyPI backport on Python 2 (https://pypi.python.org/pypi/futures)
from concurrent.futures import ProcessPoolExecutor
import os
from pprint import pformat
import signal

from tornado import gen
from tornado.ioloop import IOLoop, PeriodicCallback
from tornado.web import Application as TornadoApplication
from tornado.web import HTTPError
from tornado.web import StaticFileHandler

from bokeh.resources import Resources
from bokeh.settings import settings

from .views.root_handler import RootHandler
from .urls import per_app_patterns, toplevel_patterns
from .connection import ServerConnection
from .application_context import ApplicationContext
from .views.static_handler import StaticHandler


def match_host(host, pattern):
    """ Match host against pattern

    >>> match_host('192.168.0.1:80', '192.168.0.1:80')
    True
    >>> match_host('192.168.0.1:80', '192.168.0.1')
    True
    >>> match_host('192.168.0.1:80', '192.168.0.1:8080')
    False
    >>> match_host('192.168.0.1', '192.168.0.2')
    False
    >>> match_host('192.168.0.1', '192.168.*.*')
    True
    >>> match_host('alice', 'alice')
    True
    >>> match_host('alice:80', 'alice')
    True
    >>> match_host('alice', 'bob')
    False
    >>> match_host('foo.example.com', 'foo.example.com.net')
    False
    >>> match_host('alice', '*')
    True
    >>> match_host('alice', '*:*')
    True
    >>> match_host('alice:80', '*')
    True
    >>> match_host('alice:80', '*:80')
    True
    >>> match_host('alice:8080', '*:80')
    False

    """
    if ':' in host:
        host, host_port = host.rsplit(':', 1)
    else:
        host_port = None

    if ':' in pattern:
        pattern, pattern_port = pattern.rsplit(':', 1)
        if pattern_port == '*':
            pattern_port = None
    else:
        pattern_port = None

    if pattern_port is not None and host_port != pattern_port:
        return False

    host = host.split('.')
    pattern = pattern.split('.')

    if len(pattern) > len(host):
        return False

    for h, p in zip(host, pattern):
        if h == p or p == '*':
            continue
        else:
            return False
    return True


# factored out to be easier to test
def check_whitelist(request_host, whitelist):
    ''' Check a given request host against a whitelist.

    '''
    if ':' not in request_host:
        request_host = request_host + ':80'

    if request_host in whitelist:
        return True

    return any(match_host(request_host, host) for host in whitelist)


def _whitelist(handler_class):
    if hasattr(handler_class.prepare, 'patched'):
        return
    old_prepare = handler_class.prepare
    def _prepare(self, *args, **kw):
        if not check_whitelist(self.request.host, self.application._hosts):
            log.info("Rejected connection from host '%s' because it is not in the --host whitelist" % self.request.host)
            raise HTTPError(403)
        return old_prepare(self, *args, **kw)
    _prepare.patched = True
    handler_class.prepare = _prepare


class BokehTornado(TornadoApplication):
    ''' A Tornado Application used to implement the Bokeh Server.

        The Server class is the main public interface, this class has
        Tornado implementation details.

    Args:
        applications (dict of str : bokeh.application.Application) : map from paths to Application instances
            The application is used to create documents for each session.
        extra_patterns (seq[tuple]) : tuples of (str, http or websocket handler)
            Use this argument to add additional endpoints to custom deployments
            of the Bokeh Server.
        prefix (str) : a URL prefix to use for all Bokeh server paths
        hosts (list) : hosts that are valid values for the Host header
        secret_key (str) : secret key for signing session IDs
        sign_sessions (boolean) : whether to sign session IDs
        generate_session_ids (boolean) : whether to generate a session ID when none is provided
        extra_websocket_origins (list) : hosts that can connect to the websocket
            These are in addition to ``hosts``.
        keep_alive_milliseconds (int) : number of milliseconds between keep-alive pings
            Set to 0 to disable pings. Pings keep the websocket open.
        check_unused_sessions_milliseconds (int) : number of milliseconds between check for unused sessions
        unused_session_lifetime_milliseconds (int) : number of milliseconds for unused session lifetime
        stats_log_frequency_milliseconds (int) : number of milliseconds between logging stats
        develop (boolean) : True for develop mode
        use_index (boolean) : True to generate an index of the running apps in the RootHandler

    '''

    def __init__(self, applications, prefix, hosts,
                 extra_websocket_origins,
                 io_loop=None,
                 extra_patterns=None,
                 secret_key=settings.secret_key_bytes(),
                 sign_sessions=settings.sign_sessions(),
                 generate_session_ids=True,
                 # heroku, nginx default to 60s timeout, so well less than that
                 keep_alive_milliseconds=37000,
                 # how often to check for unused sessions
                 check_unused_sessions_milliseconds=17000,
                 # how long unused sessions last
                 unused_session_lifetime_milliseconds=15000,
                 # how often to log stats
                 stats_log_frequency_milliseconds=15000,
                 develop=False,
                 use_index=True,
                 redirect_root=True):

        self._prefix = prefix
        self.use_index = use_index

        if keep_alive_milliseconds < 0:
            # 0 means "disable"
            raise ValueError("keep_alive_milliseconds must be >= 0")

        if check_unused_sessions_milliseconds <= 0:
            raise ValueError("check_unused_sessions_milliseconds must be > 0")

        if unused_session_lifetime_milliseconds <= 0:
            raise ValueError("check_unused_sessions_milliseconds must be > 0")

        if stats_log_frequency_milliseconds <= 0:
            raise ValueError("stats_log_frequency_milliseconds must be > 0")

        self._hosts = set(hosts)
        self._websocket_origins = self._hosts | set(extra_websocket_origins)
        self._resources = {}
        self._develop = develop
        self._secret_key = secret_key
        self._sign_sessions = sign_sessions
        self._generate_session_ids = generate_session_ids

        log.debug("Allowed Host headers: %r", list(self._hosts))
        log.debug("These host origins can connect to the websocket: %r", list(self._websocket_origins))

        # Wrap applications in ApplicationContext
        self._applications = dict()
        for k,v in applications.items():
            self._applications[k] = ApplicationContext(v, self._develop)

        extra_patterns = extra_patterns or []
        all_patterns = []
        for key, app in applications.items():
            app_patterns = []
            for p in per_app_patterns:
                if key == "/":
                    route = p[0]
                else:
                    route = key + p[0]
                route = self._prefix + route
                app_patterns.append((route, p[1], { "application_context" : self._applications[key] }))

            websocket_path = None
            for r in app_patterns:
                if r[0].endswith("/ws"):
                    websocket_path = r[0]
            if not websocket_path:
                raise RuntimeError("Couldn't find websocket path")
            for r in app_patterns:
                r[2]["bokeh_websocket_path"] = websocket_path

            all_patterns.extend(app_patterns)

            # add a per-app static path if requested by the application
            if app.static_path is not None:
                if key == "/":
                    route = "/static/(.*)"
                else:
                    route = key + "/static/(.*)"
                route = self._prefix + route
                all_patterns.append((route, StaticFileHandler, { "path" : app.static_path }))

        for p in extra_patterns + toplevel_patterns:
            if p[1] == RootHandler:
                if self.use_index:
                    data = {"applications": self._applications,
                            "prefix": self._prefix,
                            "use_redirect": redirect_root}
                    prefixed_pat = (self._prefix + p[0],) + p[1:] + (data,)
                    all_patterns.append(prefixed_pat)
            else:
                prefixed_pat = (self._prefix + p[0],) + p[1:]
                all_patterns.append(prefixed_pat)

        for pat in all_patterns:
            _whitelist(pat[1])

        log.debug("Patterns are:")
        for line in pformat(all_patterns, width=60).split("\n"):
            log.debug("  " + line)

        super(BokehTornado, self).__init__(all_patterns)

    def initialize(self,
                 io_loop=None,
                 keep_alive_milliseconds=37000,
                 # how often to check for unused sessions
                 check_unused_sessions_milliseconds=17000,
                 # how long unused sessions last
                 unused_session_lifetime_milliseconds=15000,
                 # how often to log stats
                 stats_log_frequency_milliseconds=15000,
                 develop=False,
                 **kw):

        if io_loop is None:
            io_loop = IOLoop.current()
        self._loop = io_loop

        for app_context in self._applications.values():
            app_context._loop = self._loop

        self._clients = set()
        self._executor = ProcessPoolExecutor(max_workers=4)
        self._loop.add_callback(self._start_async)
        self._stats_job = PeriodicCallback(self.log_stats,
                                           stats_log_frequency_milliseconds,
                                           io_loop=self._loop)
        self._unused_session_linger_milliseconds = unused_session_lifetime_milliseconds
        self._cleanup_job = PeriodicCallback(self.cleanup_sessions,
                                             check_unused_sessions_milliseconds,
                                             io_loop=self._loop)

        if keep_alive_milliseconds > 0:
            self._ping_job = PeriodicCallback(self.keep_alive, keep_alive_milliseconds, io_loop=self._loop)
        else:
            self._ping_job = None

    @property
    def io_loop(self):
        return self._loop

    @property
    def websocket_origins(self):
        return self._websocket_origins

    @property
    def secret_key(self):
        return self._secret_key

    @property
    def sign_sessions(self):
        return self._sign_sessions

    @property
    def generate_session_ids(self):
        return self._generate_session_ids

    def root_url_for_request(self, request):
        return request.protocol + "://" + request.host + self._prefix + "/"

    def websocket_url_for_request(self, request, websocket_path):
        # websocket_path comes from the handler, and already has any
        # prefix included, no need to add here
        protocol = "ws"
        if request.protocol == "https":
            protocol = "wss"
        return protocol + "://" + request.host + websocket_path

    def resources(self, request):
        root_url = self.root_url_for_request(request)
        if root_url not in self._resources:
            self._resources[root_url] =  Resources(mode="server",
                                                   root_url=root_url,
                                                   path_versioner=StaticHandler.append_version)
        return self._resources[root_url]

    def start(self, start_loop=True):
        ''' Start the Bokeh Server application main loop.

        Args:
            start_loop (boolean): False to not actually start event loop, used in tests

        Returns:
            None

        Notes:
            Keyboard interrupts or sigterm will cause the server to shut down.

        '''
        self._stats_job.start()
        self._cleanup_job.start()
        if self._ping_job is not None:
            self._ping_job.start()

        for context in self._applications.values():
            context.run_load_hook()

        if start_loop:
            try:
                self._loop.start()
            except KeyboardInterrupt:
                print("\nInterrupted, shutting down")

    def stop(self):
        ''' Stop the Bokeh Server application.

        Returns:
            None

        '''
        # TODO we should probably close all connections and shut
        # down all sessions either here or in unlisten() ... but
        # it isn't that important since in real life it's rare to
        # do a clean shutdown (vs. a kill-by-signal) anyhow.

        for context in self._applications.values():
            context.run_unload_hook()

        self._stats_job.stop()
        self._cleanup_job.stop()
        if self._ping_job is not None:
            self._ping_job.stop()

        self._loop.stop()

    @property
    def executor(self):
        return self._executor

    def new_connection(self, protocol, socket, application_context, session):
        connection = ServerConnection(protocol, socket, application_context, session)
        self._clients.add(connection)
        return connection

    def client_lost(self, connection):
        self._clients.discard(connection)
        connection.detach_session()

    def get_session(self, app_path, session_id):
        if app_path not in self._applications:
            raise ValueError("Application %s does not exist on this server" % app_path)
        return self._applications[app_path].get_session(session_id)

    def get_sessions(self, app_path):
        if app_path not in self._applications:
            raise ValueError("Application %s does not exist on this server" % app_path)
        return list(self._applications[app_path].sessions)

    @gen.coroutine
    def cleanup_sessions(self):
        for app in self._applications.values():
            yield app.cleanup_sessions(self._unused_session_linger_milliseconds)
        raise gen.Return(None)

    def log_stats(self):
        if log.getEffectiveLevel() > logging.DEBUG:
            # avoid the work below if we aren't going to log anything
            return
        log.debug("[pid %d] %d clients connected", os.getpid(), len(self._clients))
        for app_path, app in self._applications.items():
            sessions = list(app.sessions)
            unused_count = 0
            for s in sessions:
                if s.connection_count == 0:
                    unused_count += 1
            log.debug("[pid %d]   %s has %d sessions with %d unused",
                      os.getpid(), app_path, len(sessions), unused_count)

    def keep_alive(self):
        for c in self._clients:
            c.send_ping()

    @gen.coroutine
    def run_in_background(self, _func, *args, **kwargs):
        """
        Run a synchronous function in the background without disrupting
        the main thread. Useful for long-running jobs.
        """
        res = yield self._executor.submit(_func, *args, **kwargs)
        raise gen.Return(res)

    @gen.coroutine
    def _start_async(self):
        try:
            atexit.register(self._atexit)
            signal.signal(signal.SIGTERM, self._sigterm)
        except Exception:
            self.exit(1)

    _atexit_ran = False
    def _atexit(self):
        if self._atexit_ran:
            return
        self._atexit_ran = True

        self._stats_job.stop()
        IOLoop.clear_current()
        loop = IOLoop()
        loop.make_current()
        loop.run_sync(self._cleanup)

    def _sigterm(self, signum, frame):
        print("Received SIGTERM, shutting down")
        self.stop()
        self._atexit()

    @gen.coroutine
    def _cleanup(self):
        log.debug("Shutdown: cleaning up")
        self._executor.shutdown(wait=False)
        self._clients.clear()
