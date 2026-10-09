#-----------------------------------------------------------------------------
# Copyright (c) Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------

from __future__ import annotations

# Standard library imports
import asyncio
import hashlib
import inspect
import json
import sys
import threading
from pathlib import Path
from types import ModuleType, SimpleNamespace
from typing import Any, Callable

# External imports
import pytest
from tornado.httpclient import AsyncHTTPClient
from tornado.web import HTTPError

# Bokeh imports
from bokeh import __version__
from bokeh.application import Application
from bokeh.core.properties import Any as AnyProperty, Instance
from bokeh.document import Document
from bokeh.embed.resources import extension_dirs
from bokeh.model import DataModel, Model
from bokeh.models import CustomJS
from bokeh.models.ui.notifications import Notifications
from bokeh.resources import Resources
from bokeh.server.urls import per_app_patterns
from bokeh.server.views.embed_json_handler import EmbedJsonHandler
from bokeh.util.compiler import JavaScript
from tests.support.plugins.managed_server_loop import MSL


class _TestSession:
    def __init__(self, token: str, document: Document) -> None:
        self.token = token
        self.document = document
        self._lock = asyncio.Lock()

    async def with_document_locked(self, func: Callable[..., Any], *args: Any, **kwargs: Any) -> Any:
        async with self._lock:
            result = await asyncio.to_thread(func, *args, **kwargs)
            return await result if inspect.isawaitable(result) else result


class _TestEmbedJsonHandler(EmbedJsonHandler):
    headers: dict[str, str]
    body: str
    document: Document
    origins_checked: int
    session_requests: int
    token: str | None

    def _allow_websocket_origin(self) -> None:
        self.origins_checked += 1

    async def get_session(self) -> Any:
        self.session_requests += 1
        if self.token is None:
            return None
        return _TestSession(self.token, self.document)

    def set_header(self, name: str, value: str) -> None:
        self.headers[name] = value

    def write(self, chunk: str) -> None:
        self.body = chunk


def _handler(token: str | None, document: Document | None = None) -> _TestEmbedJsonHandler:
    handler = object.__new__(_TestEmbedJsonHandler)
    handler.headers = {}
    handler.body = ""
    handler.document = document if document is not None else Document()
    handler.origins_checked = 0
    handler.session_requests = 0
    handler.token = token
    handler.request = SimpleNamespace(method="GET", protocol="https", host="server.test", headers={})
    handler._current_user = "default_user"
    handler.application = SimpleNamespace(
        prefix="",
        resources=lambda origin=None: Resources(mode="none"),
        auth_provider=SimpleNamespace(get_user=None, get_user_async=None),
    )
    return handler


async def test_get_returns_versioned_signed_bootstrap() -> None:
    handler = _handler("signed-token")
    handler.set_default_headers()

    await handler.get()

    assert handler.headers["Content-Type"] == "application/json"
    assert handler.headers["Cache-Control"] == "no-store"
    assert handler.headers["Pragma"] == "no-cache"
    assert handler.headers["X-Content-Type-Options"] == "nosniff"
    assert json.loads(handler.body) == {
        "schema": "bokeh.embed-server/v1",
        "bokeh_version": __version__,
        "token": "signed-token",
        "requires": {"components": [], "extensions": []},
        "resources": {"mode": "resolved", "root_url": "/", "assets": []},
    }


async def test_get_includes_session_extension_assets(monkeypatch: pytest.MonkeyPatch) -> None:
    document = Document()
    handler = _handler("signed-token", document)
    handler.application = SimpleNamespace(prefix="", resources=lambda origin=None: Resources(mode="inline"))
    initialized = 0

    async def get_session() -> Any:
        nonlocal initialized

        class SessionCustomJS(CustomJS):
            __implementation__ = JavaScript("export const value = 1")

        initialized += 1
        document.add_root(SessionCustomJS(code="return value"))
        return _TestSession("signed-token", document)

    def bundle_models(models: Any) -> str:
        assert any(model.__name__ == "SessionCustomJS" for model in models)
        return "compiled-server-model"

    monkeypatch.setattr(handler, "get_session", get_session)
    monkeypatch.setattr("bokeh.embed.resources.bundle_models", bundle_models)

    try:
        await handler.get()
    finally:
        Model.clear_extensions()

    assert initialized == 1
    bootstrap = json.loads(handler.body)
    content_sha256 = hashlib.sha256(b"compiled-server-model").hexdigest()
    assert bootstrap["requires"] == {
        "components": [],
        "extensions": [{
            "name": "bokeh.custom-models",
            "assets": [],
        }],
    }
    assert bootstrap["resources"] == {
        "mode": "resolved",
        "root_url": "/",
        "assets": [{
            "kind": "script", "content": "compiled-server-model", "content_sha256": content_sha256,
        }],
    }
    assert handler.body.count("compiled-server-model") == 1


