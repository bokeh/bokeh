''' Provides the Bokeh Server Tornado application.

'''
from __future__ import absolute_import, print_function

import logging
log = logging.getLogger(__name__)

import atexit
# NOTE: needs PyPI backport on Python 2 (https://pypi.python.org/pypi/futures)
from concurrent.futures import ProcessPoolExecutor
import os
import signal

from tornado import gen
from tornado.ioloop import IOLoop, PeriodicCallback
from tornado.web import Application as TornadoApplication
from tornado.web import HTTPError

from bokeh.resources import Resources
from bokeh.settings import settings

from .urls import per_app_patterns, toplevel_patterns
from .connection import ServerConnection
from .application_context import ApplicationContext
from .views.static_handler import StaticHandler

# factored out to be easier to test
def check_whitelist(request_host, whitelist):
    ''' Check a given request host against a whitelist.

    '''
    if request_host not in whitelist:

        # see if the request came with no port, assume port 80 in that case
        if len(request_host.split(':')) == 1:
            host = request_host + ":80"
            return host in whitelist
        else:
            return False

    return True


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
        develop (boolean) : True for develop mode

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
                 unused_session_lifetime_milliseconds=60*30*1000,
                 # how often to log stats
                 stats_log_frequency_milliseconds=15000,
                 develop=False):

        self._prefix = prefix

        if io_loop is None:
            io_loop = IOLoop.current()
        self._loop = io_loop

        if keep_alive_milliseconds < 0:
            # 0 means "disable"
            raise ValueError("keep_alive_milliseconds must be >= 0")

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
            self._applications[k] = ApplicationContext(v, self._develop, self._loop)

        extra_patterns = extra_patterns or []
        all_patterns = []
        for key in applications:
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

        for p in extra_patterns + toplevel_patterns:
            prefixed_pat = (self._prefix+p[0],) + p[1:]
            all_patterns.append(prefixed_pat)

        for pat in all_patterns:
            _whitelist(pat[1])

        log.debug("Patterns are: %r", all_patterns)

        super(BokehTornado, self).__init__(all_patterns)

        self._clients = set()
        self._executor = ProcessPoolExecutor(max_workers=4)
        self._loop.add_callback(self._start_async)
        self._stats_job = PeriodicCallback(self.log_stats,
                                           stats_log_frequency_milliseconds,
                                           io_loop=self._loop)
        self._unused_session_linger_seconds = unused_session_lifetime_milliseconds
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
            yield app.cleanup_sessions(self._unused_session_linger_seconds)
        raise gen.Return(None)

    def log_stats(self):
        log.debug("[pid %d] %d clients connected", os.getpid(), len(self._clients))

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
