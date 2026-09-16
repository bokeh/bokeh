#-----------------------------------------------------------------------------
# Copyright (c) Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------
"""Return the signed bootstrap needed by a server-source EmbedArtifact."""

from __future__ import annotations

# Standard library imports
import json
from collections.abc import Awaitable
from typing import Any, cast
from urllib.parse import urlparse

# External imports
from tornado.web import HTTPError

# Bokeh imports
from bokeh import __version__
from bokeh.settings import settings

# Bokeh imports
from ..session import ServerSession
from ..util import check_allowlist
from .session_handler import SessionHandler


class EmbedJsonHandler(SessionHandler):
    def set_default_headers(self) -> None:
        '''Set headers shared by artifact GET and preflight responses.'''
        self.set_header("Access-Control-Allow-Methods", "GET, OPTIONS")

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
            "Access-Control-Request-Headers", "Bokeh-Session-Id, Content-Type",
        )
        self.set_header("Access-Control-Allow-Headers", requested_headers)
        self.set_header("Vary", "Origin")

    async def get(self, *args: Any, **kwargs: Any) -> None:
        '''Return the signed bootstrap for a server artifact.

        Args:
            args: Positional arguments supplied by Tornado.
            kwargs: Keyword arguments supplied by Tornado.
        '''
        self._allow_websocket_origin()
        session_future = cast("Awaitable[ServerSession | None]", self.get_session())
        session = await session_future
        if session is None:
            raise HTTPError(status_code=403, reason="Invalid token or session ID")
        self.set_header("Content-Type", "application/json")
        self.write(json.dumps({
            "schema": "bokeh.embed-server/v1",
            "bokeh_version": __version__,
            "token": session.token,
        }))

    async def options(self, *args: Any, **kwargs: Any) -> None:
        '''Handle a cross-origin artifact preflight request.

        Args:
            args: Positional arguments supplied by Tornado.
            kwargs: Keyword arguments supplied by Tornado.
        '''
        self.set_header("Access-Control-Allow-Methods", "GET, OPTIONS")
        self._allow_websocket_origin()


__all__ = ("EmbedJsonHandler",)
