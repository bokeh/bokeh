from __future__ import absolute_import, print_function

import unittest

import logging
from bokeh.server.server import Server
from bokeh.application import Application
from tornado.ioloop import IOLoop

logging.basicConfig(level=logging.DEBUG)

# test_client_server.py is the test for the main functionality
# of the server, here we're testing some properties in isolation
class TestServer(unittest.TestCase):
    def test_port(self):
        loop = IOLoop()
        loop.make_current()
        server = Server(Application(), port=1234)
        assert server.port == 1234

    def test_address(self):
        loop = IOLoop()
        loop.make_current()
        server = Server(Application(), address='0.0.0.0')
        assert server.address == '0.0.0.0'
