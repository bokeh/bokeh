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
from ...mpl import PlotClient
from ...exceptions import DataIntegrityException

class TestMultiDoc(test_utils.BokehServerTestCase):
    def setUp(self):
        super(TestMultiDoc, self).setUp()
        doc2 = docs.new_doc(app, "defaultdoc2",
                            'main2', rw_users=["foo"],
                            apikey='nokey')
        #we should be able to read defaultdoc, but not read defaultdoc2
        self.client = PlotClient('defaultuser', 'http://localhost:5006')
        
    def test_can_get_apikey(self):
        self.client.use_doc('main')
        assert self.client.docid == 'defaultdoc'
        assert self.client.apikey == 'nokey'
        assert self.client.ic
        
    def test_cannot_get_apikey(self):
        with self.assertRaises(Exception) as e:
            self.client.load_doc('defaultdoc2')
        assert e.exception.message == 'unauthorized'
        
    def test_create_doc(self):
        self.client.use_doc('newdoc')
        userdocs = self.client.userinfo.get('docs')
        matching = [x for x in userdocs if x['title'] == 'newdoc']
        matching = matching[0]
        docid = matching['docid']
        document = docs.Doc.load(app.model_redis, docid)
        assert 'defaultuser' in document.rw_users
        assert docid == document.docid
        
    def test_create_doc_conflict(self):
        self.assertRaises(DataIntegrityException,
                          self.client.make_doc,
                          'main')
        
    def test_delete_doc(self):
        self.client.remove_doc('main')
        userdocs = self.client.userinfo.get('docs')
        matching = [x for x in userdocs if x['title'] == 'main']
        assert len(matching) == 0
