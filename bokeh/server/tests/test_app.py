from __future__ import absolute_import

from tornado.websocket import WebSocketHandler

import bokeh.server.app as app

def test_creation():
    app.BokehServer()

def test_extra_patterns():
    app.BokehServer([('/foo', WebSocketHandler)])