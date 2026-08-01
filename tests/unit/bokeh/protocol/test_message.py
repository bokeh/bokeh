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

# Bokeh imports
from bokeh.core.serialization import Buffer
from bokeh.core.types import ID
from bokeh.protocol import ack

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

def test_json_properties_reflect_mutation() -> None:
    msg = ack()
    assert "reqid" not in json.loads(msg.header_json)

    msg.header["reqid"] = ID("request")

    assert json.loads(msg.header_json)["reqid"] == "request"

def test_add_no_buffers_does_not_emit_count() -> None:
    msg = ack()

    msg.add_buffers()

    assert "num_buffers" not in msg.header

def test_fragments_include_buffer_pairs() -> None:
    msg = ack()
    msg.add_buffers(Buffer(ID("buffer"), b"payload"))

    fragments = msg.fragments()

    assert [binary for _, binary in fragments] == [False, False, False, False, True]
    assert json.loads(fragments[3][0])["id"] == "buffer"
    assert fragments[4] == (b"payload", True)

#-----------------------------------------------------------------------------
# Dev API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Private API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Code
#-----------------------------------------------------------------------------
