import time
import unittest
import mock
import websocket
import gevent

import test_utils
from ..app import app
from ...bbmodel import ContinuumModelsClient, make_model
from ..models import docs
from .. import start


class TestBBModel(test_utils.BokehServerTestCase):
    def setUp(self):
        super(TestBBModel, self).setUp()
        doc2 = docs.new_doc(app, "defaultdoc2",
                            'main', rw_users=["defaultuser"],
                            apikey='nokey')
        self.client = ContinuumModelsClient(
            "defaultdoc", "http://localhost:5006/bokeh/bb/",
            'nokey'
            )
        self.client2 = ContinuumModelsClient(
            "defaultdoc2", "http://localhost:5006/bokeh/bb/", "nokey",
            )

    def test_create(self):
        test_utils.wait_until(lambda : start.http_server.started)
        client = self.client
        model = make_model('Test', doc='defaultdoc',
                           testval=1, id='foo')
        client.create(model)
        test_utils.wait_until(lambda : app.collections.get('Test', 'defaultdoc', 'foo'))
        assert app.collections.get('Test', 'defaultdoc', 'foo').get('testval') == 1
        assert client.fetch('Test', 'foo').get('testval') == 1

    def test_update(self):
        test_utils.wait_until(lambda : start.http_server.started)
        client = self.client
        m = make_model('Test', doc='defaultdoc', testval=1, id='foo')
        client.create(m)
        m.set('testval', 2)
        client.update(m)
        test_utils.wait_until(
            lambda : app.collections.get('Test', 'defaultdoc', 'foo').get('testval') == 2
            )
        assert app.collections.get('Test', 'defaultdoc', 'foo').get('testval') == 2
        assert client.get('Test', 'foo').get('testval') == 2
        
    def test_fetch_type(self):
        test_utils.wait_until(lambda : start.http_server.started)
        client = self.client
        models = client.fetch(typename='Test')
        client.create(make_model('Test', doc='defaultdoc',
                                 testval=1, id='foo'))
        client.create(make_model('Test2', doc='defaultdoc',
                                 testval=1, id='foo2'))
        models = client.fetch(typename='Test')
        assert len(models) == 1 and models[0].get('id') == 'foo'
        
    def test_fetch_docid(self):
        test_utils.wait_until(lambda : start.http_server.started)
        client = self.client
        client2 = self.client2
        client.create(make_model('Test', doc='defaultdoc',
                                 testval=1, id='foo'))
        client.create(make_model('Test2', doc='defaultdoc',
                                 testval=1, id='foo2'))
        client2.create(make_model('Test', doc='defaultdoc',
                                  testval=1, id='foo3'))
        client2.create(make_model('Test2', doc='defaultdoc',
                                  testval=1, id='foo4'))
        assert client.get('Test', 'foo').get('testval') == 1
        assert client.get('Test', 'foo3') is None
        assert client2.get('Test2', 'foo2') is None
        assert client2.get('Test', 'foo3').get('testval') == 1
        
    def test_delete(self):
        test_utils.wait_until(lambda : start.http_server.started)
        client = self.client                
        client.create(make_model('Test', doc='defaultdoc',
                                 testval=1, id='foo'))
        client.create(make_model('Test', doc='defaultdoc',
                                 testval=1, id='foo2'))
        client.delete('Test', 'foo')
        assert client.get('Test', 'foo') is None
        assert client.get('Test', 'foo2') is not None
        
    def test_auth(self):
        # should test read auth via user fails if user not in r_user
        # should test read auth via user passes if user not in rw_user
        # read auth via api token fails if invalid api token
        # write auth via user fails if user not in rw_user
        pass
