import unittest
from unittest import skip

import mock

from . import test_utils
from .. import wsmanager
from ..app import bokeh_app
from ..models import docs
from ... import protocol
from ...tests.test_utils import skipIfPy3, skipIfPyPy



ws_address = "ws://localhost:5006/bokeh/sub"


class TestSubscribeWebSocket(test_utils.BokehServerTestCase):
    def setUp(self):
        super(TestSubscribeWebSocket, self).setUp()
        sess = bokeh_app.backbone_storage.get_session('defaultdoc')
        doc = docs.new_doc(bokeh_app, "defaultdoc",
                           'main', sess, rw_users=["defaultuser"],
                           apikey='nokey')
        sess = bokeh_app.backbone_storage.get_session('defaultdocs')
        doc2 = docs.new_doc(bokeh_app, "defaultdoc2",
                            'main', sess, rw_users=["defaultuser"],
                            apikey='nokey')

    # TODO (bev) fix or improve this test
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
        bokeh_app.wsmanager.send('bokehplot:defaultdoc', 'hello!')
        msg = sock.recv()
        import pdb; pdb.set_trace()
        assert msg == 'bokehplot:defaultdoc:hello!'
        msg = sock2.recv()
        assert msg == 'bokehplot:defaultdoc:hello!'

        # send messages on 2 topics, make sure that sockets receive
        # the right messages
        bokeh_app.wsmanager.send('bokehplot:defaultdoc', 'hello2!')
        bokeh_app.wsmanager.send('bokehplot:defaultdoc2', 'hello3!')
        msg = sock.recv()
        assert msg == 'bokehplot:defaultdoc:hello2!'
        msg = sock2.recv()
        assert msg == 'bokehplot:defaultdoc:hello2!'
        msg = sock3.recv()
        assert msg == 'bokehplot:defaultdoc2:hello3!'


def connect(sock, addr, topic, auth):
    sock.sock.settimeout(1.0)
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
