#-----------------------------------------------------------------------------
# Copyright (c) 2012 - 2020, Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Boilerplate
#-----------------------------------------------------------------------------
import pytest ; pytest

#-----------------------------------------------------------------------------
# Imports
#-----------------------------------------------------------------------------

# Standard library imports
import logging

# External imports
from tornado.ioloop import IOLoop

# Bokeh imports
from bokeh.application import Application

# Module under test
from bokeh.server.server import Server # isort:skip

#-----------------------------------------------------------------------------
# Setup
#-----------------------------------------------------------------------------

logging.basicConfig(level=logging.DEBUG)

#-----------------------------------------------------------------------------
# General API
#-----------------------------------------------------------------------------

# test_client_server.py is the test for the main functionality
# of the server, here we're testing some properties in isolation
class TestServer:
    def test_port(self) -> None:
        loop = IOLoop()
        loop.make_current()
        server = Server(Application(), port=1234)
        assert server.port == 1234
        server.stop()
        server.unlisten()

    def test_address(self) -> None:
        loop = IOLoop()
        loop.make_current()
        server = Server(Application(), address='0.0.0.0')
        assert server.address == '0.0.0.0'
        server.stop()
        server.unlisten()

#-----------------------------------------------------------------------------
# Dev API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Private API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Code
#-----------------------------------------------------------------------------
