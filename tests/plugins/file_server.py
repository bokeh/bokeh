# Licensed to the Software Freedom Conservancy (SFC) under one
# or more contributor license agreements.  See the NOTICE file
# distributed with this work for additional information
# regarding copyright ownership.  The SFC licenses this file
# to you under the Apache License, Version 2.0 (the
# "License"); you may not use this file except in compliance
# with the License.  You may obtain a copy of the License at
#
#   http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing,
# software distributed under the License is distributed on an
# "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
# KIND, either express or implied.  See the License for the
# specific language governing permissions and limitations
# under the License.

# Taken from
# https://github.com/SeleniumHQ/selenium/blob/52e9d6407248bce5de2b6a73103a50bb0e670c1f/py/test/selenium/webdriver/common/webserver.py
# with small modifications

"""A simple web server for testing purpose.
It serves the testing html pages that are needed by the webdriver unit tests."""

import logging
import os
import socket
import threading
from io import open
try:
    from urllib import request as urllib_request
except ImportError:
    import urllib as urllib_request
try:
    from http.server import BaseHTTPRequestHandler, HTTPServer
except ImportError:
    from BaseHTTPServer import BaseHTTPRequestHandler, HTTPServer

LOGGER = logging.getLogger(__name__)
WEBDRIVER = os.environ.get('WEBDRIVER')
HTML_ROOT = os.path.dirname(__file__)
if not os.path.isdir(HTML_ROOT):
    message = (
        "Can't find 'common_web' directory, try setting WEBDRIVER environment variable WEBDRIVER:" + WEBDRIVER + "  HTML_ROOT:" + HTML_ROOT
    )
    LOGGER.error(message)
    assert 0, message

DEFAULT_HOST = "127.0.0.1"
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
    def __init__(self, host=DEFAULT_HOST, port=DEFAULT_PORT):
        self.stop_serving = False
        host = host
        port = port
        while True:
            try:
                self.server = HTTPServer(
                    (host, port), HtmlOnlyHandler)
                self.host = host
                self.port = port
                break
            except socket.error:
                LOGGER.debug("port %d is in use, trying to next one" % port)
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
            urllib_request.URLopener().open("http://%s:%d" % (self.host, self.port))
        except IOError:
            pass
        LOGGER.info("Shutting down the webserver")
        self.thread.join()

    def where_is(self, path):
        return "http://%s:%d/%s" % (self.host, self.port, path)


# ---------------------------------------------


import pytest


@pytest.fixture(scope='session')
def file_server(request):
    server = SimpleWebServer()
    server.start()
    request.addfinalizer(server.stop)
    return server
