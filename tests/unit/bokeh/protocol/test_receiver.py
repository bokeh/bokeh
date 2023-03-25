#-----------------------------------------------------------------------------
# Copyright (c) 2012 - 2023, Anaconda, Inc., and Bokeh Contributors.
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

# Bokeh imports
from bokeh.core.serialization import Buffer
from bokeh.core.types import ID
from bokeh.protocol import Protocol
from bokeh.protocol.exceptions import ValidationError

# Module under test
from bokeh.protocol import receiver # isort:skip

#-----------------------------------------------------------------------------
# Setup
#-----------------------------------------------------------------------------

proto = Protocol()

#-----------------------------------------------------------------------------
# General API
#-----------------------------------------------------------------------------

def test_creation() -> None:
    receiver.Receiver(None)

async def test_validation_success() -> None:
    msg = proto.create('ACK')
    r = receiver.Receiver(proto)

    partial = await r.consume(msg.header_json)
    assert partial is None

    partial = await r.consume(msg.metadata_json)
    assert partial is None

    partial = await r.consume(msg.content_json)
    assert partial is not None
    assert partial.msgtype == msg.msgtype
    assert partial.header == msg.header
    assert partial.content == msg.content
    assert partial.metadata == msg.metadata

async def test_validation_success_with_one_buffer() -> None:
    r = receiver.Receiver(proto)

    partial = await r.consume('{"msgtype": "PATCH-DOC", "msgid": "10", "num_buffers":1}')
    assert partial is None

    partial = await r.consume('{}')
    assert partial is None

    partial = await r.consume('{"bar": 10}')
    assert partial is None

    partial = await r.consume('{"id": "buf_header"}')
    assert partial is None

    partial = await r.consume(b'payload')
    assert partial is not None
    assert partial.msgtype == "PATCH-DOC"
    assert partial.header == {"msgtype": "PATCH-DOC", "msgid": "10", "num_buffers":1}
    assert partial.content == {"bar":10}
    assert partial.metadata == {}
    assert partial.buffers == [Buffer(ID("buf_header"), b"payload")]

async def test_multiple_validation_success_with_multiple_buffers() -> None:
    r = receiver.Receiver(proto)

    for N in range(10):
        partial = await r.consume(f'{{"msgtype": "PATCH-DOC", "msgid": "10", "num_buffers":{N}}}')
        partial = await r.consume('{}')
        partial = await r.consume('{"bar": 10}')

        for i in range(N):
            partial = await r.consume(f'{{"id": "header{i}"}}')
            partial = await r.consume(f'payload{i}'.encode())

        assert partial is not None
        assert partial.msgtype == "PATCH-DOC"
        assert partial.header == {"msgtype": "PATCH-DOC", "msgid": "10", "num_buffers": N}
        assert partial.content == {"bar":10}
        assert partial.metadata == {}
        for i in range(N):
            assert partial.buffers[i] == Buffer(ID(f"header{i}"), f"payload{i}".encode())

async def test_binary_header_raises_error() -> None:
    r = receiver.Receiver(proto)

    with pytest.raises(ValidationError):
        await r.consume(b'{"msgtype": "PATCH-DOC", "msgid": "10"}')

async def test_binary_metadata_raises_error() -> None:
    r = receiver.Receiver(proto)

    await r.consume('{"msgtype": "PATCH-DOC", "msgid": "10"}')
    with pytest.raises(ValidationError):
        await r.consume(b'metadata')

async def test_binary_content_raises_error() -> None:
    r = receiver.Receiver(proto)

    await r.consume('{"msgtype": "PATCH-DOC", "msgid": "10"}')
    await r.consume('metadata')
    with pytest.raises(ValidationError):
        await r.consume(b'content')

async def test_binary_payload_header_raises_error() -> None:
    r = receiver.Receiver(proto)

    await r.consume('{"msgtype": "PATCH-DOC", "msgid": "10", "num_buffers":1}')
    await r.consume('{}')
    await r.consume('{}')
    with pytest.raises(ValidationError):
        await r.consume(b'{"id": "buf_header"}')
async def test_text_payload_buffer_raises_error() -> None:
    r = receiver.Receiver(proto)

    await r.consume('{"msgtype": "PATCH-DOC", "msgid": "10", "num_buffers":1}')
    await r.consume('{}')
    await r.consume('{}')
    await r.consume('{"id": "buf_header"}')
    with pytest.raises(ValidationError):
        await r.consume('buf_payload')

#-----------------------------------------------------------------------------
# Dev API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Private API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Code
#-----------------------------------------------------------------------------
