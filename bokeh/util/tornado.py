#-----------------------------------------------------------------------------
# Copyright (c) 2012 - 2020, Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------
""" Internal utils related to Tornado

"""

#-----------------------------------------------------------------------------
# Boilerplate
#-----------------------------------------------------------------------------
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

# External imports
from tornado import gen

# Bokeh imports
from ..util.serialization import make_id

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
    if sys.platform == 'win32' and sys.version_info[:3] >= (3, 8, 0):
        import asyncio
        if type(asyncio.get_event_loop_policy()) is asyncio.WindowsProactorEventLoopPolicy:
            # WindowsProactorEventLoopPolicy is not compatible with tornado 6
            # fallback to the pre-3.8 default of WindowsSelectorEventLoopPolicy
            asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())

#-----------------------------------------------------------------------------
# Private API
#-----------------------------------------------------------------------------

class _AsyncPeriodic:
    """Like ioloop.PeriodicCallback except the 'func' can be async and
        return a Future, and we wait for func to finish each time
        before we call it again.  Plain ioloop.PeriodicCallback
        can "pile up" invocations if they are taking too long.

    """

    def __init__(self, func, period, io_loop):
        self._func = func
        self._loop = io_loop
        self._period = period
        self._started = False
        self._stopped = False

    # this is like gen.sleep but uses our IOLoop instead of the
    # current IOLoop
    def sleep(self):
        f = gen.Future()
        self._loop.call_later(self._period / 1000.0, lambda: f.set_result(None))
        return f

    def start(self):
        if self._started:
            raise RuntimeError("called start() twice on _AsyncPeriodic")
        self._started = True

        def invoke():
            # important to start the sleep before starting callback so any initial
            # time spent in callback "counts against" the period.
            sleep_future = self.sleep()
            result = self._func()

            if result is None:
                return sleep_future

            callback_future = gen.convert_yielded(result)
            return gen.multi([sleep_future, callback_future])

        def on_done(future):
            if not self._stopped:
                self._loop.add_future(invoke(), on_done)
            ex = future.exception()
            if ex is not None:
                log.error("Error thrown from periodic callback:")
                lines = format_exception(ex.__class__, ex, ex.__traceback__)
                log.error("".join(lines))

        self._loop.add_future(self.sleep(), on_done)

    def stop(self):
        self._stopped = True

class _CallbackGroup:
    """ A collection of callbacks added to a Tornado IOLoop that we may
    want to remove as a group. """

    def __init__(self, io_loop=None):
        if io_loop is None:
            raise ValueError("must provide an io loop")
        self._loop = io_loop
        # dicts from callback to remove callable. These are
        # separate only because it's allowed to add the same
        # callback as multiple kinds of callback at once.
        self._next_tick_callback_removers = {}
        self._timeout_callback_removers = {}
        self._periodic_callback_removers = {}
        self._removers_lock = threading.Lock()

        self._next_tick_removers_by_callable = defaultdict(set)
        self._timeout_removers_by_callable = defaultdict(set)
        self._periodic_removers_by_callable = defaultdict(set)

    def remove_all_callbacks(self):
        """ Removes all registered callbacks."""
        for cb_id in list(self._next_tick_callback_removers.keys()):
            self.remove_next_tick_callback(cb_id)
        for cb_id in list(self._timeout_callback_removers.keys()):
            self.remove_timeout_callback(cb_id)
        for cb_id in list(self._periodic_callback_removers.keys()):
            self.remove_periodic_callback(cb_id)

    def _get_removers_ids_by_callable(self, removers):
        if removers is self._next_tick_callback_removers:
            return self._next_tick_removers_by_callable
        elif removers is self._timeout_callback_removers:
            return self._timeout_removers_by_callable
        elif removers is self._periodic_callback_removers:
            return self._periodic_removers_by_callable
        else:
            raise RuntimeError('Unhandled removers', removers)

    def _assign_remover(self, callback, callback_id, removers, remover):
        with self._removers_lock:
            if callback_id is None:
                callback_id = make_id()
            elif callback_id in removers:
                raise ValueError("A callback of the same type has already been added with this ID")
            removers[callback_id] = remover
            return callback_id

    def _execute_remover(self, callback_id, removers):
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

    def add_next_tick_callback(self, callback, callback_id=None):
        """ Adds a callback to be run on the next tick.
        Returns an ID that can be used with remove_next_tick_callback."""
        def wrapper(*args, **kwargs):
            # this 'removed' flag is a hack because Tornado has no way
            # to remove a "next tick" callback added with
            # IOLoop.add_callback. So instead we make our wrapper skip
            # invoking the callback.
            if not wrapper.removed:
                self.remove_next_tick_callback(callback_id)
                return callback(*args, **kwargs)
            else:
                return None

        wrapper.removed = False

        def remover():
            wrapper.removed = True

        callback_id = self._assign_remover(callback, callback_id, self._next_tick_callback_removers, remover)
        self._loop.add_callback(wrapper)
        return callback_id

    def remove_next_tick_callback(self, callback_id):
        """ Removes a callback added with add_next_tick_callback."""
        self._execute_remover(callback_id, self._next_tick_callback_removers)

    def add_timeout_callback(self, callback, timeout_milliseconds, callback_id=None):
        """ Adds a callback to be run once after timeout_milliseconds.
        Returns an ID that can be used with remove_timeout_callback."""
        def wrapper(*args, **kwargs):
            self.remove_timeout_callback(callback_id)
            return callback(*args, **kwargs)

        handle = None

        def remover():
            if handle is not None:
                self._loop.remove_timeout(handle)

        callback_id = self._assign_remover(callback, callback_id, self._timeout_callback_removers, remover)
        handle = self._loop.call_later(timeout_milliseconds / 1000.0, wrapper)
        return callback_id

    def remove_timeout_callback(self, callback_id):
        """ Removes a callback added with add_timeout_callback, before it runs."""
        self._execute_remover(callback_id, self._timeout_callback_removers)

    def add_periodic_callback(self, callback, period_milliseconds, callback_id=None):
        """ Adds a callback to be run every period_milliseconds until it is removed.
        Returns an ID that can be used with remove_periodic_callback."""

        cb = _AsyncPeriodic(callback, period_milliseconds, io_loop=self._loop)
        callback_id = self._assign_remover(callback, callback_id, self._periodic_callback_removers, cb.stop)
        cb.start()
        return callback_id

    def remove_periodic_callback(self, callback_id):
        """ Removes a callback added with add_periodic_callback."""
        self._execute_remover(callback_id, self._periodic_callback_removers)

#-----------------------------------------------------------------------------
# Code
#-----------------------------------------------------------------------------
