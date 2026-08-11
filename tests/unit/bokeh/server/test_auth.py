#-----------------------------------------------------------------------------
# Copyright (c) Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------

from __future__ import annotations

# Standard library imports
import asyncio
from threading import get_ident

# Bokeh imports
from bokeh.server.auth import AuthPolicy
from bokeh.server.request import ServerRequest


async def test_sync_authenticator() -> None:
    request = ServerRequest(method="GET", uri="/", path="/")
    loop_thread = get_ident()
    auth_thread = None

    def authenticate(request: ServerRequest) -> str:
        nonlocal auth_thread
        auth_thread = get_ident()
        return "alice"

    policy = AuthPolicy(authenticate)

    assert await policy.authenticate(request) == "alice"
    assert auth_thread != loop_thread


async def test_async_authenticator() -> None:
    loop_thread = get_ident()
    auth_thread = None

    async def authenticate(request: ServerRequest) -> str:
        nonlocal auth_thread
        auth_thread = get_ident()
        await asyncio.sleep(0)
        return "alice"

    request = ServerRequest(method="GET", uri="/", path="/")
    policy = AuthPolicy(authenticate)

    assert await policy.authenticate(request) == "alice"
    assert auth_thread == loop_thread


def test_login_and_logout_urls() -> None:
    request = ServerRequest(method="GET", uri="/plot", path="/plot")

    fixed = AuthPolicy(lambda request: None, login_url="/login", logout_url="/logout")
    dynamic = AuthPolicy(lambda request: None, login_url=lambda request: f"/login?next={request.path}")

    assert fixed.get_login_url(request) == "/login"
    assert fixed.logout_url == "/logout"
    assert dynamic.get_login_url(request) == "/login?next=/plot"


async def test_dynamic_login_url_runs_in_worker() -> None:
    request = ServerRequest(method="GET", uri="/plot", path="/plot")
    loop_thread = get_ident()
    login_thread = None

    def get_login_url(request: ServerRequest) -> str:
        nonlocal login_thread
        login_thread = get_ident()
        return f"/login?next={request.path}"

    policy = AuthPolicy(lambda request: None, login_url=get_login_url)

    assert await policy.get_login_url_async(request) == "/login?next=/plot"
    assert login_thread != loop_thread
