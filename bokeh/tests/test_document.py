from __future__ import absolute_import

import unittest

import bokeh
import bokeh.document as document
from bokeh.exceptions import DataIntegrityException
from bokeh.models import PlotContext
from bokeh.plotting import figure
import bokeh.protocol as protocol

json_objs = [
    {'attributes': { u'doc': u'foo', u'children': [], u'id': u'bar' }, 'type': u'PlotContext'}
]

json_objs2 = [
    {'attributes': { u'doc': u'foo', u'children': [], u'id': u'bar' }, 'type': u'PlotContext'},
    {'attributes': { u'doc': u'foo2', u'children': [], u'id': u'bar2' }, 'type': u'PlotContext'}
]

class TestDocument(unittest.TestCase):

    def test_basic(self):
        d = document.Document()
        self.assertEqual(d.autostore, True)
        self.assertEqual(d.autoadd, True)
        self.assertEqual(d.ref, d.context.ref)

    def test_basic_with_json_objs(self):
        d = document.Document(json_objs)
        self.assertEqual(d.autostore, True)
        self.assertEqual(d.autoadd, True)
        self.assertEqual(d.context._id, u'bar')
        self.assertEqual(d.ref, d.context.ref)
        self.assertRaises(DataIntegrityException, document.Document, json_objs2)

    def test_context(self):
        d = document.Document()
        p = PlotContext()
        d.context = p
        self.assertEqual(d.context, p)
        d._models['foo'] = PlotContext()
        self.assertRaises(TypeError, setattr, d, "context", "foo")
        self.assertRaises(DataIntegrityException, setattr, d, "context", p)

    def test_autoadd(self):
        d = document.Document()
        d.autoadd = True
        self.assertEqual(d.autoadd, True)
        d.autoadd = False
        self.assertEqual(d.autoadd, False)
        self.assertRaises(TypeError, setattr, d, "autoadd", "foo")

    def test_autostore(self):
        d = document.Document()
        d.autostore = True
        self.assertEqual(d.autostore, True)
        d.autostore = False
        self.assertEqual(d.autostore, False)
        self.assertRaises(TypeError, setattr, d, "autostore", "foo")

    def test_add(self):
        d = document.Document()
        p = figure()
        p.circle([1], [2])
        d.add(p)
        self.assertListEqual(d.context.children, [p])
        self.assertEqual(len(d._models), len(p.references())+1)
        self.assertTrue(d.context._dirty)

    def test_merge(self):
        d1 = document.Document()
        d2 = document.Document()
        p1 = figure()
        p1.circle([1], [2])
        d1.add(p1)
        p2 = figure()
        p2.circle([1], [2])
        d2.add(p2)
        json_objs = d1.dump()
        json_objs = protocol.deserialize_json(protocol.serialize_json(json_objs))
        d2.merge(json_objs)
        assert d2.context._id == d1.context._id
        assert len(d2.context.children) == 2
        assert d2.context is d2._models[d2.context._id]
        pcs = [x for x in d2._models.values() if x.__view_model__ == "PlotContext"]
        assert len(pcs) == 1
