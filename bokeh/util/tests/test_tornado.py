from __future__ import absolute_import, print_function

import unittest

from tornado import gen
from tornado.ioloop import IOLoop

from bokeh.util.tornado import _CallbackGroup, yield_for_all_futures

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
            self.assertEqual(0, len(ctx.group._next_tick_callbacks))
            ctx.group.add_next_tick_callback(func)
            self.assertEqual(1, len(ctx.group._next_tick_callbacks))
        self.assertEqual(1, func.count())
        # check for leaks
        self.assertEqual(0, len(ctx.group._next_tick_callbacks))

    def test_timeout_runs(self):
        with (LoopAndGroup()) as ctx:
            func = _make_invocation_counter(ctx.io_loop)
            self.assertEqual(0, len(ctx.group._timeout_callbacks))
            ctx.group.add_timeout_callback(func, timeout_milliseconds=1)
            self.assertEqual(1, len(ctx.group._timeout_callbacks))
        self.assertEqual(1, func.count())
        # check for leaks
        self.assertEqual(0, len(ctx.group._timeout_callbacks))

    def test_periodic_runs(self):
        with (LoopAndGroup()) as ctx:
            func = _make_invocation_counter(ctx.io_loop, stop_after=5)
            self.assertEqual(0, len(ctx.group._periodic_callbacks))
            ctx.group.add_periodic_callback(func, period_milliseconds=1)
            self.assertEqual(1, len(ctx.group._periodic_callbacks))
        self.assertEqual(5, func.count())
        # check for leaks... periodic doesn't self-remove though
        self.assertEqual(1, len(ctx.group._periodic_callbacks))
        ctx.group.remove_periodic_callback(func)
        self.assertEqual(0, len(ctx.group._periodic_callbacks))

    def test_next_tick_does_not_run_if_removed_immediately(self):
        with (LoopAndGroup(quit_after=15)) as ctx:
            func = _make_invocation_counter(ctx.io_loop)
            ctx.group.add_next_tick_callback(func)
            ctx.group.remove_next_tick_callback(func)
        self.assertEqual(0, func.count())

    def test_timeout_does_not_run_if_removed_immediately(self):
        with (LoopAndGroup(quit_after=15)) as ctx:
            func = _make_invocation_counter(ctx.io_loop)
            ctx.group.add_timeout_callback(func, timeout_milliseconds=1)
            ctx.group.remove_timeout_callback(func)
        self.assertEqual(0, func.count())

    def test_periodic_does_not_run_if_removed_immediately(self):
        with (LoopAndGroup(quit_after=15)) as ctx:
            func = _make_invocation_counter(ctx.io_loop, stop_after=5)
            ctx.group.add_periodic_callback(func, period_milliseconds=1)
            ctx.group.remove_periodic_callback(func)
        self.assertEqual(0, func.count())

    def test_next_tick_remove_with_returned_callable(self):
        with (LoopAndGroup(quit_after=15)) as ctx:
            func = _make_invocation_counter(ctx.io_loop)
            remover = ctx.group.add_next_tick_callback(func)
            remover()
        self.assertEqual(0, func.count())

    def test_timeout_remove_with_returned_callable(self):
        with (LoopAndGroup(quit_after=15)) as ctx:
            func = _make_invocation_counter(ctx.io_loop)
            remover = ctx.group.add_timeout_callback(func, timeout_milliseconds=1)
            remover()
        self.assertEqual(0, func.count())

    def test_periodic_remove_with_returned_callable(self):
        with (LoopAndGroup(quit_after=15)) as ctx:
            func = _make_invocation_counter(ctx.io_loop, stop_after=5)
            remover = ctx.group.add_periodic_callback(func, period_milliseconds=1)
            remover()
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
            def func():
                pass
            with (self.assertRaises(ValueError)) as manager:
                ctx.group.add_next_tick_callback(func)
                ctx.group.add_next_tick_callback(func)
            ctx.io_loop.add_callback(lambda: ctx.io_loop.stop())
        self.assertTrue("twice" in repr(manager.exception))

    def test_adding_timeout_twice(self):
        with (LoopAndGroup()) as ctx:
            def func():
                pass
            with (self.assertRaises(ValueError)) as manager:
                ctx.group.add_timeout_callback(func, timeout_milliseconds=1)
                ctx.group.add_timeout_callback(func, timeout_milliseconds=2)
            ctx.io_loop.add_callback(lambda: ctx.io_loop.stop())
        self.assertTrue("twice" in repr(manager.exception))

    def test_adding_periodic_twice(self):
        with (LoopAndGroup()) as ctx:
            def func():
                pass
            with (self.assertRaises(ValueError)) as manager:
                ctx.group.add_periodic_callback(func, period_milliseconds=1)
                ctx.group.add_periodic_callback(func, period_milliseconds=2)
            ctx.io_loop.add_callback(lambda: ctx.io_loop.stop())
        self.assertTrue("twice" in repr(manager.exception))

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
            remover = ctx.group.add_next_tick_callback(func)
            remover()
            with (self.assertRaises(ValueError)) as manager:
                remover()
        self.assertEqual(0, func.count())
        self.assertTrue("twice" in repr(manager.exception))

    def test_removing_timeout_twice(self):
        with (LoopAndGroup(quit_after=15)) as ctx:
            func = _make_invocation_counter(ctx.io_loop)
            remover = ctx.group.add_timeout_callback(func, timeout_milliseconds=1)
            remover()
            with (self.assertRaises(ValueError)) as manager:
                remover()
        self.assertEqual(0, func.count())
        self.assertTrue("twice" in repr(manager.exception))

    def test_removing_periodic_twice(self):
        with (LoopAndGroup(quit_after=15)) as ctx:
            func = _make_invocation_counter(ctx.io_loop, stop_after=5)
            remover = ctx.group.add_periodic_callback(func, period_milliseconds=1)
            remover()
            with (self.assertRaises(ValueError)) as manager:
                remover()
        self.assertEqual(0, func.count())
        self.assertTrue("twice" in repr(manager.exception))

    def test_next_tick_cleanup_when_removed(self):
        result = { 'ok' : False }
        with (LoopAndGroup(quit_after=15)) as ctx:
            func = _make_invocation_counter(ctx.io_loop)
            def cleanup(callback):
                self.assertIs(callback, func)
                result['ok'] = True
            remover = ctx.group.add_next_tick_callback(func, cleanup=cleanup)
            remover()
        self.assertEqual(0, func.count())
        self.assertTrue(result['ok'])

    def test_timeout_cleanup_when_removed(self):
        result = { 'ok' : False }
        with (LoopAndGroup(quit_after=15)) as ctx:
            func = _make_invocation_counter(ctx.io_loop)
            def cleanup(callback):
                self.assertIs(callback, func)
                result['ok'] = True
            remover = ctx.group.add_timeout_callback(func, timeout_milliseconds=1, cleanup=cleanup)
            remover()
        self.assertEqual(0, func.count())
        self.assertTrue(result['ok'])

    def test_periodic_cleanup_when_removed(self):
        result = { 'ok' : False }
        with (LoopAndGroup(quit_after=15)) as ctx:
            func = _make_invocation_counter(ctx.io_loop, stop_after=5)
            def cleanup(callback):
                self.assertIs(callback, func)
                result['ok'] = True
            remover = ctx.group.add_periodic_callback(func, period_milliseconds=1, cleanup=cleanup)
            remover()
        self.assertEqual(0, func.count())
        self.assertTrue(result['ok'])

    def test_next_tick_cleanup_when_run(self):
        result = { 'ok' : False }
        with (LoopAndGroup()) as ctx:
            func = _make_invocation_counter(ctx.io_loop)
            def cleanup(callback):
                self.assertIs(callback, func)
                result['ok'] = True
            ctx.group.add_next_tick_callback(func, cleanup=cleanup)
        self.assertEqual(1, func.count())
        self.assertTrue(result['ok'])

    def test_timeout_cleanup_when_run(self):
        result = { 'ok' : False }
        with (LoopAndGroup()) as ctx:
            func = _make_invocation_counter(ctx.io_loop)
            def cleanup(callback):
                self.assertIs(callback, func)
                result['ok'] = True
            ctx.group.add_timeout_callback(func, timeout_milliseconds=1, cleanup=cleanup)
        self.assertEqual(1, func.count())
        self.assertTrue(result['ok'])

@gen.coroutine
def async_value(value):
    yield gen.moment # this ensures we actually return to the loop
    raise gen.Return(value)

def test__yield_for_all_futures():
    loop = IOLoop()
    loop.make_current()

    @gen.coroutine
    def several_steps():
        value = 0
        value += yield async_value(1)
        value += yield async_value(2)
        value += yield async_value(3)
        raise gen.Return(value)

    result = {}
    def on_done(future):
        result['value'] = future.result()
        loop.stop()

    loop.add_future(yield_for_all_futures(several_steps()),
                    on_done)

    try:
        loop.start()
    except KeyboardInterrupt:
        print("keyboard interrupt")

    assert 6 == result['value']

    loop.close()
