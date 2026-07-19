#-----------------------------------------------------------------------------
# Copyright (c) Anaconda, Inc. and contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------

from __future__ import annotations

import asyncio
import json
import runpy
import sys
import threading
from collections import deque
from pathlib import Path
from types import ModuleType
from typing import Any, cast
from urllib.parse import urlencode

import pytest

from bokeh.application import Application
from bokeh.application.handlers.function import FunctionHandler
from bokeh.core.types import ID
from bokeh.document import Document
from bokeh.models import ColumnDataSource, Select
from bokeh.protocol import Protocol
from bokeh.server.asgi import BokehASGI
from bokeh.server.auth import AuthPolicy
from bokeh.util.token import generate_jwt_token


async def http_request(
    app: BokehASGI,
    path: str,
    *,
    query: dict[str, str] | None = None,
    method: str = "GET",
    root_path: str = "",
    headers: list[tuple[bytes, bytes]] | None = None,
    user: Any = None,
    state: dict[str, Any] | None = None,
) -> list[dict[str, Any]]:
    sent: list[dict[str, Any]] = []

    async def receive() -> dict[str, Any]:
        return {"type": "http.request", "body": b"", "more_body": False}

    async def send(event: dict[str, Any]) -> None:
        sent.append(event)

    query_string = urlencode(query or {}).encode()
    await app(
        {
            "type": "http",
            "asgi": {"version": "3.0"},
            "http_version": "1.1",
            "method": method,
            "scheme": "http",
            "path": path,
            "root_path": root_path,
            "query_string": query_string,
            "headers": [(b"host", b"localhost"), *(headers or [])],
            "client": ("127.0.0.1", 1234),
            "user": user,
            "state": state or {},
        },
        receive,
        send,
    )
    return sent


def response_status(events: list[dict[str, Any]]) -> int:
    return events[0]["status"]


def response_body(events: list[dict[str, Any]]) -> bytes:
    return b"".join(event.get("body", b"") for event in events if event["type"] == "http.response.body")


def response_header(events: list[dict[str, Any]], name: bytes) -> bytes | None:
    headers = events[0].get("headers", [])
    return next((value for key, value in headers if key.lower() == name.lower()), None)


def test_example_application_initializes() -> None:
    path = Path(__file__).parents[4] / "examples/server/api/asgi/bkapp.py"
    application = BokehASGI({"/": path}).core.applications["/"].application
    document = application.create_document()
    second_document = application.create_document()

    assert document.title == "Bokeh ASGI signal studio"
    assert len(document.roots) == 1
    assert document.roots[0] is not second_document.roots[0]
    waveform = document.select_one({"name": "waveform"})
    source = document.select_one({"name": "signal-source"})
    assert isinstance(waveform, Select)
    assert isinstance(source, ColumnDataSource)

    waveform.value = "Square"

    assert set(source.data["y"]) == {-1.5, 1.5}
    string_application = BokehASGI(str(path)).core.applications["/"].application
    assert string_application.create_document().title == "Bokeh ASGI signal studio"


def test_explicit_application_specs_remain_supported() -> None:
    explicit = Application()

    def modify_document(doc: Document) -> None:
        doc.title = "Callable application"

    app = BokehASGI({"/explicit": explicit, "/callable": modify_document})

    assert app.core.applications["/explicit"].application is explicit
    assert app.core.applications["/callable"].application.create_document().title == "Callable application"


