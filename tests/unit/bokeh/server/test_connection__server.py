#-----------------------------------------------------------------------------
# Copyright (c) Anaconda, Inc. and contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------

from __future__ import annotations

# Standard library imports
from types import SimpleNamespace
from unittest.mock import AsyncMock, Mock

# External imports
import pytest

# Bokeh imports
from bokeh.protocol import ack, ok, pull_doc_req, sync
from bokeh.protocol.exceptions import ProtocolError

# Module under test
from bokeh.server.connection import ServerConnection # isort:skip


def connection() -> tuple[ServerConnection, SimpleNamespace]:
    session = SimpleNamespace(
        subscribe=Mock(),
        _handle_pull=AsyncMock(),
        _handle_push=AsyncMock(),
        _handle_patch=AsyncMock(),
    )
    transport = SimpleNamespace(send_message=AsyncMock())
    return ServerConnection(transport, session), session


async def test_handle_dispatches_to_session() -> None:
    conn, session = connection()
    request = pull_doc_req()
    expected = ok(request.header["msgid"])
    session._handle_pull.return_value = expected

    reply = await conn.handle(request)

    assert reply is expected
    session._handle_pull.assert_awaited_once_with(request, conn)


async def test_handle_sync_request() -> None:
    conn, _ = connection()
    request = sync()

    reply = await conn.handle(request)

    assert reply is not None
    assert reply.msgtype == "OK"
    assert reply.header["reqid"] == request.header["msgid"]


async def test_handle_rejects_unexpected_message() -> None:
    conn, _ = connection()

    with pytest.raises(ProtocolError, match="not expected on server"):
        await conn.handle(ack())


async def test_handle_does_not_expose_exception_details() -> None:
    conn, session = connection()
    request = pull_doc_req()
    session._handle_pull.side_effect = RuntimeError("private detail")

    reply = await conn.handle(request)

    assert reply is not None
    assert reply.msgtype == "ERROR"
    assert reply.content == {
        "text": "Error handling PULL-DOC-REQ message",
        "traceback": None,
    }
