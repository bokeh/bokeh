#-----------------------------------------------------------------------------
# Copyright (c) 2012 - 2021, Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------
''' Define a Pytest plugin to provide a Bokeh server

'''

#-----------------------------------------------------------------------------
# Boilerplate
#-----------------------------------------------------------------------------
import logging # isort:skip
log = logging.getLogger(__name__)

#-----------------------------------------------------------------------------
# Imports
#-----------------------------------------------------------------------------

# Standard library imports
from contextlib import contextmanager

# External imports
import pytest

# Bokeh imports
from bokeh.server.server import Server

#-----------------------------------------------------------------------------
# Globals and constants
#-----------------------------------------------------------------------------

pytest_plugins = ()

__all__ = (
    'ManagedServerLoop',
)

#-----------------------------------------------------------------------------
# General API
#-----------------------------------------------------------------------------

@pytest.fixture
def ManagedServerLoop(unused_tcp_port):
    @contextmanager
    def msl(application, port=None, **server_kwargs):
        if port is None:
            port = unused_tcp_port
        server = Server(application, port=port, **server_kwargs)
        try:
            server.start()
            yield server
        finally:
            server.unlisten()
            server.stop()
    return msl


#-----------------------------------------------------------------------------
# Dev API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Private API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Code
#-----------------------------------------------------------------------------
