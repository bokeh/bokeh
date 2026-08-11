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

# Bokeh imports
# Module under test
from bokeh.util.tornado import _wait_for_task

#-----------------------------------------------------------------------------
# Setup
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# General API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Dev API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Private API
#-----------------------------------------------------------------------------

async def test_wait_for_task_prefers_outer_cancellation() -> None:
    loop = asyncio.get_running_loop()
    inner: asyncio.Future[None] = loop.create_future()
    outer = asyncio.create_task(_wait_for_task(inner))
    await asyncio.sleep(0)

    def complete_and_cancel() -> None:
        inner.set_exception(RuntimeError("inner failure"))
        outer.cancel()

    loop.call_soon(complete_and_cancel)

    with pytest.raises(asyncio.CancelledError):
        await outer

#-----------------------------------------------------------------------------
# Code
#-----------------------------------------------------------------------------