async def test_framework_free_example_routes_site_and_bokeh() -> None:
    path = Path(__file__).parents[4] / "examples/server/api/asgi/framework_free.py"
    namespace = runpy.run_path(str(path))
    application = namespace["application"]
    bokeh_application = cast(BokehASGI, namespace["bokeh_application"])

    try:
        index = await http_request(application, "/")
        document = await http_request(application, "/bkapp/")
        missing = await http_request(application, "/missing")

        assert response_status(index) == 200
        assert b"Bokeh meets <span>framework-free ASGI</span>" in response_body(index)
        assert b'xhr.open(\'GET\', "/bkapp/autoload.js?' in response_body(index)
        assert b"bokeh-app-path=/bkapp" in response_body(index)
        assert b"bokeh-absolute-url" not in response_body(index)
        assert b"<iframe" not in response_body(index)
        assert response_status(document) == 200
        assert b"Bokeh ASGI signal studio" in response_body(document)
        assert b'/bkapp/static/js/bokeh' in response_body(document)
        assert response_status(missing) == 404

        autoload = await http_request(application, "/bkapp/autoload.js", query={
            "bokeh-autoload-element": "target",
            "bokeh-app-path": "/bkapp",
        })
        assert response_status(autoload) == 200
        assert b"target" in response_body(autoload)
        assert b'/bkapp/static/js/bokeh' in response_body(autoload)
    finally:
        await bokeh_application.core.stop()


@pytest.mark.parametrize("framework", ["fastapi", "starlette"])
async def test_framework_example_composes_bokeh_lifespan(monkeypatch: pytest.MonkeyPatch, framework: str) -> None:
    class HostApplication:
        def __init__(self, *args: Any, lifespan=None, **kwargs: Any) -> None:
            self.lifespan = lifespan

        def get(self, *args: Any, **kwargs: Any):
            return lambda func: func

        def mount(self, *args: Any, **kwargs: Any) -> None:
            pass

    class Route:
        def __init__(self, *args: Any, **kwargs: Any) -> None:
            pass

    fastapi = ModuleType("fastapi")
    setattr(fastapi, "FastAPI", HostApplication)
    setattr(fastapi, "Request", object)
    fastapi_responses = ModuleType("fastapi.responses")
    setattr(fastapi_responses, "HTMLResponse", object)
    starlette_applications = ModuleType("starlette.applications")
    setattr(starlette_applications, "Starlette", HostApplication)
    starlette_requests = ModuleType("starlette.requests")
    setattr(starlette_requests, "Request", object)
    starlette_responses = ModuleType("starlette.responses")
    setattr(starlette_responses, "HTMLResponse", object)
    starlette_routing = ModuleType("starlette.routing")
    setattr(starlette_routing, "Mount", Route)
    setattr(starlette_routing, "Route", Route)

    monkeypatch.setitem(sys.modules, "fastapi", fastapi)
    monkeypatch.setitem(sys.modules, "fastapi.responses", fastapi_responses)
    monkeypatch.setitem(sys.modules, "starlette.applications", starlette_applications)
    monkeypatch.setitem(sys.modules, "starlette.requests", starlette_requests)
    monkeypatch.setitem(sys.modules, "starlette.responses", starlette_responses)
    monkeypatch.setitem(sys.modules, "starlette.routing", starlette_routing)

    path = Path(__file__).parents[4] / f"examples/server/api/asgi/{framework}_embed.py"
    namespace = runpy.run_path(str(path))
    application = cast(BokehASGI, namespace["bokeh_application"])
    lifespan = namespace["lifespan"]
    page = namespace["render_page"]("")
    proxied_page = namespace["render_page"]("/proxy/")

    assert namespace["app"].lifespan is lifespan
    assert "/bkapp/autoload.js" in page
    assert "bokeh-app-path=/bkapp" in page
    assert "bokeh-absolute-url" not in page
    assert "<iframe" not in page
    assert "/proxy/bkapp/autoload.js" in proxied_page
    assert "bokeh-app-path=/proxy/bkapp" in proxied_page
    assert not application.core._started
    async with lifespan(namespace["app"]):
        assert application.core._started
    assert not application.core._started


async def test_lifespan_starts_and_stops_application() -> None:
    app = BokehASGI(Application(), keep_alive_milliseconds=0)
    incoming = deque([{"type": "lifespan.startup"}, {"type": "lifespan.shutdown"}])
    sent: list[dict[str, Any]] = []

    async def receive() -> dict[str, Any]:
        return incoming.popleft()

    async def send(event: dict[str, Any]) -> None:
        sent.append(event)

    await app({"type": "lifespan", "asgi": {"version": "3.0"}}, receive, send)

    assert [event["type"] for event in sent] == [
        "lifespan.startup.complete",
        "lifespan.shutdown.complete",
    ]
    assert app._start_lock is None


