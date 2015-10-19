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
from .core.server_session import ServerSession
from .core.server_connection import ServerConnection
from .exceptions import ProtocolError

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

        self._resources = Resources(mode="server", root_url="/")

        extra_patterns = extra_patterns or []
        relative_patterns = []
        for key in applications:
            for p in per_app_patterns:
                if key == "/":
                    route = p[0]
                else:
                    route = key + p[0]
                relative_patterns.append((route, p[1], { "bokeh_application" : applications[key] }))
        websocket_path = None
        for r in relative_patterns:
            if r[0].endswith("/ws"):
                websocket_path = r[0]
        if not websocket_path:
            raise RuntimeError("Couldn't find websocket path")
        for r in relative_patterns:
            r[2]["bokeh_websocket_path"] = websocket_path

        all_patterns = extra_patterns + relative_patterns + toplevel_patterns
        log.debug("Patterns are: %r", all_patterns)
        super(BokehTornado, self).__init__(all_patterns, **settings)

        self._applications = applications
        self._sessions = dict()
        self._clients = set()
        self._executor = ProcessPoolExecutor(max_workers=4)
        if io_loop is None:
            io_loop = IOLoop.current()
        self._loop = io_loop
        self._loop.add_callback(self._start_async)
        self._stats_job = PeriodicCallback(self.log_stats, 15.0 * 1000, io_loop=self._loop)
        self._stats_job.start()

    @property
    def resources(self):
        return self._resources

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

    def new_connection(self, protocol, socket, application):
        connection = ServerConnection(protocol, self, socket, application)
        self._clients.add(connection)
        return connection

    def client_lost(self, connection):
        self._clients.discard(connection)

        # clean up sessions when they have no connections anymore
        # TODO (havocp) this should be after a timeout, to allow
        # clients to reconnect if the connection is lost.
        while connection.subscribed_sessions:
            session = next(iter(connection.subscribed_sessions))
            connection.unsubscribe_session(session)
            if session.connection_count == 0:
                self.discard_session(session)

    def create_session_if_needed(self, application, sessionid):
        # this is because empty sessionids would be "falsey" and
        # potentially open up a way for clients to confuse us
        if len(sessionid) == 0:
            raise ProtocolError("Session ID must not be empty")

        if sessionid not in self._sessions:
            doc = application.create_document()
            session = ServerSession(sessionid, doc)
            self._sessions[sessionid] = session

    def get_session(self, sessionid):
        if sessionid in self._sessions:
            session = self._sessions[sessionid]
            return session
        else:
            raise ProtocolError("No such session " + sessionid)

    def discard_session(self, session):
        if session.connection_count > 0:
            raise RuntimeError("Should not be discarding a session with open connections")
        log.debug("Discarding session %r", session.id)
        del self._sessions[session.id]

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

