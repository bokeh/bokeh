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
import gc
import logging
import threading
from threading import Event, get_ident

# External imports
from tornado.ioloop import IOLoop

# Bokeh imports
from bokeh.application import Application
from bokeh.application.handlers import CodeHandler, FunctionHandler
from bokeh.application.handlers.lifecycle import LifecycleHandler
from bokeh.document import without_document_lock
from bokeh.events import ConnectionLost
from bokeh.io import curdoc
from bokeh.models import Slider

# Module under test
import bokeh.server.contexts as bsc # isort:skip

#-----------------------------------------------------------------------------
# Setup
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# General API
#-----------------------------------------------------------------------------

async def _wait_for_event(event: threading.Event) -> None:
    async with asyncio.timeout(1):
        while not event.is_set():
            await asyncio.sleep(0)


class TestBokehServerContext:
    def test_init(self) -> None:
        ac = bsc.ApplicationContext("app", io_loop="ioloop")
        c = bsc.BokehServerContext(ac)
        assert c.application_context == ac
        assert len(gc.get_referrers(ac)) == 0

    def test_sessions(self) -> None:
        ac = bsc.ApplicationContext("app", io_loop="ioloop")
        ac._sessions = dict(foo=1, bar=2)
        c = bsc.BokehServerContext(ac)
        assert set(c.sessions) == {1, 2}


class TestBokehSessionContext:
    def test_init(self) -> None:
        ac = bsc.ApplicationContext("app", io_loop="ioloop")
        sc = bsc.BokehServerContext(ac)
        c = bsc.BokehSessionContext("id", sc, "doc")
        assert c.session is None
        assert c.request is None
        assert not c.destroyed
        assert c.logout_url is None

    def test_destroyed(self) -> None:
        class FakeSession:
            destroyed = False
        ac = bsc.ApplicationContext("app", io_loop="ioloop")
        sc = bsc.BokehServerContext(ac)
        c = bsc.BokehSessionContext("id", sc, "doc")
        sess = FakeSession()
        c._session = sess
        assert not c.destroyed
        sess.destroyed = True
        assert c.destroyed

    def test_logout_url(self) -> None:
        ac = bsc.ApplicationContext("app", io_loop="ioloop")
        sc = bsc.BokehServerContext(ac)
        c = bsc.BokehSessionContext("id", sc, "doc", logout_url="/logout")
        assert c.session is None
        assert c.request is None
        assert not c.destroyed
        assert c.logout_url == "/logout"


