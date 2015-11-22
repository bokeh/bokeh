''' Provides a Server which instantiates Application instances as clients connect

'''
from __future__ import absolute_import, print_function

import logging
log = logging.getLogger(__name__)

import sys

from tornado.httpserver import HTTPServer

from .tornado import BokehTornado

from bokeh.application import Application

from bokeh.resources import DEFAULT_SERVER_PORT

class Server(object):
    ''' A Server which creates a new Session for each connection, using an Application to initialize each Session.

    Args:
        applications (dict of str: bokeh.application.Application) or bokeh.application.Application:
            mapping from URL paths to Application instances, or a single Application to put at the root URL
            The Application is a factory for Document, with a new Document initialized for each Session.
            Each application should be identified by a path meant to go in a URL, like "/" or "/foo"
    '''

    def __init__(self, applications, **kwargs):
        if isinstance(applications, Application):
            self._applications = { '/' : applications }
        else:
            self._applications = applications
        io_loop = None
        if 'io_loop' in kwargs:
            io_loop = kwargs['io_loop']
        self._tornado = BokehTornado(self._applications, io_loop=io_loop)
        self._http = HTTPServer(self._tornado)
        self._port = DEFAULT_SERVER_PORT
        if 'port' in kwargs:
            self._port = kwargs['port']
        self._address = None
        if 'address' in kwargs:
            self._address = kwargs['address']
        # these queue a callback on the ioloop rather than
        # doing the operation immediately (I think - havocp)
        try:
            self._http.bind(self._port, address=self._address)
            self._http.start(1)
        except OSError as e:
            import errno
            if e.errno == errno.EADDRINUSE:
                log.critical("Cannot start Bokeh server, port %s is already in use", self._port)
            elif e.errno == errno.EADDRNOTAVAIL:
                log.critical("Cannot start Bokeh server, address '%s' not available", self._address)
            else:
                codename = errno.errorcode[e.errno]
                log.critical("Cannot start Bokeh server, %s %r", codename, e)
            sys.exit(1)

    # TODO this is broken, it's only used by test_client_server.py so fix that then remove this
    @property
    def ws_url(self):
        return "ws://localhost:" + str(self._port) + "/ws"

    @property
    def port(self):
        return self._port

    @property
    def address(self):
        return self._address

    @property
    def io_loop(self):
        return self._tornado.io_loop

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

    def get_session(self, app_path, session_id):
        '''Gets a session by name (session must already exist)'''

        return self._tornado.get_session(app_path, session_id)

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
        from bokeh.browserlib import view
        url = "http://localhost:%d%s" % (self.port, app_path)
        view(url, browser=browser, new=new)

