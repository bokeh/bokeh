#-----------------------------------------------------------------------------
# Copyright (c) Anaconda, Inc. and contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------

from __future__ import annotations

# Standard library imports
import asyncio
import threading

# External imports
import pytest

# Bokeh imports
from bokeh.application import Application
from bokeh.application.handlers.function import FunctionHandler
from bokeh.protocol import Protocol
from bokeh.server.core import BokehServerCore
from bokeh.server.request import Cookie, Headers, ServerRequest
from bokeh.util.asyncio import _AsyncPeriodic
from bokeh.util.token import get_token_payload


async def test_periodic_callback_continues_after_exception() -> None:
    calls = 0
    called_again = asyncio.Event()

    def callback() -> None:
        nonlocal calls
        calls += 1
        if calls == 1:
            raise RuntimeError("transient failure")
        called_again.set()

    periodic = _AsyncPeriodic(callback, 1, asyncio.get_running_loop())
    periodic.start()
    try:
        await asyncio.wait_for(called_again.wait(), 1)
    finally:
        periodic.stop()
        await periodic.wait()

    assert calls >= 2


async def test_stop_waits_for_periodic_jobs_before_unload() -> None:
    application = Application()
    unloaded = asyncio.Event()
    application.on_server_unloaded = lambda context: unloaded.set()
    core = BokehServerCore(
        application,
        keep_alive_milliseconds=0,
        check_unused_sessions_milliseconds=1,
    )
    started = asyncio.Event()
    release = asyncio.Event()

    async def cleanup() -> None:
        started.set()
        try:
            await release.wait()
        except asyncio.CancelledError:
            await release.wait()
            raise

    core._cleanup_sessions = cleanup
    await core.start()
    await asyncio.wait_for(started.wait(), 1)

    stopping = asyncio.create_task(core.stop())
    await asyncio.sleep(0)
    assert not stopping.done()
    assert not unloaded.is_set()

    release.set()
    await stopping
    assert unloaded.is_set()


async def test_stop_cancels_pending_sessions_before_waiting_for_jobs() -> None:
    initialization_started = threading.Event()
    initialization_release = threading.Event()
    job_started = asyncio.Event()
    job_release = asyncio.Event()

    def modify_document(doc) -> None:
        initialization_started.set()
        assert initialization_release.wait(timeout=2)

    core = BokehServerCore(
        Application(FunctionHandler(modify_document)),
        keep_alive_milliseconds=0,
        check_unused_sessions_milliseconds=1,
    )

    async def cleanup() -> None:
        job_started.set()
        try:
            await job_release.wait()
        except asyncio.CancelledError:
            await job_release.wait()
            raise

    core._cleanup_sessions = cleanup
    await core.start()
    context = core.applications["/"]
    pending_waiter = asyncio.create_task(context.create_session_if_needed("session"))
    await asyncio.wait_for(asyncio.to_thread(initialization_started.wait), 1)
    await asyncio.wait_for(job_started.wait(), 1)
    pending_initializer = context._pending_sessions["session"]

    stopping = asyncio.create_task(core.stop())
    async with asyncio.timeout(1):
        while not pending_initializer.cancelling():
            await asyncio.sleep(0)

    assert pending_initializer.cancelling()
    assert not stopping.done()

    initialization_release.set()
    job_release.set()
    await stopping
    with pytest.raises(asyncio.CancelledError):
        await pending_waiter


