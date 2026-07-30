#-----------------------------------------------------------------------------
# Copyright (c) Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------
''' Provide a request handler that returns a page displaying a document.

'''

#-----------------------------------------------------------------------------
# Boilerplate
#-----------------------------------------------------------------------------
from __future__ import annotations

import logging # isort:skip
log = logging.getLogger(__name__)

#-----------------------------------------------------------------------------
# Imports
#-----------------------------------------------------------------------------

# Standard library imports
import asyncio
import os
import stat
from collections.abc import Callable, Iterator
from datetime import UTC, datetime
from typing import Any, TypeVar

# External imports
from tornado import httputil, iostream, version_info as tornado_version_info
from tornado.ioloop import IOLoop
from tornado.web import HTTPError, StaticFileHandler as TornadoStaticFileHandler

# Bokeh imports
from bokeh.settings import settings

#-----------------------------------------------------------------------------
# Globals and constants
#-----------------------------------------------------------------------------

__all__ = (
    'AsyncStaticFileHandler',
    'StaticHandler',
)

T = TypeVar("T")

#-----------------------------------------------------------------------------
# General API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Dev API
#-----------------------------------------------------------------------------

class AsyncStaticFileHandler(TornadoStaticFileHandler):
    ''' Serve static files without performing filesystem I/O on the event loop. '''

    async def get(self, path: str, include_body: bool = True) -> None:
        self.path = self.parse_url_path(path)
        absolute_path = self.get_absolute_path(self.root, self.path)
        self.absolute_path = await self._validate_absolute_path(self.root, absolute_path)
        if self.absolute_path is None:
            return

        self.modified = await self._run_in_executor(self.get_modified_time)
        self._computed_etag = await self._run_in_executor(self.compute_etag)
        self.set_headers()

        if self.should_return_304():
            self.set_status(304)
            return

        request_range = None
        range_header = self.request.headers.get("Range")
        if range_header:
            request_range = httputil._parse_request_range(range_header)

        size = await self._run_in_executor(self.get_content_size)
        if request_range:
            start, end = request_range
            if start is not None and start < 0:
                start += size
                if start < 0:
                    start = 0
            if (
                start is not None
                and (start >= size or (end is not None and start >= end))
            ) or end == 0:
                self.set_status(416)
                self.set_header("Content-Type", "text/plain")
                self.set_header("Content-Range", f"bytes */{size}")
                return
            if end is not None and end > size:
                end = size
            if size != (end or size) - (start or 0):
                self.set_status(206)
                self.set_header(
                    "Content-Range", httputil._get_content_range(start, end, size),
                )
        else:
            start = end = None

        if start is not None and end is not None:
            content_length = end - start
        elif end is not None:
            content_length = end
        elif start is not None:
            content_length = size - start
        else:
            content_length = size
        self.set_header("Content-Length", content_length)

        if include_body:
            await self._stream_content(start, end)
        else:
            assert self.request.method == "HEAD"

    def compute_etag(self) -> str | None:
        if hasattr(self, "_computed_etag"):
            return self._computed_etag
        return super().compute_etag()

    def get_modified_time(self) -> datetime:
        stat_result = self._stat()
        modified = datetime.fromtimestamp(int(stat_result.st_mtime), UTC)
        if tornado_version_info < (6, 4):
            return modified.replace(tzinfo=None)
        return modified

    async def _run_in_executor(self, func: Callable[..., T], *args: Any) -> T:
        future = IOLoop.current().run_in_executor(None, func, *args)
        try:
            return await asyncio.shield(future)
        except asyncio.CancelledError:
            try:
                await future
            except Exception:
                pass
            raise

    async def _validate_absolute_path(self, root: str, absolute_path: str) -> str | None:
        root = os.path.abspath(root)
        if not root.endswith(os.path.sep):
            root += os.path.sep
        if not (absolute_path + os.path.sep).startswith(root):
            raise HTTPError(403, "%s is not in root static directory", self.path)

        stat_result = await self._stat_path(absolute_path)
        if stat.S_ISDIR(stat_result.st_mode) and self.default_filename is not None:
            if not self.request.path.endswith("/"):
                if self.request.path.startswith("//"):
                    raise HTTPError(
                        403, "cannot redirect path with two initial slashes",
                    )
                self.redirect(self.request.path + "/", permanent=True)
                return None
            absolute_path = os.path.join(absolute_path, self.default_filename)
            stat_result = await self._stat_path(absolute_path)

        if not stat.S_ISREG(stat_result.st_mode):
            raise HTTPError(403, "%s is not a file", self.path)

        self._stat_result = stat_result
        return absolute_path

    async def _stat_path(self, absolute_path: str) -> os.stat_result:
        try:
            return await self._run_in_executor(self._get_stat_result, absolute_path)
        except OSError as error:
            raise HTTPError(404) from error

    @classmethod
    def _get_stat_result(cls, absolute_path: str) -> os.stat_result:
        return os.stat(absolute_path)

    async def _stream_content(self, start: int | None, end: int | None) -> None:
        raw_content: bytes | Iterator[bytes] = await self._run_in_executor(
            self.get_content, self.absolute_path, start, end,
        )
        content = iter([raw_content]) if isinstance(raw_content, bytes) else iter(raw_content)

        try:
            while True:
                chunk, done = await self._run_in_executor(_next_chunk, content)
                if done:
                    return
                try:
                    self.write(chunk)
                    await self.flush()
                except iostream.StreamClosedError:
                    return
        finally:
            close = getattr(content, "close", None)
            if close is not None:
                await self._run_in_executor(close)


class StaticHandler(AsyncStaticFileHandler):
    ''' Implements a custom Tornado static file handler for BokehJS
    JavaScript and CSS resources.

    '''
    def __init__(self, tornado_app: Any, *args: Any, **kw: Any) -> None:
        kw['path'] = settings.bokehjs_path()

        # Note: tornado_app is stored as self.application
        super().__init__(tornado_app, *args, **kw)

    # We aren't using tornado's built-in static_path function
    # because it relies on TornadoApplication's autoconfigured
    # static handler instead of our custom one. We have a
    # custom one because we think we might want to serve
    # static files from multiple paths at once in the future.
    @classmethod
    def append_version(cls, path: str) -> str:
        # This version is cached on the StaticFileHandler class,
        # keyed by absolute filesystem path, and only invalidated
        # on an explicit StaticFileHandler.reset(). The reset is
        # automatic on every request if you set static_hash_cache=False
        # in TornadoApplication kwargs. In dev mode rely on dev tools
        # to manage caching. This improves the ability to debug code.
        if settings.dev:
            return path
        else:
            version = TornadoStaticFileHandler.get_version(dict(static_path=settings.bokehjs_path()), path)
            return f"{path}?v={version}"

#-----------------------------------------------------------------------------
# Private API
#-----------------------------------------------------------------------------

def _next_chunk(content: Iterator[bytes]) -> tuple[bytes, bool]:
    try:
        return next(content), False
    except StopIteration:
        return b"", True

#-----------------------------------------------------------------------------
# Code
#-----------------------------------------------------------------------------
