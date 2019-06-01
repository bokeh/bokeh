#-----------------------------------------------------------------------------
# Copyright (c) 2012 - 2019, Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Boilerplate
#-----------------------------------------------------------------------------
import pytest ; pytest

#-----------------------------------------------------------------------------
# Imports
#-----------------------------------------------------------------------------

# Standard library imports

# External imports

# Bokeh imports
from bokeh.protocol import Protocol
from bokeh.protocol.exceptions import ValidationError

# Module under test
from bokeh.protocol import receiver

#-----------------------------------------------------------------------------
# Setup
#-----------------------------------------------------------------------------

_proto = Protocol()

#-----------------------------------------------------------------------------
# General API
#-----------------------------------------------------------------------------

def test_creation():
    receiver.Receiver(None)

@pytest.mark.asyncio
async def test_validation_success():
    msg = _proto.create('ACK')
    r = receiver.Receiver(_proto)

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

@pytest.mark.asyncio
async def test_validation_success_with_one_buffer():
    r = receiver.Receiver(_proto)

    partial = await r.consume('{"msgtype": "PATCH-DOC", "msgid": "10", "num_buffers":1}')
    assert partial is None

    partial = await r.consume('{}')
    assert partial is None

    partial = await r.consume('{"bar": 10}')
    assert partial is None

    partial = await r.consume('header')
    assert partial is None

    partial = await r.consume(b'payload')
    assert partial is not None
    assert partial.msgtype == "PATCH-DOC"
    assert partial.header == {"msgtype": "PATCH-DOC", "msgid": "10", "num_buffers":1}
    assert partial.content == {"bar":10}
    assert partial.metadata == {}
    assert partial.buffers == [('header', b'payload')]

@pytest.mark.asyncio
async def test_multiple_validation_success_with_multiple_buffers():
    r = receiver.Receiver(_proto)

    for N in range(10):
        partial = await r.consume('{"msgtype": "PATCH-DOC", "msgid": "10", "num_buffers":%d}' % N)
        partial = await r.consume('{}')
        partial = await r.consume('{"bar": 10}')

        for i in range(N):
            partial = await r.consume('header%d'% i )
            partial = await r.consume(b'payload%d' % i)

        assert partial is not None
        assert partial.msgtype == "PATCH-DOC"
        assert partial.header == {"msgtype": "PATCH-DOC", "msgid": "10", "num_buffers": N}
        assert partial.content == {"bar":10}
        assert partial.metadata == {}
        assert partial.buffers == [('header%d' % i, b'payload%d' %i) for i in range(N)]

@pytest.mark.asyncio
async def test_binary_header_raises_error():
    r = receiver.Receiver(_proto)

    with pytest.raises(ValidationError):
        await r.consume(b'header')

@pytest.mark.asyncio
async def test_binary_metadata_raises_error():
    r = receiver.Receiver(_proto)

    await r.consume('header')
    with pytest.raises(ValidationError):
        await r.consume(b'metadata')

@pytest.mark.asyncio
async def test_binary_content_raises_error():
    r = receiver.Receiver(_proto)

    await r.consume('header')
    await r.consume('metadata')
    with pytest.raises(ValidationError):
        await r.consume(b'content')

@pytest.mark.asyncio
async def test_binary_payload_header_raises_error():
    r = receiver.Receiver(_proto)

    await r.consume('{"msgtype": "PATCH-DOC", "msgid": "10", "num_buffers":1}')
    await r.consume('{}')
    await r.consume('{}')
    with pytest.raises(ValidationError):
        await r.consume(b'buf_header')
@pytest.mark.asyncio
async def test_text_payload_buffer_raises_error():
    r = receiver.Receiver(_proto)

    await r.consume('{"msgtype": "PATCH-DOC", "msgid": "10", "num_buffers":1}')
    await r.consume('{}')
    await r.consume('{}')
    await r.consume('buf_header')
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