async def test_document_and_metadata_routes() -> None:
    application = Application()
    application._metadata = {"meaning": 42}
    app = BokehASGI({"/plot": application}, keep_alive_milliseconds=0)
    try:
        document = await http_request(app, "/plot/")
        metadata = await http_request(app, "/plot/metadata")

        assert response_status(document) == 200
        assert b"Bokeh" in response_body(document)
        assert response_status(metadata) == 200
        assert b'"meaning": 42' in response_body(metadata)
    finally:
        await app.core.stop()


async def test_mount_root_path_is_removed_before_routing() -> None:
    app = BokehASGI(Application(), keep_alive_milliseconds=0)
    try:
        response = await http_request(app, "/dashboard/", root_path="/dashboard")
        assert response_status(response) == 200
        assert b'/dashboard/static/js/bokeh' in response_body(response)
    finally:
        await app.core.stop()


async def test_mount_root_path_is_included_in_root_navigation() -> None:
    redirecting = BokehASGI({"/plot": Application()}, prefix="pre", keep_alive_milliseconds=0)
    listing = BokehASGI(
        {"/one": Application(), "/two": Application()},
        prefix="pre",
        redirect_root=False,
        keep_alive_milliseconds=0,
    )
    try:
        redirect = await http_request(redirecting, "/dashboard/pre/", root_path="/dashboard/")
        index = await http_request(listing, "/dashboard/pre/", root_path="/dashboard")

        assert response_header(redirect, b"location") == b"/dashboard/pre/plot"
        assert b'href="/dashboard/pre/one"' in response_body(index)
        assert b'href="/dashboard/pre/two"' in response_body(index)
    finally:
        await redirecting.core.stop()
        await listing.core.stop()


async def test_autoload_and_static_routes() -> None:
    app = BokehASGI(Application(), keep_alive_milliseconds=0)
    try:
        autoload = await http_request(app, "/autoload.js", query={
            "bokeh-autoload-element": "target",
            "bokeh-app-path": "/",
        })
        static = await http_request(app, "/static/js/bokeh.min.js")
        traversal = await http_request(app, "/static/../asgi.py")

        assert response_status(autoload) == 200
        assert b"target" in response_body(autoload)
        assert response_status(static) == 200
        assert b"Bokeh Contributors" in response_body(static)
        assert response_status(traversal) == 404
    finally:
        await app.core.stop()


async def test_root_application_static_files_stream_and_head_only_stats(tmp_path: Path) -> None:
    content = b"a" * (64*1024 + 1)
    (tmp_path / "artifact.bin").write_bytes(content)
    application = Application()
    app = BokehASGI(application, keep_alive_milliseconds=0)
    application._static_path = str(tmp_path)
    try:
        get = await http_request(app, "/static/artifact.bin")
        head = await http_request(app, "/static/artifact.bin", method="HEAD")

        assert response_status(get) == 200
        assert response_header(get, b"content-length") == str(len(content)).encode()
        assert response_body(get) == content
        get_bodies = [event for event in get if event["type"] == "http.response.body"]
        assert len(get_bodies) == 3
        assert get_bodies[-1] == {"type": "http.response.body", "body": b""}

        assert response_status(head) == 200
        assert response_header(head, b"content-length") == str(len(content)).encode()
        assert response_body(head) == b""
        assert [event for event in head if event["type"] == "http.response.body"] == [
            {"type": "http.response.body", "body": b""},
        ]
    finally:
        await app.core.stop()


async def test_options_only_dispatches_autoload_preflight() -> None:
    initialized = 0

    def modify_document(doc: Document) -> None:
        nonlocal initialized
        initialized += 1

    app = BokehASGI(Application(FunctionHandler(modify_document)), keep_alive_milliseconds=0)
    try:
        document = await http_request(app, "/", method="OPTIONS")
        metadata = await http_request(app, "/metadata", method="OPTIONS")
        static = await http_request(app, "/static/js/bokeh.min.js", method="OPTIONS")
        preflight = await http_request(app, "/autoload.js", method="OPTIONS")

        assert [response_status(response) for response in (document, metadata, static)] == [405, 405, 405]
        assert response_header(document, b"allow") == b"GET, HEAD"
        assert response_status(preflight) == 204
        assert response_header(preflight, b"content-length") is None
        assert response_header(preflight, b"content-type") is None
        assert response_header(preflight, b"access-control-allow-methods") == b"GET, HEAD, OPTIONS"
        assert initialized == 0
        assert not app.core.get_sessions("/")
    finally:
        await app.core.stop()


