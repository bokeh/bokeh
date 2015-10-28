from __future__ import absolute_import

import bokeh.server.protocol.message as message

def test_create_header(monkeypatch):
    message.Message.msgtype = "msgtype"
    monkeypatch.setattr("bokeh.util.serialization.make_id", lambda: "msgid")
    header = message.Message.create_header(request_id="bar")
    assert set(header.keys()) == {'msgid', 'msgtype', 'reqid'}
    assert header['msgtype'] == 'msgtype'
    assert header['msgid'] == 'msgid'
    assert header['reqid'] == 'bar'
