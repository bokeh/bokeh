#-----------------------------------------------------------------------------
# Copyright (c) Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------
"""Return the signed bootstrap needed by a server-source EmbedResult."""

from __future__ import annotations

# Standard library imports
import asyncio
import json
from collections.abc import Awaitable
from typing import Any, cast
from urllib.parse import urlparse

# External imports
from tornado.web import HTTPError, authenticated

# Bokeh imports
from bokeh import __version__
from bokeh.embed.resources import (
    resolve_server_extensions,
    server_extension_model_types,
    server_extension_resources,
)
from bokeh.settings import settings

# Bokeh imports
from ..session import ServerSession
from ..util import check_allowlist
from .session_handler import SessionHandler


class EmbedJsonHandler(SessionHandler):
    def set_default_headers(self) -> None:
        '''Set headers shared by embed payload GET and preflight responses.'''
        self.set_header("Access-Control-Allow-Methods", "GET, OPTIONS")
        self.set_header("Cache-Control", "no-store")
        self.set_header("Pragma", "no-cache")
        self.set_header("X-Content-Type-Options", "nosniff")

    async def prepare(self) -> None:
        '''Validate the embedding origin before authentication or dispatch.'''
        self._allow_websocket_origin()
        await super().prepare()

    def write_error(self, status_code: int, **kwargs: Any) -> None:
        '''Restore allowed-origin headers after Tornado clears an error response.'''
        try:
            self._allow_websocket_origin()
        except HTTPError:
            pass
        error = kwargs.get("exc_info", (None, None, None))[1]
        if status_code == 409 and isinstance(error, HTTPError) and error.log_message is not None:
            self.set_header("Content-Type", "text/plain; charset=UTF-8")
            detail = error.log_message % error.args if error.args else error.log_message
            self.finish(detail)
            return
        super().write_error(status_code, **kwargs)

    def _allow_websocket_origin(self) -> None:
        if "Origin" not in self.request.headers:
            return
        origin = self.request.headers["Origin"]
        origin_host = urlparse(origin).netloc.lower()
        allowed_hosts = list(self.application.websocket_origins)
        if settings.allowed_ws_origin():
            allowed_hosts = settings.allowed_ws_origin()
        if not check_allowlist(origin_host, allowed_hosts):
            raise HTTPError(status_code=403, reason="Origin is not allowed")
        self.set_header("Access-Control-Allow-Origin", origin)
        self.set_header("Access-Control-Allow-Credentials", "true")
        requested_headers = self.request.headers.get(
            "Access-Control-Request-Headers",
            "Bokeh-Session-Id, Bokeh-Token, Bokeh-Resource-Mode, Bokeh-Resource-Minified, Content-Type",
        )
        self.set_header("Access-Control-Allow-Headers", requested_headers)
        self.set_header("Vary", "Origin")

    @authenticated
    async def get(self, *args: Any, **kwargs: Any) -> None:
        '''Return the signed bootstrap for a server embed payload.

        Args:
            args: Positional arguments supplied by Tornado.
            kwargs: Keyword arguments supplied by Tornado.
        '''
        try:
            policy = server_extension_resources(
                self.application.resources(),
                mode=self.request.headers.get("Bokeh-Resource-Mode"),
                minified=self.request.headers.get("Bokeh-Resource-Minified"),
                root_url=self.application.prefix or "/",
            )
        except ValueError as error:
            raise HTTPError(409, "%s", str(error), reason="Bokeh resource conflict") from error
        session_future = cast("Awaitable[ServerSession | None]", self.get_session())
        session = await session_future
        if session is None:
            raise HTTPError(status_code=403, reason="Invalid token or session ID")
        try:
            if policy.mode in ("inline", "offline"):
                model_types = await session.with_document_locked(
                    server_extension_model_types, policy, session.document,
                )
                if model_types is None:
                    raise HTTPError(status_code=403, reason="Session no longer available")
            else:
                model_types = server_extension_model_types(policy, session.document)
            extensions = await asyncio.to_thread(resolve_server_extensions, policy, model_types)
        except ValueError as error:
            raise HTTPError(409, "%s", str(error), reason="Bokeh resource conflict") from error
        self.set_header("Content-Type", "application/json")
        self.write(json.dumps({
            "schema": "bokeh.embed-server/v1",
            "bokeh_version": __version__,
            "token": session.token,
            "requires": extensions.requirements.to_dict(),
            "resources": {
                "mode": "resolved",
                "root_url": self.application.prefix or "/",
                "assets": [asset.to_dict() for asset in extensions.assets],
            },
        }))

    async def options(self, *args: Any, **kwargs: Any) -> None:
        '''Handle a cross-origin embed payload preflight request.

        Args:
            args: Positional arguments supplied by Tornado.
            kwargs: Keyword arguments supplied by Tornado.
        '''
        self.set_header("Access-Control-Allow-Methods", "GET, OPTIONS")


__all__ = ("EmbedJsonHandler",)
