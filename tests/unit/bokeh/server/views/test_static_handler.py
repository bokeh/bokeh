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
import asyncio
import os
import threading
from collections.abc import Iterator
from pathlib import Path
from typing import Any

# External imports
from tornado.httpclient import AsyncHTTPClient, HTTPRequest, HTTPResponse

# Bokeh imports
from bokeh.application import Application
from bokeh.server.views.static_handler import AsyncStaticFileHandler
from tests.support.plugins.managed_server_loop import MSL

#-----------------------------------------------------------------------------
# Setup
#-----------------------------------------------------------------------------

_CONTENT = b"0123456789abcdef"

def _url(server: Any, path: str) -> str:
    return f"http://localhost:{server.port}/custom/static/{path}"

async def _fetch(server: Any, path: str, **kwargs: Any) -> HTTPResponse:
    request = HTTPRequest(_url(server, path), **kwargs)
    return await AsyncHTTPClient().fetch(request, raise_error=False)

#-----------------------------------------------------------------------------
# General API
#-----------------------------------------------------------------------------

async def test_static_response_compatibility(tmp_path: Path, ManagedServerLoop: MSL) -> None:
    (tmp_path / "asset.txt").write_bytes(_CONTENT)
    (tmp_path / "directory").mkdir()
    AsyncStaticFileHandler.reset()

    patterns = [
        (r"/custom/static/(.*)", AsyncStaticFileHandler, {"path": str(tmp_path)}),
    ]
    with ManagedServerLoop(Application(), extra_patterns=patterns) as server:
        response = await _fetch(server, "asset.txt")

        assert response.code == 200
        assert response.body == _CONTENT
        assert response.headers["Accept-Ranges"] == "bytes"
        assert response.headers["Content-Length"] == str(len(_CONTENT))
        assert response.headers["Content-Type"].startswith("text/plain")
        assert "Etag" in response.headers
        assert "Last-Modified" in response.headers

        etag = response.headers["Etag"]
        last_modified = response.headers["Last-Modified"]

        head = await _fetch(server, "asset.txt", method="HEAD")
        assert head.code == 200
        assert head.body == b""
        assert head.headers["Content-Length"] == str(len(_CONTENT))
        assert head.headers["Etag"] == etag

        partial = await _fetch(
            server, "asset.txt", headers={"Range": "bytes=2-5"},
        )
        assert partial.code == 206
        assert partial.body == _CONTENT[2:6]
        assert partial.headers["Content-Length"] == "4"
        assert partial.headers["Content-Range"] == f"bytes 2-5/{len(_CONTENT)}"
        assert partial.headers["Etag"] == etag

        not_modified = await _fetch(
            server, "asset.txt", headers={"If-None-Match": etag},
        )
        assert not_modified.code == 304
        assert not_modified.body == b""

        not_modified_since = await _fetch(
            server, "asset.txt", headers={"If-Modified-Since": last_modified},
        )
        assert not_modified_since.code == 304
        assert not_modified_since.body == b""

        unsatisfiable = await _fetch(
            server, "asset.txt", headers={"Range": "bytes=100-"},
        )
        assert unsatisfiable.code == 416
        assert unsatisfiable.headers["Content-Range"] == f"bytes */{len(_CONTENT)}"

        missing = await _fetch(server, "missing.txt")
        assert missing.code == 404

        directory = await _fetch(server, "directory/")
        assert directory.code == 403