def test_request_preserves_non_utf8_query_bytes() -> None:
    app = BokehASGI(Application(), keep_alive_milliseconds=0)
    scope = {
        "type": "http",
        "method": "GET",
        "path": "/",
        "query_string": b"value=%FF&%FF=name&utf8=%C3%A9",
        "headers": [],
    }

    request = app._request(scope)

    assert request.arguments == {
        "value": [b"\xff"],
        "\xff": [b"name"],
        "utf8": [b"\xc3\xa9"],
    }


def test_request_combines_repeated_headers_case_insensitively() -> None:
    app = BokehASGI(Application(), keep_alive_milliseconds=0)
    scope = {
        "type": "http",
        "method": "GET",
        "path": "/",
        "query_string": b"",
        "headers": [
            (b"Cookie", b"first=one"),
            (b"cookie", b"second=two"),
            (b"X-Value", b"one"),
            (b"x-value", b"two"),
        ],
    }

    request = app._request(scope)

    assert request.headers["cookie"] == "first=one; second=two"
    assert request.headers["x-value"] == "one, two"
    assert {name: cookie.value for name, cookie in request.cookies.items()} == {
        "first": "one",
        "second": "two",
    }


async def test_auth_policy_redirects_and_propagates_user() -> None:
    authentication_state: list[dict[str, Any]] = []

    def authenticate(request) -> str | None:
        authentication_state.append(dict(request.state))
        if request.headers.get("authorization") == "Bearer secret":
            return "alice"
        return None

    def modify_document(doc) -> None:
        doc.title = doc.session_context.request.user

    policy = AuthPolicy(authenticate, login_url=lambda request: f"/login?next={request.path}", logout_url="/logout")
    app = BokehASGI(Application(FunctionHandler(modify_document)), auth_policy=policy, keep_alive_milliseconds=0)
    try:
        anonymous = await http_request(app, "/", state={"request_id": "anonymous"})
        authenticated = await http_request(
            app,
            "/",
            headers=[(b"authorization", b"Bearer secret")],
            state={"request_id": "authenticated"},
        )

        assert response_status(anonymous) == 302
        assert response_header(anonymous, b"location") == b"/login?next=/"
        assert response_status(authenticated) == 200
        session = app.core.get_sessions("/")[0]
        session_context = cast(Any, session.document.session_context)
        assert session.document.title == "alice"
        assert session_context.request.user == "alice"
        assert session_context.logout_url == "/logout"
        assert authentication_state == [
            {"request_id": "anonymous"},
            {"request_id": "authenticated"},
        ]
    finally:
        await app.core.stop()


async def test_auth_policy_returns_401_without_login_url() -> None:
    app = BokehASGI(Application(), auth_policy=AuthPolicy(lambda request: None), keep_alive_milliseconds=0)
    try:
        response = await http_request(app, "/metadata")

        assert response_status(response) == 401
        assert response_body(response) == b"Authentication required"
        assert not app.core.get_sessions("/")
    finally:
        await app.core.stop()


async def test_auth_policy_leaves_static_assets_and_preflight_public() -> None:
    authenticated: list[str] = []

    def authenticate(request) -> None:
        authenticated.append(request.path)
        return None

    app = BokehASGI(Application(), auth_policy=AuthPolicy(authenticate), keep_alive_milliseconds=0)
    try:
        static = await http_request(app, "/static/js/bokeh.min.js")
        preflight = await http_request(app, "/autoload.js", method="OPTIONS")

        assert response_status(static) == 200
        assert response_status(preflight) == 204
        assert authenticated == []
    finally:
        await app.core.stop()


