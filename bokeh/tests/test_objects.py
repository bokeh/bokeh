#-----------------------------------------------------------------------------
# Copyright (c) 2012 - 2019, Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Boilerplate
#-----------------------------------------------------------------------------
from __future__ import absolute_import, division, print_function, unicode_literals

import pytest ; pytest

#-----------------------------------------------------------------------------
# Imports
#-----------------------------------------------------------------------------

# Standard library imports
import copy

# External imports
from six.moves import xrange

# Bokeh imports
from bokeh.core.properties import List, String, Instance, Dict, Any, Int
from bokeh.model import Model
from bokeh.core.property.wrappers import PropertyValueList, PropertyValueDict
from bokeh.util.future import with_metaclass

# Module under test

#-----------------------------------------------------------------------------
# Setup
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# General API
#-----------------------------------------------------------------------------

def large_plot(n):
    from bokeh.models import (
        Plot, LinearAxis, Grid, GlyphRenderer,
        ColumnDataSource, DataRange1d, PanTool, ZoomInTool, ZoomOutTool, WheelZoomTool, BoxZoomTool,
        BoxSelectTool, SaveTool, ResetTool
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
        xaxis = LinearAxis()
        plot.add_layout(xaxis, "below")
        yaxis = LinearAxis()
        plot.add_layout(yaxis, "left")
        xgrid = Grid(dimension=0)
        plot.add_layout(xgrid, "center")
        ygrid = Grid(dimension=1)
        plot.add_layout(ygrid, "center")
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
        save = SaveTool()
        reset = ResetTool()
        tools = [pan, zoom_in, zoom_out, wheel_zoom, box_zoom, box_select, save, reset]
        plot.add_tools(*tools)
        col.children.append(plot)
        objects |= set([
            xdr, ydr,
            xaxis, yaxis,
            xgrid, ygrid,
            renderer, renderer.view, glyph,
            source, source.selected, source.selection_policy,
            plot, plot.x_scale, plot.y_scale, plot.toolbar, plot.title,
            box_zoom.overlay, box_select.overlay,
        ] + tickers + tools)

    return col, objects


class TestMetaModel(object):

    def setup_method(self):
        from bokeh.model import MetaModel
        self.metamodel = MetaModel
        self.old_map = copy.copy(self.metamodel.model_class_reverse_map)

    def teardown_method(self):
        self.metamodel.model_class_reverse_map = self.old_map

    def mkclass(self):
        class Test_Class(with_metaclass(self.metamodel)):
            foo = 1
        return Test_Class

    def test_metaclassing(self):
        tclass = self.mkclass()
        assert hasattr(tclass, '__view_model__')
        with pytest.raises(Warning):
            self.mkclass()

    def test_get_class(self):
        from bokeh.model import get_class
        self.mkclass()
        tclass = get_class('Test_Class')
        assert hasattr(tclass, 'foo')
        with pytest.raises(KeyError):
            get_class('Imaginary_Class')

class DeepModel(Model):
    child = Instance(Model)

class TestCollectModels(object):

    def test_references_large(self):
        root, objects = large_plot(10)
        assert set(root.references()) == objects

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
        assert set(root.references()) == objects

class SomeModelToJson(Model):
    child = Instance(Model)
    foo = Int()
    bar = String()

class TestModel(object):

    def setup_method(self):
        from bokeh.model import Model

        self.pObjectClass = Model
        self.maxDiff = None

    def test_init(self):
        testObject = self.pObjectClass(id='test_id')
        assert testObject.id == 'test_id'

        testObject2 = self.pObjectClass()
        assert testObject2.id is not None

        assert set(["name", "tags", "js_property_callbacks", "subscribed_events", "js_event_callbacks"]) == testObject.properties()
        assert dict(
            name=None, tags=[], js_property_callbacks={}, js_event_callbacks={}, subscribed_events=[]
        ) == testObject.properties_with_values(include_defaults=True)
        assert dict() == testObject.properties_with_values(include_defaults=False)

    def test_ref(self):
        testObject = self.pObjectClass(id='test_id')
        assert {'type': 'Model', 'id': 'test_id'} == testObject.ref

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

        assert x1.references() == {t1, y, t2,     x1}
        assert x2.references() == {t1, y, t2, z2, x2}

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

        assert v.references() == set([v, u1, u2, u3, u4, u5])

    def test_to_json(self):
        child_obj = SomeModelToJson(foo=57, bar="hello")
        obj = SomeModelToJson(child=child_obj,
                              foo=42, bar="world")
        json = obj.to_json(include_defaults=True)
        json_string = obj.to_json_string(include_defaults=True)
        assert { "child" : { "id" : child_obj.id, "type" : "SomeModelToJson" },
                           "id" : obj.id,
                           "name" : None,
                           "tags" : [],
                           'js_property_callbacks': {},
                           "js_event_callbacks" : {},
                           "subscribed_events" : [],
                           "foo" : 42,
                           "bar" : "world" } == json
        assert ('{"bar":"world",' +
                '"child":{"id":"%s","type":"SomeModelToJson"},' +
                '"foo":42,"id":"%s","js_event_callbacks":{},"js_property_callbacks":{},' +
                '"name":null,"subscribed_events":[],"tags":[]}') % (child_obj.id, obj.id) == json_string

    def test_no_units_in_json(self):
        from bokeh.models import AnnularWedge
        obj = AnnularWedge()
        json = obj.to_json(include_defaults=True)
        assert 'start_angle' in json
        assert 'start_angle_units' not in json
        assert 'outer_radius' in json
        assert 'outer_radius_units' not in json

    def test_dataspec_field_in_json(self):
        from bokeh.models import AnnularWedge
        obj = AnnularWedge()
        obj.start_angle = "fieldname"
        json = obj.to_json(include_defaults=True)
        assert 'start_angle' in json
        assert 'start_angle_units' not in json
        assert dict(units='rad', field='fieldname') == json['start_angle']

    def test_dataspec_value_in_json(self):
        from bokeh.models import AnnularWedge
        obj = AnnularWedge()
        obj.start_angle = 60
        json = obj.to_json(include_defaults=True)
        assert 'start_angle' in json
        assert 'start_angle_units' not in json
        assert dict(units='rad', value=60) == json['start_angle']

    def test_list_default(self):
        class HasListDefault(Model):
            value = List(String, default=["hello"])
        obj = HasListDefault()
        assert obj.value == obj.value

        # 'value' should not be included because we haven't modified it
        assert 'value' not in obj.properties_with_values(include_defaults=False)
        # (but should be in include_defaults=True)
        assert 'value' in obj.properties_with_values(include_defaults=True)

        obj.value.append("world")

        # 'value' should now be included
        assert 'value' in obj.properties_with_values(include_defaults=False)

    def test_dict_default(self):
        class HasDictDefault(Model):
            value = Dict(String, Int, default=dict(hello=42))
        obj = HasDictDefault()
        assert obj.value == obj.value
        assert dict(hello=42) == obj.value

        # 'value' should not be included because we haven't modified it
        assert 'value' not in obj.properties_with_values(include_defaults=False)
        # (but should be in include_defaults=True)
        assert 'value' in obj.properties_with_values(include_defaults=True)

        obj.value['world'] = 57

        # 'value' should now be included
        assert 'value' in obj.properties_with_values(include_defaults=False)
        assert dict(hello=42, world=57) == obj.value

    def test_func_default_with_counter(self):
        counter = dict(value=0)
        def next_value():
            counter['value'] += 1
            return counter['value']
        class HasFuncDefaultInt(Model):
            value = Int(default=next_value)
        obj1 = HasFuncDefaultInt()
        obj2 = HasFuncDefaultInt()
        assert obj1.value+1 == obj2.value

        # 'value' is a default, but it gets included as a
        # non-default because it's unstable.
        assert 'value' in obj1.properties_with_values(include_defaults=False)

    def test_func_default_with_model(self):
        class HasFuncDefaultModel(Model):
            child = Instance(Model, lambda: Model())
        obj1 = HasFuncDefaultModel()
        obj2 = HasFuncDefaultModel()
        assert obj1.child.id != obj2.child.id

        # 'child' is a default, but it gets included as a
        # non-default because it's unstable.
        assert 'child' in obj1.properties_with_values(include_defaults=False)

class TestContainerMutation(object):

    def _check_mutation(self, obj, attr, mutator, expected_event_old, expected_event_new):
        result = dict(calls=[])
        def record_trigger(attr, old, new_):
            result['calls'].append((attr, old, new_))
        obj.on_change(attr, record_trigger)
        try:
            actual_old = getattr(obj, attr)
            assert expected_event_old == actual_old
            mutator(actual_old)
            assert expected_event_new == getattr(obj, attr)
        finally:
            obj.remove_on_change(attr, record_trigger)
        assert 1 == len(result['calls'])
        call = result['calls'][0]
        assert attr == call[0]
        assert expected_event_old == call[1]
        assert expected_event_new == call[2]


class HasListProp(Model):
    foo = List(String)
    def __init__(self, **kwargs):
        super(HasListProp, self).__init__(**kwargs)

class TestListMutation(TestContainerMutation):

    def test_whether_included_in_props_with_values(self):
        obj = HasListProp()
        assert 'foo' not in obj.properties_with_values(include_defaults=False)
        assert 'foo' in obj.properties_with_values(include_defaults=True)
        # simply reading the property creates a new wrapper, so be
        # sure that doesn't count as replacing the default
        foo = obj.foo
        assert foo == foo # this is to calm down flake's unused var warning
        assert 'foo' not in obj.properties_with_values(include_defaults=False)
        assert 'foo' in obj.properties_with_values(include_defaults=True)
        # but changing the list should count as replacing the default
        obj.foo.append("hello")
        assert 'foo' in obj.properties_with_values(include_defaults=False)
        assert 'foo' in obj.properties_with_values(include_defaults=True)

    def test_assignment_maintains_owners(self):
        obj = HasListProp()
        old_list = obj.foo
        assert isinstance(old_list, PropertyValueList)
        assert 1 == len(old_list._owners)
        obj.foo = ["a"]
        new_list = obj.foo
        assert isinstance(new_list, PropertyValueList)
        assert old_list is not new_list
        assert 0 == len(old_list._owners)
        assert 1 == len(new_list._owners)

    def test_list_delitem(self):
        obj = HasListProp(foo=["a", "b", "c"])
        assert isinstance(obj.foo, PropertyValueList)
        def mutate(x):
            del x[1]
        self._check_mutation(obj, 'foo', mutate,
                             ["a", "b", "c"],
                             ["a", "c"])

    def test_list_delslice(self):
        obj = HasListProp(foo=["a", "b", "c", "d"])
        assert isinstance(obj.foo, PropertyValueList)
        def mutate(x):
            del x[1:3]
        self._check_mutation(obj, 'foo', mutate,
                             ["a", "b", "c", "d"],
                             ["a", "d"])

    def test_list_iadd(self):
        obj = HasListProp(foo=["a"])
        assert isinstance(obj.foo, PropertyValueList)
        def mutate(x):
            x += ["b"]
        self._check_mutation(obj, 'foo', mutate,
                             ["a"],
                             ["a", "b"])

    def test_list_imul(self):
        obj = HasListProp(foo=["a"])
        assert isinstance(obj.foo, PropertyValueList)
        def mutate(x):
            x *= 3
        self._check_mutation(obj, 'foo', mutate,
                             ["a"],
                             ["a", "a", "a"])

    def test_list_setitem(self):
        obj = HasListProp(foo=["a"])
        assert isinstance(obj.foo, PropertyValueList)
        def mutate(x):
            x[0] = "b"
        self._check_mutation(obj, 'foo', mutate,
                             ["a"],
                             ["b"])

    def test_list_setslice(self):
        obj = HasListProp(foo=["a", "b", "c", "d"])
        assert isinstance(obj.foo, PropertyValueList)
        def mutate(x):
            x[1:3] = ["x"]
        self._check_mutation(obj, 'foo', mutate,
                             ["a", "b", "c", "d"],
                             ["a", "x", "d"])

    def test_list_append(self):
        obj = HasListProp()
        assert isinstance(obj.foo, PropertyValueList)
        self._check_mutation(obj, 'foo', lambda x: x.append("bar"), [], ["bar"])

    def test_list_extend(self):
        obj = HasListProp()
        assert isinstance(obj.foo, PropertyValueList)
        self._check_mutation(obj, 'foo', lambda x: x.extend(["x", "y"]), [], ["x", "y"])

    def test_list_insert(self):
        obj = HasListProp(foo=["a", "b"])
        assert isinstance(obj.foo, PropertyValueList)
        self._check_mutation(obj, 'foo', lambda x: x.insert(1, "x"),
                             ["a", "b"],
                             ["a", "x", "b"])

    def test_list_pop(self):
        obj = HasListProp(foo=["a", "b"])
        assert isinstance(obj.foo, PropertyValueList)
        self._check_mutation(obj, 'foo', lambda x: x.pop(),
                             ["a", "b"],
                             ["a"])

    def test_list_remove(self):
        obj = HasListProp(foo=["a", "b"])
        assert isinstance(obj.foo, PropertyValueList)
        self._check_mutation(obj, 'foo', lambda x: x.remove("b"),
                             ["a", "b"],
                             ["a"])

    def test_list_reverse(self):
        obj = HasListProp(foo=["a", "b"])
        assert isinstance(obj.foo, PropertyValueList)
        self._check_mutation(obj, 'foo', lambda x: x.reverse(),
                             ["a", "b"],
                             ["b", "a"])

    def test_list_sort(self):
        obj = HasListProp(foo=["b", "a"])
        assert isinstance(obj.foo, PropertyValueList)
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
        assert 'foo' not in obj.properties_with_values(include_defaults=False)
        assert 'foo' in obj.properties_with_values(include_defaults=True)
        # simply reading the property creates a new wrapper, so be
        # sure that doesn't count as replacing the default
        foo = obj.foo
        assert foo == foo # this is to calm down flake's unused var warning
        assert 'foo' not in obj.properties_with_values(include_defaults=False)
        assert 'foo' in obj.properties_with_values(include_defaults=True)
        # but changing the dict should count as replacing the default
        obj.foo['bar'] = 42
        assert 'foo' in obj.properties_with_values(include_defaults=False)
        assert 'foo' in obj.properties_with_values(include_defaults=True)

    def test_assignment_maintains_owners(self):
        obj = HasStringDictProp()
        old_dict = obj.foo
        assert isinstance(old_dict, PropertyValueDict)
        assert 1 == len(old_dict._owners)
        obj.foo = dict(a=1)
        new_dict = obj.foo
        assert isinstance(new_dict, PropertyValueDict)
        assert old_dict is not new_dict
        assert 0 == len(old_dict._owners)
        assert 1 == len(new_dict._owners)

    def test_dict_delitem_string(self):
        obj = HasStringDictProp(foo=dict(a=1, b=2, c=3))
        assert isinstance(obj.foo, PropertyValueDict)
        def mutate(x):
            del x['b']
        self._check_mutation(obj, 'foo', mutate,
                             dict(a=1, b=2, c=3),
                             dict(a=1, c=3))

    def test_dict_delitem_int(self):
        obj = HasIntDictProp(foo={ 1 : "a", 2 : "b", 3 : "c" })
        assert isinstance(obj.foo, PropertyValueDict)
        def mutate(x):
            del x[1]
        self._check_mutation(obj, 'foo', mutate,
                             { 1 : "a", 2 : "b", 3 : "c" },
                             { 2 : "b", 3 : "c" })

    def test_dict_setitem_string(self):
        obj = HasStringDictProp(foo=dict(a=1, b=2, c=3))
        assert isinstance(obj.foo, PropertyValueDict)
        def mutate(x):
            x['b'] = 42
        self._check_mutation(obj, 'foo', mutate,
                             dict(a=1, b=2, c=3),
                             dict(a=1, b=42, c=3))

    def test_dict_setitem_int(self):
        obj = HasIntDictProp(foo={ 1 : "a", 2 : "b", 3 : "c" })
        assert isinstance(obj.foo, PropertyValueDict)
        def mutate(x):
            x[2] = "bar"
        self._check_mutation(obj, 'foo', mutate,
                             { 1 : "a", 2 : "b", 3 : "c" },
                             { 1 : "a", 2 : "bar", 3 : "c" })

    def test_dict_clear(self):
        obj = HasStringDictProp(foo=dict(a=1, b=2, c=3))
        assert isinstance(obj.foo, PropertyValueDict)
        def mutate(x):
            x.clear()
        self._check_mutation(obj, 'foo', mutate,
                             dict(a=1, b=2, c=3),
                             dict())

    def test_dict_pop(self):
        obj = HasStringDictProp(foo=dict(a=1, b=2, c=3))
        assert isinstance(obj.foo, PropertyValueDict)
        def mutate(x):
            x.pop('b')
        self._check_mutation(obj, 'foo', mutate,
                             dict(a=1, b=2, c=3),
                             dict(a=1, c=3))

    def test_dict_pop_default_works(self):
        obj = HasStringDictProp(foo=dict(a=1, b=2, c=3))
        assert isinstance(obj.foo, PropertyValueDict)
        assert 42 == obj.foo.pop('z', 42)

    def test_dict_popitem_works(self):
        obj = HasStringDictProp(foo=dict(a=1, b=2, c=3))
        assert isinstance(obj.foo, PropertyValueDict)
        i = obj.foo.popitem()
        assert i == ('a', 1) or i == ('b', 2) or i == ('c', 3)
        # we don't _check_mutation since the end value is nondeterministic

    def test_dict_setdefault(self):
        obj = HasStringDictProp(foo=dict(a=1, b=2, c=3))
        assert isinstance(obj.foo, PropertyValueDict)
        def mutate(x):
            b = x.setdefault('b', 43)
            assert 2 == b
            z = x.setdefault('z', 44)
            assert 44 == z

        self._check_mutation(obj, 'foo', mutate,
                             dict(a=1, b=2, c=3),
                             dict(a=1, b=2, c=3, z=44))

    def test_dict_update(self):
        obj = HasStringDictProp(foo=dict(a=1, b=2, c=3))
        assert isinstance(obj.foo, PropertyValueDict)
        def mutate(x):
            x.update(dict(b=7, c=8))
        self._check_mutation(obj, 'foo', mutate,
                             dict(a=1, b=2, c=3),
                             dict(a=1, b=7, c=8))

#-----------------------------------------------------------------------------
# Dev API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Private API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Code
#-----------------------------------------------------------------------------
