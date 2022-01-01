#-----------------------------------------------------------------------------
# Copyright (c) 2012 - 2022, Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------
''' Define a Pytest plugin to provide a Bokeh server

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
from contextlib import contextmanager
from typing import (
    TYPE_CHECKING,
    Any,
    ContextManager,
    Iterator,
)

# External imports
import pytest
from typing_extensions import Protocol

# Bokeh imports
from bokeh.server.server import Server

if TYPE_CHECKING:
    from bokeh.application import Application

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

class MSL(Protocol):
    def __call__(self, application: Application, port: int | None = None, **server_kwargs: Any) -> ContextManager[Server]: ...

@pytest.fixture
def ManagedServerLoop(unused_tcp_port: int) -> MSL:
    @contextmanager
    def msl(application: Application, port: int | None = None, **server_kwargs: Any) -> Iterator[Server]:
        if port is None:
            port = unused_tcp_port
        server = Server(application, port=port, **server_kwargs)
        server.start()
        yield server
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
