#-----------------------------------------------------------------------------
# Copyright (c) Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------
''' Utilities for running server response generation away from the IOLoop. '''

#-----------------------------------------------------------------------------
# Boilerplate
#-----------------------------------------------------------------------------
from __future__ import annotations

# Standard library imports
import asyncio
from collections.abc import Awaitable, Callable
from concurrent.futures import ThreadPoolExecutor
from functools import partial
from typing import Any

#-----------------------------------------------------------------------------
# Imports
#-----------------------------------------------------------------------------


#-----------------------------------------------------------------------------
# Globals and constants
#-----------------------------------------------------------------------------

__all__ = ()

_DEFAULT_WORKERS = 4

#-----------------------------------------------------------------------------
# Private API
#-----------------------------------------------------------------------------

class _ServerExecutor:

    def __init__(self, max_workers: int = _DEFAULT_WORKERS) -> None:
        self._executor = ThreadPoolExecutor(max_workers=max_workers, thread_name_prefix="bokeh-response")

    async def run[T](self, func: Callable[..., T], *args: Any, cancel_safe: bool = False) -> T:
        loop = asyncio.get_running_loop()
        future = loop.run_in_executor(self._executor, partial(func, *args))

        return await _await_cancellation_safe(future) if cancel_safe else await future

    def shutdown(self, wait: bool = True) -> None:
        self._executor.shutdown(wait=wait, cancel_futures=not wait)

async def _await_cancellation_safe[T](awaitable: Awaitable[T]) -> T:
    future = asyncio.ensure_future(awaitable)
    cancellation: asyncio.CancelledError | None = None

    while not future.done():
        try:
            await asyncio.shield(future)
        except asyncio.CancelledError as error:
            cancellation = error
            if future.cancelled():
                raise

    if cancellation is not None:
        # Retrieve any exception before preserving cancellation of the
        # coroutine that owns protected state.
        try:
            future.result()
        except BaseException:
            pass
        raise cancellation

    return future.result()

#-----------------------------------------------------------------------------
# Code
#-----------------------------------------------------------------------------
