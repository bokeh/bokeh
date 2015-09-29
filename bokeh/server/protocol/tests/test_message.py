from __future__ import absolute_import

import bokeh.server.protocol.message as message

def test_create_header(monkeypatch):
    message.Message.msgtype = "msgtype"
    monkeypatch.setattr("bokeh.util.serialization.make_id", lambda: "msgid")
    header = message.Message.create_header(session_id="foo", request_id="bar")
    assert set(header.keys()) == {'msgid', 'sessid', 'msgtype', 'reqid'}
    assert header['msgtype'] == 'msgtype'
    assert header['msgid'] == 'msgid'
    assert header['sessid'] == 'foo'
    assert header['reqid'] == 'bar'
