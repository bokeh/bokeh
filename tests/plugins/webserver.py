# -*- encoding: utf-8 -*-

# Copyright 2008-2009 WebDriver committers
# Copyright 2008-2009 Google Inc.
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
# http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

"""A simple web server for testing purposes."""

import logging
import os
import socket
import threading
import urllib
try:
    from http.server import BaseHTTPRequestHandler, HTTPServer
except ImportError:
    from BaseHTTPServer import BaseHTTPRequestHandler, HTTPServer

LOGGER = logging.getLogger(__name__)
HTML_ROOT = os.path.dirname(__file__)

DEFAULT_PORT = 8000


class HtmlOnlyHandler(BaseHTTPRequestHandler):
    """Http handler."""

    def do_GET(self):
        """GET method handler."""
        try:
            path = self.path[1:].split('?')[0]
            html = open(os.path.join(HTML_ROOT, path), 'r', encoding='latin-1')
            self.send_response(200)
            self.send_header('Content-type', 'text/html')
            self.end_headers()
            self.wfile.write(html.read().encode('utf-8'))
            html.close()
        except IOError:
            self.send_error(404, 'File Not Found: %s' % path)

    def log_message(self, format, *args):
        """Override default to avoid trashing stderr"""
        pass


class SimpleWebServer(object):
    """A very basic web server."""

    def __init__(self, port=DEFAULT_PORT):
        self.stop_serving = False
        port = port
        while True:
            try:
                self.server = HTTPServer(
                    ('127.0.0.1', port), HtmlOnlyHandler)
                self.port = port
                break
            except socket.error:
                LOGGER.debug('port {0} is in use, trying {1}'.format(
                    port, port + 1))
                port += 1

        self.thread = threading.Thread(target=self._run_web_server)

    def _run_web_server(self):
        """Runs the server loop."""
        LOGGER.debug("web server started")
        while not self.stop_serving:
            self.server.handle_request()
        self.server.server_close()

    def start(self):
        """Starts the server."""
        self.thread.start()

    def stop(self):
        """Stops the server."""
        self.stop_serving = True
        try:
            # This is to force stop the server loop
            urllib.URLopener().open("http://localhost:{0}".format(self.port))
        except Exception:
            pass
        LOGGER.info("Shutting down the webserver")
        self.thread.join()


# -----------------------------------------


import pytest


@pytest.fixture(scope='session')
def file_server(request):
    server = SimpleWebServer()
    server.start()
    request.addfinalizer(server.stop)
    return server
