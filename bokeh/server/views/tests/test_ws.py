import logging

import pytest
from tornado.websocket import StreamClosedError, WebSocketClosedError

from bokeh.server.views.ws import WSHandler

from bokeh.util.logconfig import basicConfig

# needed for caplog tests to function
basicConfig()

@pytest.mark.parametrize('exc', [StreamClosedError, WebSocketClosedError])
def test_send_message_raises(caplog, exc):
    class ExcMessage(object):
        def send(self, handler):
            raise exc()
    assert len(caplog.records) == 0
    with caplog.at_level(logging.WARN):
        # fake self not great but much easier than setting up a real view
        ret = WSHandler.send_message("self", ExcMessage())
        assert len(caplog.records) == 1
        assert caplog.text.endswith("Failed sending message as connection was closed\n")
        assert ret.result() is None
