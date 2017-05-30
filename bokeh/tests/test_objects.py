from __future__ import absolute_import
import unittest

from six.moves import xrange
import copy
from bokeh.core.properties import List, String, Instance, Dict, Any, Int
from bokeh.model import Model
from bokeh.embed import _ModelInDocument
from bokeh.document import Document
from bokeh.core.property.containers import PropertyValueList, PropertyValueDict
from bokeh.util.future import with_metaclass


def large_plot(n):
    from bokeh.models import (
        Plot, LinearAxis, Grid, GlyphRenderer,
        ColumnDataSource, DataRange1d, PanTool, ZoomInTool, ZoomOutTool, WheelZoomTool, BoxZoomTool,
        BoxSelectTool, ResizeTool, SaveTool, ResetTool
    )
    from bokeh.models.layouts import Column
    from bokeh.models.glyphs import Line

    col = Column()
    objects = set([col])

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
        pan = PanTool()
        zoom_in = ZoomInTool()
        zoom_out = ZoomOutTool()
        wheel_zoom = WheelZoomTool()
        box_zoom = BoxZoomTool()
        box_select = BoxSelectTool()
        resize = ResizeTool()
        save = SaveTool()
        reset = ResetTool()
        tools = [pan, zoom_in, zoom_out, wheel_zoom, box_zoom, box_select, resize, save, reset]
        plot.add_tools(*tools)
        col.children.append(plot)
        objects |= set([
            source, xdr, ydr, plot, xaxis, yaxis, xgrid, ygrid, renderer, glyph, plot.x_scale, plot.y_scale,
            plot.toolbar, plot.tool_events, plot.title, box_zoom.overlay, box_select.overlay] +
            tickers + tools)

    return col, objects


class TestMetaModel(unittest.TestCase):

    def setUp(self):
        from bokeh.model import MetaModel
        self.metamodel = MetaModel
        self.old_map = copy.copy(self.metamodel.model_class_reverse_map)

    def tearDown(self):
        self.metamodel.model_class_reverse_map = self.old_map

    def mkclass(self):
        class Test_Class(with_metaclass(self.metamodel)):
            foo = 1
        return Test_Class

    def test_metaclassing(self):
        tclass = self.mkclass()
        self.assertTrue(hasattr(tclass, '__view_model__'))
        self.assertRaises(Warning, self.mkclass)

    def test_get_class(self):
        from bokeh.model import get_class
        self.mkclass()
        tclass = get_class('Test_Class')
        self.assertTrue(hasattr(tclass, 'foo'))
        self.assertRaises(KeyError, get_class, 'Imaginary_Class')

class DeepModel(Model):
    child = Instance(Model)

class TestCollectModels(unittest.TestCase):

    def test_references_large(self):
        root, objects = large_plot(10)
        self.assertEqual(set(root.references()), objects)

    def test_references_deep(self):
        root = DeepModel()
        objects = set([root])
        parent = root
        # in a previous implementation, about 400 would blow max
        # recursion depth, so we double that and a little bit,
        # here.
        for i in xrange(900):
            model = DeepModel()
            objects.add(model)
            parent.child = model
            parent = model
        self.assertEqual(set(root.references()), objects)

class SomeModelToJson(Model):
    child = Instance(Model)
    foo = Int()
    bar = String()

