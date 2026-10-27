#-----------------------------------------------------------------------------
# Copyright (c) Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------
"""Static-file HTTP semantics shared by the ASGI asset routes."""

from __future__ import annotations

# Standard library imports
import hashlib
import mimetypes
import os
import re
import time
from collections import OrderedDict
from collections.abc import Awaitable, Callable
from datetime import UTC
from email.utils import formatdate, parsedate_to_datetime
from io import BufferedReader
from pathlib import Path
from typing import Any

# Bokeh imports
from ..util.asyncio import _run_in_executor
from .request import ServerRequest

type Send = Callable[[dict[str, Any]], Awaitable[None]]
type HeaderList = list[tuple[bytes, bytes]]

_TAG = re.compile(r'(?:W/)?"[\x21\x23-\x7e\x80-\xff]*"')
_RANGE = re.compile(r"bytes=([0-9]*)-([0-9]*)", re.IGNORECASE)
_HTTP_DATE = re.compile(
    r"(?:[A-Za-z]{3}, [0-9]{2} [A-Za-z]{3} [0-9]{4} [0-9]{2}:[0-9]{2}:[0-9]{2} GMT|"
    r"[A-Za-z]+, [0-9]{2}-[A-Za-z]{3}-[0-9]{2} [0-9]{2}:[0-9]{2}:[0-9]{2} GMT|"
    r"[A-Za-z]{3} [A-Za-z]{3} [ 0-9][0-9] [0-9]{2}:[0-9]{2}:[0-9]{2} [0-9]{4})", re.IGNORECASE,
)
_YEAR = 365 * 24 * 60 * 60


def _date(value: str | None) -> int | None:
    if value is None or _HTTP_DATE.fullmatch(value.strip()) is None:
        return None
    try:
        date = parsedate_to_datetime(value)
        if date.tzinfo is None:
            # Obsolete asctime HTTP dates also denote GMT.
            date = date.replace(tzinfo=UTC)
        return int(date.timestamp())
    except (ValueError, TypeError, OverflowError):
        return None


def _matches(value: str, etag: str, *, weak: bool) -> bool:
    if value.strip() == "*":
        return True
    tags: list[str] = []
    end = 0
    for match in _TAG.finditer(value):
        separator = "" if not tags else ","
        if value[end:match.start()].strip() != separator:
            return False
        tags.append(match.group())
        end = match.end()
    if value[end:].strip():
        return False
    return any((tag.removeprefix("W/") if weak else tag) == etag for tag in tags)


def _range(value: str, size: int) -> tuple[int, int] | None:
    """Return a single half-open byte range, ignoring unsupported syntax."""
    match = _RANGE.fullmatch(value.strip())
    if match is None or not any(match.groups()):
        return None

    def number(value: str) -> int:
        # Bound conversion work even for arbitrarily long decimal fields.
        digits = value.lstrip("0") or "0"
        return int(digits) if len(digits) <= 20 else size + 1

    first, last = match.groups()
    if first:
        start = number(first)
        stop = number(last) + 1 if last else size
        if last and stop <= start:
            return None
        if start >= size:
            raise ValueError("Unsatisfiable range")
        return start, min(stop, size)
    suffix = number(last)
    if suffix == 0 or size == 0:
        raise ValueError("Unsatisfiable range")
    return max(0, size - suffix), size


def _error_headers(headers: HeaderList) -> HeaderList:
    return [(name, value) for name, value in headers if name not in (b"cache-control", b"expires")] + [(b"cache-control", b"no-store")]


async def _reply(send: Send, status: int, headers: HeaderList, body: bytes = b"", *, head: bool = False) -> None:
    if status != 304:
        headers = [*headers, (b"content-length", str(len(body)).encode())]
    await send({"type": "http.response.start", "status": status, "headers": headers})
    await send({"type": "http.response.body", "body": b"" if head else body})


