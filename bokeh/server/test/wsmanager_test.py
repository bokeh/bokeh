import time
import unittest
import mock
import websocket
import gevent

from .. import wsmanager
import test_utils
from ..app import app
from .. import start
from ..models import docs
from ... import protocol

class WSmanagerTestCase(unittest.TestCase):
    def test_some_topics(self):
        manager = wsmanager.WebSocketManager()
        s1 = mock.Mock()
        s2 = mock.Mock()
        manager.subscribe_socket(s1, '1', clientid='11')
        manager.subscribe_socket(s2, '1', clientid='12')
        manager.send('1', 'hello')
        assert s1.send.call_count == 1
        assert s2.send.call_count == 1
        manager.remove_clientid('11')
        manager.send('1', 'hello')
        assert s2.send.call_count == 2
        assert s1.send.call_count == 1
        
ws_address = "ws://localhost:5006/bokeh/sub"
class TestSubscribeWebSocket(test_utils.BokehServerTestCase):
    def setUp(self):
        super(TestSubscribeWebSocket, self).setUp()
        doc2 = docs.new_doc(app, "defaultdoc2",
                            'main', rw_users=["defaultuser"],
                            apikey='nokey')
    def test_basic_subscribe(self):
        sock = websocket.WebSocket()
        connect(sock, ws_address, 'bokehplot:defaultdoc', 'nokey')
        app.wsmanager.send('bokehplot:defaultdoc', 'hello!')
        msg = sock.recv()
        assert msg == 'bokehplot:defaultdoc:hello!'
        sock2 = websocket.WebSocket()
        connect(sock2, ws_address, 'bokehplot:defaultdoc', 'nokey')
        sock3 = websocket.WebSocket()
        connect(sock3, ws_address, 'bokehplot:defaultdoc2', 'nokey')
        app.wsmanager.send('bokehplot:defaultdoc', 'hello2!')        
        app.wsmanager.send('bokehplot:defaultdoc2', 'hello3!')
        msg = sock.recv()
        assert msg == 'bokehplot:defaultdoc:hello2!'
        msg = sock2.recv()
        assert msg == 'bokehplot:defaultdoc:hello2!'
        msg = sock3.recv()
        assert msg == 'bokehplot:defaultdoc2:hello3!'
        
def connect(sock, addr, topic, auth):
    sock.io_sock.settimeout(1.0)
    sock.connect(addr)
    msgobj = dict(msgtype='subscribe',
                  topic=topic,
                  auth=auth
                  )
    sock.send(protocol.serialize_msg(msgobj))
    msg = sock.recv()
    msg = msg.split(":", 2)[-1]
    msgobj = protocol.deserialize_msg(msg)
    assert msgobj['status'][:2] == ['subscribesuccess', topic]