class TestModel(unittest.TestCase):

    def setUp(self):
        from bokeh.models import Model

        self.pObjectClass = Model
        self.maxDiff = None

    def test_init(self):
        testObject = self.pObjectClass(id='test_id')
        self.assertEqual(testObject._id, 'test_id')

        testObject2 = self.pObjectClass()
        self.assertIsNot(testObject2._id, None)

        self.assertEqual(set(["name", "tags", "js_property_callbacks",
                              "subscribed_events", "js_event_callbacks"]),
                         testObject.properties())
        self.assertDictEqual(dict(name=None, tags=[], js_property_callbacks={},
                                  js_event_callbacks={}, subscribed_events=[]),
                             testObject.properties_with_values(include_defaults=True))
        self.assertDictEqual(dict(), testObject.properties_with_values(include_defaults=False))

    def test_ref(self):
        testObject = self.pObjectClass(id='test_id')
        self.assertEqual({'type': 'Model', 'id': 'test_id'}, testObject.ref)

    def test_references_by_ref_by_value(self):
        from bokeh.core.has_props import HasProps
        from bokeh.core.properties import Instance, Int

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
        from bokeh.core.properties import Int, String, Instance, List, Tuple, Dict

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
        json = obj.to_json(include_defaults=True)
        json_string = obj.to_json_string(include_defaults=True)
        self.assertEqual({ "child" : { "id" : child_obj._id, "type" : "SomeModelToJson" },
                           "id" : obj._id,
                           "name" : None,
                           "tags" : [],
                           'js_property_callbacks': {},
                           "js_event_callbacks" : {},
                           "subscribed_events" : [],
                           "foo" : 42,
                           "bar" : "world" },
                         json)
        self.assertEqual(('{"bar":"world",' +
                          '"child":{"id":"%s","type":"SomeModelToJson"},' +
                          '"foo":42,"id":"%s","js_event_callbacks":{},"js_property_callbacks":{},' +
                          '"name":null,"subscribed_events":[],"tags":[]}') %
                         (child_obj._id, obj._id),
                         json_string)

    def test_no_units_in_json(self):
        from bokeh.models import AnnularWedge
        obj = AnnularWedge()
        json = obj.to_json(include_defaults=True)
        self.assertTrue('start_angle' in json)
        self.assertTrue('start_angle_units' not in json)
        self.assertTrue('outer_radius' in json)
        self.assertTrue('outer_radius_units' not in json)

    def test_dataspec_field_in_json(self):
        from bokeh.models import AnnularWedge
        obj = AnnularWedge()
        obj.start_angle = "fieldname"
        json = obj.to_json(include_defaults=True)
        self.assertTrue('start_angle' in json)
        self.assertTrue('start_angle_units' not in json)
        self.assertDictEqual(dict(units='rad', field='fieldname'), json['start_angle'])

    def test_dataspec_value_in_json(self):
        from bokeh.models import AnnularWedge
        obj = AnnularWedge()
        obj.start_angle = 60
        json = obj.to_json(include_defaults=True)
        self.assertTrue('start_angle' in json)
        self.assertTrue('start_angle_units' not in json)
        self.assertDictEqual(dict(units='rad', value=60), json['start_angle'])

    def test_list_default(self):
        class HasListDefault(Model):
            value = List(String, default=["hello"])
        obj = HasListDefault()
        self.assertEqual(obj.value, obj.value)

        # 'value' should not be included because we haven't modified it
        self.assertFalse('value' in obj.properties_with_values(include_defaults=False))
        # (but should be in include_defaults=True)
        self.assertTrue('value' in obj.properties_with_values(include_defaults=True))

        obj.value.append("world")

        # 'value' should now be included
        self.assertTrue('value' in obj.properties_with_values(include_defaults=False))

    def test_dict_default(self):
        class HasDictDefault(Model):
            value = Dict(String, Int, default=dict(hello=42))
        obj = HasDictDefault()
        self.assertDictEqual(obj.value, obj.value)
        self.assertDictEqual(dict(hello=42), obj.value)

        # 'value' should not be included because we haven't modified it
        self.assertFalse('value' in obj.properties_with_values(include_defaults=False))
        # (but should be in include_defaults=True)
        self.assertTrue('value' in obj.properties_with_values(include_defaults=True))

        obj.value['world'] = 57

        # 'value' should now be included
        self.assertTrue('value' in obj.properties_with_values(include_defaults=False))
        self.assertDictEqual(dict(hello=42, world=57), obj.value)

    def test_func_default_with_counter(self):
        counter = dict(value=0)
        def next_value():
            counter['value'] += 1
            return counter['value']
        class HasFuncDefaultInt(Model):
            value = Int(default=next_value)
        obj1 = HasFuncDefaultInt()
        obj2 = HasFuncDefaultInt()
        self.assertEqual(obj1.value+1, obj2.value)

        # 'value' is a default, but it gets included as a
        # non-default because it's unstable.
        self.assertTrue('value' in obj1.properties_with_values(include_defaults=False))

    def test_func_default_with_model(self):
        class HasFuncDefaultModel(Model):
            child = Instance(Model, lambda: Model())
        obj1 = HasFuncDefaultModel()
        obj2 = HasFuncDefaultModel()
        self.assertNotEqual(obj1.child._id, obj2.child._id)

        # 'child' is a default, but it gets included as a
        # non-default because it's unstable.
        self.assertTrue('child' in obj1.properties_with_values(include_defaults=False))