class TestApplicationContext:
    def test_init(self) -> None:
        c = bsc.ApplicationContext("app", io_loop="ioloop")
        assert c.io_loop == "ioloop"
        assert c.application == "app"
        assert c.url is None

        c = bsc.ApplicationContext("app", io_loop="ioloop", url="url")
        assert c.io_loop == "ioloop"
        assert c.application == "app"
        assert c.url == "url"

    def test_sessions(self) -> None:
        c = bsc.ApplicationContext("app", io_loop="ioloop")
        c._sessions = dict(foo=1, bar=2)
        assert set(c.sessions) == {1, 2}

    def test_get_session_success(self) -> None:
        c = bsc.ApplicationContext("app", io_loop="ioloop")
        c._sessions = dict(foo=1, bar=2)
        assert c.get_session("foo") == 1

    def test_get_session_failure(self) -> None:
        c = bsc.ApplicationContext("app", io_loop="ioloop")
        c._sessions = dict(foo=1, bar=2)
        with pytest.raises(bsc.ProtocolError) as e:
            c.get_session("bax")
        assert str(e.value).endswith("No such session bax")

    async def test_create_session_if_needed_new(self) -> None:
        app = Application()
        c = bsc.ApplicationContext(app, io_loop="ioloop")
        s = await c.create_session_if_needed("foo")
        assert c.get_session("foo") == s

    async def test_create_session_uses_running_loop_by_default(self) -> None:
        app = Application()
        c = bsc.ApplicationContext(app)
        session = await c.create_session_if_needed("foo")
        assert session._loop is asyncio.get_running_loop()

    async def test_create_session_if_needed_exists(self) -> None:
        app = Application()
        c = bsc.ApplicationContext(app, io_loop="ioloop")
        s1 = await c.create_session_if_needed("foo")
        s2 = await c.create_session_if_needed("foo")
        assert s1 == s2

    async def test_document_initialization_does_not_block_event_loop(self) -> None:
        started = threading.Event()
        release = threading.Event()

        def modify_document(doc) -> None:
            started.set()
            release.wait()

        app = Application(FunctionHandler(modify_document))
        c = bsc.ApplicationContext(app, io_loop=asyncio.get_running_loop())
        task = asyncio.create_task(c.create_session_if_needed("foo"))

        try:
            await _wait_for_event(started)
            # This timeout would fire if modify_document still occupied the loop.
            await asyncio.wait_for(asyncio.sleep(0), 0.1)
        finally:
            release.set()
        await task

    async def test_document_initialization_is_concurrent_per_application(self) -> None:
        slow_started = threading.Event()
        slow_release = threading.Event()

        def modify_document(doc) -> None:
            if doc.session_context.id == "slow":
                slow_started.set()
                assert slow_release.wait(timeout=2)

        app = Application(FunctionHandler(modify_document))
        c = bsc.ApplicationContext(app, io_loop=asyncio.get_running_loop())

        slow = asyncio.create_task(c.create_session_if_needed("slow"))
        try:
            await _wait_for_event(slow_started)
            fast = await asyncio.wait_for(c.create_session_if_needed("fast"), timeout=1)
            assert fast.id == "fast"
        finally:
            slow_release.set()

        assert (await slow).id == "slow"

    async def test_session_created_does_not_block_other_sessions(self) -> None:
        slow_started = threading.Event()
        slow_release = threading.Event()
        handler = LifecycleHandler()

        def on_session_created(session_context) -> None:
            if session_context.id == "slow":
                slow_started.set()
                assert slow_release.wait(timeout=2)

        handler._on_session_created = on_session_created
        app = Application(handler)
        c = bsc.ApplicationContext(app, io_loop=asyncio.get_running_loop())

        slow = asyncio.create_task(c.create_session_if_needed("slow"))
        try:
            await _wait_for_event(slow_started)
            fast = await asyncio.wait_for(c.create_session_if_needed("fast"), timeout=1)
            assert fast.id == "fast"
        finally:
            slow_release.set()

        assert (await slow).id == "slow"

    async def test_failed_document_initialization_can_be_retried(self) -> None:
        attempts = 0

        def modify_document(doc) -> None:
            nonlocal attempts
            attempts += 1
            if attempts == 1:
                raise RuntimeError("initialization failed")

        app = Application(FunctionHandler(modify_document))
        c = bsc.ApplicationContext(app, io_loop=asyncio.get_running_loop())

        with pytest.raises(RuntimeError, match="initialization failed"):
            await c.create_session_if_needed("foo")
        session = await c.create_session_if_needed("foo")

        assert session.id == "foo"
        assert attempts == 2

    async def test_concurrent_waiters_share_session_creation(self) -> None:
        started = threading.Event()
        release = threading.Event()
        attempts = 0

        def modify_document(doc) -> None:
            nonlocal attempts
            attempts += 1
            started.set()
            assert release.wait(timeout=2)

        app = Application(FunctionHandler(modify_document))
        c = bsc.ApplicationContext(app, io_loop=asyncio.get_running_loop())

        first = asyncio.create_task(c.create_session_if_needed("foo"))
        try:
            await _wait_for_event(started)
            second = asyncio.create_task(c.create_session_if_needed("foo"))
            await asyncio.sleep(0)
            assert not second.done()
        finally:
            release.set()

        first_session, second_session = await asyncio.gather(first, second)
        assert first_session is second_session
        assert attempts == 1

    async def test_cancelling_waiter_does_not_cancel_session_creation(self) -> None:
        started = threading.Event()
        release = threading.Event()

        def modify_document(doc) -> None:
            started.set()
            assert release.wait(timeout=2)

        app = Application(FunctionHandler(modify_document))
        c = bsc.ApplicationContext(app, io_loop=asyncio.get_running_loop())

        first = asyncio.create_task(c.create_session_if_needed("foo"))
        try:
            await _wait_for_event(started)

            first.cancel()
            with pytest.raises(asyncio.CancelledError):
                await first

            second = asyncio.create_task(c.create_session_if_needed("foo"))
        finally:
            release.set()

        assert (await second).id == "foo"

    async def test_concurrent_waiters_share_session_creation_failure(self) -> None:
        started = threading.Event()
        release = threading.Event()
        attempts = 0

        def modify_document(doc) -> None:
            nonlocal attempts
            attempts += 1
            started.set()
            assert release.wait(timeout=2)
            raise RuntimeError("shared failure")

        app = Application(FunctionHandler(modify_document))
        c = bsc.ApplicationContext(app, io_loop=asyncio.get_running_loop())

        first = asyncio.create_task(c.create_session_if_needed("foo"))
        try:
            await _wait_for_event(started)
            second = asyncio.create_task(c.create_session_if_needed("foo"))
            await asyncio.sleep(0)
        finally:
            release.set()

        results = await asyncio.gather(first, second, return_exceptions=True)
        assert all(isinstance(result, RuntimeError) for result in results)
        assert all(str(result) == "shared failure" for result in results)
        assert attempts == 1

    async def test_abandoned_session_creation_failure_is_logged(self, caplog: pytest.LogCaptureFixture) -> None:
        started = threading.Event()
        release = threading.Event()

        def modify_document(doc) -> None:
            started.set()
            assert release.wait(timeout=2)
            raise RuntimeError("failed after disconnect")

        app = Application(FunctionHandler(modify_document))
        c = bsc.ApplicationContext(app, io_loop=asyncio.get_running_loop())

        waiter = asyncio.create_task(c.create_session_if_needed("foo"))
        try:
            await _wait_for_event(started)

            waiter.cancel()
            with pytest.raises(asyncio.CancelledError):
                await waiter
        finally:
            release.set()

        with caplog.at_level(logging.ERROR):
            async with asyncio.timeout(1):
                while c._pending_sessions:
                    await asyncio.sleep(0)

        assert "Failed to create session 'foo': failed after disconnect" in caplog.text

    async def test_shutdown_pending_sessions_prevents_session_registration(self) -> None:
        started = threading.Event()
        release = threading.Event()

        def modify_document(doc) -> None:
            started.set()
            assert release.wait(timeout=2)

        app = Application(FunctionHandler(modify_document))
        c = bsc.ApplicationContext(app, io_loop=asyncio.get_running_loop())

        pending = asyncio.create_task(c.create_session_if_needed("foo"))
        try:
            await _wait_for_event(started)
            shutdown = asyncio.create_task(c._shutdown_pending_sessions())
            await asyncio.sleep(0)
            assert not shutdown.done()
        finally:
            release.set()

        await shutdown
        with pytest.raises(asyncio.CancelledError):
            await pending
        assert not c._pending_sessions
        assert not list(c.sessions)

    async def test_code_handler_uses_context_local_curdoc_on_event_loop(self) -> None:
        handler = CodeHandler(filename="app.py", source="""
from threading import get_ident
from bokeh.io import curdoc

assert curdoc().session_context.id == "foo"
curdoc().template_variables["thread_id"] = get_ident()
""")
        c = bsc.ApplicationContext(Application(handler), io_loop=asyncio.get_running_loop())
        loop_doc = curdoc()

        session = await c.create_session_if_needed("foo")
        assert not handler.failed
        assert curdoc() is loop_doc
        assert session.document.template_variables["thread_id"] == threading.get_ident()

    async def test_discard_bookkeeping_runs_on_event_loop(self) -> None:
        c = bsc.ApplicationContext(Application(), io_loop=asyncio.get_running_loop())
        session = await c.create_session_if_needed("foo")
        session.request_expiration()
        destroy_threads: list[int] = []
        original_destroy = session.destroy

        def destroy() -> None:
            destroy_threads.append(threading.get_ident())
            original_destroy()

        session.destroy = destroy
        await c._cleanup_sessions(1)

        assert destroy_threads == [threading.get_ident()]
        assert not list(c.sessions)

    async def test_concurrent_discard_runs_destroy_hook_once(self) -> None:
        app = Application()
        destroyed = 0

        async def on_session_destroyed(session_context) -> None:
            nonlocal destroyed
            destroyed += 1

        app.on_session_destroyed = on_session_destroyed
        c = bsc.ApplicationContext(app, io_loop=asyncio.get_running_loop())
        session = await c.create_session_if_needed("foo")
        both_started = asyncio.Event()
        first_checked = asyncio.Event()
        second_finished = asyncio.Event()
        arrivals = 0

        async def with_document_locked(func, *args, **kwargs):
            nonlocal arrivals
            position = arrivals
            arrivals += 1
            session.block_expiration()
            if arrivals == 2:
                both_started.set()
            await both_started.wait()

            if position == 0:
                result = await func(*args, **kwargs)
                session.unblock_expiration()
                first_checked.set()
                await second_finished.wait()
                return result

            await first_checked.wait()
            result = await func(*args, **kwargs)
            session.unblock_expiration()
            second_finished.set()
            return result

        session.with_document_locked = with_document_locked
        await asyncio.gather(
            c._discard_session(session, lambda session: True),
            c._discard_session(session, lambda session: True),
        )

        assert destroyed == 1
        assert session.destroyed
        assert not list(c.sessions)

    async def test_create_session_if_needed_bad_sessionid(self) -> None:
        app = Application()
        c = bsc.ApplicationContext(app, io_loop="ioloop")
        r = c.create_session_if_needed("")
        with pytest.raises(bsc.ProtocolError) as e:
            await r
        assert str(e.value).endswith("Session ID must not be empty")

    async def test_create_session_if_needed_logout_url(self) -> None:
        app = Application()
        c = bsc.ApplicationContext(app, io_loop="ioloop", logout_url="/logout")
        s = await c.create_session_if_needed("foo")
        session = c.get_session("foo")
        assert session == s
        assert c._session_contexts[session.id].logout_url == "/logout"

    async def test_async_next_tick_callback_is_called(self) -> None:
        app = Application()
        c = bsc.ApplicationContext(app, io_loop=IOLoop.current())

        s = await c.create_session_if_needed("foo")

        latch_f = asyncio.Future()
        result_f = asyncio.Future()

        async def cb():
            m = await latch_f
            result_f.set_result(m)

        s.document.add_next_tick_callback(cb)

        message = 'Done'
        latch_f.set_result(message)
        result = await asyncio.wait_for(result_f, 1)
        assert result == message

    @pytest.mark.parametrize("callback_type", ["next_tick", "timeout", "periodic"])
    async def test_sync_session_callbacks_run_in_worker(
            self, callback_type: str) -> None:
        app = Application()
        c = bsc.ApplicationContext(app, io_loop=IOLoop.current())
        session = await c.create_session_if_needed("foo")
        loop_thread = get_ident()
        callback_thread = None
        started = Event()
        release = Event()
        finished = Event()
        periodic = None

        def callback() -> None:
            nonlocal callback_thread
            callback_thread = get_ident()
            assert curdoc() is session.document
            if periodic is not None:
                session.document.remove_periodic_callback(periodic)
            started.set()
            assert release.wait(timeout=2)
            finished.set()

        if callback_type == "next_tick":
            session.document.add_next_tick_callback(callback)
        elif callback_type == "timeout":
            session.document.add_timeout_callback(callback, 1)
        else:
            periodic = session.document.add_periodic_callback(callback, 1)

        try:
            await _wait_for_event(started)
            heartbeat = asyncio.Event()
            asyncio.get_running_loop().call_soon(heartbeat.set)
            await asyncio.wait_for(heartbeat.wait(), 1)
        finally:
            release.set()
        await _wait_for_event(finished)

        assert callback_thread != loop_thread

    async def test_sync_unlocked_callback_runs_in_worker(self) -> None:
        app = Application()
        c = bsc.ApplicationContext(app, io_loop=IOLoop.current())
        session = await c.create_session_if_needed("foo")
        loop_thread = get_ident()
        callback_thread = None
        callback_doc = None
        finished = Event()

        @without_document_lock
        def callback() -> None:
            nonlocal callback_doc, callback_thread
            callback_thread = get_ident()
            callback_doc = curdoc()
            finished.set()

        session.document.add_next_tick_callback(callback)
        await _wait_for_event(finished)

        assert callback_thread != loop_thread
        assert callback_doc is not None
        with pytest.raises(AttributeError, match="Only 'add_next_tick_callback'"):
            callback_doc.title

    @pytest.mark.free_threading
    async def test_session_callbacks_are_serialized(self) -> None:
        app = Application()
        c = bsc.ApplicationContext(app, io_loop=IOLoop.current())
        session = await c.create_session_if_needed("foo")
        state_lock = threading.Lock()
        active = 0
        maximum_active = 0

        def callback() -> None:
            nonlocal active, maximum_active
            with state_lock:
                active += 1
                maximum_active = max(maximum_active, active)
            Event().wait(0.02)
            with state_lock:
                active -= 1

        await asyncio.gather(
            session.with_document_locked(callback),
            session.with_document_locked(callback),
        )

        assert maximum_active == 1

    @pytest.mark.free_threading
    async def test_different_session_callbacks_can_run_concurrently(self) -> None:
        app = Application()
        c = bsc.ApplicationContext(app, io_loop=IOLoop.current())
        first = await c.create_session_if_needed("first")
        second = await c.create_session_if_needed("second")
        barrier = threading.Barrier(2)

        def callback() -> None:
            barrier.wait(timeout=1)

        await asyncio.gather(
            first.with_document_locked(callback),
            second.with_document_locked(callback),
        )

    async def test_async_session_callback_runs_on_event_loop(self) -> None:
        app = Application()
        c = bsc.ApplicationContext(app, io_loop=IOLoop.current())
        session = await c.create_session_if_needed("foo")
        loop_thread = get_ident()
        callback_thread = None

        async def callback() -> None:
            nonlocal callback_thread
            callback_thread = get_ident()
            await asyncio.sleep(0)

        await session.with_document_locked(callback)

        assert callback_thread == loop_thread

    async def test_callback_can_schedule_timers_from_worker(self) -> None:
        app = Application()
        c = bsc.ApplicationContext(app, io_loop=IOLoop.current())
        session = await c.create_session_if_needed("foo")
        timeout_finished = Event()
        periodic_finished = Event()
        periodic = None

        def periodic_callback() -> None:
            assert periodic is not None
            session.document.remove_periodic_callback(periodic)
            periodic_finished.set()

        def callback() -> None:
            nonlocal periodic
            session.document.add_timeout_callback(timeout_finished.set, 1)
            periodic = session.document.add_periodic_callback(periodic_callback, 1)

        await session.with_document_locked(callback)
        await _wait_for_event(timeout_finished)
        await _wait_for_event(periodic_finished)

    async def test_cancelling_locked_callback_waits_for_worker(self) -> None:
        app = Application()
        c = bsc.ApplicationContext(app, io_loop=IOLoop.current())
        session = await c.create_session_if_needed("foo")
        started = Event()
        release = Event()
        finished = Event()

        def callback() -> None:
            started.set()
            assert release.wait(timeout=2)
            session.document.title = "finished"
            finished.set()

        task = asyncio.create_task(session.with_document_locked(callback))
        await _wait_for_event(started)
        task.cancel()
        await asyncio.sleep(0)

        assert not task.done()
        assert session.expiration_blocked

        release.set()
        with pytest.raises(asyncio.CancelledError):
            await task

        assert finished.is_set()
        assert session.document.title == "finished"
        assert not session.expiration_blocked

    async def test_locked_callback_can_raise_cancelled_error(self) -> None:
        app = Application()
        c = bsc.ApplicationContext(app, io_loop=asyncio.get_running_loop())
        session = await c.create_session_if_needed("foo")

        def callback() -> None:
            raise asyncio.CancelledError

        async with asyncio.timeout(1):
            with pytest.raises(asyncio.CancelledError):
                await session.with_document_locked(callback)

        assert not session.expiration_blocked

    async def test_protocol_callback_runs_in_worker(self, monkeypatch: pytest.MonkeyPatch) -> None:
        app = Application()
        c = bsc.ApplicationContext(app, io_loop=IOLoop.current())
        session = await c.create_session_if_needed("foo")
        slider = Slider()
        await session.with_document_locked(session.document.add_root, slider)
        loop_thread = get_ident()
        apply_thread = None
        model_callback_thread = None
        document_callback_thread = None

        def model_callback(attr, old, new):
            nonlocal model_callback_thread
            model_callback_thread = get_ident()
            assert curdoc() is session.document

        def document_callback(event):
            nonlocal document_callback_thread
            if getattr(event, "attr", None) == "value":
                document_callback_thread = get_ident()
                assert curdoc() is session.document

        slider.on_change("value", model_callback)
        session.document.on_change(document_callback)

        def apply_patch(message, doc, setter):
            nonlocal apply_thread
            apply_thread = get_ident()
            assert doc is session.document
            assert setter is session
            slider.value = 1

        monkeypatch.setattr("bokeh.server.session.apply_patch", apply_patch)

        class Message:
            pass

        class Connection:
            def ok(self, message):
                assert get_ident() == loop_thread
                return "ok"

        result = await session._handle_patch(Message(), Connection())

        assert result == "ok"
        assert apply_thread != loop_thread
        assert model_callback_thread == apply_thread
        assert document_callback_thread == apply_thread

    async def test_connection_lost_callback_runs_in_worker_with_curdoc(self) -> None:
        app = Application()
        c = bsc.ApplicationContext(app, io_loop=IOLoop.current())
        session = await c.create_session_if_needed("foo")
        loop_thread = get_ident()
        callback_thread = None
        finished = Event()

        def callback(event) -> None:
            nonlocal callback_thread
            callback_thread = get_ident()
            assert curdoc() is session.document
            finished.set()

        session.document.on_event(ConnectionLost, callback)
        session.notify_connection_lost()
        await _wait_for_event(finished)

        assert callback_thread != loop_thread

#-----------------------------------------------------------------------------
# Dev API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Private API
#-----------------------------------------------------------------------------

class Test_RequestProxy:
    def test_getattr_forwards_request_attributes(self) -> None:
        class Request:
            uri = "/app"

        proxy = bsc._RequestProxy(Request())
        assert proxy.uri == "/app"

    def test_getattr_raises_for_unknown_attribute(self) -> None:
        class Request:
            pass

        proxy = bsc._RequestProxy(Request())
        with pytest.raises(AttributeError, match="missing"):
            proxy.missing

    def test_getattr_raises_for_none_attribute(self) -> None:
        class Request:
            value = None

        proxy = bsc._RequestProxy(Request())
        with pytest.raises(AttributeError, match="value"):
            proxy.value

#-----------------------------------------------------------------------------
# Code
#-----------------------------------------------------------------------------
