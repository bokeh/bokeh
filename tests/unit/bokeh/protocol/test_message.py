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
import json
from pathlib import Path

# Bokeh imports
from bokeh.core.serialization import Buffer
from bokeh.core.types import ID
from bokeh.protocol import ack
from bokeh.protocol.receiver import Receiver

# Module under test
import bokeh.protocol.message as message # isort:skip

#-----------------------------------------------------------------------------
# Setup
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# General API
#-----------------------------------------------------------------------------

def test_create_header(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setattr("bokeh.util.serialization.make_id", lambda: "msgid")
    header = message.Message.create_header("ACK", request_id="bar")
    assert set(header.keys()) == {'msgid', 'msgtype', 'reqid'}
    assert header['msgtype'] == 'ACK'
    assert header['msgid'] == 'msgid'
    assert header['reqid'] == 'bar'

def test_envelope_reflects_mutation() -> None:
    msg = ack()
    assert "reqid" not in json.loads(msg.envelope_json)["header"]

    msg.header["reqid"] = ID("request")

    assert json.loads(msg.envelope_json)["header"]["reqid"] == "request"

def test_envelope_includes_empty_buffer_list() -> None:
    msg = ack()

    assert json.loads(msg.envelope_json)["buffers"] == []

def test_fragments_include_ordered_buffers() -> None:
    msg = message.Message(message.Message.create_header("ACK"), {}, [Buffer(ID("buffer"), b"payload")])

    fragments = msg.fragments()

    assert [binary for _, binary in fragments] == [False, True]
    assert json.loads(fragments[0][0])["buffers"] == ["buffer"]
    assert fragments[1] == (b"payload", True)

def test_duplicate_buffer_ids_raise() -> None:
    buffers = [Buffer(ID("duplicate"), b"one"), Buffer(ID("duplicate"), b"two")]

    with pytest.raises(message.ProtocolError, match="buffer ids must be unique"):
        message.Message(message.Message.create_header("ACK"), {}, buffers)

def test_constructor_rejects_too_many_buffers() -> None:
    buffers = [Buffer(ID(str(index)), b"") for index in range(message.MAX_BUFFERS_PER_MESSAGE + 1)]

    with pytest.raises(message.ProtocolError, match="cannot contain more than"):
        message.Message(message.Message.create_header("ACK"), {}, buffers)

def test_decode_rejects_too_many_buffers() -> None:
    envelope = json.dumps({
        "header": {"msgid": "10", "msgtype": "ACK"},
        "content": {},
        "buffers": [str(index) for index in range(message.MAX_BUFFERS_PER_MESSAGE + 1)],
    })

    with pytest.raises(message.MessageError, match="cannot contain more than"):
        message.Message.decode(envelope)

def test_shared_python_bokehjs_wire_conformance_vectors() -> None:
    path = Path(__file__).parents[4] / "bokehjs/test/unit/protocol/conformance.json"
    vectors = json.loads(path.read_text(encoding="utf-8"))

    for vector in vectors:
        receiver = Receiver()
        complete = receiver.consume(json.dumps(vector["envelope"]))
        for payload in vector["payloads"]:
            complete = receiver.consume(bytes(payload))

        assert complete is not None, vector["name"]
        header, content, buffer_ids = message.Message.decode(json.dumps(vector["envelope"]))
        assert header == vector["envelope"]["header"], vector["name"]
        assert content == vector["envelope"]["content"], vector["name"]
        assert buffer_ids == vector["envelope"]["buffers"], vector["name"]
        assert [buffer.id for buffer in complete.buffers] == buffer_ids, vector["name"]
        assert [list(buffer.to_bytes()) for buffer in complete.buffers] == vector["payloads"], vector["name"]

#-----------------------------------------------------------------------------
# Dev API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Private API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Code
#-----------------------------------------------------------------------------
