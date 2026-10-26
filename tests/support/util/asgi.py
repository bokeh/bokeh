#-----------------------------------------------------------------------------
# Copyright (c) Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------
"""Run an ASGI application on a private loop for browser tests."""

from __future__ import annotations

# Standard library imports
import socket
import threading
import time
from collections.abc import Iterator
from contextlib import contextmanager
from dataclasses import dataclass
from typing import Any

# External imports
import uvicorn


@dataclass
class ASGIHost:
    port: int

    @property
    def url(self) -> str:
        return f"http://127.0.0.1:{self.port}"


@contextmanager
def running_asgi(application: Any) -> Iterator[ASGIHost]:
    with socket.create_server(("127.0.0.1", 0)) as listener:
        port = listener.getsockname()[1]
        server = uvicorn.Server(uvicorn.Config(application, host="127.0.0.1", port=port,
                                              lifespan="on", loop="asyncio", log_config=None,
                                              access_log=False))
        failures: list[BaseException] = []

        def run() -> None:
            try:
                server.run(sockets=[listener])
            except BaseException as error:
                failures.append(error)

        thread = threading.Thread(target=run, daemon=True)
        thread.start()
        try:
            deadline = time.monotonic() + 15
            while not server.started:
                if failures:
                    raise RuntimeError("ASGI test host failed") from failures[0]
                if not thread.is_alive() or time.monotonic() >= deadline:
                    raise RuntimeError("ASGI test host did not start")
                time.sleep(0.01)
            yield ASGIHost(port)
        finally:
            server.should_exit = True
            thread.join(timeout=10)
            if thread.is_alive():
                server.force_exit = True
                thread.join(timeout=2)
                raise RuntimeError("ASGI test host did not shut down")
            if failures:
                raise RuntimeError("ASGI test host failed") from failures[0]
