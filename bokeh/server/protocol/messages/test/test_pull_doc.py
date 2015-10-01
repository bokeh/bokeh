from __future__ import absolute_import, print_function

import unittest

import bokeh.document as document
from bokeh.plot_object import PlotObject
from bokeh.properties import Int, Instance
from bokeh.server.protocol import Protocol

class AnotherModel(PlotObject):
    bar = Int(1)

class SomeModel(PlotObject):
    foo = Int(2)
    child = Instance(PlotObject)

class TestPullDocument(unittest.TestCase):

    def _sample_doc(self):
        doc = document.Document()
        another = AnotherModel()
        doc.add_root(SomeModel(child=another))
        doc.add_root(SomeModel())
        return doc

    def test_create_req(self):
        msg = Protocol("1.0").create("PULL-DOC-REQ", 'fakesession')

    def test_create_reply(self):
        sample = self._sample_doc()
        msg = Protocol("1.0").create("PULL-DOC-REPLY", 'fakesession', sample)

    def test_create_reply_then_parse(self):
        sample = self._sample_doc()
        msg = Protocol("1.0").create("PULL-DOC-REPLY", 'fakesession', sample)
        copy = document.Document()
        msg.push_to_document(copy)
        assert len(sample.roots) == 2
        assert len(copy.roots) == 2