async def test_slow_document_does_not_block_other_http_requests() -> None:
    started = threading.Event()
    release = threading.Event()

    def slow_document(doc) -> None:
        started.set()
        release.wait()

    app = BokehASGI(
        {
            "/slow": Application(FunctionHandler(slow_document)),
            "/fast": Application(),
        },
        keep_alive_milliseconds=0,
    )
    slow = asyncio.create_task(http_request(app, "/slow/"))
    try:
        await asyncio.wait_for(asyncio.to_thread(started.wait), 1)
        fast = await asyncio.wait_for(http_request(app, "/fast/metadata"), 0.2)
        assert response_status(fast) == 200
    finally:
        release.set()
        await slow
        await app.core.stop()


async def test_stop_waits_for_pending_initialization_before_unload() -> None:
    started = threading.Event()
    release = threading.Event()
    unloaded = threading.Event()

    def slow_document(doc) -> None:
        started.set()
        assert release.wait(timeout=2)

    handler = FunctionHandler(slow_document)
    handler.on_server_unloaded = lambda server_context: unloaded.set()
    app = BokehASGI(Application(handler), keep_alive_milliseconds=0)
    await app.core.start()
    context = app.core.applications["/"]
    pending = asyncio.create_task(context.create_session_if_needed(ID("session")))

    try:
        await asyncio.wait_for(asyncio.to_thread(started.wait), 1)
        stopping = asyncio.create_task(app.core.stop())
        await asyncio.sleep(0)
        assert not stopping.done()
        assert not unloaded.is_set()
    finally:
        release.set()

    await stopping
    try:
        initialized_session = await pending
    except asyncio.CancelledError:
        pass
    else:
        # Shutdown may reach the pending-session cancellation before or after
        # the worker returns. A session that wins that race must still be
        # destroyed before the unload hook runs.
        assert initialized_session.destroyed
    assert unloaded.is_set()
    assert not list(context.sessions)


async def test_websocket_accepts_bokeh_protocol_and_sends_ack() -> None:
    app = BokehASGI(Application(), keep_alive_milliseconds=0)
    token = generate_jwt_token(cast(ID, "session"), expiration=300)
    incoming = deque([
        {"type": "websocket.connect"},
        {"type": "websocket.disconnect", "code": 1000},
    ])
    sent: list[dict[str, Any]] = []

    async def receive() -> dict[str, Any]:
        return incoming.popleft()

    async def send(event: dict[str, Any]) -> None:
        sent.append(event)

    try:
        await app(
            {
                "type": "websocket",
                "asgi": {"version": "3.0", "spec_version": "2.3"},
                "scheme": "ws",
                "path": "/ws",
                "root_path": "",
                "query_string": b"",
                "headers": [(b"host", b"localhost"), (b"origin", b"http://localhost")],
                "client": ("127.0.0.1", 1234),
                "subprotocols": ["bokeh", token],
            },
            receive,
            send,
        )

        assert sent[0] == {"type": "websocket.accept", "subprotocol": "bokeh"}
        fragments = [event["text"] for event in sent if event["type"] == "websocket.send"]
        assert len(fragments) == 3
        assert json.loads(fragments[0])["msgtype"] == "ACK"
        assert app.core.get_sessions("/")[0].connection_count == 0
    finally:
        await app.core.stop()


async def test_websocket_auth_policy_rejects_anonymous_user() -> None:
    app = BokehASGI(Application(), auth_policy=AuthPolicy(lambda request: None), keep_alive_milliseconds=0)
    token = generate_jwt_token(cast(ID, "session"), expiration=300)
    sent: list[dict[str, Any]] = []

    async def receive() -> dict[str, Any]:
        return {"type": "websocket.connect"}

    async def send(event: dict[str, Any]) -> None:
        sent.append(event)

    try:
        await app(
            {
                "type": "websocket",
                "asgi": {"version": "3.0", "spec_version": "2.3"},
                "scheme": "ws",
                "path": "/ws",
                "root_path": "",
                "query_string": b"",
                "headers": [(b"host", b"localhost")],
                "subprotocols": ["bokeh", token],
            },
            receive,
            send,
        )

        assert sent == [{
            "type": "websocket.close",
            "code": 1008,
            "reason": "Authentication required",
        }]
        assert not app.core.get_sessions("/")
    finally:
        await app.core.stop()