async def test_get_honors_host_owned_extension_policy(monkeypatch: pytest.MonkeyPatch) -> None:
    class InlineCustomJS(CustomJS):
        __implementation__ = JavaScript("export const value = 1")

    handler = _handler("signed-token")
    handler.request.headers["Bokeh-Resource-Mode"] = "none"
    handler.application = SimpleNamespace(prefix="", resources=lambda origin=None: Resources(mode="inline"))
    def fail_if_bundled(models: Any) -> None:
        raise AssertionError("host-owned resources must not discover or compile extensions")

    monkeypatch.setattr("bokeh.embed.resources.bundle_models", fail_if_bundled)

    try:
        await handler.get()
    finally:
        Model.clear_extensions()

    bootstrap = json.loads(handler.body)
    assert bootstrap["requires"] == {"components": [], "extensions": []}
    assert bootstrap["resources"] == {"mode": "resolved", "root_url": "/", "assets": []}


@pytest.mark.parametrize("mode", ["inline", "offline"])
async def test_get_resource_registry_is_snapshotted_after_document_lock(
    mode: str, monkeypatch: pytest.MonkeyPatch,
) -> None:
    url = "https://example.test/registered-while-waiting.js"
    handler = _handler("signed-token")
    handler.request.headers["Bokeh-Resource-Mode"] = mode
    session = _TestSession("signed-token", handler.document)
    loop = asyncio.get_running_loop()
    registration_started = asyncio.Event()
    discovery_waiting = asyncio.Event()
    release = threading.Event()
    with_document_locked = session.with_document_locked

    async def get_session() -> _TestSession:
        return session

    def register_definition() -> None:
        assert session._lock.locked()
        loop.call_soon_threadsafe(registration_started.set)
        assert release.wait(timeout=5)

        class URLCustomJS(CustomJS):
            __javascript__ = [url]

        class RegisteredWhileWaiting(DataModel):
            __javascript__ = []
            child = Instance(CustomJS, default=CustomJS(args={"dependency": URLCustomJS(code="")}, code=""))

    async def observed_lock(func: Callable[..., Any], *args: Any, **kwargs: Any) -> Any:
        discovery_waiting.set()
        return await with_document_locked(func, *args, **kwargs)

    monkeypatch.setattr(handler, "get_session", get_session)
    registration = asyncio.create_task(with_document_locked(register_definition))
    pending: asyncio.Task[None] | None = None
    try:
        await asyncio.wait_for(registration_started.wait(), timeout=5)
        monkeypatch.setattr(session, "with_document_locked", observed_lock)
        pending = asyncio.create_task(handler.get())
        await asyncio.wait_for(discovery_waiting.wait(), timeout=5)
        assert session._lock.locked()
        assert not pending.done()
        release.set()
        await registration
        with pytest.raises(HTTPError, match=f"{mode} resources") as exc:
            await pending
        assert exc.value.status_code == 409
        assert url in str(exc.value)
    finally:
        release.set()
        await asyncio.gather(registration, return_exceptions=True)
        if pending is not None:
            await asyncio.gather(pending, return_exceptions=True)
        Model.clear_extensions()


