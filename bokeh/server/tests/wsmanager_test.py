from __future__ import absolute_import

from bokeh import protocol
from bokeh import session

from . import test_utils
from ..app import bokeh_app

ws_address = "ws://localhost:5006/bokeh/sub"

class TestSubscribeWebSocket(test_utils.BokehServerTestCase):
    def test_basic_subscribe(self):
        self.sess1 = session.Session()
        self.sess1.use_doc('first')
        self.sess2 = session.Session()
        self.sess2.use_doc('second')
        #connect sock to defaultdoc
        #connect sock2 to defaultdoc
        #connect sock3 to defaultdoc2
        firstid = self.sess1.docid
        secondid = self.sess2.docid
        firsttoken = self.sess1.apikey
        secondtoken = self.sess2.apikey
        import websocket
        sock = websocket.WebSocket()
        connect(sock, ws_address, 'bokehplot:%s' % firstid, firsttoken)
        sock2 = websocket.WebSocket()
        connect(sock2, ws_address, 'bokehplot:%s' % firstid, firsttoken)

        sock3 = websocket.WebSocket()
        connect(sock3, ws_address, 'bokehplot:%s' % secondid, secondtoken)
        #make sure sock and sock2 receive message
        bokeh_app.publisher.send('bokehplot:%s' % firstid, 'hello!')
        msg = sock.recv()
        assert msg == 'bokehplot:%s:hello!' % firstid
        msg = sock2.recv()
        assert msg == 'bokehplot:%s:hello!' % firstid

        # send messages on 2 topics, make sure that sockets receive
        # the right messages
        bokeh_app.publisher.send('bokehplot:%s' % firstid, 'hello2!')
        bokeh_app.publisher.send('bokehplot:%s' % secondid, 'hello3!')
        msg = sock.recv()
        assert msg == 'bokehplot:%s:hello2!' % firstid
        msg = sock2.recv()
        assert msg == 'bokehplot:%s:hello2!' % firstid
        msg = sock3.recv()
        assert msg == 'bokehplot:%s:hello3!' % secondid

def connect(sock, addr, topic, auth):
    # TODO (bev) increasing timeout due to failing TravisCI tests
    # investigate if this is the real solution or if there is a
    # deeper problem
    sock.timeout = 4.0
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
