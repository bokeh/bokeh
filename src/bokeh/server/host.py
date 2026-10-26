#-----------------------------------------------------------------------------
# Copyright (c) Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------
"""Private single-process ASGI hosting for the Bokeh command line."""

from __future__ import annotations

# Standard library imports
import logging
from importlib.util import find_spec
from typing import Any

# External imports
import uvicorn

# Bokeh imports
from ..util.browser import get_browser_controller
from .asgi import BokehASGI
from .util import bind_sockets

log = logging.getLogger(__name__)

__all__ = ()


class _Server(uvicorn.Server):

    def __init__(self, application: BokehASGI, *, show: bool, **kwargs: Any) -> None:
        self.application = application
        self.show = show
        websocket_backend = ("websockets-sansio" if
            find_spec("uvicorn.protocols.websockets.websockets_sansio_impl") is not None else "auto")
        super().__init__(uvicorn.Config(application, lifespan="on", log_config=None, ws=websocket_backend, **kwargs))

    async def startup(self, sockets: Any = None) -> None:
        await super().startup(sockets)
        if not self.started:
            return
        if self.config.uds is not None:
            log.info("Bokeh server listening on %s", self.config.uds)
            return
        port = self.servers[0].sockets[0].getsockname()[1]
        # Port zero is resolved only after binding. Add its actual local origin.
        for origin in list(self.application.core.websocket_origins):
            if origin.endswith(":0"):
                self.application.core._websocket_origins.remove(origin)
                self.application.core._websocket_origins.add(f"{origin[:-1]}{port}")
        host = self.config.host
        if host in ("0.0.0.0", "::"):
            host = "localhost"
        if ":" in host:
            host = f"[{host}]"
        scheme = "https" if self.config.is_ssl else "http"
        if not self.application.core.app_paths:
            log.info("Bokeh static assets available at: %s://%s:%s/static/", scheme, host, port)
        for path in sorted(self.application.core.app_paths):
            url = f"{scheme}://{host}:{port}{self.application.core.prefix}{path}"
            log.info("Bokeh app running at: %s", url)
            if self.show:
                get_browser_controller().open(url, new=2)


def serve(application: BokehASGI, *, address: str | None = None, port: int = 5006,
          unix_socket: str | None = None, show: bool = False, **kwargs: Any) -> None:
    """Run the CLI host until interrupted, including ASGI session shutdown."""
    server = _Server(application, show=show, host="0.0.0.0" if address is None else address, port=port,
                     uds=unix_socket, **kwargs)
    try:
        if unix_socket is not None:
            listeners = [server.config.bind_socket()]
        else:
            listeners, _ = bind_sockets(address, port)
    except OSError as error:
        log.error("Could not bind Bokeh server: %s", error)
        raise SystemExit(1) from None
    try:
        server.run(sockets=listeners)
    finally:
        for listener in listeners:
            listener.close()
