''' Provides the Bokeh Server Tornado application.

'''
from __future__ import absolute_import, print_function

import logging
log = logging.getLogger(__name__)

import atexit
# NOTE: needs PyPI backport on Python 2 (https://pypi.python.org/pypi/futures)
from concurrent.futures import ThreadPoolExecutor
import os
import signal

from tornado import gen
from tornado.ioloop import IOLoop, PeriodicCallback
from tornado.web import Application

from .settings import settings
from .urls import patterns



class BokehServer(Application):
    ''' A Tornado Application for the Bokeh Server.

    Args:
        extra_patterns (seq[tuple]) : tuples of (str, http or websocket handler)
            Use this argmument to add additional endpoints to custom deployments
            of the Bokeh Server.

    '''

    def __init__(self, extra_patterns=None):
        self._clients = set()
        # NOTE: raise the number of workers if you need more concurrency
        # (e.g. if your background tasks are doing a lot of I/O).
        # If a lot of pure Python code is run by the background tasks and
        # you want to take advantage of multiple cores, consider using
        # ProcessPoolExecutor instead.
        self._executor = ThreadPoolExecutor(max_workers=4)
        extra_patterns = extra_patterns or []
        super(BokehServer, self).__init__(patterns+extra_patterns, **settings)

    def start(self, argv=None):
        ''' Start the Bokeh Server application

        Args:
            argv (seq[str], optionals) : values to pass as argv (default: None)

        Returns:
            None

        Notes:
            Keyboard interrupts or sigterm will cause the server to shut down.

        '''
        loop = IOLoop.current()
        loop.add_callback(self._start_async, argv)
        self._stats_job = PeriodicCallback(self.log_stats, 5.0 * 1000)
        self._stats_job.start()
        try:
            loop.start()
        except KeyboardInterrupt:
            print("\nInterrupted, shutting down")

    def stop(self):
        ''' Stop the Bokeh Server application.

        Returns:
            None

        '''
        if not self.io_loop:
            return
        self.io_loop.add_callback(self.io_loop.stop)

    def client_connected(self, session):
        self._clients.add(session)

    def client_lost(self, session):
        self._clients.discard(session)

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
    def _start_async(self, argv=None):
        try:
            yield self._start_helper()
        except Exception:
            self.exit(1)

    @gen.coroutine
    def _start_helper(self):
        self.io_loop = IOLoop.current()
        atexit.register(self._atexit)
        signal.signal(signal.SIGTERM, self._sigterm)

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
        log.warn("Shutdown: cleaning up")
        self._executor.shutdown(wait=False)
        self._clients.clear()

