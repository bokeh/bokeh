#-----------------------------------------------------------------------------
# Copyright (c) Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------
"""Cache validation and byte ranges through all ASGI static-file routes."""

from __future__ import annotations

# Standard library imports
import asyncio
import hashlib
import os
import threading
from email.utils import formatdate
from pathlib import Path

# External imports
import pytest

# Bokeh imports
from bokeh.application import Application
from bokeh.embed.resources import extension_dirs
from bokeh.server.asgi import BokehASGI

# Bokeh test imports
from tests.unit.bokeh.server.test_asgi import http_request, response_body, response_header, response_status


@pytest.fixture(params=["root", "application", "extension"])
async def asset(tmp_path, monkeypatch, request):
    content = bytes(range(256)) * 513
    path = tmp_path / "data.bin"
    path.write_bytes(content)
    os.utime(path, (1_700_000_000, 1_700_000_000))
    application = Application()
    if request.param == "root":
        app = BokehASGI(application)
        url = "/static/data.bin"
    elif request.param == "application":
        app = BokehASGI({"/example": application})
        url = "/example/static/data.bin"
    else:
        app = BokehASGI(application)
        monkeypatch.setitem(extension_dirs, "test-http", tmp_path)
        url = "/static/extensions/test-http/data.bin"
    application._static_path = str(tmp_path)
    try:
        yield app, url, path, content
    finally:
        await app.core.stop()


async def get(asset, headers=None, **kwargs):
    app, url, _, _ = asset
    return await http_request(app, url, headers=[(name.lower().encode(), value.encode()) for name, value in (headers or {}).items()], **kwargs)


async def test_static_validators_cache_policy_and_head(asset):
    _, _, _, content = asset
    response = await get(asset)
    head = await get(asset, method="HEAD")
    assert response_status(response) == response_status(head) == 200
    assert response_body(response) == content
    assert response_body(head) == b""
    for name in (b"etag", b"last-modified", b"cache-control", b"content-length", b"accept-ranges"):
        assert response_header(response, name) == response_header(head, name)
    assert response_header(response, b"etag") == ('"' + hashlib.sha256(content).hexdigest() + '"').encode()
    assert response_header(response, b"last-modified") == formatdate(1_700_000_000, usegmt=True).encode()
    assert response_header(response, b"cache-control") == b"public, max-age=0, must-revalidate"
    versioned = await get(asset, query={"v": "version-one"})
    assert response_header(versioned, b"cache-control") == b"public, max-age=31536000"
    assert response_header(versioned, b"expires")


@pytest.mark.parametrize("method", ["GET", "HEAD"])
@pytest.mark.parametrize("condition", ["etag", "weak", "list", "wildcard", "date"])
async def test_static_conditional_requests_return_bodyless_304(asset, method, condition):
    initial = await get(asset)
    etag = response_header(initial, b"etag").decode()
    headers = {
        "etag": {"If-None-Match": etag},
        "weak": {"If-None-Match": "W/" + etag},
        "list": {"If-None-Match": f'"other,tag", W/{etag}'},
        "wildcard": {"If-None-Match": "*"},
        "date": {"If-Modified-Since": response_header(initial, b"last-modified").decode()},
    }[condition]
    headers["Range"] = "bytes=0-3"
    response = await get(asset, headers, method=method)
    assert response_status(response) == 304
    assert response_body(response) == b""
    assert response_header(response, b"etag") == etag.encode()
    assert response_header(response, b"cache-control") == response_header(initial, b"cache-control")
    assert b"content-length" not in dict(response[0]["headers"])
    assert b"content-range" not in dict(response[0]["headers"])


