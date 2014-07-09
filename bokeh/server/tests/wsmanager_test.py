import unittest
from unittest import skip
import time

import mock

from . import test_utils
from .. import wsmanager
from ..app import bokeh_app
from ..models import docs
from ... import protocol
from ...tests.test_utils import skipIfPy3, skipIfPyPy
from bokeh.widgetobjects import VBox
import bokeh.document as document
import bokeh.session as session
ws_address = "ws://localhost:6009/bokeh/sub/"

class TestSubscribeWebSocket(test_utils.BokehServerTestCase):
    def setUp(self):
        super(TestSubscribeWebSocket, self).setUp()
        self.doc1 = document.Document()
        self.sess1 = session.Session()
        self.sess1.use_doc('first')
        self.doc2 = document.Document()
        self.sess2 = session.Session()
        self.sess2.use_doc('second')
    @skipIfPy3("gevent does not work in py3.")
    @skipIfPyPy("gevent requires pypycore and pypy-hacks branch of gevent.")
    def test_basic_subscribe(self):
        #connect sock to defaultdoc
        #connect sock2 to defaultdoc
        #connect sock3 to defaultdoc2
        import websocket
        sock = websocket.WebSocket()
        connect(sock, ws_address, 'bokehplot:defaultdoc', 'nokey')
        sock2 = websocket.WebSocket()
        connect(sock2, ws_address, 'bokehplot:defaultdoc', 'nokey')

        sock3 = websocket.WebSocket()
        connect(sock3, ws_address, 'bokehplot:defaultdoc2', 'nokey')
        #make sure sock and sock2 receive message
        bokeh_app.publisher.send('bokehplot:defaultdoc', 'hello!')
        msg = sock.recv()
        assert msg == 'bokehplot:defaultdoc:hello!'
        msg = sock2.recv()
        assert msg == 'bokehplot:defaultdoc:hello!'

        # send messages on 2 topics, make sure that sockets receive
        # the right messages
        bokeh_app.publisher.send('bokehplot:defaultdoc', 'hello2!')
        bokeh_app.publisher.send('bokehplot:defaultdoc2', 'hello3!')
        msg = sock.recv()
        assert msg == 'bokehplot:defaultdoc:hello2!'
        msg = sock2.recv()
        assert msg == 'bokehplot:defaultdoc:hello2!'
        msg = sock3.recv()
        assert msg == 'bokehplot:defaultdoc2:hello3!'


def connect(sock, addr, topic, auth):
    sock.timeout = 2.0
    sock.connect(addr)
    msgobj = dict(msgtype='subscribe',
                  topic=topic,
                  auth=auth
                  )
    sock.send(protocol.serialize_json(msgobj))
    msg = sock.recv()
    msg = msg.split(":", 2)[-1]
    msgobj = protocol.deserialize_json(msg)
    assert msgobj['status'][:2] == ['subscribesuccess', topic]
