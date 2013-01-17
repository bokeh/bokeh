import time
import unittest
import mock
import websocket
import gevent

import test_utils
import cdx.redisutils as redisutils
from cdx.app import app
import cdxlib.bbmodel as bbmodel
import cdx.start as start
import cdx.models.docs as docs
import requests
import redis

class TestBBModel(test_utils.CDXServerTestCase):
    def setUp(self):
        super(TestBBModel, self).setUp()
        doc2 = docs.new_doc(app, "defaultdoc2",
                            'main', rw_users=["defaultuser"],
                            apikey='nokey')
        self.client = bbmodel.ContinuumModelsClient(
            "defaultdoc", "http://localhost:5006/cdx/bb/",
            'nokey', app.ph
            )
        self.client2 = bbmodel.ContinuumModelsClient(
            "defaultdoc2", "http://localhost:5006/cdx/bb/", "nokey",
            app.ph,
            )

    def test_create(self):
        test_utils.wait_until(lambda : start.http_server.started)
        client = self.client
        client.create('Test', dict(testval=1, id='foo'))
        test_utils.wait_until(lambda : app.collections.get('Test', 'foo'))
        assert app.collections.get('Test', 'foo').get('testval') == 1
        assert client.fetch('Test', 'foo').get('testval') == 1

    def test_update(self):
        test_utils.wait_until(lambda : start.http_server.started)
        client = self.client        
        client.create('Test', dict(testval=1, id='foo'))
        client.update('Test', dict(id='foo', testval=2))
        test_utils.wait_until(
            lambda : app.collections.get('Test', 'foo').get('testval') == 2
            )
        assert app.collections.get('Test', 'foo').get('testval') == 2
        assert client.get('Test', 'foo').get('testval') == 2
        
    def test_fetch_type(self):
        test_utils.wait_until(lambda : start.http_server.started)
        client = self.client
        client.create('Test', dict(testval=1, id='foo'))
        client.create('Test2', dict(testval=1, id='foo2'))
        models = client.fetch(typename='Test')
        assert len(models) == 1 and models[0].get('id') == 'foo'
        
    def test_fetch_docid(self):
        test_utils.wait_until(lambda : start.http_server.started)
        client = self.client
        client2 = self.client2
        client.create('Test', dict(testval=1, id='foo'))
        client.create('Test2', dict(testval=1, id='foo2'))
        client2.create('Test', dict(testval=1, id='foo3'))
        client2.create('Test2', dict(testval=1, id='foo4'))
        assert client.get('Test', 'foo').get('testval') == 1
        assert client.get('Test', 'foo3') is None
        assert client2.get('Test2', 'foo2') is None
        assert client2.get('Test', 'foo3').get('testval') == 1
        
    def test_delete(self):
        test_utils.wait_until(lambda : start.http_server.started)
        client = self.client                
        client.create('Test', dict(testval=1, id='foo'))
        client.create('Test', dict(testval=1, id='foo2'))
        client.delete('Test', 'foo')
        assert client.get('Test', 'foo') is None
        assert client.get('Test', 'foo2') is not None
        
