from __future__ import absolute_import, print_function

import unittest
from concurrent.futures import ThreadPoolExecutor
from itertools import repeat

import pytest
from tornado.ioloop import IOLoop

from bokeh.util.tornado import _CallbackGroup
from bokeh.util.warnings import BokehDeprecationWarning

def _make_invocation_counter(loop, stop_after=1):
    from types import MethodType
    counter = { 'count' : 0 }
    def func():
        counter['count'] += 1
        if stop_after is not None and counter['count'] >= stop_after:
            loop.stop()
    def count(self):
        return self.counter['count']
    func.count = MethodType(count, func)
    func.counter = counter
    return func

# this is so ctrl+c out of the tests will show the actual
# error, which pytest otherwise won't do by default
def run(loop):
    try:
        loop.start()
    except KeyboardInterrupt:
        print("Keyboard interrupt")
        pass

class LoopAndGroup(object):
    def __init__(self, quit_after=None):
        self.io_loop = IOLoop()
        self.io_loop.make_current()
        self.group = _CallbackGroup(self.io_loop)

        if quit_after is not None:
            self.io_loop.call_later(quit_after / 1000.0,
                                    lambda: self.io_loop.stop())

    def __exit__(self, type, value, traceback):
        run(self.io_loop)
        self.io_loop.close()

    def __enter__(self):
        return self

