#-----------------------------------------------------------------------------
# Copyright (c) Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Boilerplate
#-----------------------------------------------------------------------------
from __future__ import annotations

# Standard library imports
import asyncio
import sys
import threading

#-----------------------------------------------------------------------------
# Imports
#-----------------------------------------------------------------------------


# Module under test
import bokeh.io.browser as bib # isort:skip

#-----------------------------------------------------------------------------
# General API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Dev API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Private API
#-----------------------------------------------------------------------------

def test_playwright_thread_owns_one_event_loop() -> None:
    playwright_thread = bib._PlaywrightThread()

    async def worker_identity() -> tuple[int, int, bool]:
        loop = asyncio.get_running_loop()
        is_supported = (sys.platform != "win32"
            or isinstance(loop, getattr(asyncio, "ProactorEventLoop")))
        return (threading.get_ident(), id(loop), is_supported)

    try:
        first = playwright_thread.run(worker_identity)
        second = playwright_thread.run(worker_identity)
    finally:
        playwright_thread.shutdown()

    assert first[0] != threading.get_ident()
    assert first == second
    assert first[2]

#-----------------------------------------------------------------------------
# Code
#-----------------------------------------------------------------------------
