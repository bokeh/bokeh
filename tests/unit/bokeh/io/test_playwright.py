#-----------------------------------------------------------------------------
# Copyright (c) Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Boilerplate
#-----------------------------------------------------------------------------
from __future__ import annotations

# Standard library imports
import asyncio
import multiprocessing
import os
import queue
import sys
import threading
import time
from typing import Any
from unittest.mock import MagicMock

# External imports
import pytest

#-----------------------------------------------------------------------------
# Imports
#-----------------------------------------------------------------------------


# Module under test
import bokeh.io.browser as bib # isort:skip

#-----------------------------------------------------------------------------
# General API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Dev API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Private API
#-----------------------------------------------------------------------------

async def _worker_identity() -> tuple[int, int, int, bool]:
    loop = asyncio.get_running_loop()
    is_supported = (sys.platform != "win32"
        or isinstance(loop, getattr(asyncio, "ProactorEventLoop")))
    return (os.getpid(), threading.get_ident(), id(loop), is_supported)


def _run_global_worker_in_child(connection: Any) -> None:
    try:
        identity = bib._playwright_thread.run(_worker_identity)
        state_was_reset = bib.playwright_control._playwright is None and bib.playwright_control._browser is None
        connection.send(("ok", (identity, id(bib.playwright_control), state_was_reset)))
    except BaseException as e:
        connection.send(("error", repr(e)))
    finally:
        bib._playwright_thread.shutdown()
        connection.close()


def test_playwright_thread_owns_one_event_loop() -> None:
    playwright_thread = bib._PlaywrightThread()

    try:
        first = playwright_thread.run(_worker_identity)
        second = playwright_thread.run(_worker_identity)
    finally:
        playwright_thread.shutdown()

    assert first[1] != threading.get_ident()
    assert first == second
    assert first[3]


def test_playwright_thread_propagates_cancellation() -> None:
    playwright_thread = bib._PlaywrightThread()

    async def cancel() -> None:
        raise asyncio.CancelledError

    try:
        with pytest.raises(asyncio.CancelledError):
            playwright_thread.run(cancel)
        assert playwright_thread.run(_worker_identity)[0] == os.getpid()
    finally:
        playwright_thread.shutdown()


@pytest.mark.skipif(not hasattr(os, "fork"), reason="requires POSIX fork")
def test_playwright_thread_restarts_after_fork() -> None:
    context = multiprocessing.get_context("fork")
    receiver, sender = context.Pipe(duplex=False)
    process = context.Process(target=_run_global_worker_in_child, args=(sender,))

    bib._cleanup()
    parent_identity = bib._playwright_thread.run(_worker_identity)
    parent_state = id(bib.playwright_control)

    try:
        process.start()
        sender.close()
        process.join(timeout=10)

        if process.is_alive():
            process.kill()
            process.join()
            pytest.fail("forked child blocked waiting for the inherited Playwright worker")

        assert process.exitcode == 0
        assert receiver.poll(timeout=1)
        status, value = receiver.recv()
        assert status == "ok", value
        child_identity, child_state, state_was_reset = value
        assert child_identity[0] != parent_identity[0]
        assert child_state != parent_state
        assert state_was_reset
    finally:
        if process.is_alive():
            process.kill()
            process.join()
        sender.close()
        receiver.close()
        bib._cleanup()


def test_playwright_thread_serializes_shutdown_and_submissions() -> None:
    playwright_thread = bib._PlaywrightThread()
    entered = threading.Event()
    release = threading.Event()
    errors = queue.Queue[BaseException]()

    async def blocking_task() -> None:
        entered.set()
        while not release.is_set():
            await asyncio.sleep(0.01)

    def submit() -> None:
        try:
            playwright_thread.run(blocking_task)
        except BaseException as e:
            errors.put(e)

    submitter = threading.Thread(target=submit)
    shutdown = threading.Thread(target=playwright_thread.shutdown)

    try:
        submitter.start()
        assert entered.wait(timeout=5)
        shutdown.start()

        deadline = time.monotonic() + 5
        while not playwright_thread._stopping and time.monotonic() < deadline:
            time.sleep(0.01)
        assert playwright_thread._stopping

        with pytest.raises(RuntimeError, match="shutting down"):
            playwright_thread.run(_worker_identity)
    finally:
        release.set()
        submitter.join(timeout=5)
        shutdown.join(timeout=5)

    assert not submitter.is_alive()
    assert not shutdown.is_alive()
    assert errors.empty()
    assert not playwright_thread._started
    assert not playwright_thread._stopping

    try:
        assert playwright_thread.run(_worker_identity)[0] == os.getpid()
    finally:
        playwright_thread.shutdown()


def test_wait_until_render_complete_wraps_multistatement_loaded_check() -> None:
    page = MagicMock()

    bib.wait_until_render_complete(page, timeout=5)

    loaded_check = page.wait_for_function.call_args_list[0].args[0]
    assert loaded_check.startswith("() => { const mount = ")
    assert "return typeof Bokeh" in loaded_check

#-----------------------------------------------------------------------------
# Code
#-----------------------------------------------------------------------------
