""" Internal utils related to Tornado

"""
from __future__ import absolute_import

import logging
log = logging.getLogger(__name__)

from tornado import gen

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

    def start(self):
        if self._started:
            raise RuntimeError("called start() twice on _AsyncPeriodic")
        self._started = True
        def schedule():
            # important to start the sleep before starting callback
            # so any initial time spent in callback "counts against"
            # the period.
            sleep_future = gen.sleep(self._period / 1000.0)
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
                self._loop.add_future(schedule(), on_done)
            if future.exception() is not None:
                log.error("Error thrown from periodic callback: %r", future.exception())
        self._loop.add_future(schedule(), on_done)

    def stop(self):
        self._stopped = True
