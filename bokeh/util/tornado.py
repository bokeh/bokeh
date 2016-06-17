""" Internal utils related to Tornado

"""
from __future__ import absolute_import, print_function

import logging
log = logging.getLogger(__name__)

from tornado import gen

from bokeh.document import NextTickCallback, PeriodicCallback, TimeoutCallback

@gen.coroutine
def yield_for_all_futures(result):
    """ Converts result into a Future by collapsing any futures inside result.

    If result is a Future we yield until it's done, then if the value inside
    the Future is another Future we yield until it's done as well, and so on.
    """
    while True:
        try:
            future = gen.convert_yielded(result)
        except gen.BadYieldError:
            # result is not a yieldable thing, we are done
            break
        else:
            result = yield future
    raise gen.Return(result)

class _AsyncPeriodic(object):
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
            # important to start the sleep before starting callback
            # so any initial time spent in callback "counts against"
            # the period.
            sleep_future = self.sleep()
            result = self._func()
            try:
                callback_future = gen.convert_yielded(result)
            except gen.BadYieldError:
                # result is not a yieldable thing
                return sleep_future
            else:
                return gen.multi([sleep_future, callback_future])
        def on_done(future):
            if not self._stopped:
                self._loop.add_future(invoke(), on_done)
            if future.exception() is not None:
                log.error("Error thrown from periodic callback: %r", future.exception())
        self._loop.add_future(self.sleep(), on_done)

    def stop(self):
        self._stopped = True

class _CallbackGroup(object):
    """ A collection of callbacks added to a Tornado IOLoop that we may
    want to remove as a group. """

    def __init__(self, io_loop=None):
        if io_loop is None:
            raise ValueError("must provide an io loop")
        self._loop = io_loop
        # dicts from callback to remove callable. These are
        # separate only because it's allowed to add the same
        # callback as multiple kinds of callback at once.
        self._next_tick_callbacks = {}
        self._timeout_callbacks = {}
        self._periodic_callbacks = {}

    def remove_all_callbacks(self):
        """ Removes all registered callbacks."""
        for cb in list(self._next_tick_callbacks.keys()):
            self.remove_next_tick_callback(cb)
        for cb in list(self._timeout_callbacks.keys()):
            self.remove_timeout_callback(cb)
        for cb in list(self._periodic_callbacks.keys()):
            self.remove_periodic_callback(cb)

    def _error_on_double_remove(self, callback, callbacks):
        if callback not in callbacks:
            raise ValueError("Removing a callback twice (or after it's already been run)")

    def _remover(self, callback, callbacks, cleanup):
        self._error_on_double_remove(callback, callbacks)
        del callbacks[callback]
        if cleanup is not None:
            cleanup(callback)

    def _wrap_next_tick(self, callback, cleanup):
        # this 'removed' flag is a hack because Tornado has no way
        # to remove a "next tick" callback added with
        # IOLoop.add_callback. So instead we make our wrapper skip
        # invoking the callback.
        handle = { 'removed' : False }
        def wrapper(*args, **kwargs):
            was_removed = handle['removed']
            if not was_removed:
                self.remove_next_tick_callback(callback)
                return callback(*args, **kwargs)
            else:
                return None
        wrapper.handle = handle
        return wrapper

    def add_next_tick_callback(self, callback, cleanup=None):
        """ Adds a callback to be run on the next tick.
        Returns a callable that removes the callback if called."""
        if callback in self._next_tick_callbacks:
            raise ValueError("Next-tick callback added twice")
        wrapper = self._wrap_next_tick(callback, cleanup)
        self._loop.add_callback(wrapper)
        def remover():
            wrapper.handle['removed'] = True
            self._remover(callback, self._next_tick_callbacks, cleanup)
        self._next_tick_callbacks[callback] = remover
        return remover

    def _remove(self, callback, callbacks):
        self._error_on_double_remove(callback, callbacks)
        callbacks[callback]()

    def remove_next_tick_callback(self, callback):
        """ Removes a callback added with add_next_tick_callback."""
        self._remove(callback, self._next_tick_callbacks)

    def _wrap_timeout(self, callback):
        def wrapper(*args, **kwargs):
            self.remove_timeout_callback(callback)
            return callback(*args, **kwargs)
        return wrapper

    def add_timeout_callback(self, callback, timeout_milliseconds, cleanup=None):
        """ Adds a callback to be run once after timeout_milliseconds.
        Returns a callable that removes the callback if called."""
        if callback in self._timeout_callbacks:
            raise ValueError("Callback added as a timeout twice")
        handle = self._loop.call_later(timeout_milliseconds / 1000.0,
                                       self._wrap_timeout(callback))
        def remover():
            self._loop.remove_timeout(handle)
            self._remover(callback, self._timeout_callbacks, cleanup)
        self._timeout_callbacks[callback] = remover
        return remover

    def remove_timeout_callback(self, callback):
        """ Removes a callback added with add_timeout_callback, before it runs."""
        self._remove(callback, self._timeout_callbacks)

    def add_periodic_callback(self, callback, period_milliseconds, cleanup=None):
        """ Adds a callback to be run every period_milliseconds until it is removed."""
        if callback in self._periodic_callbacks:
            raise ValueError("Callback added as a periodic callback twice")
        cb = _AsyncPeriodic(
            callback, period_milliseconds, io_loop=self._loop
        )
        def remover():
            cb.stop()
            self._remover(callback, self._periodic_callbacks, cleanup)
        self._periodic_callbacks[callback] = remover
        cb.start()
        return remover

    def remove_periodic_callback(self, callback):
        """ Removes a callback added with add_periodic_callback."""
        self._remove(callback, self._periodic_callbacks)

class _DocumentCallbackGroup(object):
    def __init__(self, io_loop=None):
        self._group = _CallbackGroup(io_loop)
        # from callback ids to removers
        self._removers = dict()

    def remove_all_callbacks(self):
        for r in list(self._removers.values()):
            r()

    def add_session_callbacks(self, callbacks):
        for cb in callbacks:
            self.add_session_callback(cb)

    def add_session_callback(self, callback):
        def cleanup(func):
            if callback.id in self._removers:
                del self._removers[callback.id]
        if isinstance(callback, PeriodicCallback):
            remover = self._group.add_periodic_callback(callback.callback, callback.period, cleanup)
        elif isinstance(callback, TimeoutCallback):
            remover = self._group.add_timeout_callback(callback.callback, callback.timeout, cleanup)
        elif isinstance(callback, NextTickCallback):
            remover = self._group.add_next_tick_callback(callback.callback, cleanup)
        else:
            raise ValueError("Expected callback of type PeriodicCallback, TimeoutCallback, NextTickCallback, got: %s" % callback.callback)
        self._removers[callback.id] = remover

    def remove_session_callback(self, callback):
        # we may be called multiple times because of multiple
        # views on a document - the document has to notify that
        # the callback was removed even if only one view invoked
        # it. So we need to silently no-op if we're already
        # removed.
        if callback.id in self._removers:
            self._removers[callback.id]()
