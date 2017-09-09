import pytest

import bokeh.client.util as bcu

def test_server_url_for_websocket_url_with_ws():
    assert bcu.server_url_for_websocket_url("ws://foo.com/ws") == "http://foo.com/"

def test_server_url_for_websocket_url_with_wss():
    assert bcu.server_url_for_websocket_url("wss://foo.com/ws") == "https://foo.com/"

def test_server_url_for_websocket_url_bad_proto():
    with pytest.raises(ValueError):
        bcu.server_url_for_websocket_url("junk://foo.com/ws")

def test_server_url_for_websocket_url_bad_ending():
    with pytest.raises(ValueError):
        bcu.server_url_for_websocket_url("ws://foo.com/junk")
    with pytest.raises(ValueError):
        bcu.server_url_for_websocket_url("wss://foo.com/junk")

def test_websocket_url_for_server_url_with_http():
    assert bcu.websocket_url_for_server_url("http://foo.com") == "ws://foo.com/ws"
    assert bcu.websocket_url_for_server_url("http://foo.com/") == "ws://foo.com/ws"

def test_websocket_url_for_server_url_with_https():
    assert bcu.websocket_url_for_server_url("https://foo.com") == "wss://foo.com/ws"
    assert bcu.websocket_url_for_server_url("https://foo.com/") == "wss://foo.com/ws"

def test_websocket_url_for_server_url_bad_proto():
    with pytest.raises(ValueError):
        bcu.websocket_url_for_server_url("junk://foo.com")
