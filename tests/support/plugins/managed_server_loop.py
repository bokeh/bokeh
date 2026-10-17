#-----------------------------------------------------------------------------
# Copyright (c) Anaconda, Inc., and Bokeh Contributors.
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
import asyncio
from collections.abc import Mapping
from contextlib import contextmanager
from typing import (
    TYPE_CHECKING,
    Any,
    AsyncIterator,
    ContextManager,
    Iterator,
    Protocol,
)

# External imports
import pytest
from tornado.ioloop import IOLoop

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
    'server_loop',
)

#-----------------------------------------------------------------------------
# General API
#-----------------------------------------------------------------------------

class MSL(Protocol):
    def __call__(self, application: Application | Mapping[str, Application], port: int | None = None,
            **server_kwargs: Any) -> ContextManager[Server]: ...

@pytest.fixture
def server_loop() -> Iterator[IOLoop]:
    loop = IOLoop(make_current=False)
    asyncio.set_event_loop(loop.asyncio_loop)
    try:
        yield loop
    finally:
        loop.close(all_fds=True)
        asyncio.set_event_loop(None)

@pytest.fixture
async def ManagedServerLoop() -> AsyncIterator[MSL]:
    stopped: list[Server] = []

    @contextmanager
    def msl(application: Application | Mapping[str, Application], port: int | None = None,
            **server_kwargs: Any) -> Iterator[Server]:
        if port is None:
            port = 0
        server = Server(application, port=port, **server_kwargs)
        server.start()
        try:
            yield server
        finally:
            server.unlisten()
            server.stop()
            stopped.append(server)

    try:
        yield msl
    finally:
        # stop() schedules cleanup when called on the test's running loop.
        # Finish it before pytest closes that loop and cancels its worker tasks.
        for server in stopped:
            await server.wait_until_stopped()

#-----------------------------------------------------------------------------
# Dev API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Private API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Code
#-----------------------------------------------------------------------------
