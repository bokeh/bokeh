from __future__ import absolute_import, print_function

import bokeh.document as document
from bokeh.model import Model
from bokeh.core.properties import Int, Instance
from bokeh.protocol import Protocol

class AnotherModelInTestPullDoc(Model):
    bar = Int(1)

class SomeModelInTestPullDoc(Model):
    foo = Int(2)
    child = Instance(Model)

class TestPullDocument(object):

    def _sample_doc(self):
        doc = document.Document()
        another = AnotherModelInTestPullDoc()
        doc.add_root(SomeModelInTestPullDoc(child=another))
        doc.add_root(SomeModelInTestPullDoc())
        return doc

    def test_create_req(self):
        Protocol("1.0").create("PULL-DOC-REQ")

    def test_create_reply(self):
        sample = self._sample_doc()
        Protocol("1.0").create("PULL-DOC-REPLY", 'fakereqid', sample)

    def test_create_reply_then_parse(self):
        sample = self._sample_doc()
        msg = Protocol("1.0").create("PULL-DOC-REPLY", 'fakereqid', sample)
        copy = document.Document()
        msg.push_to_document(copy)
        assert len(sample.roots) == 2
        assert len(copy.roots) == 2
