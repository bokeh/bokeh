#-----------------------------------------------------------------------------
# Copyright (c) Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------
''' Internal utilities for scheduling callbacks on asyncio event loops. '''

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
import inspect
import threading
from collections import defaultdict
from traceback import format_exception
from typing import (
    Any,
    Awaitable,
    Callable,
    Protocol,
)

# Bokeh imports
from ..core.types import ID

#-----------------------------------------------------------------------------
# Globals and constants
#-----------------------------------------------------------------------------

__all__ = ()

#-----------------------------------------------------------------------------
# Private API
#-----------------------------------------------------------------------------

type CallbackSync = Callable[[], None]
type CallbackAsync = Callable[[], Awaitable[None]]
type Callback = CallbackSync | CallbackAsync

type Remover = Callable[[], None]
type Removers = dict[ID, Remover]
type RemoversByCallable = dict[Callback, set[ID]]

class _HasAsyncioLoop(Protocol):
    asyncio_loop: asyncio.AbstractEventLoop

type Loop = asyncio.AbstractEventLoop | _HasAsyncioLoop

def _asyncio_loop(loop: Loop) -> asyncio.AbstractEventLoop:
    if isinstance(loop, asyncio.AbstractEventLoop):
        return loop
    return loop.asyncio_loop

def _log_task_exception(task: asyncio.Future[Any]) -> None:
    if task.cancelled():
        return
    if (exception := task.exception()) is not None:
        log.error("Error thrown from callback:")
        lines = format_exception(exception.__class__, exception, exception.__traceback__)
        log.error("".join(lines))

class _AsyncPeriodic:
    ''' Invoke a callback periodically without overlapping invocations. '''

    def __init__(self, func: Callback, period: int, io_loop: Loop) -> None:
        self._func = func
        self._loop = _asyncio_loop(io_loop)
        self._period = period / 1000.0
        self._started = False
        self._stopped = False
        self._task: asyncio.Task[None] | None = None

    async def _run(self) -> None:
        await asyncio.sleep(self._period)
        while not self._stopped:
            started = self._loop.time()
            try:
                result = self._func()
                if inspect.isawaitable(result):
                    await result
            except asyncio.CancelledError:
                raise
            except Exception:
                log.error("Error thrown from periodic callback:", exc_info=True)
            elapsed = self._loop.time() - started
            await asyncio.sleep(max(0, self._period - elapsed))

    def start(self) -> None:
        if self._started:
            raise RuntimeError("called start() twice on _AsyncPeriodic")
        self._started = True
        self._task = self._loop.create_task(self._run())
        self._task.add_done_callback(_log_task_exception)

    def stop(self) -> None:
        self._stopped = True
        if self._task is not None:
            if not self._loop.is_closed():
                self._loop.call_soon_threadsafe(self._task.cancel)

    async def wait(self) -> None:
        task = self._task
        if task is None:
            return
        try:
            await task
        except asyncio.CancelledError:
            pass
        finally:
            if self._task is task:
                self._task = None

