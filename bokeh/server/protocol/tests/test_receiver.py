from __future__ import absolute_import

import pytest

from bokeh.server.exceptions import ProtocolError, ValidationError
from bokeh.server.protocol import receiver, Protocol
from bokeh.util.string import decode_utf8, encode_utf8

_proto = Protocol("1.0")

def test_creation():
    r = receiver.Receiver(None)

def test_invalid_hmac_length():
    with pytest.raises(ProtocolError):
        r = receiver.Receiver(None)
        r.consume(decode_utf8("junk"))

def test_hmac_mismatch():
    with pytest.raises(ValidationError) as excinfo:
        msg = _proto.create('ACK', 10)
        r = receiver.Receiver(_proto)
        # bad HMAC
        r.consume(decode_utf8("junk") * 16)
        # we need these lines because we check the HMAC
        # only after getting all the chunks
        r.consume(decode_utf8(msg.header_json))
        r.consume(decode_utf8(msg.metadata_json))
        r.consume(decode_utf8(msg.content_json))
    assert 'HMAC signatures do not match' in str(excinfo.value)

def test_validation_success():
    msg = _proto.create('ACK', 10)
    r = receiver.Receiver(_proto)

    partial = r.consume(decode_utf8(msg.hmac)).result()
    assert partial is None

    partial = r.consume(decode_utf8(msg.header_json)).result()
    assert partial is None

    partial = r.consume(decode_utf8(msg.metadata_json)).result()
    assert partial is None

    partial = r.consume(decode_utf8(msg.content_json)).result()
    assert partial is not None
    assert partial.msgtype == msg.msgtype
    assert partial.hmac == msg.hmac
    assert partial.header == msg.header
    assert partial.content == msg.content
    assert partial.metadata == msg.metadata