class StaticFiles:
    """Stream files with a bounded cache of content digests."""

    def __init__(self) -> None:
        self._etags: OrderedDict[tuple[int, ...], str] = OrderedDict()

    async def serve(self, request: ServerRequest, send: Send, root: str | Path | None, relative: str) -> None:
        head = request.method.upper() == "HEAD"
        stream: BufferedReader | None = None

        def open_file() -> tuple[Path, os.stat_result]:
            nonlocal stream
            if root is None or not relative:
                raise FileNotFoundError
            directory = Path(root).resolve()
            path = (directory / relative).resolve()
            if not path.is_relative_to(directory) or not path.is_file():
                raise FileNotFoundError
            stream = path.open("rb")
            return path, os.fstat(stream.fileno())

        try:
            try:
                path, stat = await _run_in_executor(open_file)
            except (FileNotFoundError, NotADirectoryError, IsADirectoryError):
                await _reply(send, 404, [(b"content-type", b"text/plain"), (b"cache-control", b"no-store")], b"Not found", head=head)
                return
            except PermissionError:
                await _reply(send, 403, [(b"content-type", b"text/plain"), (b"cache-control", b"no-store")], b"Forbidden", head=head)
                return
            assert stream is not None
            key = (stat.st_dev, stat.st_ino, stat.st_size, stat.st_mtime_ns, stat.st_ctime_ns)
            # On Windows ctime can denote creation time, so preserved mtimes are insufficient.
            etag = self._etags.get(key) if os.name != "nt" else None
            if etag is None:
                digest = await _run_in_executor(hashlib.file_digest, stream, "sha256")
                etag = '"' + digest.hexdigest() + '"'
                self._etags[key] = etag
                if len(self._etags) > 128:
                    self._etags.popitem(last=False)
            self._etags.move_to_end(key)
            now = int(time.time())
            modified = min(int(stat.st_mtime), now)
            versioned = any(request.arguments.get("v", ()))
            cache = f"public, max-age={_YEAR}" if versioned else "public, max-age=0, must-revalidate"
            headers = [(b"etag", etag.encode()), (b"last-modified", formatdate(modified, usegmt=True).encode()),
                       (b"cache-control", cache.encode()), (b"accept-ranges", b"bytes")]
            if versioned:
                headers.append((b"expires", formatdate(now + _YEAR, usegmt=True).encode()))

            conditions = request.headers
            if_match = conditions.get("If-Match")
            unmodified = _date(conditions.get("If-Unmodified-Since"))
            if (if_match is not None and not _matches(if_match, etag, weak=False)) or (
                    if_match is None and unmodified is not None and modified > unmodified):
                await _reply(send, 412, _error_headers(headers), head=head)
                return
            if_none = conditions.get("If-None-Match")
            since = _date(conditions.get("If-Modified-Since"))
            if (if_none is not None and _matches(if_none, etag, weak=True)) or (
                    if_none is None and since is not None and modified <= since):
                await _reply(send, 304, headers, head=head)
                return

            start, stop = 0, stat.st_size
            status = 200
            requested = conditions.get("Range") if not head else None
            if_range = conditions.get("If-Range")
            if requested is not None and if_range is not None:
                date = _date(if_range)
                # A recent second-resolution date cannot safely validate a partial response.
                if if_range.strip() != etag and not (date == modified and modified < now):
                    requested = None
            if requested is not None:
                try:
                    selected = _range(requested, stat.st_size)
                except ValueError:
                    await _reply(send, 416, [*_error_headers(headers), (b"content-range", f"bytes */{stat.st_size}".encode())])
                    return
                if selected is not None:
                    start, stop = selected
                    status = 206
                    headers.append((b"content-range", f"bytes {start}-{stop - 1}/{stat.st_size}".encode()))

            content_type = mimetypes.guess_type(path.name)[0] or "application/octet-stream"
            headers.extend([(b"content-type", content_type.encode()), (b"content-length", str(stop - start).encode())])
            await send({"type": "http.response.start", "status": status, "headers": headers})
            if not head:
                await _run_in_executor(stream.seek, start)
                remaining = stop - start
                while remaining:
                    chunk = await _run_in_executor(stream.read, min(remaining, 64 * 1024))
                    if not chunk:
                        raise OSError("Static file was truncated while being served")
                    remaining -= len(chunk)
                    await send({"type": "http.response.body", "body": chunk, "more_body": True})
            await send({"type": "http.response.body", "body": b""})
        finally:
            if stream is not None:
                await _run_in_executor(stream.close)