class TestCallbackGroup(unittest.TestCase):
    def test_next_tick_runs(self):
        with (LoopAndGroup()) as ctx:
            func = _make_invocation_counter(ctx.io_loop)
            self.assertEqual(0, len(ctx.group._next_tick_callback_removers))
            ctx.group.add_next_tick_callback(func)
            self.assertEqual(1, len(ctx.group._next_tick_callback_removers))
        self.assertEqual(1, func.count())
        # check for leaks
        self.assertEqual(0, len(ctx.group._next_tick_callback_removers))

    def test_timeout_runs(self):
        with (LoopAndGroup()) as ctx:
            func = _make_invocation_counter(ctx.io_loop)
            self.assertEqual(0, len(ctx.group._timeout_callback_removers))
            ctx.group.add_timeout_callback(func, timeout_milliseconds=1)
            self.assertEqual(1, len(ctx.group._timeout_callback_removers))
        self.assertEqual(1, func.count())
        # check for leaks
        self.assertEqual(0, len(ctx.group._timeout_callback_removers))

    def test_periodic_runs(self):
        with (LoopAndGroup()) as ctx:
            func = _make_invocation_counter(ctx.io_loop, stop_after=5)
            self.assertEqual(0, len(ctx.group._periodic_callback_removers))
            cb_id = ctx.group.add_periodic_callback(func, period_milliseconds=1)
            self.assertEqual(1, len(ctx.group._periodic_callback_removers))
        self.assertEqual(5, func.count())
        # check for leaks... periodic doesn't self-remove though
        self.assertEqual(1, len(ctx.group._periodic_callback_removers))
        ctx.group.remove_periodic_callback(cb_id)
        self.assertEqual(0, len(ctx.group._periodic_callback_removers))

    def test_next_tick_does_not_run_if_removed_immediately(self):
        with (LoopAndGroup(quit_after=15)) as ctx:
            func = _make_invocation_counter(ctx.io_loop)
            cb_id = ctx.group.add_next_tick_callback(func)
            ctx.group.remove_next_tick_callback(cb_id)
        self.assertEqual(0, func.count())

    def test_timeout_does_not_run_if_removed_immediately(self):
        with (LoopAndGroup(quit_after=15)) as ctx:
            func = _make_invocation_counter(ctx.io_loop)
            cb_id = ctx.group.add_timeout_callback(func, timeout_milliseconds=1)
            ctx.group.remove_timeout_callback(cb_id)
        self.assertEqual(0, func.count())

    def test_periodic_does_not_run_if_removed_immediately(self):
        with (LoopAndGroup(quit_after=15)) as ctx:
            func = _make_invocation_counter(ctx.io_loop, stop_after=5)
            cb_id = ctx.group.add_periodic_callback(func, period_milliseconds=1)
            ctx.group.remove_periodic_callback(cb_id)
        self.assertEqual(0, func.count())

    def test_same_callback_as_all_three_types(self):
        with (LoopAndGroup()) as ctx:
            func = _make_invocation_counter(ctx.io_loop, stop_after=5)
            # we want the timeout and next_tick to run before the periodic
            ctx.group.add_periodic_callback(func, period_milliseconds=2)
            ctx.group.add_timeout_callback(func, timeout_milliseconds=1)
            ctx.group.add_next_tick_callback(func)
        self.assertEqual(5, func.count())

    def test_adding_next_tick_twice(self):
        with (LoopAndGroup()) as ctx:
            func = _make_invocation_counter(ctx.io_loop, stop_after=2)
            ctx.group.add_next_tick_callback(func)
            ctx.group.add_next_tick_callback(func)
        self.assertEqual(2, func.count())

    def test_adding_timeout_twice(self):
        with (LoopAndGroup()) as ctx:
            func = _make_invocation_counter(ctx.io_loop, stop_after=2)
            ctx.group.add_timeout_callback(func, timeout_milliseconds=1)
            ctx.group.add_timeout_callback(func, timeout_milliseconds=2)
        self.assertEqual(2, func.count())

    def test_adding_periodic_twice(self):
        with (LoopAndGroup()) as ctx:
            func = _make_invocation_counter(ctx.io_loop, stop_after=2)
            ctx.group.add_periodic_callback(func, period_milliseconds=3)
            ctx.group.add_periodic_callback(func, period_milliseconds=2)
        self.assertEqual(2, func.count())

    def test_remove_all_callbacks(self):
        with (LoopAndGroup(quit_after=15)) as ctx:
            # add a callback that will remove all the others
            def remove_all():
                ctx.group.remove_all_callbacks()
            ctx.group.add_next_tick_callback(remove_all)
            # none of these should run
            func = _make_invocation_counter(ctx.io_loop, stop_after=5)
            ctx.group.add_periodic_callback(func, period_milliseconds=2)
            ctx.group.add_timeout_callback(func, timeout_milliseconds=1)
            ctx.group.add_next_tick_callback(func)
        self.assertEqual(0, func.count())

    def test_removing_next_tick_twice(self):
        with (LoopAndGroup(quit_after=15)) as ctx:
            func = _make_invocation_counter(ctx.io_loop)
            cb_id = ctx.group.add_next_tick_callback(func)
            ctx.group.remove_next_tick_callback(cb_id)
            with (self.assertRaises(ValueError)) as manager:
                ctx.group.remove_next_tick_callback(cb_id)
        self.assertEqual(0, func.count())
        self.assertTrue("twice" in repr(manager.exception))

    def test_removing_timeout_twice(self):
        with (LoopAndGroup(quit_after=15)) as ctx:
            func = _make_invocation_counter(ctx.io_loop)
            cb_id = ctx.group.add_timeout_callback(func, timeout_milliseconds=1)
            ctx.group.remove_timeout_callback(cb_id)
            with (self.assertRaises(ValueError)) as manager:
                ctx.group.remove_timeout_callback(cb_id)
        self.assertEqual(0, func.count())
        self.assertTrue("twice" in repr(manager.exception))

    def test_removing_periodic_twice(self):
        with (LoopAndGroup(quit_after=15)) as ctx:
            func = _make_invocation_counter(ctx.io_loop, stop_after=5)
            cb_id = ctx.group.add_periodic_callback(func, period_milliseconds=1)
            ctx.group.remove_periodic_callback(cb_id)
            with (self.assertRaises(ValueError)) as manager:
                ctx.group.remove_periodic_callback(cb_id)
        self.assertEqual(0, func.count())
        self.assertTrue("twice" in repr(manager.exception))

    def test_adding_next_tick_from_another_thread(self):
        # The test has probabilistic nature - there's a slight change it'll give a false negative
        with LoopAndGroup(quit_after=15) as ctx:
            n = 1000
            func = _make_invocation_counter(ctx.io_loop, stop_after=n)
            tpe = ThreadPoolExecutor(n)
            list(tpe.map(ctx.group.add_next_tick_callback, repeat(func, n)))
        self.assertEqual(n, func.count())

    def test_deprecated_remove_next_tick_callback(self):
        with LoopAndGroup(quit_after=15) as ctx:
            func = _make_invocation_counter(ctx.io_loop, stop_after=1)
            ctx.group.add_next_tick_callback(func)
            with pytest.warns(BokehDeprecationWarning):
                ctx.group.remove_next_tick_callback(func)
        self.assertEqual(0, func.count())

    def test_deprecated_remove_periodic_callback(self):
        with LoopAndGroup(quit_after=15) as ctx:
            func = _make_invocation_counter(ctx.io_loop, stop_after=1)
            ctx.group.add_periodic_callback(func, 1)
            with pytest.warns(BokehDeprecationWarning):
                ctx.group.remove_periodic_callback(func)
        self.assertEqual(0, func.count())

    def test_deprecated_remove_timeout_callback(self):
        with LoopAndGroup(quit_after=15) as ctx:
            func = _make_invocation_counter(ctx.io_loop, stop_after=1)
            ctx.group.add_timeout_callback(func, 1)
            with pytest.warns(BokehDeprecationWarning):
                ctx.group.remove_timeout_callback(func)
        self.assertEqual(0, func.count())
