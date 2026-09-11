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
from threading import Event, get_ident
from types import SimpleNamespace
from unittest.mock import AsyncMock, MagicMock

# Module under test
from bokeh.server.views.auth_request_handler import AuthRequestHandler # isort:skip

#-----------------------------------------------------------------------------
# Setup
#-----------------------------------------------------------------------------

def _make_handler(login_url=None, get_login_url=None, prefix=""):
    app = MagicMock()
    app.prefix = prefix
    app.auth_provider.login_url = login_url
    app.auth_provider.get_login_url = get_login_url

    handler = AuthRequestHandler.__new__(AuthRequestHandler)
    handler.application = app
    return handler

def _make_auth_handler(*, get_user=None, get_user_async=None, get_login_url=None):
    handler = _make_handler(get_login_url=get_login_url)
    handler.application.auth_provider.get_user = get_user
    handler.application.auth_provider.get_user_async = get_user_async
    handler.request = SimpleNamespace(method="GET")
    return handler

#-----------------------------------------------------------------------------
# General API
#-----------------------------------------------------------------------------

class TestGetLoginUrl:
    def test_login_url_no_prefix(self) -> None:
        handler = _make_handler(login_url="/login")
        assert handler.get_login_url() == "/login"

    def test_login_url_with_prefix(self) -> None:
        handler = _make_handler(login_url="/login", prefix="/pre")
        assert handler.get_login_url() == "/pre/login"

    def test_login_url_without_leading_slash(self) -> None:
        handler = _make_handler(login_url="login", prefix="/pre")
        assert handler.get_login_url() == "/pre/login"

    def test_login_url_with_trailing_slash(self) -> None:
        handler = _make_handler(login_url="/login/", prefix="/pre")
        assert handler.get_login_url() == "/pre/login/"

    def test_login_url_multi_segment_prefix(self) -> None:
        handler = _make_handler(login_url="/login", prefix="/a/b")
        assert handler.get_login_url() == "/a/b/login"

    def test_get_login_url_func_not_affected_by_prefix(self) -> None:
        handler = _make_handler(get_login_url=lambda req: "/custom_login", prefix="/pre")
        assert handler.get_login_url() == "/custom_login"

    def test_raises_when_no_login_url(self) -> None:
        handler = _make_handler()
        with pytest.raises(RuntimeError):
            handler.get_login_url()


class TestPrepare:
    async def test_sync_get_user_runs_in_worker(self) -> None:
        started = Event()
        release = Event()
        loop_thread = get_ident()
        auth_thread = None

        def get_user(handler):
            nonlocal auth_thread
            auth_thread = get_ident()
            started.set()
            assert release.wait(timeout=2)
            return "alice"

        handler = _make_auth_handler(get_user=get_user)
        pending = asyncio.create_task(handler.prepare())
        try:
            async with asyncio.timeout(1):
                while not started.is_set():
                    await asyncio.sleep(0)
            heartbeat = asyncio.Event()
            asyncio.get_running_loop().call_soon(heartbeat.set)
            await asyncio.wait_for(heartbeat.wait(), 1)
        finally:
            release.set()

        await pending
        assert handler.current_user == "alice"
        assert auth_thread != loop_thread

    async def test_async_get_user_runs_on_event_loop(self) -> None:
        loop_thread = get_ident()
        auth_thread = None

        async def get_user_async(handler):
            nonlocal auth_thread
            auth_thread = get_ident()
            await asyncio.sleep(0)
            return "alice"

        handler = _make_auth_handler(get_user_async=get_user_async)
        await handler.prepare()

        assert handler.current_user == "alice"
        assert auth_thread == loop_thread

    async def test_dynamic_login_url_is_computed_in_worker_and_cached(self) -> None:
        loop_thread = get_ident()
        login_thread = None
        calls = 0

        def get_user(handler):
            return None

        def get_login_url(handler):
            nonlocal calls, login_thread
            calls += 1
            login_thread = get_ident()
            return "/login"

        handler = _make_auth_handler(get_user=get_user, get_login_url=get_login_url)
        await handler.prepare()

        assert handler.get_login_url() == "/login"
        assert handler.get_login_url() == "/login"
        assert calls == 1
        assert login_thread != loop_thread

    async def test_sync_get_user_is_not_called_for_options(self) -> None:
        get_user = MagicMock()
        handler = _make_auth_handler(get_user=get_user)
        handler.request.method = "OPTIONS"

        await handler.prepare()

        get_user.assert_not_called()

    async def test_async_options_does_not_compute_login_url(self) -> None:
        get_user_async = AsyncMock(return_value=None)
        get_login_url = MagicMock(return_value="/login")
        handler = _make_auth_handler(
            get_user_async=get_user_async,
            get_login_url=get_login_url,
        )
        handler.request.method = "OPTIONS"

        await handler.prepare()

        get_user_async.assert_awaited_once_with(handler)
        get_login_url.assert_not_called()

#-----------------------------------------------------------------------------
# Dev API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Private API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Code
#-----------------------------------------------------------------------------
