#-----------------------------------------------------------------------------
# Copyright (c) Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Boilerplate
#-----------------------------------------------------------------------------
from __future__ import annotations # isort:skip

import pytest ; pytest

#-----------------------------------------------------------------------------
# Imports
#-----------------------------------------------------------------------------

# Standard library imports
import asyncio
import logging

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
        asyncio.set_event_loop(asyncio.new_event_loop())
        server = Server(Application(), port=1234)
        assert server.port == 1234
        server.unlisten()
        server.stop()

    def test_address(self) -> None:
        asyncio.set_event_loop(asyncio.new_event_loop())
        server = Server(Application(), address='0.0.0.0')
        assert server.address == '0.0.0.0'
        server.unlisten()
        server.stop()

#-----------------------------------------------------------------------------
# Dev API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Private API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Code
#-----------------------------------------------------------------------------
