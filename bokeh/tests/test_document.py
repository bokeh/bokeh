from __future__ import absolute_import

import unittest

import bokeh.document as document
from bokeh.plot_object import PlotObject
from bokeh.properties import Int, Instance

class AnotherModel(PlotObject):
    bar = Int(1)

class SomeModel(PlotObject):
    foo = Int(2)
    child = Instance(PlotObject)

class TestDocument(unittest.TestCase):

    def test_empty(self):
        d = document.Document()
        assert not d.roots

    def test_add_roots(self):
        d = document.Document()
        assert not d.roots
        d.add_root(AnotherModel())
        assert len(d.roots) == 1

    def test_all_models(self):
        d = document.Document()
        assert not d.roots
        assert len(d._all_models) == 0
        m = SomeModel()
        m2 = AnotherModel()
        m.child = m2
        d.add_root(m)
        assert len(d.roots) == 1
        assert len(d._all_models) == 2
        m.child = None
        assert len(d._all_models) == 1
        m.child = m2
        assert len(d._all_models) == 2

    def test_all_models_with_multiple_references(self):
        d = document.Document()
        assert not d.roots
        assert len(d._all_models) == 0
        root1 = SomeModel()
        root2 = SomeModel()
        child1 = AnotherModel()
        root1.child = child1
        root2.child = child1
        d.add_root(root1)
        d.add_root(root2)
        assert len(d.roots) == 2
        assert len(d._all_models) == 3
        root1.child = None
        assert len(d._all_models) == 3
        root2.child = None
        assert len(d._all_models) == 2
        root1.child = child1
        assert len(d._all_models) == 3

    def test_all_models_with_cycles(self):
        d = document.Document()
        assert not d.roots
        assert len(d._all_models) == 0
        root1 = SomeModel()
        root2 = SomeModel()
        child1 = SomeModel()
        root1.child = child1
        root2.child = child1
        child1.child = root1
        d.add_root(root1)
        d.add_root(root2)
        assert len(d.roots) == 2
        assert len(d._all_models) == 3
        root1.child = None
        assert len(d._all_models) == 3
        root2.child = None
        assert len(d._all_models) == 2
        root1.child = child1
        assert len(d._all_models) == 3

    def test_change_notification(self):
        d = document.Document()
        assert not d.roots
        m = AnotherModel()
        d.add_root(m)
        assert len(d.roots) == 1
        assert m.bar == 1
        result = { 'doc': None, 'model': None, 'attr': None, 'old': None, 'new': None }
        def listener(doc, model, attr, old, new):
            result['doc'] = doc
            result['model'] = model
            result['attr'] = attr
            result['old'] = old
            result['new'] = new
        d.on_change(listener)
        m.bar = 42
        assert result['doc'] == d
        assert result['model'] == m
        assert result['attr'] == 'bar'
        assert result['old'] == 1
        assert result['new'] == 42