async def test_websocket_auth_policy_uses_asgi_scope_user() -> None:
    policy = AuthPolicy(lambda request: request.user if request.user == "alice" else None)
    app = BokehASGI(Application(), auth_policy=policy, keep_alive_milliseconds=0)
    token = generate_jwt_token(cast(ID, "session"), expiration=300)
    incoming = deque([
        {"type": "websocket.connect"},
        {"type": "websocket.disconnect", "code": 1000},
    ])
    sent: list[dict[str, Any]] = []

    async def receive() -> dict[str, Any]:
        return incoming.popleft()

    async def send(event: dict[str, Any]) -> None:
        sent.append(event)

    try:
        await app(
            {
                "type": "websocket",
                "asgi": {"version": "3.0"},
                "scheme": "ws",
                "path": "/ws",
                "root_path": "",
                "query_string": b"",
                "headers": [(b"host", b"localhost")],
                "subprotocols": ["bokeh", token],
                "user": "alice",
            },
            receive,
            send,
        )

        assert sent[0] == {"type": "websocket.accept", "subprotocol": "bokeh"}
        session = app.core.get_sessions("/")[0]
        session_context = cast(Any, session.document.session_context)
        assert session_context.request.user == "alice"
    finally:
        await app.core.stop()


async def test_websocket_handles_pull_document_round_trip() -> None:
    app = BokehASGI(Application(), keep_alive_milliseconds=0)
    token = generate_jwt_token(cast(ID, "session"), expiration=300)
    request = Protocol().create("PULL-DOC-REQ")
    incoming = deque([
        {"type": "websocket.connect"},
        {"type": "websocket.receive", "text": request.header_json},
        {"type": "websocket.receive", "text": request.metadata_json},
        {"type": "websocket.receive", "text": request.content_json},
        {"type": "websocket.disconnect", "code": 1000},
    ])
    sent: list[dict[str, Any]] = []

    async def receive() -> dict[str, Any]:
        return incoming.popleft()

    async def send(event: dict[str, Any]) -> None:
        sent.append(event)

    try:
        await app(
            {
                "type": "websocket",
                "asgi": {"version": "3.0"},
                "scheme": "ws",
                "path": "/ws",
                "root_path": "",
                "query_string": b"",
                "headers": [(b"host", b"localhost")],
                "subprotocols": ["bokeh", token],
            },
            receive,
            send,
        )

        message_types = [
            value["msgtype"]
            for event in sent
            if event["type"] == "websocket.send"
            if (value := json.loads(event["text"])) and "msgtype" in value
        ]
        assert message_types == ["ACK", "PULL-DOC-REPLY"]
    finally:
        await app.core.stop()


async def test_websocket_rejects_missing_token() -> None:
    app = BokehASGI(Application(), keep_alive_milliseconds=0)
    sent: list[dict[str, Any]] = []

    async def receive() -> dict[str, Any]:
        return {"type": "websocket.connect"}

    async def send(event: dict[str, Any]) -> None:
        sent.append(event)

    try:
        await app(
            {
                "type": "websocket",
                "asgi": {"version": "3.0", "spec_version": "2.3"},
                "path": "/ws",
                "root_path": "",
                "query_string": b"",
                "headers": [(b"host", b"localhost")],
                "subprotocols": ["bokeh"],
            },
            receive,
            send,
        )
        assert sent == [{
            "type": "websocket.close",
            "code": 1002,
            "reason": "Bokeh subprotocol and token required",
        }]
    finally:
        await app.core.stop()


