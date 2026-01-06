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
import logging
from collections.abc import Callable
from typing import Generator

# External imports
from tornado.httpclient import HTTPClientError, HTTPRequest
from tornado.httpserver import HTTPServer
from tornado.websocket import WebSocketClosedError, websocket_connect

# Bokeh imports
from bokeh.application import Application
from bokeh.server.tornado import BokehTornado
from bokeh.server.views.auth_request_handler import AuthRequestHandler
from bokeh.util.logconfig import basicConfig
from bokeh.util.token import generate_jwt_token, generate_session_id

# Module under test
from bokeh.server.views.ws import WSHandler # isort:skip

#-----------------------------------------------------------------------------
# Setup
#-----------------------------------------------------------------------------

# needed for caplog tests to function
basicConfig()

pytestmark = [
    pytest.mark.filterwarnings("ignore:pytest-asyncio detected an unclosed event loop:DeprecationWarning"),
    pytest.mark.filterwarnings("ignore:clear_current is deprecated:DeprecationWarning"),
]

#-----------------------------------------------------------------------------
# General API
#-----------------------------------------------------------------------------

async def test_send_message_raises(caplog: pytest.LogCaptureFixture) -> None:
    class ExcMessage:
        def send(self, handler):
            raise WebSocketClosedError()
    # TODO: assert len(caplog.records) == 0
    with caplog.at_level(logging.WARN):
        # fake self not great but much easier than setting up a real view
        ret = await WSHandler.send_message("self", ExcMessage())
        assert ret is None
        # TODO: assert len(caplog.records) == 1
        # TODO: assert caplog.text.endswith("Failed sending message as connection was closed\n")
        # XXX: caplog collects stray messages from previously unawaited async function calls,
        # resulting in varying number of messages, depending on the tests run and their order
        assert len([msg for msg in caplog.messages if "Failed sending message as connection was closed" in msg]) == 1


def test_uses_auth_request_handler() -> None:
    assert issubclass(WSHandler, AuthRequestHandler)


GOOD_ORIGIN_CASES = (
    pytest.param(["*"],                "http://example.com",      id="global wildcard"),
    pytest.param(["example.*"],        "http://example.com",      id="partial wildcard"),
    pytest.param(["example.com:*"],    "http://example.com",      id="port wildcard"),
    pytest.param(["*:81"],             "http://example.com:81",   id="host wildcard"),
    pytest.param(["example.com:80"],   "http://example.com",      id="implicit port 80"),
    pytest.param(["example.com:8080"], "http://example.com:8080", id="explicit port"),
    pytest.param(["example.com"],      "http://example.com",      id="exact match"),
)


@pytest.mark.gen_test
@pytest.mark.parametrize(("allowed_origins", "request_origin"), GOOD_ORIGIN_CASES)
async def test_ws_handler_accepts_allowed_origins(
    websocket_url_factory: Callable[[list[str]], str],
    allowed_origins: list[str],
    request_origin: str,
) -> None:
    ws_url = websocket_url_factory(allowed_origins)
    request = build_ws_request(ws_url, request_origin)
    connection = await websocket_connect(request)
    connection.close()


BAD_ORIGIN_CASES = (
    pytest.param(["example.com"],    "http://example.com.bad.com", id="subdomain rejection"),
    pytest.param(["example.com"],    "http://foo.com",             id="exact host mismatch"),
    pytest.param(["example.com:80"], "http://foo.com:80",          id="exact host mismatch with port"),
    pytest.param(["example.com.*"],  "http://example.com",         id="pattern mismatch"),
    pytest.param(["example.com:80"], "http://example.com:8080",    id="port mismatch with exact host"),
    pytest.param(["*:81"],           "http://example.com:8080",    id="port mismatch with wildcard host"),
)


@pytest.mark.gen_test
@pytest.mark.parametrize(("allowed_origins", "request_origin"), BAD_ORIGIN_CASES)
async def test_ws_handler_rejects_disallowed_origins(
    websocket_url_factory: Callable[[list[str]], str],
    allowed_origins: list[str],
    request_origin: str,
    caplog: pytest.LogCaptureFixture,
) -> None:
    ws_url = websocket_url_factory(allowed_origins)
    request = build_ws_request(ws_url, request_origin)

    with caplog.at_level(logging.ERROR):
        with pytest.raises(HTTPClientError) as e:
            await websocket_connect(request)

    assert e.value.code == 403
    assert f"Refusing websocket connection from Origin {request_origin!r}" in caplog.text
    assert f"currently we allow origins {set(allowed_origins)!r}" in caplog.text


#-----------------------------------------------------------------------------
# Dev API
#-----------------------------------------------------------------------------

@pytest.fixture
def websocket_url_factory(unused_tcp_port_factory) -> Generator[Callable[[list[str]], str], None, None]:
    servers: list[HTTPServer] = []

    def start(allowed_origins: list[str]) -> str:
        port = unused_tcp_port_factory()
        app = Application
        tornado_app = BokehTornado({"/": app}, extra_websocket_origins=allowed_origins)
        server = HTTPServer(tornado_app)
        server.listen(port, address="localhost")
        servers.append(server)
        return f"ws://localhost:{port}/ws"

    yield start

    for server in servers:
        server.stop()

def build_ws_request(url: str, origin: str) -> HTTPRequest:
    session_id = generate_session_id()
    token = generate_jwt_token(session_id)
    return HTTPRequest(
        url=url,
        headers={
            "Origin": origin,
            "Sec-WebSocket-Protocol": f"bokeh, {token}",
        },
    )

#-----------------------------------------------------------------------------
# Private API
#-----------------------------------------------------------------------------


#-----------------------------------------------------------------------------
# Code
#-----------------------------------------------------------------------------
