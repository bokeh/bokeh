#-----------------------------------------------------------------------------
# Copyright (c) Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------

from __future__ import annotations

# Bokeh imports
from bokeh.server.request import Cookie, Headers, ServerRequest


def test_headers_are_case_insensitive() -> None:
    headers = Headers({"Content-Type": "text/plain", "X-Test": "value"})

    assert headers["content-type"] == "text/plain"
    assert headers["X-TEST"] == "value"
    assert list(headers) == ["Content-Type", "X-Test"]


def test_server_request_defaults() -> None:
    request = ServerRequest(method="GET", uri="/app", path="/app")

    assert request.arguments == {}
    assert request.headers == {}
    assert request.cookies == {}
    assert request.protocol == "http"


def test_server_request_cookie_values_match_tornado_shape() -> None:
    request = ServerRequest(
        method="GET",
        uri="/app",
        path="/app",
        cookies={"session": Cookie("abc")},
    )

    assert request.cookies["session"].value == "abc"
