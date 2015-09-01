from __future__ import absolute_import

import pytest

import bokeh.server.protocol.message as message

def test_create_header(monkeypatch):
    message.Message.msgtype = "msgtype"
    monkeypatch.setattr("bokeh.util.serialization.make_id", lambda: "msgid")
    header = message.Message.create_header("sessid")
    assert set(header.keys()) == {'msgid', 'sessid', 'msgtype'}
    assert header['msgtype'] == 'msgtype'
    assert header['sessid'] == 'sessid'
    assert header['msgid'] == 'msgid'