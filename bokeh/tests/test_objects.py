from __future__ import absolute_import
import unittest

from six import add_metaclass
from six.moves import xrange
import copy
from bokeh.properties import List, String, Instance, Dict, Any, Int
from bokeh.model import Model, _ModelInDocument
from bokeh.document import Document
from bokeh.property_containers import PropertyValueList, PropertyValueDict

def large_plot(n):
    from bokeh.models import (Plot, LinearAxis, Grid, GlyphRenderer,
        ColumnDataSource, DataRange1d, PanTool, WheelZoomTool, BoxZoomTool,
        BoxSelectTool, BoxSelectionOverlay, ResizeTool, PreviewSaveTool,
        ResetTool)
    from bokeh.models.widgets.layouts import VBox
    from bokeh.models.glyphs import Line

    vbox = VBox()
    objects = set([vbox])

    for i in xrange(n):
        source = ColumnDataSource(data=dict(x=[0, i + 1], y=[0, i + 1]))
        xdr = DataRange1d()
        ydr = DataRange1d()
        plot = Plot(x_range=xdr, y_range=ydr)
        xaxis = LinearAxis(plot=plot)
        yaxis = LinearAxis(plot=plot)
        xgrid = Grid(plot=plot, dimension=0)
        ygrid = Grid(plot=plot, dimension=1)
        tickers = [xaxis.ticker, xaxis.formatter, yaxis.ticker, yaxis.formatter]
        glyph = Line(x='x', y='y')
        renderer = GlyphRenderer(data_source=source, glyph=glyph)
        plot.renderers.append(renderer)
        pan = PanTool(plot=plot)
        wheel_zoom = WheelZoomTool(plot=plot)
        box_zoom = BoxZoomTool(plot=plot)
        box_select = BoxSelectTool(plot=plot)
        box_selection = BoxSelectionOverlay(tool=box_select)
        plot.renderers.append(box_selection)
        resize = ResizeTool(plot=plot)
        previewsave = PreviewSaveTool(plot=plot)
        reset = ResetTool(plot=plot)
        tools = [pan, wheel_zoom, box_zoom, box_select, resize, previewsave, reset]
        plot.tools.extend(tools)
        vbox.children.append(plot)
        objects |= set([source, xdr, ydr, plot, xaxis, yaxis, xgrid, ygrid,
                        renderer, glyph, plot.tool_events, box_selection] +
                        tickers + tools)

    return vbox, objects

class TestViewable(unittest.TestCase):

    def setUp(self):
        from bokeh.model import Viewable
        self.viewable = Viewable
        self.old_map = copy.copy(self.viewable.model_class_reverse_map)

    def tearDown(self):
        self.viewable.model_class_reverse_map = self.old_map

    def mkclass(self):
        @add_metaclass(self.viewable)
        class Test_Class():
            foo = 1
        return Test_Class

    def test_metaclassing(self):
        tclass = self.mkclass()
        self.assertTrue(hasattr(tclass, '__view_model__'))
        self.assertRaises(Warning, self.mkclass)

    def test_get_class(self):
        self.mkclass()
        tclass = self.viewable.get_class('Test_Class')
        self.assertTrue(hasattr(tclass, 'foo'))
        self.assertRaises(KeyError, self.viewable.get_class, 'Imaginary_Class')

class TestCollectModels(unittest.TestCase):

    def test_references_large(self):
        root, objects = large_plot(500)
        self.assertEqual(set(root.references()), objects)

class SomeModelToJson(Model):
    child = Instance(Model)
    foo = Int()
    bar = String()

