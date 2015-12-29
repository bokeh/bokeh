from __future__ import absolute_import, print_function

import unittest

import bokeh.document as document
from bokeh.model import Model
from bokeh.core.properties import Int, Instance
from bokeh.server.protocol import Protocol

class AnotherModelInTestPushDoc(Model):
    bar = Int(1)

class SomeModelInTestPushDoc(Model):
    foo = Int(2)
    child = Instance(Model)

class TestPushDocument(unittest.TestCase):

    def _sample_doc(self):
        doc = document.Document()
        another = AnotherModelInTestPushDoc()
        doc.add_root(SomeModelInTestPushDoc(child=another))
        doc.add_root(SomeModelInTestPushDoc())
        return doc

    def test_create(self):
        sample = self._sample_doc()
        Protocol("1.0").create("PUSH-DOC", sample)

    def test_create_then_parse(self):
        sample = self._sample_doc()
        msg = Protocol("1.0").create("PUSH-DOC", sample)
        copy = document.Document()
        msg.push_to_document(copy)
        assert len(sample.roots) == 2
        assert len(copy.roots) == 2
