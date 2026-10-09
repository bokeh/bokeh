#-----------------------------------------------------------------------------
# Copyright (c) Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------

from __future__ import annotations

# Standard library imports
import hashlib
import json
import sys
from pathlib import Path
from types import ModuleType, SimpleNamespace
from typing import Any

# External imports
import pytest
from tornado.httpclient import AsyncHTTPClient
from tornado.web import HTTPError

# Bokeh imports
from bokeh import __version__
from bokeh.application import Application
from bokeh.document import Document
from bokeh.embed.resources import extension_dirs
from bokeh.model import Model
from bokeh.models import CustomJS
from bokeh.resources import Resources
from bokeh.server.urls import per_app_patterns
from bokeh.server.views.embed_json_handler import EmbedJsonHandler
from bokeh.util.compiler import JavaScript
from tests.support.plugins.managed_server_loop import MSL


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
        return type("Session", (), {"token": self.token, "document": self.document})()

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
        "resources": {"mode": "resolved", "assets": []},
    }


async def test_get_includes_all_registered_extension_assets(monkeypatch: pytest.MonkeyPatch) -> None:
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
        return SimpleNamespace(token="signed-token", document=document)

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
    assert bootstrap["resources"] == {"mode": "resolved", "assets": []}


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
        "bokeh.server.views.embed_json_handler.HasProps",
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