class TestModel(unittest.TestCase):

    def setUp(self):
        from bokeh.models import Model
        self.pObjectClass = Model

    def test_init(self):
        testObject = self.pObjectClass(id='test_id')
        self.assertEqual(testObject._id, 'test_id')

        testObject2 = self.pObjectClass()
        self.assertIsNot(testObject2._id, None)

    def test_ref(self):
        testObject = self.pObjectClass(id='test_id')
        self.assertEqual({'type': 'Model', 'id': 'test_id'}, testObject.ref)

    def test_references_by_ref_by_value(self):
        from bokeh.properties import HasProps, Instance, Int

        class T(self.pObjectClass):
            t = Int(0)

        class Y(self.pObjectClass):
            t1 = Instance(T)

        class Z1(HasProps):
            t2 = Instance(T)

        class Z2(self.pObjectClass):
            t2 = Instance(T)

        class X1(self.pObjectClass):
            y = Instance(Y)
            z1 = Instance(Z1)

        class X2(self.pObjectClass):
            y = Instance(Y)
            z2 = Instance(Z2)

        t1, t2 = T(t=1), T(t=2)
        y = Y(t1=t1)
        z1, z2 = Z1(t2=t2), Z2(t2=t2)

        x1 = X1(y=y, z1=z1)
        x2 = X2(y=y, z2=z2)

        self.assertEqual(x1.references(), {t1, y, t2,     x1})
        self.assertEqual(x2.references(), {t1, y, t2, z2, x2})

    def test_references_in_containers(self):
        from bokeh.properties import Int, String, Instance, List, Tuple, Dict

        # XXX: can't use Y, because of:
        #
        # Warning: Duplicate __view_model__ declaration of 'Y' for class Y.
        #          Previous definition: <class 'bokeh.tests.test_objects.Y'>

        class U(self.pObjectClass):
            a = Int

        class V(self.pObjectClass):
            u1 = Instance(U)
            u2 = List(Instance(U))
            u3 = Tuple(Int, Instance(U))
            u4 = Dict(String, Instance(U))
            u5 = Dict(String, List(Instance(U)))

        u1, u2, u3, u4, u5 = U(a=1), U(a=2), U(a=3), U(a=4), U(a=5)
        v = V(u1=u1, u2=[u2], u3=(3, u3), u4={"4": u4}, u5={"5": [u5]})

        self.assertEqual(v.references(), set([v, u1, u2, u3, u4, u5]))

    def test_to_json(self):
        child_obj = SomeModelToJson(foo=57, bar="hello")
        obj = SomeModelToJson(child=child_obj,
                              foo=42, bar="world")
        json = obj.to_json()
        json_string = obj.to_json_string()
        self.assertEqual({ "child" : { "id" : child_obj._id, "type" : "SomeModelToJson" },
                           "id" : obj._id,
                           "name" : None,
                           "tags" : [],
                           "foo" : 42,
                           "bar" : "world" },
                         json)
        self.assertEqual(('{"bar": "world", ' +
                          '"child": {"id": "%s", "type": "SomeModelToJson"}, ' +
                          '"foo": 42, "id": "%s", "name": null, "tags": []}') %
                         (child_obj._id, obj._id),
                         json_string)

class SomeModelInTestObjects(Model):
    child = Instance(Model)