@pytest.mark.parametrize("mode", ["inline", "offline"])
@pytest.mark.parametrize("location", ["unused", "root", "configuration", "document-callback", "callback-argument", "plain-any", "global-definition"])
async def test_get_restrictive_resources_follow_session_models(mode: str, location: str) -> None:
    url = "https://example.test/session-resource.js"

    class URLCustomJS(CustomJS):
        __javascript__ = [url]

    class URLNotifications(Notifications):
        __javascript__ = [url]

    class AnyContainer(CustomJS):
        __javascript__ = []
        child = AnyProperty(default=None)

    document = Document()
    if location == "root":
        document.add_root(URLCustomJS(code=""))
    elif location == "configuration":
        document.config.notifications = URLNotifications()
    elif location == "document-callback":
        document.js_on_event("document_ready", URLCustomJS(code=""))
    elif location == "callback-argument":
        document.js_on_event("document_ready", CustomJS(args={"dependency": URLCustomJS(code="")}, code=""))
    elif location == "plain-any":
        document.add_root(AnyContainer(child=URLCustomJS(code=""), code=""))
    elif location == "global-definition":
        class UnusedDefinition(DataModel):
            __javascript__ = []
            child = Instance(CustomJS, default=URLCustomJS(code=""))
    handler = _handler("signed-token", document)
    handler.request.headers["Bokeh-Resource-Mode"] = mode

    try:
        if location == "plain-any":
            wire = document.to_json(deferred=False)
            assert wire["roots"][0]["attributes"]["child"]["name"] == URLCustomJS.__qualified_model__
        elif location == "global-definition":
            wire = document.to_json(deferred=False)
            definition = next(item for item in wire["defs"] if item["name"] == UnusedDefinition.__qualified_model__)
            assert wire["roots"] == []
            assert definition["properties"][0]["default"]["name"] == URLCustomJS.__qualified_model__
        if location == "unused":
            await handler.get()
            bootstrap = json.loads(handler.body)
            assert bootstrap["requires"] == {"components": [], "extensions": []}
            assert bootstrap["resources"]["assets"] == []
        else:
            with pytest.raises(HTTPError, match=f"{mode} resources") as exc:
                await handler.get()
            assert exc.value.status_code == 409
            assert exc.value.reason == "Bokeh resource conflict"
            assert url in str(exc.value)
    finally:
        Model.clear_extensions()


@pytest.mark.parametrize("mode", ["inline", "offline"])
@pytest.mark.parametrize("source", ["global-definition", "plain-any"])
async def test_get_includes_extensions_in_serialized_definitions_and_any_properties(
    mode: str, source: str, monkeypatch: pytest.MonkeyPatch,
) -> None:
    class Hidden(CustomJS):
        __implementation__ = JavaScript("export const value = 1")

    document = Document()
    if source == "global-definition":
        class UnusedDefinition(DataModel):
            __javascript__ = []
            child = Instance(CustomJS, default=CustomJS(args={"nested": Hidden(code="")}, code=""))
    else:
        class Container(CustomJS):
            __implementation__ = JavaScript("export const container = 1")
            child = AnyProperty(default=None)

        document.add_root(Container(child={"nested": [Hidden(code="")]}, code=""))

    compiled: set[type[Any]] = set()

    def bundle_models(models: Any) -> str:
        compiled.update(models)
        return "compiled-serialized-session-models"

    monkeypatch.setattr("bokeh.embed.resources.bundle_models", bundle_models)
    handler = _handler("signed-token", document)
    handler.request.headers["Bokeh-Resource-Mode"] = mode
    try:
        wire = document.to_json(deferred=False)
        if source == "global-definition":
            definition = next(item for item in wire["defs"] if item["name"] == UnusedDefinition.__qualified_model__)
            assert wire["roots"] == []
            assert definition["properties"][0]["default"]["attributes"]["args"]["entries"][0][1]["name"] == Hidden.__qualified_model__
        else:
            assert wire["roots"][0]["attributes"]["child"]["entries"][0][1][0]["name"] == Hidden.__qualified_model__

        await handler.get()
        bootstrap = json.loads(handler.body)
        assert Hidden in compiled
        assert any(asset.get("content") == "compiled-serialized-session-models" for asset in bootstrap["resources"]["assets"])
    finally:
        Model.clear_extensions()


@pytest.mark.parametrize("mode", ["server", "cdn"])
async def test_get_delivery_modes_preserve_unused_registered_model_assets(mode: str) -> None:
    url = "https://example.test/future-session-resource.js"

    class FutureCustomJS(CustomJS):
        __javascript__ = [url]

    handler = _handler("signed-token")
    handler.request.headers["Bokeh-Resource-Mode"] = mode
    try:
        await handler.get()
        bootstrap = json.loads(handler.body)
        assert url in [asset.get("url") for asset in bootstrap["resources"]["assets"]]
    finally:
        Model.clear_extensions()


async def test_get_rejects_missing_session() -> None:
    handler = _handler(None)

    with pytest.raises(HTTPError, match="Invalid token or session ID") as exc:
        await handler.get()

    assert exc.value.status_code == 403


async def test_get_rejects_invalid_resource_policy_before_session_creation() -> None:
    handler = _handler("signed-token")
    handler.request.headers["Bokeh-Resource-Mode"] = "invalid"

    with pytest.raises(HTTPError, match="unknown server extension resource mode") as exc:
        await handler.get()

    assert exc.value.status_code == 409
    assert handler.session_requests == 0