@pytest.mark.parametrize(("headers", "status"), [
    ({"If-None-Match": '"other"', "If-Modified-Since": "Tue, 14 Nov 2023 22:13:20 GMT"}, 200),
    ({"If-Modified-Since": "invalid"}, 200),
    ({"If-Modified-Since": "Tue, 14 Nov 2023 22:13:20 GMT, Tue, 14 Nov 2023 22:13:20 GMT"}, 200),
    ({"If-Match": '"other"'}, 412),
    ({"If-Match": '"other"', "If-None-Match": "*"}, 412),
    ({"If-Unmodified-Since": "Tue, 14 Nov 2023 22:13:19 GMT"}, 412),
    ({"If-Match": "*", "If-Unmodified-Since": "Tue, 14 Nov 2023 22:13:19 GMT"}, 200),
])
async def test_static_precondition_precedence(asset, headers, status):
    response = await get(asset, headers)
    assert response_status(response) == status
    if status == 412:
        assert response_body(response) == b""
        assert response_header(response, b"cache-control") == b"no-store"


@pytest.mark.parametrize(("value", "start", "stop"), [
    ("bytes=0-3", 0, 4), ("bytes=65530-65545", 65530, 65546),
    ("bytes=131320-", 131320, 131328), ("bytes=-8", 131320, 131328),
    ("bytes=0-999999", 0, 131328), ("bytes=-999999", 0, 131328),
    ("bytes=0-" + "9" * 5000, 0, 131328),
])
async def test_static_byte_ranges(asset, value, start, stop):
    _, _, _, content = asset
    response = await get(asset, {"Range": value})
    assert response_status(response) == 206
    assert response_body(response) == content[start:stop]
    assert response_header(response, b"content-length") == str(stop - start).encode()
    assert response_header(response, b"content-range") == f"bytes {start}-{stop - 1}/{len(content)}".encode()


@pytest.mark.parametrize("value", ["bytes=131328-", "bytes=-0", "bytes=" + "9" * 5000 + "-"])
async def test_static_unsatisfiable_ranges(asset, value):
    response = await get(asset, {"Range": value})
    assert response_status(response) == 416
    assert response_header(response, b"cache-control") == b"no-store"
    assert response_header(response, b"content-range") == b"bytes */131328"
    assert response_header(response, b"content-length") == b"0"
    assert response_body(response) == b""


@pytest.mark.parametrize("value", ["items=0-3", "bytes=oops", "bytes=-", "bytes=5-3", "bytes=0-1,4-5"])
async def test_static_unsupported_or_malformed_ranges_fall_back_to_full_response(asset, value):
    response = await get(asset, {"Range": value})
    assert response_status(response) == 200
    assert response_body(response) == asset[3]
    head = await get(asset, {"Range": "bytes=0-3"}, method="HEAD")
    assert response_status(head) == 200
    assert response_header(head, b"content-length") == str(len(asset[3])).encode()
    assert b"content-range" not in dict(head[0]["headers"])


@pytest.mark.parametrize("condition", ["etag", "date", "weak", "stale", "future-date", "invalid"])
async def test_static_if_range_requires_matching_validator(asset, condition):
    initial = await get(asset)
    etag = response_header(initial, b"etag").decode()
    validator = {
        "etag": etag, "date": response_header(initial, b"last-modified").decode(),
        "weak": "W/" + etag, "stale": '"stale"', "invalid": "invalid",
        "future-date": "Tue, 14 Nov 2023 22:13:21 GMT",
    }[condition]
    response = await get(asset, {"Range": "bytes=0-3", "If-Range": validator})
    partial = condition in ("etag", "date")
    assert response_status(response) == (206 if partial else 200)
    assert response_body(response) == (asset[3][:4] if partial else asset[3])


async def test_static_changed_file_invalidates_cached_digest_even_with_preserved_mtime(asset):
    _, _, path, content = asset
    initial = await get(asset)
    previous_stat = path.stat()
    updated = content[::-1]
    path.write_bytes(updated)
    os.utime(path, ns=(previous_stat.st_atime_ns, previous_stat.st_mtime_ns))
    response = await get(asset, {"If-None-Match": response_header(initial, b"etag").decode()})
    assert response_status(response) == 200
    assert response_body(response) == updated
    assert response_header(response, b"etag") != response_header(initial, b"etag")


async def test_empty_static_file_and_ranges(asset):
    asset[2].write_bytes(b"")
    response = await get(asset)
    assert response_status(response) == 200
    assert response_body(response) == b""
    response = await get(asset, {"Range": "bytes=0-0"})
    assert response_status(response) == 416
    assert response_header(response, b"content-range") == b"bytes */0"