class TestModelInDocument(unittest.TestCase):
    def test_single_model(self):
        p = Model()
        self.assertIs(p.document, None)
        with _ModelInDocument(p):
            self.assertIsNot(p.document, None)
        self.assertIs(p.document, None)

    def test_list_of_model(self):
        p1 = Model()
        p2 = Model()
        self.assertIs(p1.document, None)
        self.assertIs(p2.document, None)
        with _ModelInDocument([p1, p2]):
            self.assertIsNot(p1.document, None)
            self.assertIsNot(p2.document, None)
        self.assertIs(p1.document, None)
        self.assertIs(p2.document, None)

    def test_uses_precedent(self):
        # it's deliberate that the doc is on p2, so _ModelInDocument
        # has to be smart about looking for a doc anywhere in the list
        # before it starts inventing new documents
        doc = Document()
        p1 = Model()
        p2 = Model()
        doc.add_root(p2)
        self.assertIs(p1.document, None)
        self.assertIsNot(p2.document, None)
        with _ModelInDocument([p1, p2]):
            self.assertIsNot(p1.document, None)
            self.assertIsNot(p2.document, None)
            self.assertIs(p1.document, doc)
            self.assertIs(p2.document, doc)
        self.assertIs(p1.document, None)
        self.assertIsNot(p2.document, None)

    def test_uses_doc_precedent(self):
        doc = Document()
        p1 = Model()
        p2 = Model()
        self.assertIs(p1.document, None)
        self.assertIs(p2.document, None)
        with _ModelInDocument([p1, p2, doc]):
            self.assertIsNot(p1.document, None)
            self.assertIsNot(p2.document, None)
            self.assertIs(p1.document, doc)
            self.assertIs(p2.document, doc)
        self.assertIs(p1.document, None)
        self.assertIs(p2.document, None)

    def test_uses_precedent_from_child(self):
        doc = Document()
        p1 = Model()
        p2 = SomeModelInTestObjects(child=Model())
        doc.add_root(p2.child)
        self.assertIs(p1.document, None)
        self.assertIs(p2.document, None)
        self.assertIs(p2.child.document, doc)
        with _ModelInDocument([p1, p2]):
            self.assertIsNot(p1.document, None)
            self.assertIsNot(p2.document, None)
            self.assertIs(p1.document, doc)
            self.assertIs(p2.document, doc)
        self.assertIs(p1.document, None)
        self.assertIs(p2.document, None)
        self.assertIsNot(p2.child.document, None)
        self.assertIs(p2.child.document, doc)

class TestContainerMutation(unittest.TestCase):

    def _check_mutation(self, obj, attr, mutator, expected_event_old, expected_event_new):
        result = dict(calls=[])
        def record_trigger(attr, old, new_):
            result['calls'].append((attr, old, new_))
        obj.on_change(attr, record_trigger)
        try:
            actual_old = getattr(obj, attr)
            self.assertEqual(expected_event_old, actual_old)
            mutator(actual_old)
            self.assertEqual(expected_event_new, getattr(obj, attr))
        finally:
            obj.remove_on_change(attr, record_trigger)
        self.assertEqual(1, len(result['calls']))
        call = result['calls'][0]
        self.assertEqual(attr, call[0])
        self.assertEqual(expected_event_old, call[1])
        self.assertEqual(expected_event_new, call[2])


class HasListProp(Model):
    foo = List(String)
    def __init__(self, **kwargs):
        super(HasListProp, self).__init__(**kwargs)

