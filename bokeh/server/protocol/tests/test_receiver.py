from __future__ import absolute_import

import pytest

from bokeh.server.exceptions import ProtocolError, ValidationError
from bokeh.server.protocol import receiver, Protocol

_proto = Protocol("1.0")

def test_creation():
    r = receiver.Receiver(None)
    assert r.failures == 0

def test_invalid_hmac_length():
    with pytest.raises(ProtocolError):
        r = receiver.Receiver(None)
        r.consume(b"junk")
    assert r.failures == 1

def test_hmac_mismatch():
    with pytest.raises(ValidationError):
        msg = _proto.create('ACK', 10)
        r = receiver.Receiver(_proto)
        r.consume("junk" * 16)
        r.consume(msg.header_json.decode('utf-8'))
        r.consume(msg.metadata_json.decode('utf-8'))
        r.consume(msg.content_json.decode('utf-8'))

def test_validation_success():
    msg = _proto.create('ACK', 10)
    r = receiver.Receiver(_proto)

    partial = r.consume(msg.hmac.decode('utf-8')).result()
    assert partial is None

    partial = r.consume(msg.header_json.decode('utf-8')).result()
    assert partial is None

    partial = r.consume(msg.metadata_json.decode('utf-8')).result()
    assert partial is None

    partial = r.consume(msg.content_json.decode('utf-8')).result()
    assert partial is not None
    assert partial.msgtype == msg.msgtype
    assert partial.hmac == msg.hmac
    assert partial.header == msg.header
    assert partial.content == msg.content
    assert partial.metadata == msg.metadata