class SomeModelInTestObjects(Model):
    child = Instance(Model)

class TestModelInDocument(unittest.TestCase):
    def test_single_model(self):
        p = Model()
        self.assertIs(p.document, None)
        with _ModelInDocument([p]):
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

    def test_with_doc_in_child_raises_error(self):
        doc = Document()
        p1 = Model()
        p2 = SomeModelInTestObjects(child=Model())
        doc.add_root(p2.child)
        self.assertIs(p1.document, None)
        self.assertIs(p2.document, None)
        self.assertIs(p2.child.document, doc)
        with self.assertRaisesRegexp(RuntimeError, p2._id):
            with _ModelInDocument([p1, p2]):
                self.assertIsNot(p1.document, None)
                self.assertIsNot(p2.document, None)
                self.assertIs(p1.document, doc)
                self.assertIs(p2.document, doc)

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

    def test_whether_included_in_props_with_values(self):
        obj = HasListProp()
        self.assertFalse('foo' in obj.properties_with_values(include_defaults=False))
        self.assertTrue('foo' in obj.properties_with_values(include_defaults=True))
        # simply reading the property creates a new wrapper, so be
        # sure that doesn't count as replacing the default
        foo = obj.foo
        self.assertEqual(foo, foo) # this is to calm down flake's unused var warning
        self.assertFalse('foo' in obj.properties_with_values(include_defaults=False))
        self.assertTrue('foo' in obj.properties_with_values(include_defaults=True))
        # but changing the list should count as replacing the default
        obj.foo.append("hello")
        self.assertTrue('foo' in obj.properties_with_values(include_defaults=False))
        self.assertTrue('foo' in obj.properties_with_values(include_defaults=True))

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

    def test_whether_included_in_props_with_values(self):
        obj = HasStringDictProp()
        self.assertFalse('foo' in obj.properties_with_values(include_defaults=False))
        self.assertTrue('foo' in obj.properties_with_values(include_defaults=True))
        # simply reading the property creates a new wrapper, so be
        # sure that doesn't count as replacing the default
        foo = obj.foo
        self.assertEqual(foo, foo) # this is to calm down flake's unused var warning
        self.assertFalse('foo' in obj.properties_with_values(include_defaults=False))
        self.assertTrue('foo' in obj.properties_with_values(include_defaults=True))
        # but changing the dict should count as replacing the default
        obj.foo['bar'] = 42
        self.assertTrue('foo' in obj.properties_with_values(include_defaults=False))
        self.assertTrue('foo' in obj.properties_with_values(include_defaults=True))

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

    def test_dict_delitem_string(self):
        obj = HasStringDictProp(foo=dict(a=1, b=2, c=3))
        self.assertTrue(isinstance(obj.foo, PropertyValueDict))
        def mutate(x):
            del x['b']
        self._check_mutation(obj, 'foo', mutate,
                             dict(a=1, b=2, c=3),
                             dict(a=1, c=3))

    def test_dict_delitem_int(self):
        obj = HasIntDictProp(foo={ 1 : "a", 2 : "b", 3 : "c" })
        self.assertTrue(isinstance(obj.foo, PropertyValueDict))
        def mutate(x):
            del x[1]
        self._check_mutation(obj, 'foo', mutate,
                             { 1 : "a", 2 : "b", 3 : "c" },
                             { 2 : "b", 3 : "c" })

    def test_dict_setitem_string(self):
        obj = HasStringDictProp(foo=dict(a=1, b=2, c=3))
        self.assertTrue(isinstance(obj.foo, PropertyValueDict))
        def mutate(x):
            x['b'] = 42
        self._check_mutation(obj, 'foo', mutate,
                             dict(a=1, b=2, c=3),
                             dict(a=1, b=42, c=3))

    def test_dict_setitem_int(self):
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
