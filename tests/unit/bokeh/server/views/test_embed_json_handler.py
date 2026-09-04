#-----------------------------------------------------------------------------
# Copyright (c) Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------

from __future__ import annotations

# Standard library imports
import json
from typing import Any

# External imports
import pytest
from tornado.web import HTTPError

# Bokeh imports
from bokeh import __version__
from bokeh.server.urls import per_app_patterns
from bokeh.server.views.embed_json_handler import EmbedJsonHandler


class _TestEmbedJsonHandler(EmbedJsonHandler):
    headers: dict[str, str]
    body: str
    token: str | None

    def _allow_websocket_origin(self) -> None:
        pass

    async def get_session(self) -> Any:
        if self.token is None:
            return None
        return type("Session", (), {"token": self.token})()

    def set_header(self, name: str, value: str) -> None:
        self.headers[name] = value

    def write(self, chunk: str) -> None:
        self.body = chunk


def _handler(token: str | None) -> _TestEmbedJsonHandler:
    handler = object.__new__(_TestEmbedJsonHandler)
    handler.headers = {}
    handler.body = ""
    handler.token = token
    return handler


async def test_get_returns_versioned_signed_bootstrap() -> None:
    handler = _handler("signed-token")

    await handler.get()

    assert handler.headers["Content-Type"] == "application/json"
    assert json.loads(handler.body) == {
        "schema": "bokeh.embed-server/v1",
        "bokeh_version": __version__,
        "token": "signed-token",
    }


async def test_get_rejects_missing_session() -> None:
    handler = _handler(None)

    with pytest.raises(HTTPError, match="Invalid token or session ID") as exc:
        await handler.get()

    assert exc.value.status_code == 403


async def test_options_declares_bootstrap_methods() -> None:
    handler = _handler(None)

    await handler.options()

    assert handler.headers["Access-Control-Allow-Methods"] == "GET, OPTIONS"


def test_embed_json_is_a_per_application_route() -> None:
    assert (r"/embed.json", EmbedJsonHandler) in per_app_patterns
    assert all(pattern != r"/autoload.js" for pattern, *_ in per_app_patterns)
