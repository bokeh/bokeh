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
from threading import Event, get_ident

# Module under test
from bokeh.server.executor import _ServerExecutor # isort:skip

#-----------------------------------------------------------------------------
# General API
#-----------------------------------------------------------------------------

async def test_run_uses_worker_thread() -> None:
    executor = _ServerExecutor(max_workers=1)
    try:
        assert await executor.run(get_ident) != get_ident()
    finally:
        executor.shutdown()

async def test_cancel_safe_run_finishes_before_propagating_cancellation() -> None:
    executor = _ServerExecutor(max_workers=1)
    started = Event()
    release = Event()

    def work() -> None:
        started.set()
        assert release.wait(timeout=2)

    task = asyncio.create_task(executor.run(work, cancel_safe=True))
    try:
        async with asyncio.timeout(1):
            while not started.is_set():
                await asyncio.sleep(0)

        task.cancel()
        await asyncio.sleep(0)
        assert not task.done()
    finally:
        release.set()

    with pytest.raises(asyncio.CancelledError):
        await task

    executor.shutdown()

async def test_worker_concurrency_is_bounded() -> None:
    executor = _ServerExecutor(max_workers=1)
    first_started = Event()
    first_release = Event()
    second_started = Event()

    def first_work() -> None:
        first_started.set()
        assert first_release.wait(timeout=2)

    first = asyncio.create_task(executor.run(first_work))
    second = asyncio.create_task(executor.run(second_started.set))
    try:
        async with asyncio.timeout(1):
            while not first_started.is_set():
                await asyncio.sleep(0)

        await asyncio.sleep(0)
        assert not second_started.is_set()
    finally:
        first_release.set()

    await asyncio.gather(first, second)
    assert second_started.is_set()

    executor.shutdown()

#-----------------------------------------------------------------------------
# Code
#-----------------------------------------------------------------------------
