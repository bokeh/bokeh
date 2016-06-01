from __future__ import absolute_import

from bokeh.server.protocol import receiver, Protocol
from bokeh.util.string import decode_utf8

_proto = Protocol("1.0")

def test_creation():
    receiver.Receiver(None)

def test_validation_success():
    msg = _proto.create('ACK')
    r = receiver.Receiver(_proto)

    partial = r.consume(decode_utf8(msg.header_json)).result()
    assert partial is None

    partial = r.consume(decode_utf8(msg.metadata_json)).result()
    assert partial is None

    partial = r.consume(decode_utf8(msg.content_json)).result()
    assert partial is not None
    assert partial.msgtype == msg.msgtype
    assert partial.header == msg.header
    assert partial.content == msg.content
    assert partial.metadata == msg.metadata
