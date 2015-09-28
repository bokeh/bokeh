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

    def test_should_suppress(self):
        sample = self._sample_doc()
        root = None
        other_root = None
        for r in sample.roots:
            if r.child is not None:
                root = r
            else:
                other_root = r
        assert root is not None
        assert other_root is not None
        new_child = AnotherModel(bar=56)

        # integer property changed
        msg = Protocol("1.0").create("PATCH-DOC", 'fakesession', sample, root, { 'foo' : 42 })
        assert msg.should_suppress_on_change(root, 'foo', 42)
        assert not msg.should_suppress_on_change(root, 'foo', 43)
        assert not msg.should_suppress_on_change(root, 'bar', 42)
        assert not msg.should_suppress_on_change(other_root, 'foo', 42)

        # PlotObject property changed
        msg2 = Protocol("1.0").create("PATCH-DOC", 'fakesession', sample, root, { 'child' : new_child })
        assert msg2.should_suppress_on_change(root, 'child', new_child)
        assert not msg2.should_suppress_on_change(root, 'child', other_root)
        assert not msg2.should_suppress_on_change(root, 'blah', new_child)
        assert not msg2.should_suppress_on_change(other_root, 'child', new_child)

        # PlotObject property changed to None
        msg3 = Protocol("1.0").create("PATCH-DOC", 'fakesession', sample, root, { 'child' : None })
        assert msg3.should_suppress_on_change(root, 'child', None)
        assert not msg3.should_suppress_on_change(root, 'child', other_root)
        assert not msg3.should_suppress_on_change(root, 'blah', new_child)
        assert not msg3.should_suppress_on_change(other_root, 'child', new_child)

        # PlotObject property changed from None
        msg4 = Protocol("1.0").create("PATCH-DOC", 'fakesession', sample, other_root, { 'child' : None })
        assert msg4.should_suppress_on_change(other_root, 'child', None)
        assert not msg4.should_suppress_on_change(other_root, 'child', root)
        assert not msg4.should_suppress_on_change(other_root, 'blah', None)
        assert not msg4.should_suppress_on_change(root, 'child', None)