async def test_concurrent_stop_is_shared_and_rejects_new_work() -> None:
    application = Application()
    unload_count = 0

    def on_server_unloaded(server_context) -> None:
        nonlocal unload_count
        unload_count += 1

    application.on_server_unloaded = on_server_unloaded
    core = BokehServerCore(
        application,
        keep_alive_milliseconds=0,
        check_unused_sessions_milliseconds=1,
    )
    job_started = asyncio.Event()
    job_release = asyncio.Event()

    async def cleanup() -> None:
        job_started.set()
        try:
            await job_release.wait()
        except asyncio.CancelledError:
            await job_release.wait()
            raise

    core._cleanup_sessions = cleanup
    await core.start()
    context = core.applications["/"]
    session = await context.create_session_if_needed("session")
    await asyncio.wait_for(job_started.wait(), 1)

    first_stop = asyncio.create_task(core.stop())
    await asyncio.sleep(0)
    second_stop = asyncio.create_task(core.stop())
    await asyncio.sleep(0)

    assert core._stopping
    assert not first_stop.done()
    assert not second_stop.done()
    with pytest.raises(RuntimeError, match="stopping"):
        await core.start()
    with pytest.raises(RuntimeError, match="stopping"):
        await core.create_session(context, ServerRequest(method="GET", uri="/", path="/"))
    with pytest.raises(RuntimeError, match="stopping"):
        await core.create_session_if_needed(context, "new-session")
    with pytest.raises(RuntimeError, match="stopping"):
        core.new_connection(Protocol(), object(), context, session)
    assert not context._pending_sessions

    job_release.set()
    await asyncio.gather(first_stop, second_stop)

    assert unload_count == 1
    assert not core._started
    assert not core._stopping
    assert core._stop_task is None


async def test_stop_destroys_sessions_and_document_callbacks() -> None:
    application = Application()
    destroyed = asyncio.Event()

    async def on_session_destroyed(session_context) -> None:
        destroyed.set()

    application.on_session_destroyed = on_session_destroyed
    core = BokehServerCore(application, keep_alive_milliseconds=0)
    await core.start()
    context = core.applications["/"]
    session = await context.create_session_if_needed("session")
    calls = 0
    called = asyncio.Event()

    def callback() -> None:
        nonlocal calls
        calls += 1
        called.set()

    session.document.add_periodic_callback(callback, 1)
    await asyncio.wait_for(called.wait(), 1)
    await core.stop()
    calls_at_stop = calls
    await asyncio.sleep(0.02)

    assert destroyed.is_set()
    assert session.destroyed
    assert not list(context.sessions)
    assert calls == calls_at_stop


async def test_stop_detaches_connections_before_destroying_sessions() -> None:
    core = BokehServerCore(Application(), keep_alive_milliseconds=0)
    await core.start()
    context = core.applications["/"]
    session = await context.create_session_if_needed("session")
    connection = core.new_connection(Protocol(), object(), context, session)

    await core.stop()

    assert connection._session is None
    assert session.connection_count == 0
    assert session.destroyed
    assert not core._clients
    assert not list(context.sessions)


async def test_lifecycle_hooks_run_on_event_loop() -> None:
    application = Application()
    observed: list[asyncio.AbstractEventLoop] = []
    application.on_server_loaded = lambda context: observed.append(asyncio.get_running_loop())
    application.on_server_unloaded = lambda context: observed.append(asyncio.get_running_loop())
    core = BokehServerCore(application, keep_alive_milliseconds=0)

    await core.start()
    await core.stop()

    assert observed == [asyncio.get_running_loop(), asyncio.get_running_loop()]


def test_core_can_restart_on_a_new_event_loop() -> None:
    core = BokehServerCore(Application(), keep_alive_milliseconds=0)

    async def cycle() -> None:
        await core.start()
        await core.stop()

    asyncio.run(cycle())
    asyncio.run(cycle())


async def test_cookie_header_is_removed_case_insensitively_from_token() -> None:
    core = BokehServerCore(Application(), keep_alive_milliseconds=0, exclude_cookies=["secret"])
    request = ServerRequest(
        method="GET",
        uri="/",
        path="/",
        headers=Headers({"cookie": "secret=hidden; public=visible", "x-test": "visible"}),
        cookies={"secret": Cookie("hidden"), "public": Cookie("visible")},
    )
    await core.start()
    try:
        session = await core.create_session(core.applications["/"], request)
        payload = get_token_payload(session.token)

        assert payload["cookies"] == {"public": "visible"}
        assert payload["headers"] == {"x-test": "visible"}
    finally:
        await core.stop()