class TestListMutation(TestContainerMutation):

    def test_assignment_maintains_owners(self):
        obj = HasListProp()
        old_list = obj.foo
        self.assertTrue(isinstance(old_list, PropertyValueList))
        self.assertEqual(1, len(old_list._owners))
        obj.foo = ["a"]
        new_list = obj.foo
        self.assertTrue(isinstance(new_list, PropertyValueList))
        self.assertIsNot(old_list, new_list)
        self.assertEqual(0, len(old_list._owners))
        self.assertEqual(1, len(new_list._owners))

    def test_list_delitem(self):
        obj = HasListProp(foo=["a", "b", "c"])
        self.assertTrue(isinstance(obj.foo, PropertyValueList))
        def mutate(x):
            del x[1]
        self._check_mutation(obj, 'foo', mutate,
                             ["a", "b", "c"],
                             ["a", "c"])

    def test_list_delslice(self):
        obj = HasListProp(foo=["a", "b", "c", "d"])
        self.assertTrue(isinstance(obj.foo, PropertyValueList))
        def mutate(x):
            del x[1:3]
        self._check_mutation(obj, 'foo', mutate,
                             ["a", "b", "c", "d"],
                             ["a", "d"])

    def test_list_iadd(self):
        obj = HasListProp(foo=["a"])
        self.assertTrue(isinstance(obj.foo, PropertyValueList))
        def mutate(x):
            x += ["b"]
        self._check_mutation(obj, 'foo', mutate,
                             ["a"],
                             ["a", "b"])

    def test_list_imul(self):
        obj = HasListProp(foo=["a"])
        self.assertTrue(isinstance(obj.foo, PropertyValueList))
        def mutate(x):
            x *= 3
        self._check_mutation(obj, 'foo', mutate,
                             ["a"],
                             ["a", "a", "a"])

    def test_list_setitem(self):
        obj = HasListProp(foo=["a"])
        self.assertTrue(isinstance(obj.foo, PropertyValueList))
        def mutate(x):
            x[0] = "b"
        self._check_mutation(obj, 'foo', mutate,
                             ["a"],
                             ["b"])

    def test_list_setslice(self):
        obj = HasListProp(foo=["a", "b", "c", "d"])
        self.assertTrue(isinstance(obj.foo, PropertyValueList))
        def mutate(x):
            x[1:3] = ["x"]
        self._check_mutation(obj, 'foo', mutate,
                             ["a", "b", "c", "d"],
                             ["a", "x", "d"])

    def test_list_append(self):
        obj = HasListProp()
        self.assertTrue(isinstance(obj.foo, PropertyValueList))
        self._check_mutation(obj, 'foo', lambda x: x.append("bar"), [], ["bar"])

    def test_list_extend(self):
        obj = HasListProp()
        self.assertTrue(isinstance(obj.foo, PropertyValueList))
        self._check_mutation(obj, 'foo', lambda x: x.extend(["x", "y"]), [], ["x", "y"])

    def test_list_insert(self):
        obj = HasListProp(foo=["a", "b"])
        self.assertTrue(isinstance(obj.foo, PropertyValueList))
        self._check_mutation(obj, 'foo', lambda x: x.insert(1, "x"),
                             ["a", "b"],
                             ["a", "x", "b"])

    def test_list_pop(self):
        obj = HasListProp(foo=["a", "b"])
        self.assertTrue(isinstance(obj.foo, PropertyValueList))
        self._check_mutation(obj, 'foo', lambda x: x.pop(),
                             ["a", "b"],
                             ["a"])

    def test_list_remove(self):
        obj = HasListProp(foo=["a", "b"])
        self.assertTrue(isinstance(obj.foo, PropertyValueList))
        self._check_mutation(obj, 'foo', lambda x: x.remove("b"),
                             ["a", "b"],
                             ["a"])

    def test_list_reverse(self):
        obj = HasListProp(foo=["a", "b"])
        self.assertTrue(isinstance(obj.foo, PropertyValueList))
        self._check_mutation(obj, 'foo', lambda x: x.reverse(),
                             ["a", "b"],
                             ["b", "a"])

    def test_list_sort(self):
        obj = HasListProp(foo=["b", "a"])
        self.assertTrue(isinstance(obj.foo, PropertyValueList))
        self._check_mutation(obj, 'foo', lambda x: x.sort(),
                             ["b", "a"],
                             ["a", "b"])


class HasStringDictProp(Model):
    foo = Dict(String, Any)
    def __init__(self, **kwargs):
        super(HasStringDictProp, self).__init__(**kwargs)

class HasIntDictProp(Model):
    foo = Dict(Int, Any)
    def __init__(self, **kwargs):
        super(HasIntDictProp, self).__init__(**kwargs)

