''' Provides a Server which instantiates Application instances as clients connect

'''
from __future__ import absolute_import, print_function

import logging
log = logging.getLogger(__name__)

from tornado.httpserver import HTTPServer

from .tornado import BokehTornado

class Server(object):
    ''' A Server which creates a new Session for each connection, using an Application to initialize each Session.

    Args:
        application (bokeh.application.Application) : an Application instance
            The Application is a factory for Document, with a new Document initialized for each Session.

    '''

    def __init__(self, application):
        self._application = application
        self._tornado = BokehTornado(self._application)
        self._http = HTTPServer(self._tornado)

    def start(self):
        ''' Start the Bokeh Server and listen for connections

        Returns:
            None

        Notes:
            Keyboard interrupts or sigterm will cause the server to shut down.

        '''
        self._http.bind(8888)
        self._http.start(1)
        self._tornado.start()

    def stop(self):
        ''' Stop the Bokeh Server.

        Returns:
            None

        '''
        self._tornado.stop()

