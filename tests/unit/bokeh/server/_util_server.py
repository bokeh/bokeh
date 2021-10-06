#-----------------------------------------------------------------------------
# Copyright (c) 2012 - 2021, Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Boilerplate
#-----------------------------------------------------------------------------
from __future__ import annotations # isort:skip

import logging # isort:skip
log = logging.getLogger(__name__)

#-----------------------------------------------------------------------------
# Imports
#-----------------------------------------------------------------------------

# Standard library imports
from typing import (
    TYPE_CHECKING,
    Any,
    Dict,
    List,
)

# External imports
from tornado.httpclient import AsyncHTTPClient, HTTPRequest
from tornado.websocket import WebSocketClientConnection, websocket_connect

if TYPE_CHECKING:
    from tornado.ioloop import IOLoop

## Bokeh imports
if TYPE_CHECKING:
    from bokeh.server.server import Server

#-----------------------------------------------------------------------------
# Globals and constants
#-----------------------------------------------------------------------------

__all__ = (
    'http_get',
    'url',
    'websocket_open',
    'ws_url',
)

#-----------------------------------------------------------------------------
# General API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Dev API
#-----------------------------------------------------------------------------

def url(server: Server, prefix: str = "") -> str:
    return f"http://localhost:{server.port}{prefix}/"

def ws_url(server: Server, prefix: str = "") -> str:
    return f"ws://localhost:{server.port}{prefix}/ws"

async def http_get(io_loop: IOLoop, url: str, headers: Dict[str, str] | None = None) -> Any:
    http_client = AsyncHTTPClient()
    if not headers:
        headers = {}
    return await http_client.fetch(url, headers=headers)

async def websocket_open(io_loop: IOLoop, url: str, origin: str | None = None,
        subprotocols: List[str] = []) -> WebSocketClientConnection:
    request = HTTPRequest(url)
    if origin is not None:
        request.headers["Origin"] = origin
    result = await websocket_connect(request, subprotocols=subprotocols)
    result.close()
    return result

#-----------------------------------------------------------------------------
# Private API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Code
#-----------------------------------------------------------------------------
