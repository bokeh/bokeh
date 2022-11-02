#-----------------------------------------------------------------------------
# Copyright (c) 2012 - 2022, Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------
''' Internal utils related to Tornado

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
import sys
import threading
from collections import defaultdict
from traceback import format_exception
from typing import (
    TYPE_CHECKING,
    Any,
    Awaitable,
    Callable,
    Dict,
    List,
    Set,
    Union,
)

# External imports
import tornado
from tornado import gen

# Bokeh imports
from ..core.types import ID

if TYPE_CHECKING:
    from tornado.ioloop import IOLoop
    from typing_extensions import TypeAlias

#-----------------------------------------------------------------------------
# Globals and constants
#-----------------------------------------------------------------------------

__all__ = ()

#-----------------------------------------------------------------------------
# General API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Dev API
#-----------------------------------------------------------------------------

# See https://github.com/bokeh/bokeh/issues/9507
def fixup_windows_event_loop_policy() -> None:
    if (
        sys.platform == 'win32'
        and sys.version_info[:3] >= (3, 8, 0)
        and tornado.version_info < (6, 1)
    ):
        import asyncio
        if type(asyncio.get_event_loop_policy()) is asyncio.WindowsProactorEventLoopPolicy:
            # WindowsProactorEventLoopPolicy is not compatible with tornado 6
            # fallback to the pre-3.8 default of WindowsSelectorEventLoopPolicy
            asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())

#-----------------------------------------------------------------------------
# Private API
#-----------------------------------------------------------------------------

CallbackSync: TypeAlias = Callable[[], None]
CallbackAsync: TypeAlias = Callable[[], Awaitable[None]]
Callback: TypeAlias = Union[CallbackSync, CallbackAsync]

InvokeResult: TypeAlias = Union[Awaitable[None], Awaitable[List[Any]], Awaitable[Dict[Any, Any]]]

Remover: TypeAlias = Callable[[], None]

Removers: TypeAlias = Dict[ID, Remover]

RemoversByCallable: TypeAlias = Dict[Callback, Set[ID]]

class _AsyncPeriodic:
    ''' Like ioloop.PeriodicCallback except the 'func' can be async and return
    a Future.

    Will wait for func to finish each time before we call it again. (Plain
    ioloop.PeriodicCallback can "pile up" invocations if they are taking too
    long.)

    '''

    _loop: IOLoop
    _period: int
    _started: bool
    _stopped: bool

    def __init__(self, func: Callback, period: int, io_loop: IOLoop) -> None:
        # specify type here until this is released: https://github.com/python/mypy/pull/10548
        self._func: Callback = func

        self._loop = io_loop
        self._period = period
        self._started = False
        self._stopped = False

    # this is like gen.sleep but uses our IOLoop instead of the current IOLoop
    def sleep(self) -> gen.Future[None]:
        f: gen.Future[None] = gen.Future()
        self._loop.call_later(self._period / 1000.0, lambda: f.set_result(None))
        return f

    def start(self) -> None:
        if self._started:
            raise RuntimeError("called start() twice on _AsyncPeriodic")
        self._started = True

        def invoke() -> InvokeResult:
            # important to start the sleep before starting callback so any initial
            # time spent in callback "counts against" the period.
            sleep_future = self.sleep()
            result = self._func()

            if result is None:
                return sleep_future

            callback_future = gen.convert_yielded(result)
            return gen.multi([sleep_future, callback_future])

        def on_done(future: gen.Future[None]) -> None:
            if not self._stopped:
                # mypy can't infer type of invoker for some reason
                self._loop.add_future(invoke(), on_done)  # type: ignore
            ex = future.exception()
            if ex is not None:
                log.error("Error thrown from periodic callback:")
                lines = format_exception(ex.__class__, ex, ex.__traceback__)
                log.error("".join(lines))

        self._loop.add_future(self.sleep(), on_done)

    def stop(self) -> None:
        self._stopped = True

class _CallbackGroup:
    ''' A collection of callbacks added to a Tornado IOLoop that can be removed
    as a group.

    '''

    _next_tick_callback_removers: Removers
    _timeout_callback_removers: Removers
    _periodic_callback_removers: Removers

    _next_tick_removers_by_callable: RemoversByCallable
    _timeout_removers_by_callable: RemoversByCallable
    _periodic_removers_by_callable: RemoversByCallable

    _loop: IOLoop

    def __init__(self, io_loop: IOLoop) -> None:
        self._loop = io_loop
        # dicts from callback to remove callable. These are separate only because
        # it's allowed to add the same callback as multiple kinds of callback at once.
        self._next_tick_callback_removers = {}
        self._timeout_callback_removers = {}
        self._periodic_callback_removers = {}
        self._removers_lock = threading.Lock()

        self._next_tick_removers_by_callable = defaultdict(set)
        self._timeout_removers_by_callable = defaultdict(set)
        self._periodic_removers_by_callable = defaultdict(set)

    def remove_all_callbacks(self) -> None:
        ''' Removes all registered callbacks.

        '''

        # call list to make a copy since dicts could change in flight
        for cb_id in list(self._next_tick_callback_removers):
            self.remove_next_tick_callback(cb_id)
        for cb_id in list(self._timeout_callback_removers):
            self.remove_timeout_callback(cb_id)
        for cb_id in list(self._periodic_callback_removers):
            self.remove_periodic_callback(cb_id)

    def _get_removers_ids_by_callable(self, removers: Removers) -> RemoversByCallable:
        if removers is self._next_tick_callback_removers:
            return self._next_tick_removers_by_callable
        elif removers is self._timeout_callback_removers:
            return self._timeout_removers_by_callable
        elif removers is self._periodic_callback_removers:
            return self._periodic_removers_by_callable
        else:
            raise RuntimeError('Unhandled removers', removers)

    def _assign_remover(self, callback: Callback, callback_id: ID, removers: Removers, remover: Remover) -> None:
        with self._removers_lock:
            if callback_id in removers:
                raise ValueError("A callback of the same type has already been added with this ID")
            removers[callback_id] = remover

    def _execute_remover(self, callback_id: ID, removers: Removers) -> None:
        try:
            with self._removers_lock:
                remover = removers.pop(callback_id)
                for cb, cb_ids in list(self._get_removers_ids_by_callable(removers).items()):
                    try:
                        cb_ids.remove(callback_id)
                        if not cb_ids:
                            del self._get_removers_ids_by_callable(removers)[cb]
                    except KeyError:
                        pass
        except KeyError:
            raise ValueError("Removing a callback twice (or after it's already been run)")
        remover()

    def add_next_tick_callback(self, callback: Callback, callback_id: ID) -> ID:
        ''' Adds a callback to be run on the nex

        The passed-in ID can be used with remove_next_tick_callback.

        '''
        def wrapper() -> None | Awaitable[None]:
            # this 'removed' flag is a hack because Tornado has no way to remove
            # a "next tick" callback added with IOLoop.add_callback. So instead
            # we make our wrapper skip invoking the callback.
            #
            # also: mypy cannot handle attrs on callables: https://github.com/python/mypy/issues/2087
            if wrapper.removed:  # type: ignore
                return None
            self.remove_next_tick_callback(callback_id)
            return callback()

        wrapper.removed = False  # type: ignore

        def remover() -> None:
            wrapper.removed = True   # type: ignore

        self._assign_remover(callback, callback_id, self._next_tick_callback_removers, remover)
        self._loop.add_callback(wrapper)
        return callback_id

    def remove_next_tick_callback(self, callback_id: ID) -> None:
        ''' Removes a callback added with add_next_tick_callback.

        '''
        self._execute_remover(callback_id, self._next_tick_callback_removers)

    def add_timeout_callback(self, callback: CallbackSync, timeout_milliseconds: int, callback_id: ID) -> ID:
        ''' Adds a callback to be run once after timeout_milliseconds.

        The passed-in ID can be used with remove_timeout_callback.

        '''
        def wrapper() -> None:
            self.remove_timeout_callback(callback_id)
            return callback()

        handle: object | None = None

        def remover() -> None:
            if handle is not None:
                self._loop.remove_timeout(handle)

        self._assign_remover(callback, callback_id, self._timeout_callback_removers, remover)
        handle = self._loop.call_later(timeout_milliseconds / 1000.0, wrapper)
        return callback_id

    def remove_timeout_callback(self, callback_id: ID) -> None:
        ''' Removes a callback added with add_timeout_callback, before it runs.

        '''
        self._execute_remover(callback_id, self._timeout_callback_removers)

    def add_periodic_callback(self, callback: Callback, period_milliseconds: int, callback_id: ID) -> None:
        ''' Adds a callback to be run every period_milliseconds until it is removed.

        The passed-in ID can be used with remove_periodic_callback.

        '''
        cb = _AsyncPeriodic(callback, period_milliseconds, io_loop=self._loop)
        self._assign_remover(callback, callback_id, self._periodic_callback_removers, cb.stop)
        cb.start()

    def remove_periodic_callback(self, callback_id: ID) -> None:
        ''' Removes a callback added with add_periodic_callback.

        '''
        self._execute_remover(callback_id, self._periodic_callback_removers)

#-----------------------------------------------------------------------------
# Code
#-----------------------------------------------------------------------------
