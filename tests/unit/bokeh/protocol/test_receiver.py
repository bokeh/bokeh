#-----------------------------------------------------------------------------
# Copyright (c) Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------

from __future__ import annotations # isort:skip

import pytest ; pytest

import json

from bokeh.core.serialization import Buffer
from bokeh.core.types import ID
from bokeh.protocol import ack
from bokeh.protocol.exceptions import ProtocolError, ValidationError

from bokeh.protocol import receiver # isort:skip


def envelope(*, buffers: list[str] | None = None) -> str:
    return json.dumps({
        "header": {"msgtype": "PATCH-DOC", "msgid": "10"},
        "content": {"bar": 10},
        "buffers": buffers or [],
    })

def test_creation() -> None:
    receiver.Receiver()

def test_validation_success() -> None:
    msg = ack()

    complete = receiver.Receiver().consume(msg.envelope_json)

    assert complete is not None
    assert complete.msgtype == msg.msgtype
    assert complete.header == msg.header
    assert complete.content == msg.content

def test_validation_success_with_one_buffer() -> None:
    r = receiver.Receiver()

    assert r.consume(envelope(buffers=["buffer"])) is None
    complete = r.consume(b"payload")

    assert complete is not None
    assert complete.msgtype == "PATCH-DOC"
    assert complete.header == {"msgtype": "PATCH-DOC", "msgid": "10"}
    assert complete.content == {"bar": 10}
    assert complete.buffers == [Buffer(ID("buffer"), b"payload")]

def test_multiple_validation_success_with_multiple_buffers() -> None:
    r = receiver.Receiver()

    for count in range(10):
        buffer_ids = [f"buffer-{index}" for index in range(count)]
        complete = r.consume(envelope(buffers=buffer_ids))
        for index in range(count):
            complete = r.consume(f"payload-{index}".encode())

        assert complete is not None
        assert complete.buffers == [
            Buffer(ID(buffer_id), f"payload-{index}".encode())
            for index, buffer_id in enumerate(buffer_ids)
        ]

def test_binary_envelope_raises_error() -> None:
    with pytest.raises(ValidationError):
        receiver.Receiver().consume(b"envelope")

def test_text_payload_raises_error_and_resets() -> None:
    r = receiver.Receiver()
    r.consume(envelope(buffers=["buffer"]))

    with pytest.raises(ValidationError):
        r.consume("payload")

    assert r.consume(ack().envelope_json) is not None

@pytest.mark.parametrize("invalid", [
    "not json",
    "[]",
    "{}",
    '{"header": {}, "content": {}, "buffers": []}',
    '{"header": {"msgtype": "NOPE", "msgid": "10"}, "content": {}, "buffers": []}',
    '{"header": {"msgtype": "ACK", "msgid": ""}, "content": {}, "buffers": []}',
    '{"header": {"msgtype": "ACK", "msgid": "10", "num_buffers": 1}, "content": {}, "buffers": []}',
    '{"header": {"msgtype": "ACK", "msgid": "10"}, "content": [], "buffers": []}',
    '{"header": {"msgtype": "ACK", "msgid": "10"}, "content": {}, "buffers": "one"}',
    '{"header": {"msgtype": "ACK", "msgid": "10"}, "content": {}, "buffers": [""]}',
    '{"header": {"msgtype": "ACK", "msgid": "10"}, "content": {}, "buffers": ["x", "x"]}',
])
def test_invalid_envelope_resets_receiver(invalid: str) -> None:
    r = receiver.Receiver()

    with pytest.raises(ProtocolError):
        r.consume(invalid)

    assert r.consume(ack().envelope_json) is not None