async def test_static_filesystem_operations_run_off_loop(tmp_path: Path, ManagedServerLoop: MSL) -> None:
    path = tmp_path / "asset.bin"
    path.write_bytes(_CONTENT)
    loop_thread = threading.get_ident()

    class TrackingStaticFileHandler(AsyncStaticFileHandler):
        operations: list[tuple[str, int]] = []

        @classmethod
        def _get_stat_result(cls, absolute_path: str) -> os.stat_result:
            cls.operations.append(("stat", threading.get_ident()))
            return super()._get_stat_result(absolute_path)

        @classmethod
        def get_content(cls, abspath: str, start: int | None = None,
                end: int | None = None) -> Iterator[bytes]:
            cls.operations.append(("open", threading.get_ident()))
            file = open(abspath, "rb")
            try:
                if start is not None:
                    file.seek(start)
                remaining = None if end is None else end - (start or 0)
                while remaining is None or remaining > 0:
                    cls.operations.append(("read", threading.get_ident()))
                    chunk = file.read(4 if remaining is None else min(4, remaining))
                    if not chunk:
                        return
                    if remaining is not None:
                        remaining -= len(chunk)
                    yield chunk
            finally:
                cls.operations.append(("close", threading.get_ident()))
                file.close()

    TrackingStaticFileHandler.reset()
    patterns = [
        (r"/custom/static/(.*)", TrackingStaticFileHandler, {"path": str(tmp_path)}),
    ]
    with ManagedServerLoop(Application(), extra_patterns=patterns) as server:
        response = await _fetch(server, path.name)

    assert response.code == 200
    assert response.body == _CONTENT
    assert {"stat", "open", "read", "close"} <= {name for name, _ in TrackingStaticFileHandler.operations}
    assert all(thread_id != loop_thread for _, thread_id in TrackingStaticFileHandler.operations)

async def test_static_streaming_waits_for_flush(tmp_path: Path, ManagedServerLoop: MSL) -> None:
    (tmp_path / "asset.bin").write_bytes(b"abc")
    loop_thread = threading.get_ident()

    class BackpressureStaticFileHandler(AsyncStaticFileHandler):
        first_flush = asyncio.Event()
        release_flush = asyncio.Event()
        closed = threading.Event()
        chunks_requested = 0
        close_thread: int | None = None

        def compute_etag(self) -> str:
            return '"fixed"'

        @classmethod
        def get_content(cls, abspath: str, start: int | None = None,
                end: int | None = None) -> Iterator[bytes]:
            try:
                for chunk in (b"a", b"b", b"c"):
                    cls.chunks_requested += 1
                    yield chunk
            finally:
                cls.close_thread = threading.get_ident()
                cls.closed.set()

        async def flush(self, include_footers: bool = False) -> None:
            if not self.first_flush.is_set():
                self.first_flush.set()
                await self.release_flush.wait()
            await super().flush(include_footers)

    patterns = [
        (r"/custom/static/(.*)", BackpressureStaticFileHandler, {"path": str(tmp_path)}),
    ]
    with ManagedServerLoop(Application(), extra_patterns=patterns) as server:
        response_future = asyncio.create_task(_fetch(server, "asset.bin"))
        await asyncio.wait_for(BackpressureStaticFileHandler.first_flush.wait(), 5)
        assert BackpressureStaticFileHandler.chunks_requested == 1

        BackpressureStaticFileHandler.release_flush.set()
        response = await asyncio.wait_for(response_future, 5)

    assert response.code == 200
    assert response.body == b"abc"
    assert BackpressureStaticFileHandler.closed.is_set()
    assert BackpressureStaticFileHandler.close_thread != loop_thread

async def test_static_content_is_closed_on_read_error(tmp_path: Path, ManagedServerLoop: MSL) -> None:
    (tmp_path / "asset.bin").write_bytes(b"x")
    loop_thread = threading.get_ident()

    class BrokenContent:
        def __iter__(self) -> BrokenContent:
            return self

        def __next__(self) -> bytes:
            raise OSError("read failed")

        def close(self) -> None:
            BrokenStaticFileHandler.close_thread = threading.get_ident()
            BrokenStaticFileHandler.closed.set()

    class BrokenStaticFileHandler(AsyncStaticFileHandler):
        closed = threading.Event()
        close_thread: int | None = None

        def compute_etag(self) -> str:
            return '"fixed"'

        @classmethod
        def get_content(cls, abspath: str, start: int | None = None,
                end: int | None = None) -> BrokenContent:
            return BrokenContent()

    patterns = [
        (r"/custom/static/(.*)", BrokenStaticFileHandler, {"path": str(tmp_path)}),
    ]
    with ManagedServerLoop(Application(), extra_patterns=patterns) as server:
        response = await _fetch(server, "asset.bin")

    assert response.code == 500
    assert BrokenStaticFileHandler.closed.is_set()
    assert BrokenStaticFileHandler.close_thread != loop_thread

#-----------------------------------------------------------------------------
# Dev API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Private API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Code
#-----------------------------------------------------------------------------
