#-----------------------------------------------------------------------------
# Copyright (c) Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------
"""Validate static-file response framing over a real keepalive connection."""

from __future__ import annotations

# Standard library imports
import http.client
from contextlib import closing

# Bokeh imports
from bokeh.application import Application
from bokeh.server.asgi import BokehASGI

# Bokeh test imports
from tests.support.util.asgi import running_asgi


def test_static_cache_and_range_responses_over_http(tmp_path):
    content = bytes(range(256)) * 1024
    (tmp_path / "data.bin").write_bytes(content)
    application = Application()
    app = BokehASGI({"/example": application}, prefix="/tools")
    application._static_path = str(tmp_path)
    with running_asgi(app) as host:
        with closing(http.client.HTTPConnection("127.0.0.1", host.port, timeout=5)) as connection:
            url = "/tools/example/static/data.bin"
            connection.request("GET", url)
            response = connection.getresponse()
            assert response.status == 200
            etag = response.getheader("ETag")
            assert etag
            assert response.read() == content

            connection.request("GET", url, headers={"If-None-Match": etag})
            response = connection.getresponse()
            assert response.status == 304
            assert response.read() == b""

            connection.request("GET", url, headers={"Range": "bytes=65530-65545", "If-Range": etag})
            response = connection.getresponse()
            assert response.status == 206
            assert response.getheader("Content-Range") == f"bytes 65530-65545/{len(content)}"
            assert response.read() == content[65530:65546]

            connection.request("HEAD", url, headers={"Range": "bytes=0-3"})
            response = connection.getresponse()
            assert response.status == 200
            assert response.getheader("Content-Length") == str(len(content))
            assert response.read() == b""

            connection.request("GET", url, headers={"Range": "bytes=9999999-"})
            response = connection.getresponse()
            assert response.status == 416
            assert response.getheader("Content-Range") == f"bytes */{len(content)}"
            assert response.read() == b""

            connection.request("GET", url, headers={"If-Match": '"stale"'})
            response = connection.getresponse()
            assert response.status == 412
            assert response.read() == b""

            connection.request("GET", url, headers={"If-Range": '"stale"', "Range": "bytes=0-3"})
            response = connection.getresponse()
            assert response.status == 200
            assert response.read() == content