class TestDictMutation(TestContainerMutation):

    def test_assignment_maintains_owners(self):
        obj = HasStringDictProp()
        old_dict = obj.foo
        self.assertTrue(isinstance(old_dict, PropertyValueDict))
        self.assertEqual(1, len(old_dict._owners))
        obj.foo = dict(a=1)
        new_dict = obj.foo
        self.assertTrue(isinstance(new_dict, PropertyValueDict))
        self.assertIsNot(old_dict, new_dict)
        self.assertEqual(0, len(old_dict._owners))
        self.assertEqual(1, len(new_dict._owners))

    def test_dict_delattr(self):
        obj = HasStringDictProp(foo=dict(a=1, b=2, c=3))
        self.assertTrue(isinstance(obj.foo, PropertyValueDict))
        def mutate(x):
            del x['b']
        self._check_mutation(obj, 'foo', mutate,
                             dict(a=1, b=2, c=3),
                             dict(a=1, c=3))

    def test_dict_delitem(self):
        obj = HasIntDictProp(foo={ 1 : "a", 2 : "b", 3 : "c" })
        self.assertTrue(isinstance(obj.foo, PropertyValueDict))
        def mutate(x):
            del x[1]
        self._check_mutation(obj, 'foo', mutate,
                             { 1 : "a", 2 : "b", 3 : "c" },
                             { 2 : "b", 3 : "c" })

    def test_dict_setattr(self):
        obj = HasStringDictProp(foo=dict(a=1, b=2, c=3))
        self.assertTrue(isinstance(obj.foo, PropertyValueDict))
        def mutate(x):
            x['b'] = 42
        self._check_mutation(obj, 'foo', mutate,
                             dict(a=1, b=2, c=3),
                             dict(a=1, b=42, c=3))

    def test_dict_setitem(self):
        obj = HasIntDictProp(foo={ 1 : "a", 2 : "b", 3 : "c" })
        self.assertTrue(isinstance(obj.foo, PropertyValueDict))
        def mutate(x):
            x[2] = "bar"
        self._check_mutation(obj, 'foo', mutate,
                             { 1 : "a", 2 : "b", 3 : "c" },
                             { 1 : "a", 2 : "bar", 3 : "c" })

    def test_dict_clear(self):
        obj = HasStringDictProp(foo=dict(a=1, b=2, c=3))
        self.assertTrue(isinstance(obj.foo, PropertyValueDict))
        def mutate(x):
            x.clear()
        self._check_mutation(obj, 'foo', mutate,
                             dict(a=1, b=2, c=3),
                             dict())

    def test_dict_pop(self):
        obj = HasStringDictProp(foo=dict(a=1, b=2, c=3))
        self.assertTrue(isinstance(obj.foo, PropertyValueDict))
        def mutate(x):
            x.pop('b')
        self._check_mutation(obj, 'foo', mutate,
                             dict(a=1, b=2, c=3),
                             dict(a=1, c=3))

    def test_dict_pop_default_works(self):
        obj = HasStringDictProp(foo=dict(a=1, b=2, c=3))
        self.assertTrue(isinstance(obj.foo, PropertyValueDict))
        self.assertEqual(42, obj.foo.pop('z', 42))

    def test_dict_popitem_works(self):
        obj = HasStringDictProp(foo=dict(a=1, b=2, c=3))
        self.assertTrue(isinstance(obj.foo, PropertyValueDict))
        i = obj.foo.popitem()
        self.assertTrue(i == ('a', 1) or i == ('b', 2) or i == ('c', 3))
        # we don't _check_mutation since the end value is nondeterministic

    def test_dict_setdefault(self):
        obj = HasStringDictProp(foo=dict(a=1, b=2, c=3))
        self.assertTrue(isinstance(obj.foo, PropertyValueDict))
        def mutate(x):
            b = x.setdefault('b', 43)
            self.assertEqual(2, b)
            z = x.setdefault('z', 44)
            self.assertEqual(44, z)

        self._check_mutation(obj, 'foo', mutate,
                             dict(a=1, b=2, c=3),
                             dict(a=1, b=2, c=3, z=44))

    def test_dict_update(self):
        obj = HasStringDictProp(foo=dict(a=1, b=2, c=3))
        self.assertTrue(isinstance(obj.foo, PropertyValueDict))
        def mutate(x):
            x.update(dict(b=7, c=8))
        self._check_mutation(obj, 'foo', mutate,
                             dict(a=1, b=2, c=3),
                             dict(a=1, b=7, c=8))

if __name__ == "__main__":
    unittest.main()
