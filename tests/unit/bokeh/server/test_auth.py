#-----------------------------------------------------------------------------
# Copyright (c) Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------

from __future__ import annotations

import asyncio

from bokeh.server.auth import AuthPolicy
from bokeh.server.request import ServerRequest


async def test_sync_authenticator() -> None:
    request = ServerRequest(method="GET", uri="/", path="/")
    policy = AuthPolicy(lambda request: "alice")

    assert await policy.authenticate(request) == "alice"


async def test_async_authenticator() -> None:
    async def authenticate(request: ServerRequest) -> str:
        await asyncio.sleep(0)
        return "alice"

    request = ServerRequest(method="GET", uri="/", path="/")
    policy = AuthPolicy(authenticate)

    assert await policy.authenticate(request) == "alice"


def test_login_and_logout_urls() -> None:
    request = ServerRequest(method="GET", uri="/plot", path="/plot")

    fixed = AuthPolicy(lambda request: None, login_url="/login", logout_url="/logout")
    dynamic = AuthPolicy(lambda request: None, login_url=lambda request: f"/login?next={request.path}")

    assert fixed.get_login_url(request) == "/login"
    assert fixed.logout_url == "/logout"
    assert dynamic.get_login_url(request) == "/login?next=/plot"