@pytest.mark.parametrize("token", [
    "garbage",
    "e30=",
    "W10=",
    generate_jwt_token(cast(ID, ""), expiration=300),
    generate_jwt_token(cast(ID, 1), expiration=300),
])
async def test_websocket_rejects_malformed_token(token: str) -> None:
    app = BokehASGI(Application(), keep_alive_milliseconds=0)
    sent: list[dict[str, Any]] = []

    async def receive() -> dict[str, Any]:
        return {"type": "websocket.connect"}

    async def send(event: dict[str, Any]) -> None:
        sent.append(event)

    try:
        await app(
            {
                "type": "websocket",
                "asgi": {"version": "3.0", "spec_version": "2.3"},
                "path": "/ws",
                "root_path": "",
                "query_string": b"",
                "headers": [(b"host", b"localhost")],
                "subprotocols": ["bokeh", token],
            },
            receive,
            send,
        )

        assert sent == [{
            "type": "websocket.close",
            "code": 1008,
            "reason": "Invalid or expired token",
        }]
    finally:
        await app.core.stop()


async def test_websocket_waits_for_connect_and_gates_close_reason() -> None:
    app = BokehASGI(Application(), keep_alive_milliseconds=0)
    connect_received = False
    sent: list[dict[str, Any]] = []

    async def receive() -> dict[str, Any]:
        nonlocal connect_received
        connect_received = True
        return {"type": "websocket.connect"}

    async def send(event: dict[str, Any]) -> None:
        assert connect_received
        sent.append(event)

    try:
        await app(
            {
                "type": "websocket",
                "asgi": {"version": "3.0", "spec_version": "2.0"},
                "path": "/ws",
                "root_path": "",
                "query_string": b"",
                "headers": [(b"host", b"localhost")],
                "subprotocols": ["bokeh"],
            },
            receive,
            send,
        )

        assert sent == [{"type": "websocket.close", "code": 1002}]
    finally:
        await app.core.stop()


async def test_websocket_send_oserror_is_treated_as_disconnect() -> None:
    app = BokehASGI(Application(), keep_alive_milliseconds=0)
    token = generate_jwt_token(cast(ID, "session"), expiration=300)
    incoming = deque([
        {"type": "websocket.connect"},
        {"type": "websocket.disconnect", "code": 1001},
    ])
    sent: list[dict[str, Any]] = []

    async def receive() -> dict[str, Any]:
        return incoming.popleft()

    async def send(event: dict[str, Any]) -> None:
        sent.append(event)
        if event["type"] == "websocket.send":
            raise OSError("peer disconnected")

    try:
        await app(
            {
                "type": "websocket",
                "asgi": {"version": "3.0", "spec_version": "2.4"},
                "path": "/ws",
                "root_path": "",
                "query_string": b"",
                "headers": [(b"host", b"localhost")],
                "subprotocols": ["bokeh", token],
            },
            receive,
            send,
        )

        assert [event["type"] for event in sent] == ["websocket.accept", "websocket.send"]
        assert not app.core._clients
        assert app.core.get_sessions("/")[0].connection_count == 0
    finally:
        await app.core.stop()


async def test_websocket_disconnect_after_core_stop_does_not_reuse_detached_session() -> None:
    app = BokehASGI(Application(), keep_alive_milliseconds=0)
    token = generate_jwt_token(cast(ID, "session"), expiration=300)
    incoming: asyncio.Queue[dict[str, Any]] = asyncio.Queue()
    await incoming.put({"type": "websocket.connect"})
    connected = asyncio.Event()

    async def receive() -> dict[str, Any]:
        return await incoming.get()

    async def send(event: dict[str, Any]) -> None:
        if event["type"] == "websocket.send":
            connected.set()

    task = asyncio.create_task(app(
        {
            "type": "websocket",
            "asgi": {"version": "3.0", "spec_version": "2.4"},
            "path": "/ws",
            "root_path": "",
            "query_string": b"",
            "headers": [(b"host", b"localhost")],
            "subprotocols": ["bokeh", token],
        },
        receive,
        send,
    ))

    await asyncio.wait_for(connected.wait(), 1)
    connection = next(iter(app.core._clients))
    assert getattr(connection, "_session") is not None
    await app.core.stop()
    assert getattr(connection, "_session") is None
    assert not app.core._clients
    await incoming.put({"type": "websocket.disconnect", "code": 1001})
    await asyncio.wait_for(task, 1)
