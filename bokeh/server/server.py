''' Provides a Server which instantiates Application instances as clients connect

'''
from __future__ import absolute_import, print_function

import logging
log = logging.getLogger(__name__)

from tornado.httpserver import HTTPServer

from .tornado import BokehTornado

from bokeh.application import Application

class Server(object):
    ''' A Server which creates a new Session for each connection, using an Application to initialize each Session.

    Args:
        applications (dict of str: bokeh.application.Application) or bokeh.application.Application: mapping from URL paths to Application instances, or a single Application to put at the root URL
            The Application is a factory for Document, with a new Document initialized for each Session.
            Each application should be identified by a path meant to go in a URL, like "/" or "/foo"
    '''

    def __init__(self, applications):
        if isinstance(applications, Application):
            self._applications = { '/' : applications }
        else:
            self._applications = applications
        self._tornado = BokehTornado(self._applications)
        self._http = HTTPServer(self._tornado)
        # these queue a callback on the ioloop rather than
        # doing the operation immediately (I think - havocp)
        self._http.bind(8888)
        self._http.start(1)

    def start(self):
        ''' Start the Bokeh Server's IO loop.

        Returns:
            None

        Notes:
            Keyboard interrupts or sigterm will cause the server to shut down.

        '''
        self._tornado.start()

    def stop(self):
        ''' Stop the Bokeh Server's IO loop.

        Returns:
            None

        '''
        self._tornado.stop()

    def unlisten(self):
        '''Stop listening on ports (Server will no longer be usable after calling this)

        Returns:
            None
        '''
        self._http.stop()

    def get_session(self, sessionid):
        '''Gets a session by name (session must already exist)'''

        return self._tornado.get_session(sessionid)