async def test_get_uses_relative_extension_urls_behind_a_proxy(
    monkeypatch: pytest.MonkeyPatch, tmp_path: Path,
) -> None:
    package = tmp_path / "proxy_extension"
    artifact_directory = package / "dist"
    artifact_directory.mkdir(parents=True)
    (package / "bokeh.ext.json").write_text("{}")
    (artifact_directory / "proxy_extension.js").write_text("globalThis.proxy_extension = true")
    module = ModuleType("proxy_extension")
    module.__file__ = str(package / "__init__.py")
    monkeypatch.setitem(sys.modules, "proxy_extension", module)
    monkeypatch.setitem(extension_dirs, "proxy_extension", artifact_directory)

    class _ProxyCustomJS(CustomJS):
        __view_module__ = "proxy_extension.models"

    monkeypatch.setattr(
        "bokeh.embed.resources.HasProps",
        SimpleNamespace(model_class_reverse_map={"proxy": _ProxyCustomJS}),
    )
    handler = _handler("signed-token")
    handler.request.host = "backend.internal:5006"
    handler.request.headers["Bokeh-Resource-Mode"] = "server"
    handler.application = SimpleNamespace(
        prefix="/proxy", resources=lambda origin=None: Resources(mode="server", root_url="/proxy"),
    )
    await handler.get()

    urls = [asset.get("url") for asset in json.loads(handler.body)["resources"]["assets"]]
    assert "/proxy/static/extensions/proxy_extension/proxy_extension.js" in urls
    assert all("backend.internal" not in url for url in urls if url is not None)


@pytest.mark.parametrize("headers, status", [
    ({"Bokeh-Resource-Mode": "invalid"}, 409),
    ({"Bokeh-Token": "invalid"}, 403),
])
async def test_error_responses_keep_allowed_origin_headers(
    ManagedServerLoop: MSL, headers: dict[str, str], status: int,
) -> None:
    with ManagedServerLoop(Application(), allow_websocket_origin=["trusted.example:80"]) as server:
        response = await AsyncHTTPClient().fetch(
            f"http://localhost:{server.port}/embed.json",
            headers={"Origin": "http://trusted.example", **headers}, raise_error=False,
        )

    assert response.code == status
    assert response.headers["Access-Control-Allow-Origin"] == "http://trusted.example"
    assert response.headers["Access-Control-Allow-Credentials"] == "true"
    assert response.headers["Cache-Control"] == "no-store"


async def test_multiline_extension_errors_are_returned_in_body(
    ManagedServerLoop: MSL, monkeypatch: pytest.MonkeyPatch,
) -> None:
    detail = "failed to compile custom models: bad.ts:1: error\n> invalid 100% syntax\n  ^"

    def fail_to_resolve(*args: Any, **kwargs: Any) -> None:
        raise ValueError(detail)

    monkeypatch.setattr("bokeh.server.views.embed_json_handler.resolve_server_extensions", fail_to_resolve)
    with ManagedServerLoop(Application(), allow_websocket_origin=["trusted.example:80"]) as server:
        response = await AsyncHTTPClient().fetch(
            f"http://localhost:{server.port}/embed.json",
            headers={"Origin": "http://trusted.example"}, raise_error=False,
        )

    assert response.code == 409
    assert response.reason == "Bokeh resource conflict"
    assert response.body.decode() == detail
    assert response.headers["Content-Type"] == "text/plain; charset=UTF-8"
    assert response.headers["Access-Control-Allow-Origin"] == "http://trusted.example"
    assert response.headers["Cache-Control"] == "no-store"


async def test_disallowed_origin_errors_do_not_receive_cors_headers(ManagedServerLoop: MSL) -> None:
    with ManagedServerLoop(Application(), allow_websocket_origin=["trusted.example:80"]) as server:
        response = await AsyncHTTPClient().fetch(
            f"http://localhost:{server.port}/embed.json", headers={"Origin": "http://evil.example"},
            raise_error=False,
        )

    assert response.code == 403
    assert "Access-Control-Allow-Origin" not in response.headers


async def test_options_declares_bootstrap_methods() -> None:
    handler = _handler(None)

    await handler.prepare()
    await handler.options()

    assert handler.headers["Access-Control-Allow-Methods"] == "GET, OPTIONS"
    assert handler.origins_checked == 1


def test_embed_json_is_a_per_application_route() -> None:
    assert (r"/embed.json", EmbedJsonHandler) in per_app_patterns
    assert all(pattern != r"/autoload.js" for pattern, *_ in per_app_patterns)
