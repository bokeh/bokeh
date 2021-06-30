#-----------------------------------------------------------------------------
# Copyright (c) 2012 - 2021, Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------
''' Define a simple web server for testing purpose.

Used for serves the testing html pages that are needed by the webdriver unit
tests.

'''

#-----------------------------------------------------------------------------
# Boilerplate
#-----------------------------------------------------------------------------
from __future__ import annotations

import logging # isort:skip
log = logging.getLogger(__name__)

#-----------------------------------------------------------------------------
# Imports
#-----------------------------------------------------------------------------

# Standard library imports
import os
import threading
from http.server import BaseHTTPRequestHandler, HTTPServer
from typing import Any
from urllib.request import URLopener

# External imports
import pytest

#-----------------------------------------------------------------------------
# Globals and constants
#-----------------------------------------------------------------------------

DEFAULT_HOST = "127.0.0.1"

DEFAULT_PORT = 8000

HTML_ROOT = os.path.dirname(__file__)

WEBDRIVER = os.environ.get('WEBDRIVER', "<undefined>")

__all__ = (
    'file_server',
    'HtmlOnlyHandler',
    'SimpleWebServer',
)

#-----------------------------------------------------------------------------
# General API
#-----------------------------------------------------------------------------

class HtmlOnlyHandler(BaseHTTPRequestHandler):
    """Http handler."""
    def do_GET(self) -> None:
        """GET method handler."""
        path = self.path[1:].split("?")[0]
        try:
            with open(os.path.join(HTML_ROOT, path), mode="rb") as f:  # lgtm [py/path-injection]
                self.send_response(200)
                self.send_header("Content-type", "text/html")
                self.end_headers()
                self.wfile.write(f.read())
        except OSError:
            self.send_error(404, f"File Not Found: {path}")

    def log_message(self, format: str, *args: Any) -> None:
        """Override default to avoid trashing stderr"""
        pass


class SimpleWebServer:
    """A very basic web server."""
    def __init__(self, host: str = DEFAULT_HOST, port: int = DEFAULT_PORT) -> None:
        self.stop_serving = False
        while True:
            try:
                self.server = HTTPServer((host, port), HtmlOnlyHandler)
                self.host = host
                self.port = port
                break
            except OSError:
                log.debug(f"port {port} is in use, trying to next one")
                port += 1

        self.thread = threading.Thread(target=self._run_web_server)

    def _run_web_server(self) -> None:
        """Runs the server loop."""
        log.debug("web server started")
        while not self.stop_serving:
            self.server.handle_request()
        self.server.server_close()

    def start(self) -> None:
        """Starts the server."""
        self.thread.start()

    def stop(self) -> None:
        """Stops the server."""
        self.stop_serving = True
        try:
            # This is to force stop the server loop
            URLopener().open(f"http://{self.host}:{self.port}")
        except OSError:
            pass
        log.info("Shutting down the webserver")
        self.thread.join()

    def where_is(self, path: str) -> str:
        return f"http://{self.host}:{self.port}/{path}"

@pytest.fixture(scope='session')
def file_server(request: pytest.FixtureRequest) -> SimpleWebServer:
    server = SimpleWebServer()
    server.start()
    request.addfinalizer(server.stop)
    return server

#-----------------------------------------------------------------------------
# Dev API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Private API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Code
#-----------------------------------------------------------------------------

_html_root_error_message = "Can't find 'common_web' directory, try setting WEBDRIVER environment variable WEBDRIVER:" + WEBDRIVER + "  HTML_ROOT:" + HTML_ROOT

if not os.path.isdir(HTML_ROOT):
    log.error(_html_root_error_message)
    assert 0, _html_root_error_message

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
