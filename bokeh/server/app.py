''' Provides the Bokeh Server Tornado application.

'''
from __future__ import absolute_import, print_function

import atexit
import signal

from tornado import gen
from tornado.ioloop import IOLoop
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

        IOLoop.clear_current()
        loop = IOLoop()
        loop.make_current()
        loop.run_sync(self._cleanup)

    def _sigterm(self, signum, frame):
        print("Received SIGTERM, shutting down")
        self.io_loop.stop()
        self._atexit()

    @gen.coroutine
    def _cleanup(self):
        print("...done")

