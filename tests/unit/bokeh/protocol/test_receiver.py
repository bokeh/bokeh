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

# Bokeh imports
from bokeh.core.serialization import Buffer
from bokeh.core.types import ID
from bokeh.protocol import ack
from bokeh.protocol.exceptions import ProtocolError, ValidationError

# Module under test
from bokeh.protocol import receiver # isort:skip

#-----------------------------------------------------------------------------
# Setup
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# General API
#-----------------------------------------------------------------------------

def test_creation() -> None:
    receiver.Receiver()

def test_validation_success() -> None:
    msg = ack()
    r = receiver.Receiver()

    partial = r.consume(msg.header_json)
    assert partial is None

    partial = r.consume(msg.content_json)
    assert partial is not None
    assert partial.msgtype == msg.msgtype
    assert partial.header == msg.header
    assert partial.content == msg.content

def test_validation_success_with_one_buffer() -> None:
    r = receiver.Receiver()

    partial = r.consume('{"msgtype": "PATCH-DOC", "msgid": "10", "num_buffers":1}')
    assert partial is None

    partial = r.consume('{"bar": 10}')
    assert partial is None

    partial = r.consume('{"id": "buf_header"}')
    assert partial is None

    partial = r.consume(b'payload')
    assert partial is not None
    assert partial.msgtype == "PATCH-DOC"
    assert partial.header == {"msgtype": "PATCH-DOC", "msgid": "10", "num_buffers":1}
    assert partial.content == {"bar":10}
    assert partial.buffers == [Buffer(ID("buf_header"), b"payload")]

def test_multiple_validation_success_with_multiple_buffers() -> None:
    r = receiver.Receiver()

    for N in range(10):
        partial = r.consume(f'{{"msgtype": "PATCH-DOC", "msgid": "10", "num_buffers":{N}}}')
        partial = r.consume('{"bar": 10}')

        for i in range(N):
            partial = r.consume(f'{{"id": "header{i}"}}')
            partial = r.consume(f'payload{i}'.encode())

        assert partial is not None
        assert partial.msgtype == "PATCH-DOC"
        assert partial.header == {"msgtype": "PATCH-DOC", "msgid": "10", "num_buffers": N}
        assert partial.content == {"bar":10}
        for i in range(N):
            assert partial.buffers[i] == Buffer(ID(f"header{i}"), f"payload{i}".encode())

def test_binary_header_raises_error() -> None:
    r = receiver.Receiver()

    with pytest.raises(ValidationError):
        r.consume(b'{"msgtype": "PATCH-DOC", "msgid": "10"}')

def test_binary_content_raises_error() -> None:
    r = receiver.Receiver()

    r.consume('{"msgtype": "PATCH-DOC", "msgid": "10"}')
    with pytest.raises(ValidationError):
        r.consume(b'content')

def test_binary_payload_header_raises_error() -> None:
    r = receiver.Receiver()

    r.consume('{"msgtype": "PATCH-DOC", "msgid": "10", "num_buffers":1}')
    r.consume('{}')
    with pytest.raises(ValidationError):
        r.consume(b'{"id": "buf_header"}')
def test_text_payload_buffer_raises_error() -> None:
    r = receiver.Receiver()

    r.consume('{"msgtype": "PATCH-DOC", "msgid": "10", "num_buffers":1}')
    r.consume('{}')
    r.consume('{"id": "buf_header"}')
    with pytest.raises(ValidationError):
        r.consume('buf_payload')

@pytest.mark.parametrize("header", [
    "not json",
    "[]",
    "{}",
    '{"msgtype": "NOPE", "msgid": "10"}',
    '{"msgtype": "ACK", "msgid": ""}',
    '{"msgtype": "ACK", "msgid": "10", "num_buffers": -1}',
    '{"msgtype": "ACK", "msgid": "10", "num_buffers": true}',
])
def test_invalid_header_resets_receiver(header: str) -> None:
    r = receiver.Receiver()

    r.consume(header)
    with pytest.raises(ProtocolError):
        r.consume('{}')

    msg = ack()
    assert r.consume(msg.header_json) is None
    assert r.consume(msg.content_json) is not None

def test_invalid_content_type_resets_receiver() -> None:
    r = receiver.Receiver()

    r.consume('{"msgtype": "ACK", "msgid": "10"}')
    with pytest.raises(ProtocolError, match="content must be a JSON object"):
        r.consume('[]')

    msg = ack()
    assert r.consume(msg.header_json) is None
    assert r.consume(msg.content_json) is not None

def test_malformed_buffer_header_resets_receiver() -> None:
    r = receiver.Receiver()

    r.consume('{"msgtype": "PATCH-DOC", "msgid": "10", "num_buffers": 1}')
    r.consume('{}')
    with pytest.raises(ValidationError):
        r.consume('{"id": 10}')

    msg = ack()
    assert r.consume(msg.header_json) is None
    assert r.consume(msg.content_json) is not None

def test_duplicate_buffer_id_raises() -> None:
    r = receiver.Receiver()

    r.consume('{"msgtype": "PATCH-DOC", "msgid": "10", "num_buffers": 2}')
    r.consume('{}')
    r.consume('{"id": "duplicate"}')
    r.consume(b'first')
    r.consume('{"id": "duplicate"}')
    with pytest.raises(ProtocolError, match="duplicate buffer id"):
        r.consume(b'second')

#-----------------------------------------------------------------------------
# Dev API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Private API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Code
#-----------------------------------------------------------------------------