class _CallbackGroup:
    ''' A removable collection of callbacks scheduled on an asyncio loop. '''

    def __init__(self, io_loop: Loop) -> None:
        self._loop_source = io_loop
        self._next_tick_callback_removers: Removers = {}
        self._timeout_callback_removers: Removers = {}
        self._periodic_callback_removers: Removers = {}
        self._removers_lock = threading.Lock()

        self._next_tick_removers_by_callable: RemoversByCallable = defaultdict(set)
        self._timeout_removers_by_callable: RemoversByCallable = defaultdict(set)
        self._periodic_removers_by_callable: RemoversByCallable = defaultdict(set)

    @property
    def _loop(self) -> asyncio.AbstractEventLoop:
        return _asyncio_loop(self._loop_source)

    def remove_all_callbacks(self) -> None:
        with self._removers_lock:
            next_tick_ids = list(self._next_tick_callback_removers)
            timeout_ids = list(self._timeout_callback_removers)
            periodic_ids = list(self._periodic_callback_removers)
        groups = (
            (next_tick_ids, self.remove_next_tick_callback),
            (timeout_ids, self.remove_timeout_callback),
            (periodic_ids, self.remove_periodic_callback),
        )
        for callback_ids, remover in groups:
            for callback_id in callback_ids:
                try:
                    remover(callback_id)
                except ValueError:
                    pass

    def _call_on_loop(self, callback: CallbackSync) -> None:
        try:
            on_loop = asyncio.get_running_loop() is self._loop
        except RuntimeError:
            on_loop = False
        if on_loop:
            callback()
        else:
            self._loop.call_soon_threadsafe(callback)

    def _get_removers_ids_by_callable(self, removers: Removers) -> RemoversByCallable:
        if removers is self._next_tick_callback_removers:
            return self._next_tick_removers_by_callable
        elif removers is self._timeout_callback_removers:
            return self._timeout_removers_by_callable
        elif removers is self._periodic_callback_removers:
            return self._periodic_removers_by_callable
        else:
            raise RuntimeError("Unhandled removers", removers)

    def _assign_remover(self, callback: Callback, callback_id: ID, removers: Removers, remover: Remover) -> None:
        with self._removers_lock:
            if callback_id in removers:
                raise ValueError("A callback of the same type has already been added with this ID")
            removers[callback_id] = remover
            self._get_removers_ids_by_callable(removers)[callback].add(callback_id)

    def _execute_remover(self, callback_id: ID, removers: Removers) -> None:
        try:
            with self._removers_lock:
                remover = removers.pop(callback_id)
                removers_by_callable = self._get_removers_ids_by_callable(removers)
                for callback, callback_ids in list(removers_by_callable.items()):
                    callback_ids.discard(callback_id)
                    if not callback_ids:
                        del removers_by_callable[callback]
        except KeyError:
            raise ValueError("Removing a callback twice (or after it's already been run)")
        remover()

    def _invoke(self, callback: Callback) -> None:
        result = callback()
        if inspect.isawaitable(result):
            future = asyncio.ensure_future(result, loop=self._loop)
            future.add_done_callback(_log_task_exception)

    def add_next_tick_callback(self, callback: Callback, callback_id: ID) -> ID:
        removed = False

        def wrapper() -> None:
            if removed:
                return
            self.remove_next_tick_callback(callback_id)
            self._invoke(callback)

        def remover() -> None:
            nonlocal removed
            removed = True

        self._assign_remover(callback, callback_id, self._next_tick_callback_removers, remover)
        self._loop.call_soon_threadsafe(wrapper)
        return callback_id

    def remove_next_tick_callback(self, callback_id: ID) -> None:
        self._execute_remover(callback_id, self._next_tick_callback_removers)

    def add_timeout_callback(self, callback: CallbackSync, timeout_milliseconds: int, callback_id: ID) -> ID:
        handle: asyncio.TimerHandle | None = None
        removed = False
        state_lock = threading.Lock()

        def wrapper() -> None:
            self.remove_timeout_callback(callback_id)
            self._invoke(callback)

        def remover() -> None:
            nonlocal removed
            with state_lock:
                removed = True
                current_handle = handle
            if current_handle is not None:
                self._call_on_loop(current_handle.cancel)

        def start() -> None:
            nonlocal handle
            with state_lock:
                if not removed:
                    handle = self._loop.call_later(timeout_milliseconds / 1000.0, wrapper)

        self._assign_remover(callback, callback_id, self._timeout_callback_removers, remover)
        self._call_on_loop(start)
        return callback_id

    def remove_timeout_callback(self, callback_id: ID) -> None:
        self._execute_remover(callback_id, self._timeout_callback_removers)

    def add_periodic_callback(self, callback: Callback, period_milliseconds: int, callback_id: ID) -> None:
        periodic = _AsyncPeriodic(callback, period_milliseconds, io_loop=self._loop)
        self._assign_remover(callback, callback_id, self._periodic_callback_removers, periodic.stop)
        self._call_on_loop(periodic.start)

    def remove_periodic_callback(self, callback_id: ID) -> None:
        self._execute_remover(callback_id, self._periodic_callback_removers)

#-----------------------------------------------------------------------------
# Code
#-----------------------------------------------------------------------------
