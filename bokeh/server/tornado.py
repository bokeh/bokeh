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

from bokeh.resources import Resources

from .settings import settings
from .urls import per_app_patterns, toplevel_patterns
from .connection import ServerConnection
from .application_context import ApplicationContext

class BokehTornado(TornadoApplication):
    ''' A Tornado Application used to implement the Bokeh Server.

        The Server class is the main public interface, this class has
        Tornado implementation details.

    Args:
        applications (dict of str : bokeh.application.Application) : map from paths to Application instances
            The application is used to create documents for each session.
        extra_patterns (seq[tuple]) : tuples of (str, http or websocket handler)
            Use this argmument to add additional endpoints to custom deployments
            of the Bokeh Server.

    '''

    def __init__(self, applications, io_loop=None, extra_patterns=None):
        if io_loop is None:
            io_loop = IOLoop.current()
        self._loop = io_loop

        self._resources = {}

        # Wrap applications in ApplicationContext
        self._applications = dict()
        for k,v in applications.items():
            self._applications[k] = ApplicationContext(v, self._loop)

        extra_patterns = extra_patterns or []
        relative_patterns = []
        for key in applications:
            app_patterns = []
            for p in per_app_patterns:
                if key == "/":
                    route = p[0]
                else:
                    route = key + p[0]
                app_patterns.append((route, p[1], { "application_context" : self._applications[key] }))

            websocket_path = None
            for r in app_patterns:
                if r[0].endswith("/ws"):
                    websocket_path = r[0]
            if not websocket_path:
                raise RuntimeError("Couldn't find websocket path")
            for r in app_patterns:
                r[2]["bokeh_websocket_path"] = websocket_path

            relative_patterns.extend(app_patterns)

        all_patterns = extra_patterns + relative_patterns + toplevel_patterns
        log.debug("Patterns are: %r", all_patterns)
        super(BokehTornado, self).__init__(all_patterns, **settings)

        self._clients = set()
        self._executor = ProcessPoolExecutor(max_workers=4)
        self._loop.add_callback(self._start_async)
        self._stats_job = PeriodicCallback(self.log_stats, 15.0 * 1000, io_loop=self._loop)
        self._stats_job.start()
        self._unused_session_linger_seconds = 60*30
        self._cleanup_job = PeriodicCallback(self.cleanup_sessions, 17.0 * 1000, io_loop=self._loop)
        self._cleanup_job.start()

    @property
    def io_loop(self):
        return self._loop

    def root_url_for_request(self, request):
        # If we add a "whole server prefix," we'd put that on here too
        return request.protocol + "://" + request.host + "/"

    def websocket_url_for_request(self, request, websocket_path):
        protocol = "ws"
        if request.protocol == "https":
            protocol = "wss"
        return protocol + "://" + request.host + websocket_path

    def resources(self, request):
        root_url = self.root_url_for_request(request)
        if root_url not in self._resources:
            self._resources[root_url] = Resources(mode="server", root_url=root_url)
        return self._resources[root_url]

    def start(self):
        ''' Start the Bokeh Server application main loop.

        Args:

        Returns:
            None

        Notes:
            Keyboard interrupts or sigterm will cause the server to shut down.

        '''
        try:
            self._loop.start()
        except KeyboardInterrupt:
            print("\nInterrupted, shutting down")

    def stop(self):
        ''' Stop the Bokeh Server application.

        Returns:
            None

        '''
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

    def cleanup_sessions(self):
        for app in self._applications.values():
            app.cleanup_sessions(self._unused_session_linger_seconds)

    def log_stats(self):
        log.debug("[pid %d] %d clients connected", os.getpid(), len(self._clients))

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
