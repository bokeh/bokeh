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

class TestPatchDocument(unittest.TestCase):

    def _sample_doc(self):
        doc = document.Document()
        another = AnotherModel()
        doc.add_root(SomeModel(child=another))
        doc.add_root(SomeModel())
        return doc

    def test_create(self):
        sample = self._sample_doc()
        msg = Protocol("1.0").create("PATCH-DOC", 'fakesession', sample, next(iter(sample.roots)), { 'foo' : 42 })

    def test_create_then_apply(self):
        sample = self._sample_doc()

        foos = []
        for r in sample.roots:
            foos.append(r.foo)
        assert foos == [ 2, 2 ]

        obj = next(iter(sample.roots))
        assert obj.foo == 2
        msg = Protocol("1.0").create("PATCH-DOC", 'fakesession', sample, obj, { 'foo' : 42 })

        copy = document.Document.from_json_string(sample.to_json_string())
        msg.apply_to_document(copy)

        foos = []
        for r in copy.roots:
            foos.append(r.foo)
        foos.sort()
        assert foos == [ 2, 42 ]

