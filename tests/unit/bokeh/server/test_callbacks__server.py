#-----------------------------------------------------------------------------
# Copyright (c) 2012 - 2022, Anaconda, Inc., and Bokeh Contributors.
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
from concurrent.futures import ThreadPoolExecutor
from itertools import repeat

# External imports
from flaky import flaky
from tornado.ioloop import IOLoop

# Bokeh imports
from bokeh.util.serialization import make_id

# Module under test
from bokeh.util.tornado import _CallbackGroup # isort:skip

#-----------------------------------------------------------------------------
# Setup
#-----------------------------------------------------------------------------

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

class LoopAndGroup:
    def __init__(self, quit_after=None) -> None:
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

#-----------------------------------------------------------------------------
# General API
#-----------------------------------------------------------------------------


class TestCallbackGroup:
    @flaky(max_runs=10)
    def test_next_tick_runs(self) -> None:
        with (LoopAndGroup()) as ctx:
            func = _make_invocation_counter(ctx.io_loop)
            assert 0 == len(ctx.group._next_tick_callback_removers)
            ctx.group.add_next_tick_callback(callback=func, callback_id=make_id())
            assert 1 == len(ctx.group._next_tick_callback_removers)
        assert 1 == func.count()
        # check for leaks
        assert 0 == len(ctx.group._next_tick_callback_removers)

    @flaky(max_runs=10)
    def test_timeout_runs(self) -> None:
        with (LoopAndGroup()) as ctx:
            func = _make_invocation_counter(ctx.io_loop)
            assert 0 == len(ctx.group._timeout_callback_removers)
            ctx.group.add_timeout_callback(callback=func, timeout_milliseconds=1, callback_id=make_id())
            assert 1 == len(ctx.group._timeout_callback_removers)
        assert 1 == func.count()
        # check for leaks
        assert 0 == len(ctx.group._timeout_callback_removers)

    @flaky(max_runs=10)
    def test_periodic_runs(self) -> None:
        with (LoopAndGroup()) as ctx:
            func = _make_invocation_counter(ctx.io_loop, stop_after=5)
            assert 0 == len(ctx.group._periodic_callback_removers)
            cb_id = make_id()
            ctx.group.add_periodic_callback(callback=func, period_milliseconds=1, callback_id=cb_id)
            assert 1 == len(ctx.group._periodic_callback_removers)
        assert 5 == func.count()
        # check for leaks... periodic doesn't self-remove though
        assert 1 == len(ctx.group._periodic_callback_removers)
        ctx.group.remove_periodic_callback(cb_id)
        assert 0 == len(ctx.group._periodic_callback_removers)

    @flaky(max_runs=10)
    def test_next_tick_does_not_run_if_removed_immediately(self) -> None:
        with (LoopAndGroup(quit_after=15)) as ctx:
            func = _make_invocation_counter(ctx.io_loop)
            cb_id = make_id()
            ctx.group.add_next_tick_callback(callback=func, callback_id=cb_id)
            ctx.group.remove_next_tick_callback(cb_id)
        assert 0 == func.count()

    @flaky(max_runs=10)
    def test_timeout_does_not_run_if_removed_immediately(self) -> None:
        with (LoopAndGroup(quit_after=15)) as ctx:
            func = _make_invocation_counter(ctx.io_loop)
            cb_id = ctx.group.add_timeout_callback(callback=func, timeout_milliseconds=1, callback_id=make_id())
            ctx.group.remove_timeout_callback(cb_id)
        assert 0 == func.count()

    @flaky(max_runs=10)
    def test_periodic_does_not_run_if_removed_immediately(self) -> None:
        with (LoopAndGroup(quit_after=15)) as ctx:
            func = _make_invocation_counter(ctx.io_loop, stop_after=5)
            cb_id = make_id()
            ctx.group.add_periodic_callback(callback=func, period_milliseconds=1, callback_id=cb_id)
            ctx.group.remove_periodic_callback(cb_id)
        assert 0 == func.count()

    @flaky(max_runs=10)
    def test_same_callback_as_all_three_types(self) -> None:
        with (LoopAndGroup()) as ctx:
            func = _make_invocation_counter(ctx.io_loop, stop_after=5)
            # we want the timeout and next_tick to run before the periodic
            ctx.group.add_periodic_callback(callback=func, period_milliseconds=2, callback_id=make_id())
            ctx.group.add_timeout_callback(callback=func, timeout_milliseconds=1, callback_id=make_id())
            ctx.group.add_next_tick_callback(callback=func, callback_id=make_id())
        assert 5 == func.count()

    @flaky(max_runs=10)
    def test_adding_next_tick_twice(self) -> None:
        with (LoopAndGroup()) as ctx:
            func = _make_invocation_counter(ctx.io_loop, stop_after=2)
            ctx.group.add_next_tick_callback(callback=func, callback_id=make_id())
            ctx.group.add_next_tick_callback(callback=func, callback_id=make_id())
        assert 2 == func.count()

    @flaky(max_runs=10)
    def test_adding_timeout_twice(self) -> None:
        with (LoopAndGroup()) as ctx:
            func = _make_invocation_counter(ctx.io_loop, stop_after=2)
            ctx.group.add_timeout_callback(callback=func, timeout_milliseconds=1, callback_id=make_id())
            ctx.group.add_timeout_callback(callback=func, timeout_milliseconds=2, callback_id=make_id())
        assert 2 == func.count()

    @flaky(max_runs=10)
    def test_adding_periodic_twice(self) -> None:
        with (LoopAndGroup()) as ctx:
            func = _make_invocation_counter(ctx.io_loop, stop_after=2)
            ctx.group.add_periodic_callback(callback=func, period_milliseconds=3, callback_id=make_id())
            ctx.group.add_periodic_callback(callback=func, period_milliseconds=2, callback_id=make_id())
        assert 2 == func.count()

    @flaky(max_runs=10)
    def test_remove_all_callbacks(self) -> None:
        with (LoopAndGroup(quit_after=15)) as ctx:
            # add a callback that will remove all the others
            def remove_all():
                ctx.group.remove_all_callbacks()
            ctx.group.add_next_tick_callback(callback=remove_all, callback_id=make_id())
            # none of these should run
            func = _make_invocation_counter(ctx.io_loop, stop_after=5)
            ctx.group.add_periodic_callback(callback=func, period_milliseconds=2, callback_id=make_id())
            ctx.group.add_timeout_callback(callback=func, timeout_milliseconds=1, callback_id=make_id())
            ctx.group.add_next_tick_callback(callback=func, callback_id=make_id())
        assert 0 == func.count()

    @flaky(max_runs=10)
    def test_removing_next_tick_twice(self) -> None:
        with (LoopAndGroup(quit_after=15)) as ctx:
            func = _make_invocation_counter(ctx.io_loop)
            cb_id = make_id()
            ctx.group.add_next_tick_callback(callback=func, callback_id=cb_id)
            ctx.group.remove_next_tick_callback(cb_id)
            with pytest.raises(ValueError) as exc:
                ctx.group.remove_next_tick_callback(cb_id)
        assert 0 == func.count()
        assert "twice" in repr(exc.value)

    @flaky(max_runs=10)
    def test_removing_timeout_twice(self) -> None:
        with (LoopAndGroup(quit_after=15)) as ctx:
            func = _make_invocation_counter(ctx.io_loop)
            cb_id = make_id()
            ctx.group.add_timeout_callback(callback=func, timeout_milliseconds=1, callback_id=cb_id)
            ctx.group.remove_timeout_callback(cb_id)
            with pytest.raises(ValueError) as exc:
                ctx.group.remove_timeout_callback(cb_id)
        assert 0 == func.count()
        assert "twice" in repr(exc.value)

    @flaky(max_runs=10)
    def test_removing_periodic_twice(self) -> None:
        with (LoopAndGroup(quit_after=15)) as ctx:
            func = _make_invocation_counter(ctx.io_loop, stop_after=5)
            cb_id = make_id()
            ctx.group.add_periodic_callback(callback=func, period_milliseconds=1, callback_id=cb_id)
            ctx.group.remove_periodic_callback(cb_id)
            with pytest.raises(ValueError) as exc:
                ctx.group.remove_periodic_callback(cb_id)
        assert 0 == func.count()
        assert "twice" in repr(exc.value)

    @flaky(max_runs=10)
    def test_adding_next_tick_from_another_thread(self) -> None:
        # The test has probabilistic nature - there's a slight change it'll give a false negative
        with LoopAndGroup(quit_after=15) as ctx:
            n = 1000
            func = _make_invocation_counter(ctx.io_loop, stop_after=n)
            tpe = ThreadPoolExecutor(n)
            def make_cb(cb):
                return ctx.group.add_next_tick_callback(cb, callback_id=make_id())
            list(tpe.map(make_cb, repeat(func, n)))
        assert n == func.count()

#-----------------------------------------------------------------------------
# Dev API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Private API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Code
#-----------------------------------------------------------------------------