async def test_static_conditions_do_not_override_missing_files_or_path_boundaries(asset, tmp_path):
    app, url, _, _ = asset
    for relative in ("missing", "../outside", "data.bin/child"):
        response = await http_request(app, url.rsplit("/", 1)[0] + "/" + relative,
                                      headers=[(b"if-none-match", b"*"), (b"range", b"bytes=0-1")])
        assert response_status(response) == 404
    outside = tmp_path.parent / (tmp_path.name + "-outside.txt")
    outside.write_text("outside")
    symlink = tmp_path / "escape.bin"
    try:
        symlink.symlink_to(outside)
        response = await http_request(app, url.rsplit("/", 1)[0] + "/escape.bin")
        assert response_status(response) == 404
    finally:
        outside.unlink()


async def test_static_stream_closes_on_send_failure(asset, monkeypatch):
    app, url, path, _ = asset
    opened = []
    original = Path.open

    def recording(path, *args, **kwargs):
        result = original(path, *args, **kwargs)
        opened.append(result)
        return result

    monkeypatch.setattr(Path, "open", recording)

    async def fail(event):
        if event["type"] == "http.response.body":
            raise ConnectionError("client disconnected")

    request = app._request({"path": url, "method": "GET", "headers": []})
    with pytest.raises(ConnectionError):
        await app._static_files.serve(request, fail, path.parent, path.name)
    assert opened and all(stream.closed for stream in opened)


@pytest.mark.parametrize("phase", ["open", "hash"])
async def test_static_cancellation_waits_for_file_worker_and_closes_stream(asset, monkeypatch, phase):
    app, url, path, _ = asset
    entered = asyncio.Event()
    release = threading.Event()
    loop = asyncio.get_running_loop()
    opened = []
    original_open = Path.open
    original_digest = hashlib.file_digest

    def pause():
        loop.call_soon_threadsafe(entered.set)
        assert release.wait(timeout=5)

    def recording(path, *args, **kwargs):
        result = original_open(path, *args, **kwargs)
        opened.append(result)
        if phase == "open":
            pause()
        return result

    def digest(*args, **kwargs):
        pause()
        return original_digest(*args, **kwargs)

    monkeypatch.setattr(Path, "open", recording)
    if phase == "hash":
        monkeypatch.setattr(hashlib, "file_digest", digest)

    async def send(event):
        pass

    request = app._request({"path": url, "method": "GET", "headers": []})
    task = asyncio.create_task(app._static_files.serve(request, send, path.parent, path.name))
    try:
        await asyncio.wait_for(entered.wait(), timeout=2)
        task.cancel()
        await asyncio.sleep(0)
        assert not task.done()
    finally:
        release.set()
        with pytest.raises(asyncio.CancelledError):
            await task
    assert opened and all(stream.closed for stream in opened)


async def test_static_duplicate_conditional_headers_are_combined(asset):
    app, url, _, _ = asset
    initial = await get(asset)
    response = await http_request(app, url, headers=[
        (b"If-None-Match", response_header(initial, b"etag")), (b"if-none-match", b'"other"'),
    ])
    assert response_status(response) == 304
    response = await http_request(app, url, headers=[(b"Range", b"bytes=0-1"), (b"range", b"bytes=3-4")])
    assert response_status(response) == 200
    assert response_body(response) == asset[3]


async def test_builtin_bokeh_assets_support_validators_and_ranges():
    app = BokehASGI(Application())
    try:
        initial = await http_request(app, "/static/js/bokeh.min.js")
        etag = response_header(initial, b"etag")
        cached = await http_request(app, "/static/js/bokeh.min.js", headers=[(b"if-none-match", etag)])
        assert response_status(cached) == 304
        part = await http_request(app, "/static/js/bokeh.min.js", headers=[(b"range", b"bytes=0-15"), (b"if-range", etag)])
        assert response_status(part) == 206
        assert response_body(part) == response_body(initial)[:16]
    finally:
        await app.core.stop()
