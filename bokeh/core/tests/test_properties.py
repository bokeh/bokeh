from __future__ import absolute_import

import datetime
import time
import unittest
import numpy as np
import pandas as pd
from copy import copy

import pytest

from bokeh.core.properties import (field, value,
    NumberSpec, ColorSpec, Bool, Int, Float, Complex, Date, String,
    Regex, Seq, List, Dict, Tuple, Instance, Any, Interval, Either,
    Enum, Color, DashPattern, Size, Percent, Angle, AngleSpec, StringSpec,
    DistanceSpec, FontSize, FontSizeSpec, Override, Include, MinMaxBounds,
    DataDistanceSpec, ScreenDistanceSpec, ColumnData, UnitsSpec)

from bokeh.core.property.containers import PropertyValueColumnData, PropertyValueDict, PropertyValueList

from bokeh.core.has_props import HasProps

from bokeh.models import Plot

class Test_Date(object):
    def test_validate_seconds(self):
        t = time.time()
        d = Date()
        assert d.transform(t) == datetime.date.today()

    def test_validate_milliseconds(self):
        t = time.time() * 1000
        d = Date()
        assert d.transform(t) == datetime.date.today()

class Basictest(unittest.TestCase):

    def test_simple_class(self):
        class Foo(HasProps):
            x = Int(12)
            y = String("hello")
            z = List(Int, [1, 2, 3])
            zz = Dict(String, Int)
            s = String(None)

        f = Foo()
        self.assertEqual(f.x, 12)
        self.assertEqual(f.y, "hello")
        self.assert_(np.array_equal(np.array([1, 2, 3]), f.z))
        self.assertEqual(f.s, None)


        self.assertEqual(set(["x", "y", "z", "zz", "s"]), f.properties())
        with_defaults = f.properties_with_values(include_defaults=True)
        self.assertDictEqual(dict(x=12, y="hello", z=[1,2,3], zz={}, s=None), with_defaults)
        without_defaults = f.properties_with_values(include_defaults=False)
        self.assertDictEqual(dict(), without_defaults)

        f.x = 18
        self.assertEqual(f.x, 18)

        f.y = "bar"
        self.assertEqual(f.y, "bar")

        without_defaults = f.properties_with_values(include_defaults=False)
        self.assertDictEqual(dict(x=18, y="bar"), without_defaults)

        f.z[0] = 100

        without_defaults = f.properties_with_values(include_defaults=False)
        self.assertDictEqual(dict(x=18, y="bar", z=[100,2,3]), without_defaults)

        f.zz = {'a': 10}

        without_defaults = f.properties_with_values(include_defaults=False)
        self.assertDictEqual(dict(x=18, y="bar", z=[100,2,3], zz={'a': 10}), without_defaults)

    def test_enum(self):
        class Foo(HasProps):
            x = Enum("blue", "red", "green")     # the first item is the default
            y = Enum("small", "medium", "large", default="large")

        f = Foo()
        self.assertEqual(f.x, "blue")
        self.assertEqual(f.y, "large")

        f.x = "red"
        self.assertEqual(f.x, "red")

        with self.assertRaises(ValueError):
            f.x = "yellow"

        f.y = "small"
        self.assertEqual(f.y, "small")

        with self.assertRaises(ValueError):
            f.y = "yellow"

    def test_inheritance(self):
        class Base(HasProps):
            x = Int(12)
            y = String("hello")

        class Child(Base):
            z = Float(3.14)

        c = Child()
        self.assertEqual(frozenset(['x', 'y', 'z']), frozenset(c.properties()))
        self.assertEqual(c.y, "hello")

    def test_set(self):
        class Foo(HasProps):
            x = Int(12)
            y = Enum("red", "blue", "green")
            z = String("blah")

        f = Foo()
        self.assertEqual(f.x, 12)
        self.assertEqual(f.y, "red")
        self.assertEqual(f.z, "blah")
        f.update(**dict(x=20, y="green", z="hello"))
        self.assertEqual(f.x, 20)
        self.assertEqual(f.y, "green")
        self.assertEqual(f.z, "hello")
        with self.assertRaises(ValueError):
            f.update(y="orange")

    def test_no_parens(self):
        class Foo(HasProps):
            x = Int
            y = Int()
        f = Foo()
        self.assertEqual(f.x, f.y)
        f.x = 13
        self.assertEqual(f.x, 13)

    def test_accurate_properties_sets(self):
        class Base(HasProps):
            num = Int(12)
            container = List(String)
            child = Instance(HasProps)

        class Mixin(HasProps):
            mixin_num = Int(12)
            mixin_container = List(String)
            mixin_child = Instance(HasProps)

        class Sub(Base, Mixin):
            sub_num = Int(12)
            sub_container = List(String)
            sub_child = Instance(HasProps)

        b = Base()
        self.assertEqual(set(["child"]),
                         b.properties_with_refs())
        self.assertEqual(set(["container"]),
                         b.properties_containers())
        self.assertEqual(set(["num", "container", "child"]),
                         b.properties())
        self.assertEqual(set(["num", "container", "child"]),
                         b.properties(with_bases=True))
        self.assertEqual(set(["num", "container", "child"]),
                         b.properties(with_bases=False))

        m = Mixin()
        self.assertEqual(set(["mixin_child"]),
                         m.properties_with_refs())
        self.assertEqual(set(["mixin_container"]),
                         m.properties_containers())
        self.assertEqual(set(["mixin_num", "mixin_container", "mixin_child"]),
                         m.properties())
        self.assertEqual(set(["mixin_num", "mixin_container", "mixin_child"]),
                         m.properties(with_bases=True))
        self.assertEqual(set(["mixin_num", "mixin_container", "mixin_child"]),
                         m.properties(with_bases=False))

        s = Sub()
        self.assertEqual(set(["child", "sub_child", "mixin_child"]),
                         s.properties_with_refs())
        self.assertEqual(set(["container", "sub_container", "mixin_container"]),
                         s.properties_containers())
        self.assertEqual(set(["num", "container", "child",
                              "mixin_num", "mixin_container", "mixin_child",
                              "sub_num", "sub_container", "sub_child"]),
                         s.properties())
        self.assertEqual(set(["num", "container", "child",
                              "mixin_num", "mixin_container", "mixin_child",
                              "sub_num", "sub_container", "sub_child"]),
                         s.properties(with_bases=True))
        self.assertEqual(set(["sub_num", "sub_container", "sub_child"]),
                         s.properties(with_bases=False))

        # verify caching
        self.assertIs(s.properties_with_refs(), s.properties_with_refs())
        self.assertIs(s.properties_containers(), s.properties_containers())
        self.assertIs(s.properties(), s.properties())
        self.assertIs(s.properties(with_bases=True), s.properties(with_bases=True))
        # this one isn't cached because we store it as a list __properties__ and wrap it
        # in a new set every time
        #self.assertIs(s.properties(with_bases=False), s.properties(with_bases=False))

    def test_accurate_dataspecs(self):
        class Base(HasProps):
            num = NumberSpec(12)
            not_a_dataspec = Float(10)

        class Mixin(HasProps):
            mixin_num = NumberSpec(14)

        class Sub(Base, Mixin):
            sub_num = NumberSpec(16)

        base = Base()
        mixin = Mixin()
        sub = Sub()

        self.assertEqual(set(["num"]), base.dataspecs())
        self.assertEqual(set(["mixin_num"]), mixin.dataspecs())
        self.assertEqual(set(["num", "mixin_num", "sub_num"]), sub.dataspecs())

        self.assertDictEqual(dict(num=base.lookup("num")), base.dataspecs_with_props())
        self.assertDictEqual(dict(mixin_num=mixin.lookup("mixin_num")), mixin.dataspecs_with_props())
        self.assertDictEqual(dict(num=sub.lookup("num"),
                                  mixin_num=sub.lookup("mixin_num"),
                                  sub_num=sub.lookup("sub_num")),
                             sub.dataspecs_with_props())

    def test_not_serialized(self):
        class NotSerialized(HasProps):
            x = Int(12, serialized=False)
            y = String("hello")

        o = NotSerialized()
        self.assertEqual(o.x, 12)
        self.assertEqual(o.y, 'hello')

        # non-serialized props are still in the list of props
        self.assertTrue('x' in o.properties())
        self.assertTrue('y' in o.properties())

        # but they aren't in the dict of props with values, since their
        # values are not important (already included in other values,
        # as with the _units properties)
        self.assertTrue('x' not in o.properties_with_values(include_defaults=True))
        self.assertTrue('y' in o.properties_with_values(include_defaults=True))
        self.assertTrue('x' not in o.properties_with_values(include_defaults=False))
        self.assertTrue('y' not in o.properties_with_values(include_defaults=False))

        o.x = 42
        o.y = 'world'

        self.assertTrue('x' not in o.properties_with_values(include_defaults=True))
        self.assertTrue('y' in o.properties_with_values(include_defaults=True))
        self.assertTrue('x' not in o.properties_with_values(include_defaults=False))
        self.assertTrue('y' in o.properties_with_values(include_defaults=False))

    def test_readonly(self):
        class Readonly(HasProps):
            x = Int(12, readonly=True)    # with default
            y = Int(readonly=True)        # without default
            z = String("hello")

        o = Readonly()
        self.assertEqual(o.x, 12)
        self.assertEqual(o.y, None)
        self.assertEqual(o.z, 'hello')

        # readonly props are still in the list of props
        self.assertTrue('x' in o.properties())
        self.assertTrue('y' in o.properties())
        self.assertTrue('z' in o.properties())

        # but they aren't in the dict of props with values
        self.assertTrue('x' not in o.properties_with_values(include_defaults=True))
        self.assertTrue('y' not in o.properties_with_values(include_defaults=True))
        self.assertTrue('z' in o.properties_with_values(include_defaults=True))
        self.assertTrue('x' not in o.properties_with_values(include_defaults=False))
        self.assertTrue('y' not in o.properties_with_values(include_defaults=False))
        self.assertTrue('z' not in o.properties_with_values(include_defaults=False))

        with self.assertRaises(RuntimeError):
            o.x = 7
        with self.assertRaises(RuntimeError):
            o.y = 7
        o.z = "xyz"

        self.assertEqual(o.x, 12)
        self.assertEqual(o.y, None)
        self.assertEqual(o.z, 'xyz')

    def test_include_defaults(self):
        class IncludeDefaultsTest(HasProps):
            x = Int(12)
            y = String("hello")

        o = IncludeDefaultsTest()
        self.assertEqual(o.x, 12)
        self.assertEqual(o.y, 'hello')

        self.assertTrue('x' in o.properties_with_values(include_defaults=True))
        self.assertTrue('y' in o.properties_with_values(include_defaults=True))
        self.assertTrue('x' not in o.properties_with_values(include_defaults=False))
        self.assertTrue('y' not in o.properties_with_values(include_defaults=False))

        o.x = 42
        o.y = 'world'

        self.assertTrue('x' in o.properties_with_values(include_defaults=True))
        self.assertTrue('y' in o.properties_with_values(include_defaults=True))
        self.assertTrue('x' in o.properties_with_values(include_defaults=False))
        self.assertTrue('y' in o.properties_with_values(include_defaults=False))

    def test_include_defaults_with_kwargs(self):
        class IncludeDefaultsKwargsTest(HasProps):
            x = Int(12)
            y = String("hello")

        o = IncludeDefaultsKwargsTest(x=14, y="world")
        self.assertEqual(o.x, 14)
        self.assertEqual(o.y, 'world')

        self.assertTrue('x' in o.properties_with_values(include_defaults=True))
        self.assertTrue('y' in o.properties_with_values(include_defaults=True))
        self.assertTrue('x' in o.properties_with_values(include_defaults=False))
        self.assertTrue('y' in o.properties_with_values(include_defaults=False))

    def test_include_defaults_set_to_same(self):
        class IncludeDefaultsSetToSameTest(HasProps):
            x = Int(12)
            y = String("hello")

        o = IncludeDefaultsSetToSameTest()

        self.assertTrue('x' in o.properties_with_values(include_defaults=True))
        self.assertTrue('y' in o.properties_with_values(include_defaults=True))
        self.assertTrue('x' not in o.properties_with_values(include_defaults=False))
        self.assertTrue('y' not in o.properties_with_values(include_defaults=False))

        # this should no-op
        o.x = 12
        o.y = "hello"

        self.assertTrue('x' in o.properties_with_values(include_defaults=True))
        self.assertTrue('y' in o.properties_with_values(include_defaults=True))
        self.assertTrue('x' not in o.properties_with_values(include_defaults=False))
        self.assertTrue('y' not in o.properties_with_values(include_defaults=False))

    def test_override_defaults(self):
        class FooBase(HasProps):
            x = Int(12)

        class FooSub(FooBase):
            x = Override(default=14)

        def func_default():
            return 16

        class FooSubSub(FooBase):
            x = Override(default=func_default)

        f_base = FooBase()
        f_sub = FooSub()
        f_sub_sub = FooSubSub()

        self.assertEqual(f_base.x, 12)
        self.assertEqual(f_sub.x, 14)
        self.assertEqual(f_sub_sub.x, 16)

        self.assertEqual(12, f_base.properties_with_values(include_defaults=True)['x'])
        self.assertEqual(14, f_sub.properties_with_values(include_defaults=True)['x'])
        self.assertEqual(16, f_sub_sub.properties_with_values(include_defaults=True)['x'])

        self.assertFalse('x' in f_base.properties_with_values(include_defaults=False))
        self.assertFalse('x' in f_sub.properties_with_values(include_defaults=False))
        self.assertFalse('x' in f_sub_sub.properties_with_values(include_defaults=False))

    def test_include_delegate(self):
        class IsDelegate(HasProps):
            x = Int(12)
            y = String("hello")

        class IncludesDelegateWithPrefix(HasProps):
            z = Include(IsDelegate, use_prefix=True)
            z_y = Int(57) # override the Include

        class IncludesDelegateWithoutPrefix(HasProps):
            z = Include(IsDelegate, use_prefix=False)
            y = Int(42) # override the Include

        class IncludesDelegateWithoutPrefixUsingOverride(HasProps):
            z = Include(IsDelegate, use_prefix=False)
            y = Override(default="world") # override the Include changing just the default

        o = IncludesDelegateWithoutPrefix()
        self.assertEqual(o.x, 12)
        self.assertEqual(o.y, 42)
        self.assertFalse(hasattr(o, 'z'))

        self.assertTrue('x' in o.properties_with_values(include_defaults=True))
        self.assertTrue('y' in o.properties_with_values(include_defaults=True))
        self.assertTrue('x' not in o.properties_with_values(include_defaults=False))
        self.assertTrue('y' not in o.properties_with_values(include_defaults=False))

        o = IncludesDelegateWithoutPrefixUsingOverride()
        self.assertEqual(o.x, 12)
        self.assertEqual(o.y, 'world')
        self.assertFalse(hasattr(o, 'z'))

        self.assertTrue('x' in o.properties_with_values(include_defaults=True))
        self.assertTrue('y' in o.properties_with_values(include_defaults=True))
        self.assertTrue('x' not in o.properties_with_values(include_defaults=False))
        self.assertTrue('y' not in o.properties_with_values(include_defaults=False))

        o2 = IncludesDelegateWithPrefix()
        self.assertEqual(o2.z_x, 12)
        self.assertEqual(o2.z_y, 57)
        self.assertFalse(hasattr(o2, 'z'))
        self.assertFalse(hasattr(o2, 'x'))
        self.assertFalse(hasattr(o2, 'y'))

        self.assertFalse('z' in o2.properties_with_values(include_defaults=True))
        self.assertFalse('x' in o2.properties_with_values(include_defaults=True))
        self.assertFalse('y' in o2.properties_with_values(include_defaults=True))
        self.assertTrue('z_x' in o2.properties_with_values(include_defaults=True))
        self.assertTrue('z_y' in o2.properties_with_values(include_defaults=True))
        self.assertTrue('z_x' not in o2.properties_with_values(include_defaults=False))
        self.assertTrue('z_y' not in o2.properties_with_values(include_defaults=False))

    # def test_kwargs_init(self):
    #     class Foo(HasProps):
    #         x = String
    #         y = Int
    #         z = Float
    #     f = Foo(x = "hello", y = 14)
    #     self.assertEqual(f.x, "hello")
    #     self.assertEqual(f.y, 14)

    #     with self.assertRaises(TypeError):
    #         # This should raise a TypeError: object.__init__() takes no parameters
    #         g = Foo(z = 3.14, q = "blah")

class TestNumberSpec(unittest.TestCase):

    def test_field(self):
        class Foo(HasProps):
            x = NumberSpec("xfield")
        f = Foo()
        self.assertEqual(f.x, "xfield")
        self.assertDictEqual(Foo.__dict__["x"].serializable_value(f), {"field": "xfield"})
        f.x = "my_x"
        self.assertEqual(f.x, "my_x")
        self.assertDictEqual(Foo.__dict__["x"].serializable_value(f), {"field": "my_x"})

    def test_value(self):
        class Foo(HasProps):
            x = NumberSpec("xfield")
        f = Foo()
        self.assertEqual(f.x, "xfield")
        f.x = 12
        self.assertEqual(f.x, 12)
        self.assertDictEqual(Foo.__dict__["x"].serializable_value(f), {"value": 12})
        f.x = 15
        self.assertEqual(f.x, 15)
        self.assertDictEqual(Foo.__dict__["x"].serializable_value(f), {"value": 15})
        f.x = dict(value=32)
        self.assertDictEqual(Foo.__dict__["x"].serializable_value(f), {"value": 32})
        f.x = None
        self.assertIs(Foo.__dict__["x"].serializable_value(f), None)

    def tests_accepts_timedelta(self):
        class Foo(HasProps):
            dt = NumberSpec("dt", accept_datetime=True)
            ndt = NumberSpec("ndt", accept_datetime=False)

        f = Foo()

        f.dt = datetime.timedelta(3, 54)
        self.assertEqual(f.dt, 259254000.0)

        # counts as number.Real out of the box
        f.dt = np.timedelta64(3000, "ms")
        self.assertEqual(f.dt, np.timedelta64(3000, "ms"))

        # counts as number.Real out of the box
        f.dt = pd.Timedelta("3000ms")
        self.assertEqual(f.dt, 3000.0)


        f.ndt = datetime.timedelta(3, 54)
        self.assertEqual(f.ndt, 259254000.0)

        # counts as number.Real out of the box
        f.ndt = np.timedelta64(3000, "ms")
        self.assertEqual(f.ndt, np.timedelta64(3000, "ms"))

        f.ndt = pd.Timedelta("3000ms")
        self.assertEqual(f.ndt, 3000.0)

    def test_accepts_datetime(self):
        class Foo(HasProps):
            dt = NumberSpec("dt", accept_datetime=True)
            ndt = NumberSpec("ndt", accept_datetime=False)

        f = Foo()

        f.dt = datetime.datetime(2016, 5, 11)
        self.assertEqual(f.dt, 1462924800000.0)

        f.dt = datetime.date(2016, 5, 11)
        self.assertEqual(f.dt, 1462924800000.0)

        f.dt = np.datetime64("2016-05-11")
        self.assertEqual(f.dt, 1462924800000.0)


        with self.assertRaises(ValueError):
            f.ndt = datetime.datetime(2016, 5, 11)

        with self.assertRaises(ValueError):
            f.ndt = datetime.date(2016, 5, 11)

        with self.assertRaises(ValueError):
            f.ndt = np.datetime64("2016-05-11")

    def test_default(self):
        class Foo(HasProps):
            y = NumberSpec(default=12)
        f = Foo()
        self.assertEqual(f.y, 12)
        self.assertDictEqual(Foo.__dict__["y"].serializable_value(f), {"value": 12})
        f.y = "y1"
        self.assertEqual(f.y, "y1")
        # Once we set a concrete value, the default is ignored, because it is unused
        f.y = 32
        self.assertEqual(f.y, 32)
        self.assertDictEqual(Foo.__dict__["y"].serializable_value(f), {"value": 32})

    def test_multiple_instances(self):
        class Foo(HasProps):
            x = NumberSpec("xfield")

        a = Foo()
        b = Foo()
        a.x = 13
        b.x = 14
        self.assertEqual(a.x, 13)
        self.assertEqual(b.x, 14)
        self.assertDictEqual(Foo.__dict__["x"].serializable_value(a), {"value": 13})
        self.assertDictEqual(Foo.__dict__["x"].serializable_value(b), {"value": 14})
        b.x = {"field": "x3"}
        self.assertDictEqual(Foo.__dict__["x"].serializable_value(a), {"value": 13})
        self.assertDictEqual(Foo.__dict__["x"].serializable_value(b), {"field": "x3"})

    def test_autocreate_no_parens(self):
        class Foo(HasProps):
            x = NumberSpec

        a = Foo()

        self.assertIs(a.x, None)
        a.x = 14
        self.assertEqual(a.x, 14)

    def test_set_from_json_keeps_mode(self):
        class Foo(HasProps):
            x = NumberSpec(default=None)

        a = Foo()

        self.assertIs(a.x, None)

        # set as a value
        a.x = 14
        self.assertEqual(a.x, 14)
        # set_from_json keeps the previous dict-ness or lack thereof
        a.set_from_json('x', dict(value=16))
        self.assertEqual(a.x, 16)
        # but regular assignment overwrites the previous dict-ness
        a.x = dict(value=17)
        self.assertDictEqual(a.x, dict(value=17))

        # set as a field
        a.x = "bar"
        self.assertEqual(a.x, "bar")
        # set_from_json keeps the previous dict-ness or lack thereof
        a.set_from_json('x', dict(field="foo"))
        self.assertEqual(a.x, "foo")
        # but regular assignment overwrites the previous dict-ness
        a.x = dict(field="baz")
        self.assertDictEqual(a.x, dict(field="baz"))

class TestFontSizeSpec(unittest.TestCase):
    def test_font_size_from_string(self):
        class Foo(HasProps):
            x = FontSizeSpec(default=None)

        css_units = "%|em|ex|ch|ic|rem|vw|vh|vi|vb|vmin|vmax|cm|mm|q|in|pc|pt|px"

        a = Foo()
        self.assertIs(a.x, None)

        for unit in css_units.split("|"):

            v = '10%s' % unit
            a.x = v
            self.assertEqual(a.x, v)
            self.assertEqual(a.lookup('x').serializable_value(a), dict(value=v))

            v = '10.2%s' % unit
            a.x = v
            self.assertEqual(a.x, v)
            self.assertEqual(a.lookup('x').serializable_value(a), dict(value=v))

            f = '_10%s' % unit
            a.x = f
            self.assertEqual(a.x, f)
            self.assertEqual(a.lookup('x').serializable_value(a), dict(field=f))

            f = '_10.2%s' % unit
            a.x = f
            self.assertEqual(a.x, f)
            self.assertEqual(a.lookup('x').serializable_value(a), dict(field=f))

        for unit in css_units.upper().split("|"):
            v = '10%s' % unit
            a.x = v
            self.assertEqual(a.x, v)
            self.assertEqual(a.lookup('x').serializable_value(a), dict(value=v))

            v = '10.2%s' % unit
            a.x = v
            self.assertEqual(a.x, v)
            self.assertEqual(a.lookup('x').serializable_value(a), dict(value=v))

            f = '_10%s' % unit
            a.x = f
            self.assertEqual(a.x, f)
            self.assertEqual(a.lookup('x').serializable_value(a), dict(field=f))

            f = '_10.2%s' % unit
            a.x = f
            self.assertEqual(a.x, f)
            self.assertEqual(a.lookup('x').serializable_value(a), dict(field=f))

    def test_bad_font_size_values(self):
        class Foo(HasProps):
            x = FontSizeSpec(default=None)

        a = Foo()

        with self.assertRaises(ValueError):
            a.x = "6"

        with self.assertRaises(ValueError):
            a.x = 6

        with self.assertRaises(ValueError):
            a.x = ""

    def test_fields(self):
        class Foo(HasProps):
            x = FontSizeSpec(default=None)

        a = Foo()

        a.x = "_120"
        self.assertEqual(a.x, "_120")

        a.x = dict(field="_120")
        self.assertEqual(a.x, dict(field="_120"))

        a.x = "foo"
        self.assertEqual(a.x, "foo")

        a.x = dict(field="foo")
        self.assertEqual(a.x, dict(field="foo"))

class TestAngleSpec(unittest.TestCase):
    def test_default_none(self):
        class Foo(HasProps):
            x = AngleSpec(None)

        a = Foo()

        self.assertIs(a.x, None)
        self.assertEqual(a.x_units, 'rad')
        a.x = 14
        self.assertEqual(a.x, 14)
        self.assertEqual(a.x_units, 'rad')

    def test_autocreate_no_parens(self):
        class Foo(HasProps):
            x = AngleSpec

        a = Foo()

        self.assertIs(a.x, None)
        self.assertEqual(a.x_units, 'rad')
        a.x = 14
        self.assertEqual(a.x, 14)
        self.assertEqual(a.x_units, 'rad')

    def test_default_value(self):
        class Foo(HasProps):
            x = AngleSpec(default=14)

        a = Foo()

        self.assertEqual(a.x, 14)
        self.assertEqual(a.x_units, 'rad')

    def test_setting_dict_sets_units(self):
        class Foo(HasProps):
            x = AngleSpec(default=14)

        a = Foo()

        self.assertEqual(a.x, 14)
        self.assertEqual(a.x_units, 'rad')

        a.x = { 'value' : 180, 'units' : 'deg' }
        self.assertDictEqual(a.x, { 'value' : 180 })
        self.assertEqual(a.x_units, 'deg')

    def test_setting_json_sets_units_keeps_dictness(self):
        class Foo(HasProps):
            x = AngleSpec(default=14)

        a = Foo()

        self.assertEqual(a.x, 14)
        self.assertEqual(a.x_units, 'rad')

        a.set_from_json('x', { 'value' : 180, 'units' : 'deg' })
        self.assertEqual(a.x, 180)
        self.assertEqual(a.x_units, 'deg')

    def test_setting_dict_does_not_modify_original_dict(self):
        class Foo(HasProps):
            x = AngleSpec(default=14)

        a = Foo()

        self.assertEqual(a.x, 14)
        self.assertEqual(a.x_units, 'rad')

        new_value = { 'value' : 180, 'units' : 'deg' }
        new_value_copy = copy(new_value)
        self.assertDictEqual(new_value_copy, new_value)

        a.x = new_value
        self.assertDictEqual(a.x, { 'value' : 180 })
        self.assertEqual(a.x_units, 'deg')

        self.assertDictEqual(new_value_copy, new_value)

class TestDistanceSpec(unittest.TestCase):
    def test_default_none(self):
        class Foo(HasProps):
            x = DistanceSpec(None)

        a = Foo()

        self.assertIs(a.x, None)
        self.assertEqual(a.x_units, 'data')
        a.x = 14
        self.assertEqual(a.x, 14)
        self.assertEqual(a.x_units, 'data')

    def test_autocreate_no_parens(self):
        class Foo(HasProps):
            x = DistanceSpec

        a = Foo()

        self.assertIs(a.x, None)
        self.assertEqual(a.x_units, 'data')
        a.x = 14
        self.assertEqual(a.x, 14)
        self.assertEqual(a.x_units, 'data')

    def test_default_value(self):
        class Foo(HasProps):
            x = DistanceSpec(default=14)

        a = Foo()

        self.assertEqual(a.x, 14)
        self.assertEqual(a.x_units, 'data')

class TestColorSpec(unittest.TestCase):

    def test_field(self):
        class Foo(HasProps):
            col = ColorSpec("colorfield")
        desc = Foo.__dict__["col"]
        f = Foo()
        self.assertEqual(f.col, "colorfield")
        self.assertDictEqual(desc.serializable_value(f), {"field": "colorfield"})
        f.col = "myfield"
        self.assertEqual(f.col, "myfield")
        self.assertDictEqual(desc.serializable_value(f), {"field": "myfield"})

    def test_field_default(self):
        class Foo(HasProps):
            col = ColorSpec(default="red")
        desc = Foo.__dict__["col"]
        f = Foo()
        self.assertEqual(f.col, "red")
        self.assertDictEqual(desc.serializable_value(f), {"value": "red"})
        f.col = "myfield"
        self.assertEqual(f.col, "myfield")
        self.assertDictEqual(desc.serializable_value(f), {"field": "myfield"})

    def test_default_tuple(self):
        class Foo(HasProps):
            col = ColorSpec(default=(128, 255, 124))
        desc = Foo.__dict__["col"]
        f = Foo()
        self.assertEqual(f.col, (128, 255, 124))
        self.assertDictEqual(desc.serializable_value(f), {"value": "rgb(128, 255, 124)"})

    def test_fixed_value(self):
        class Foo(HasProps):
            col = ColorSpec("gray")
        desc = Foo.__dict__["col"]
        f = Foo()
        self.assertEqual(f.col, "gray")
        self.assertDictEqual(desc.serializable_value(f), {"value": "gray"})

    def test_named_value(self):
        class Foo(HasProps):
            col = ColorSpec("colorfield")
        desc = Foo.__dict__["col"]
        f = Foo()

        f.col = "red"
        self.assertEqual(f.col, "red")
        self.assertDictEqual(desc.serializable_value(f), {"value": "red"})
        f.col = "forestgreen"
        self.assertEqual(f.col, "forestgreen")
        self.assertDictEqual(desc.serializable_value(f), {"value": "forestgreen"})

    def test_case_insensitive_named_value(self):
        class Foo(HasProps):
            col = ColorSpec("colorfield")
        desc = Foo.__dict__["col"]
        f = Foo()

        f.col = "RED"
        self.assertEqual(f.col, "RED")
        self.assertDictEqual(desc.serializable_value(f), {"value": "RED"})
        f.col = "ForestGreen"
        self.assertEqual(f.col, "ForestGreen")
        self.assertDictEqual(desc.serializable_value(f), {"value": "ForestGreen"})

    def test_named_value_set_none(self):
        class Foo(HasProps):
            col = ColorSpec("colorfield")
        desc = Foo.__dict__["col"]
        f = Foo()
        f.col = None
        self.assertDictEqual(desc.serializable_value(f), {"value": None})

    def test_named_value_unset(self):
        class Foo(HasProps):
            col = ColorSpec("colorfield")
        desc = Foo.__dict__["col"]
        f = Foo()
        self.assertDictEqual(desc.serializable_value(f), {"field": "colorfield"})

    def test_named_color_overriding_default(self):
        class Foo(HasProps):
            col = ColorSpec("colorfield")
        desc = Foo.__dict__["col"]
        f = Foo()
        f.col = "forestgreen"
        self.assertEqual(f.col, "forestgreen")
        self.assertDictEqual(desc.serializable_value(f), {"value": "forestgreen"})
        f.col = "myfield"
        self.assertEqual(f.col, "myfield")
        self.assertDictEqual(desc.serializable_value(f), {"field": "myfield"})

    def test_hex_value(self):
        class Foo(HasProps):
            col = ColorSpec("colorfield")
        desc = Foo.__dict__["col"]
        f = Foo()
        f.col = "#FF004A"
        self.assertEqual(f.col, "#FF004A")
        self.assertDictEqual(desc.serializable_value(f), {"value": "#FF004A"})
        f.col = "myfield"
        self.assertEqual(f.col, "myfield")
        self.assertDictEqual(desc.serializable_value(f), {"field": "myfield"})

    def test_tuple_value(self):
        class Foo(HasProps):
            col = ColorSpec("colorfield")
        desc = Foo.__dict__["col"]
        f = Foo()
        f.col = (128, 200, 255)
        self.assertEqual(f.col, (128, 200, 255))
        self.assertDictEqual(desc.serializable_value(f), {"value": "rgb(128, 200, 255)"})
        f.col = "myfield"
        self.assertEqual(f.col, "myfield")
        self.assertDictEqual(desc.serializable_value(f), {"field": "myfield"})
        f.col = (100, 150, 200, 0.5)
        self.assertEqual(f.col, (100, 150, 200, 0.5))
        self.assertDictEqual(desc.serializable_value(f), {"value": "rgba(100, 150, 200, 0.5)"})

    def test_set_dict(self):
        class Foo(HasProps):
            col = ColorSpec("colorfield")
        desc = Foo.__dict__["col"]
        f = Foo()
        f.col = {"field": "myfield"}
        self.assertDictEqual(f.col, {"field": "myfield"})

        f.col = "field2"
        self.assertEqual(f.col, "field2")
        self.assertDictEqual(desc.serializable_value(f), {"field": "field2"})

class TestDashPattern(unittest.TestCase):

    def test_named(self):
        class Foo(HasProps):
            pat = DashPattern
        f = Foo()

        self.assertEqual(f.pat, [])
        f.pat = "solid"
        self.assertEqual(f.pat, [])
        f.pat = "dashed"
        self.assertEqual(f.pat, [6])
        f.pat = "dotted"
        self.assertEqual(f.pat, [2, 4])
        f.pat = "dotdash"
        self.assertEqual(f.pat, [2, 4, 6, 4])
        f.pat = "dashdot"
        self.assertEqual(f.pat, [6, 4, 2, 4])

    def test_string(self):
        class Foo(HasProps):
            pat = DashPattern
        f = Foo()

        f.pat = ""
        self.assertEqual(f.pat, [])
        f.pat = "2"
        self.assertEqual(f.pat, [2])
        f.pat = "2 4"
        self.assertEqual(f.pat, [2, 4])
        f.pat = "2 4 6"
        self.assertEqual(f.pat, [2, 4, 6])

        with self.assertRaises(ValueError):
            f.pat = "abc 6"

    def test_list(self):
        class Foo(HasProps):
            pat = DashPattern
        f = Foo()

        f.pat = ()
        self.assertEqual(f.pat, ())
        f.pat = (2,)
        self.assertEqual(f.pat, (2,))
        f.pat = (2, 4)
        self.assertEqual(f.pat, (2, 4))
        f.pat = (2, 4, 6)
        self.assertEqual(f.pat, (2, 4, 6))

        with self.assertRaises(ValueError):
            f.pat = (2, 4.2)
        with self.assertRaises(ValueError):
            f.pat = (2, "a")

    def test_invalid(self):
        class Foo(HasProps):
            pat = DashPattern
        f = Foo()

        with self.assertRaises(ValueError):
            f.pat = 10
        with self.assertRaises(ValueError):
            f.pat = 10.1
        with self.assertRaises(ValueError):
            f.pat = {}


class Foo(HasProps):
    pass

class Bar(HasProps):
    pass

class Baz(HasProps):
    pass

class TestProperties(unittest.TestCase):

    def test_Any(self):
        prop = Any()

        self.assertTrue(prop.is_valid(None))
        self.assertTrue(prop.is_valid(False))
        self.assertTrue(prop.is_valid(True))
        self.assertTrue(prop.is_valid(0))
        self.assertTrue(prop.is_valid(1))
        self.assertTrue(prop.is_valid(0.0))
        self.assertTrue(prop.is_valid(1.0))
        self.assertTrue(prop.is_valid(1.0+1.0j))
        self.assertTrue(prop.is_valid(""))
        self.assertTrue(prop.is_valid(()))
        self.assertTrue(prop.is_valid([]))
        self.assertTrue(prop.is_valid({}))
        self.assertTrue(prop.is_valid(Foo()))

    def test_Bool(self):
        prop = Bool()

        self.assertTrue(prop.is_valid(None))
        self.assertTrue(prop.is_valid(False))
        self.assertTrue(prop.is_valid(True))
        self.assertFalse(prop.is_valid(0))
        self.assertFalse(prop.is_valid(1))
        self.assertFalse(prop.is_valid(0.0))
        self.assertFalse(prop.is_valid(1.0))
        self.assertFalse(prop.is_valid(1.0+1.0j))
        self.assertFalse(prop.is_valid(""))
        self.assertFalse(prop.is_valid(()))
        self.assertFalse(prop.is_valid([]))
        self.assertFalse(prop.is_valid({}))
        self.assertFalse(prop.is_valid(Foo()))

        self.assertTrue(prop.is_valid(np.bool8(False)))
        self.assertTrue(prop.is_valid(np.bool8(True)))
        self.assertFalse(prop.is_valid(np.int8(0)))
        self.assertFalse(prop.is_valid(np.int8(1)))
        self.assertFalse(prop.is_valid(np.int16(0)))
        self.assertFalse(prop.is_valid(np.int16(1)))
        self.assertFalse(prop.is_valid(np.int32(0)))
        self.assertFalse(prop.is_valid(np.int32(1)))
        self.assertFalse(prop.is_valid(np.int64(0)))
        self.assertFalse(prop.is_valid(np.int64(1)))
        self.assertFalse(prop.is_valid(np.uint8(0)))
        self.assertFalse(prop.is_valid(np.uint8(1)))
        self.assertFalse(prop.is_valid(np.uint16(0)))
        self.assertFalse(prop.is_valid(np.uint16(1)))
        self.assertFalse(prop.is_valid(np.uint32(0)))
        self.assertFalse(prop.is_valid(np.uint32(1)))
        self.assertFalse(prop.is_valid(np.uint64(0)))
        self.assertFalse(prop.is_valid(np.uint64(1)))
        self.assertFalse(prop.is_valid(np.float16(0)))
        self.assertFalse(prop.is_valid(np.float16(1)))
        self.assertFalse(prop.is_valid(np.float32(0)))
        self.assertFalse(prop.is_valid(np.float32(1)))
        self.assertFalse(prop.is_valid(np.float64(0)))
        self.assertFalse(prop.is_valid(np.float64(1)))
        self.assertFalse(prop.is_valid(np.complex64(1.0+1.0j)))
        self.assertFalse(prop.is_valid(np.complex128(1.0+1.0j)))
        if hasattr(np, "complex256"):
            self.assertFalse(prop.is_valid(np.complex256(1.0+1.0j)))

    def test_Int(self):
        prop = Int()

        self.assertTrue(prop.is_valid(None))
        # TODO: self.assertFalse(prop.is_valid(False))
        # TODO: self.assertFalse(prop.is_valid(True))
        self.assertTrue(prop.is_valid(0))
        self.assertTrue(prop.is_valid(1))
        self.assertFalse(prop.is_valid(0.0))
        self.assertFalse(prop.is_valid(1.0))
        self.assertFalse(prop.is_valid(1.0+1.0j))
        self.assertFalse(prop.is_valid(""))
        self.assertFalse(prop.is_valid(()))
        self.assertFalse(prop.is_valid([]))
        self.assertFalse(prop.is_valid({}))
        self.assertFalse(prop.is_valid(Foo()))

        # TODO: self.assertFalse(prop.is_valid(np.bool8(False)))
        # TODO: self.assertFalse(prop.is_valid(np.bool8(True)))
        self.assertTrue(prop.is_valid(np.int8(0)))
        self.assertTrue(prop.is_valid(np.int8(1)))
        self.assertTrue(prop.is_valid(np.int16(0)))
        self.assertTrue(prop.is_valid(np.int16(1)))
        self.assertTrue(prop.is_valid(np.int32(0)))
        self.assertTrue(prop.is_valid(np.int32(1)))
        self.assertTrue(prop.is_valid(np.int64(0)))
        self.assertTrue(prop.is_valid(np.int64(1)))
        self.assertTrue(prop.is_valid(np.uint8(0)))
        self.assertTrue(prop.is_valid(np.uint8(1)))
        self.assertTrue(prop.is_valid(np.uint16(0)))
        self.assertTrue(prop.is_valid(np.uint16(1)))
        self.assertTrue(prop.is_valid(np.uint32(0)))
        self.assertTrue(prop.is_valid(np.uint32(1)))
        self.assertTrue(prop.is_valid(np.uint64(0)))
        self.assertTrue(prop.is_valid(np.uint64(1)))
        self.assertFalse(prop.is_valid(np.float16(0)))
        self.assertFalse(prop.is_valid(np.float16(1)))
        self.assertFalse(prop.is_valid(np.float32(0)))
        self.assertFalse(prop.is_valid(np.float32(1)))
        self.assertFalse(prop.is_valid(np.float64(0)))
        self.assertFalse(prop.is_valid(np.float64(1)))
        self.assertFalse(prop.is_valid(np.complex64(1.0+1.0j)))
        self.assertFalse(prop.is_valid(np.complex128(1.0+1.0j)))
        if hasattr(np, "complex256"):
            self.assertFalse(prop.is_valid(np.complex256(1.0+1.0j)))

    def test_Float(self):
        prop = Float()

        self.assertTrue(prop.is_valid(None))
        # TODO: self.assertFalse(prop.is_valid(False))
        # TODO: self.assertFalse(prop.is_valid(True))
        self.assertTrue(prop.is_valid(0))
        self.assertTrue(prop.is_valid(1))
        self.assertTrue(prop.is_valid(0.0))
        self.assertTrue(prop.is_valid(1.0))
        self.assertFalse(prop.is_valid(1.0+1.0j))
        self.assertFalse(prop.is_valid(""))
        self.assertFalse(prop.is_valid(()))
        self.assertFalse(prop.is_valid([]))
        self.assertFalse(prop.is_valid({}))
        self.assertFalse(prop.is_valid(Foo()))

        # TODO: self.assertFalse(prop.is_valid(np.bool8(False)))
        # TODO: self.assertFalse(prop.is_valid(np.bool8(True)))
        self.assertTrue(prop.is_valid(np.int8(0)))
        self.assertTrue(prop.is_valid(np.int8(1)))
        self.assertTrue(prop.is_valid(np.int16(0)))
        self.assertTrue(prop.is_valid(np.int16(1)))
        self.assertTrue(prop.is_valid(np.int32(0)))
        self.assertTrue(prop.is_valid(np.int32(1)))
        self.assertTrue(prop.is_valid(np.int64(0)))
        self.assertTrue(prop.is_valid(np.int64(1)))
        self.assertTrue(prop.is_valid(np.uint8(0)))
        self.assertTrue(prop.is_valid(np.uint8(1)))
        self.assertTrue(prop.is_valid(np.uint16(0)))
        self.assertTrue(prop.is_valid(np.uint16(1)))
        self.assertTrue(prop.is_valid(np.uint32(0)))
        self.assertTrue(prop.is_valid(np.uint32(1)))
        self.assertTrue(prop.is_valid(np.uint64(0)))
        self.assertTrue(prop.is_valid(np.uint64(1)))
        self.assertTrue(prop.is_valid(np.float16(0)))
        self.assertTrue(prop.is_valid(np.float16(1)))
        self.assertTrue(prop.is_valid(np.float32(0)))
        self.assertTrue(prop.is_valid(np.float32(1)))
        self.assertTrue(prop.is_valid(np.float64(0)))
        self.assertTrue(prop.is_valid(np.float64(1)))
        self.assertFalse(prop.is_valid(np.complex64(1.0+1.0j)))
        self.assertFalse(prop.is_valid(np.complex128(1.0+1.0j)))
        if hasattr(np, "complex256"):
            self.assertFalse(prop.is_valid(np.complex256(1.0+1.0j)))

    def test_Complex(self):
        prop = Complex()

        self.assertTrue(prop.is_valid(None))
        # TODO: self.assertFalse(prop.is_valid(False))
        # TODO: self.assertFalse(prop.is_valid(True))
        self.assertTrue(prop.is_valid(0))
        self.assertTrue(prop.is_valid(1))
        self.assertTrue(prop.is_valid(0.0))
        self.assertTrue(prop.is_valid(1.0))
        self.assertTrue(prop.is_valid(1.0+1.0j))
        self.assertFalse(prop.is_valid(""))
        self.assertFalse(prop.is_valid(()))
        self.assertFalse(prop.is_valid([]))
        self.assertFalse(prop.is_valid({}))
        self.assertFalse(prop.is_valid(Foo()))

        # TODO: self.assertFalse(prop.is_valid(np.bool8(False)))
        # TODO: self.assertFalse(prop.is_valid(np.bool8(True)))
        self.assertTrue(prop.is_valid(np.int8(0)))
        self.assertTrue(prop.is_valid(np.int8(1)))
        self.assertTrue(prop.is_valid(np.int16(0)))
        self.assertTrue(prop.is_valid(np.int16(1)))
        self.assertTrue(prop.is_valid(np.int32(0)))
        self.assertTrue(prop.is_valid(np.int32(1)))
        self.assertTrue(prop.is_valid(np.int64(0)))
        self.assertTrue(prop.is_valid(np.int64(1)))
        self.assertTrue(prop.is_valid(np.uint8(0)))
        self.assertTrue(prop.is_valid(np.uint8(1)))
        self.assertTrue(prop.is_valid(np.uint16(0)))
        self.assertTrue(prop.is_valid(np.uint16(1)))
        self.assertTrue(prop.is_valid(np.uint32(0)))
        self.assertTrue(prop.is_valid(np.uint32(1)))
        self.assertTrue(prop.is_valid(np.uint64(0)))
        self.assertTrue(prop.is_valid(np.uint64(1)))
        self.assertTrue(prop.is_valid(np.float16(0)))
        self.assertTrue(prop.is_valid(np.float16(1)))
        self.assertTrue(prop.is_valid(np.float32(0)))
        self.assertTrue(prop.is_valid(np.float32(1)))
        self.assertTrue(prop.is_valid(np.float64(0)))
        self.assertTrue(prop.is_valid(np.float64(1)))
        self.assertTrue(prop.is_valid(np.complex64(1.0+1.0j)))
        self.assertTrue(prop.is_valid(np.complex128(1.0+1.0j)))
        if hasattr(np, "complex256"):
            self.assertTrue(prop.is_valid(np.complex256(1.0+1.0j)))

    def test_String(self):
        prop = String()

        self.assertTrue(prop.is_valid(None))

        self.assertFalse(prop.is_valid(False))
        self.assertFalse(prop.is_valid(True))
        self.assertFalse(prop.is_valid(0))
        self.assertFalse(prop.is_valid(1))
        self.assertFalse(prop.is_valid(0.0))
        self.assertFalse(prop.is_valid(1.0))
        self.assertFalse(prop.is_valid(1.0+1.0j))
        self.assertTrue(prop.is_valid(""))
        self.assertTrue(prop.is_valid("6"))
        self.assertFalse(prop.is_valid(()))
        self.assertFalse(prop.is_valid([]))
        self.assertFalse(prop.is_valid({}))
        self.assertFalse(prop.is_valid(Foo()))

    def test_FontSize(self):

        prop = FontSize()

        self.assertTrue(prop.is_valid(None))

        css_units = "%|em|ex|ch|ic|rem|vw|vh|vi|vb|vmin|vmax|cm|mm|q|in|pc|pt|px"

        for unit in css_units.split("|"):
            v = '10%s' % unit
            self.assertTrue(prop.is_valid(v))

            v = '10.2%s' % unit
            self.assertTrue(prop.is_valid(v))

            v = '_10%s' % unit
            self.assertFalse(prop.is_valid(v))

            v = '_10.2%s' % unit
            self.assertFalse(prop.is_valid(v))

        for unit in css_units.upper().split("|"):
            v = '10%s' % unit
            self.assertTrue(prop.is_valid(v))

            v = '10.2%s' % unit
            self.assertTrue(prop.is_valid(v))

            v = '_10%s' % unit
            self.assertFalse(prop.is_valid(v))

            v = '_10.2%s' % unit
            self.assertFalse(prop.is_valid(v))

        self.assertFalse(prop.is_valid(False))
        self.assertFalse(prop.is_valid(True))
        self.assertFalse(prop.is_valid(0))
        self.assertFalse(prop.is_valid(1))
        self.assertFalse(prop.is_valid(0.0))
        self.assertFalse(prop.is_valid(1.0))
        self.assertFalse(prop.is_valid(1.0+1.0j))
        self.assertFalse(prop.is_valid(""))
        self.assertFalse(prop.is_valid(()))
        self.assertFalse(prop.is_valid([]))
        self.assertFalse(prop.is_valid({}))
        self.assertFalse(prop.is_valid(Foo()))


    def test_Regex(self):
        with self.assertRaises(TypeError):
            prop = Regex()

        prop = Regex("^x*$")

        self.assertTrue(prop.is_valid(None))
        self.assertFalse(prop.is_valid(False))
        self.assertFalse(prop.is_valid(True))
        self.assertFalse(prop.is_valid(0))
        self.assertFalse(prop.is_valid(1))
        self.assertFalse(prop.is_valid(0.0))
        self.assertFalse(prop.is_valid(1.0))
        self.assertFalse(prop.is_valid(1.0+1.0j))
        self.assertTrue(prop.is_valid(""))
        self.assertFalse(prop.is_valid(()))
        self.assertFalse(prop.is_valid([]))
        self.assertFalse(prop.is_valid({}))
        self.assertFalse(prop.is_valid(Foo()))

    def test_Seq(self):
        with self.assertRaises(TypeError):
            prop = Seq()

        prop = Seq(Int)

        self.assertTrue(prop.is_valid(None))
        self.assertFalse(prop.is_valid(False))
        self.assertFalse(prop.is_valid(True))
        self.assertFalse(prop.is_valid(0))
        self.assertFalse(prop.is_valid(1))
        self.assertFalse(prop.is_valid(0.0))
        self.assertFalse(prop.is_valid(1.0))
        self.assertFalse(prop.is_valid(1.0+1.0j))
        self.assertFalse(prop.is_valid(""))
        self.assertTrue(prop.is_valid(()))
        self.assertTrue(prop.is_valid([]))
        self.assertTrue(prop.is_valid(np.array([])))
        self.assertFalse(prop.is_valid(set([])))
        self.assertFalse(prop.is_valid({}))
        self.assertTrue(prop.is_valid((1, 2)))
        self.assertTrue(prop.is_valid([1, 2]))
        self.assertTrue(prop.is_valid(np.array([1, 2])))
        self.assertFalse(prop.is_valid({1, 2}))
        self.assertFalse(prop.is_valid({1: 2}))
        self.assertFalse(prop.is_valid(Foo()))

        df = pd.DataFrame([1, 2])
        self.assertTrue(prop.is_valid(df.index))
        self.assertTrue(prop.is_valid(df.iloc[0]))

    def test_List(self):
        with self.assertRaises(TypeError):
            prop = List()

        prop = List(Int)

        self.assertTrue(prop.is_valid(None))
        self.assertFalse(prop.is_valid(False))
        self.assertFalse(prop.is_valid(True))
        self.assertFalse(prop.is_valid(0))
        self.assertFalse(prop.is_valid(1))
        self.assertFalse(prop.is_valid(0.0))
        self.assertFalse(prop.is_valid(1.0))
        self.assertFalse(prop.is_valid(1.0+1.0j))
        self.assertFalse(prop.is_valid(""))
        self.assertFalse(prop.is_valid(()))
        self.assertTrue(prop.is_valid([]))
        self.assertFalse(prop.is_valid({}))
        self.assertFalse(prop.is_valid(Foo()))

    def test_Dict(self):
        with self.assertRaises(TypeError):
            prop = Dict()

        prop = Dict(String, List(Int))

        self.assertTrue(prop.is_valid(None))
        self.assertFalse(prop.is_valid(False))
        self.assertFalse(prop.is_valid(True))
        self.assertFalse(prop.is_valid(0))
        self.assertFalse(prop.is_valid(1))
        self.assertFalse(prop.is_valid(0.0))
        self.assertFalse(prop.is_valid(1.0))
        self.assertFalse(prop.is_valid(1.0+1.0j))
        self.assertFalse(prop.is_valid(""))
        self.assertFalse(prop.is_valid(()))
        self.assertFalse(prop.is_valid([]))
        self.assertTrue(prop.is_valid({}))
        self.assertFalse(prop.is_valid(Foo()))

    def test_Tuple(self):
        with self.assertRaises(TypeError):
            prop = Tuple()

        with self.assertRaises(TypeError):
            prop = Tuple(Int)

        prop = Tuple(Int, String, List(Int))

        self.assertTrue(prop.is_valid(None))
        self.assertFalse(prop.is_valid(False))
        self.assertFalse(prop.is_valid(True))
        self.assertFalse(prop.is_valid(0))
        self.assertFalse(prop.is_valid(1))
        self.assertFalse(prop.is_valid(0.0))
        self.assertFalse(prop.is_valid(1.0))
        self.assertFalse(prop.is_valid(1.0+1.0j))
        self.assertFalse(prop.is_valid(""))
        self.assertFalse(prop.is_valid(()))
        self.assertFalse(prop.is_valid([]))
        self.assertFalse(prop.is_valid({}))
        self.assertFalse(prop.is_valid(Foo()))

        self.assertTrue(prop.is_valid((1, "", [1, 2, 3])))
        self.assertFalse(prop.is_valid((1.0, "", [1, 2, 3])))
        self.assertFalse(prop.is_valid((1, True, [1, 2, 3])))
        self.assertFalse(prop.is_valid((1, "", (1, 2, 3))))
        self.assertFalse(prop.is_valid((1, "", [1, 2, "xyz"])))

    def test_Instance(self):
        with self.assertRaises(TypeError):
            prop = Instance()

        prop = Instance(Foo)

        self.assertTrue(prop.is_valid(None))
        self.assertFalse(prop.is_valid(False))
        self.assertFalse(prop.is_valid(True))
        self.assertFalse(prop.is_valid(0))
        self.assertFalse(prop.is_valid(1))
        self.assertFalse(prop.is_valid(0.0))
        self.assertFalse(prop.is_valid(1.0))
        self.assertFalse(prop.is_valid(1.0+1.0j))
        self.assertFalse(prop.is_valid(""))
        self.assertFalse(prop.is_valid(()))
        self.assertFalse(prop.is_valid([]))
        self.assertFalse(prop.is_valid({}))
        self.assertTrue(prop.is_valid(Foo()))

        self.assertFalse(prop.is_valid(Bar()))
        self.assertFalse(prop.is_valid(Baz()))

    def test_Instance_from_json(self):
        class MapOptions(HasProps):
            lat = Float
            lng = Float
            zoom = Int(12)

        v1 = Instance(MapOptions).from_json(dict(lat=1, lng=2))
        v2 = MapOptions(lat=1, lng=2)
        self.assertTrue(v1.equals(v2))

    def test_Interval(self):
        with self.assertRaises(TypeError):
            prop = Interval()

        with self.assertRaises(ValueError):
            prop = Interval(Int, 0.0, 1.0)

        prop = Interval(Int, 0, 255)

        self.assertTrue(prop.is_valid(None))
        # TODO: self.assertFalse(prop.is_valid(False))
        # TODO: self.assertFalse(prop.is_valid(True))
        self.assertTrue(prop.is_valid(0))
        self.assertTrue(prop.is_valid(1))
        self.assertFalse(prop.is_valid(0.0))
        self.assertFalse(prop.is_valid(1.0))
        self.assertFalse(prop.is_valid(1.0+1.0j))
        self.assertFalse(prop.is_valid(""))
        self.assertFalse(prop.is_valid(()))
        self.assertFalse(prop.is_valid([]))
        self.assertFalse(prop.is_valid({}))
        self.assertFalse(prop.is_valid(Foo()))

        self.assertTrue(prop.is_valid(127))
        self.assertFalse(prop.is_valid(-1))
        self.assertFalse(prop.is_valid(256))

        prop = Interval(Float, 0.0, 1.0)

        self.assertTrue(prop.is_valid(None))
        # TODO: self.assertFalse(prop.is_valid(False))
        # TODO: self.assertFalse(prop.is_valid(True))
        self.assertTrue(prop.is_valid(0))
        self.assertTrue(prop.is_valid(1))
        self.assertTrue(prop.is_valid(0.0))
        self.assertTrue(prop.is_valid(1.0))
        self.assertFalse(prop.is_valid(1.0+1.0j))
        self.assertFalse(prop.is_valid(""))
        self.assertFalse(prop.is_valid(()))
        self.assertFalse(prop.is_valid([]))
        self.assertFalse(prop.is_valid({}))
        self.assertFalse(prop.is_valid(Foo()))

        self.assertTrue(prop.is_valid(0.5))
        self.assertFalse(prop.is_valid(-0.001))
        self.assertFalse(prop.is_valid( 1.001))

    def test_Either(self):
        with self.assertRaises(TypeError):
            prop = Either()

        prop = Either(Interval(Int, 0, 100), Regex("^x*$"), List(Int))

        self.assertTrue(prop.is_valid(None))
        # TODO: self.assertFalse(prop.is_valid(False))
        # TODO: self.assertFalse(prop.is_valid(True))
        self.assertTrue(prop.is_valid(0))
        self.assertTrue(prop.is_valid(1))
        self.assertFalse(prop.is_valid(0.0))
        self.assertFalse(prop.is_valid(1.0))
        self.assertFalse(prop.is_valid(1.0+1.0j))
        self.assertTrue(prop.is_valid(""))
        self.assertFalse(prop.is_valid(()))
        self.assertTrue(prop.is_valid([]))
        self.assertFalse(prop.is_valid({}))
        self.assertFalse(prop.is_valid(Foo()))

        self.assertTrue(prop.is_valid(100))
        self.assertFalse(prop.is_valid(-100))
        self.assertTrue(prop.is_valid("xxx"))
        self.assertFalse(prop.is_valid("yyy"))
        self.assertTrue(prop.is_valid([1, 2, 3]))
        self.assertFalse(prop.is_valid([1, 2, ""]))

    def test_Enum(self):
        with self.assertRaises(TypeError):
            prop = Enum()

        with self.assertRaises(TypeError):
            prop = Enum("red", "green", 1)

        with self.assertRaises(TypeError):
            prop = Enum("red", "green", "red")

        prop = Enum("red", "green", "blue")

        self.assertTrue(prop.is_valid(None))
        self.assertFalse(prop.is_valid(False))
        self.assertFalse(prop.is_valid(True))
        self.assertFalse(prop.is_valid(0))
        self.assertFalse(prop.is_valid(1))
        self.assertFalse(prop.is_valid(0.0))
        self.assertFalse(prop.is_valid(1.0))
        self.assertFalse(prop.is_valid(1.0+1.0j))
        self.assertFalse(prop.is_valid(""))
        self.assertFalse(prop.is_valid(()))
        self.assertFalse(prop.is_valid([]))
        self.assertFalse(prop.is_valid({}))
        self.assertFalse(prop.is_valid(Foo()))

        self.assertTrue(prop.is_valid("red"))
        self.assertTrue(prop.is_valid("green"))
        self.assertTrue(prop.is_valid("blue"))

        self.assertFalse(prop.is_valid("RED"))
        self.assertFalse(prop.is_valid("GREEN"))
        self.assertFalse(prop.is_valid("BLUE"))

        self.assertFalse(prop.is_valid(" red"))
        self.assertFalse(prop.is_valid(" green"))
        self.assertFalse(prop.is_valid(" blue"))

        from bokeh.core.enums import LineJoin
        prop = Enum(LineJoin)

        self.assertTrue(prop.is_valid(None))
        self.assertFalse(prop.is_valid(False))
        self.assertFalse(prop.is_valid(True))
        self.assertFalse(prop.is_valid(0))
        self.assertFalse(prop.is_valid(1))
        self.assertFalse(prop.is_valid(0.0))
        self.assertFalse(prop.is_valid(1.0))
        self.assertFalse(prop.is_valid(1.0+1.0j))
        self.assertFalse(prop.is_valid(""))
        self.assertFalse(prop.is_valid(()))
        self.assertFalse(prop.is_valid([]))
        self.assertFalse(prop.is_valid({}))
        self.assertFalse(prop.is_valid(Foo()))

        self.assertTrue(prop.is_valid("miter"))
        self.assertTrue(prop.is_valid("round"))
        self.assertTrue(prop.is_valid("bevel"))

        self.assertFalse(prop.is_valid("MITER"))
        self.assertFalse(prop.is_valid("ROUND"))
        self.assertFalse(prop.is_valid("BEVEL"))

        self.assertFalse(prop.is_valid(" miter"))
        self.assertFalse(prop.is_valid(" round"))
        self.assertFalse(prop.is_valid(" bevel"))

        from bokeh.core.enums import NamedColor
        prop = Enum(NamedColor)

        self.assertTrue(prop.is_valid("red"))
        self.assertTrue(prop.is_valid("Red"))
        self.assertTrue(prop.is_valid("RED"))

    def test_Color(self):
        prop = Color()

        self.assertTrue(prop.is_valid(None))
        self.assertFalse(prop.is_valid(False))
        self.assertFalse(prop.is_valid(True))
        self.assertFalse(prop.is_valid(0))
        self.assertFalse(prop.is_valid(1))
        self.assertFalse(prop.is_valid(0.0))
        self.assertFalse(prop.is_valid(1.0))
        self.assertFalse(prop.is_valid(1.0+1.0j))
        self.assertFalse(prop.is_valid(""))
        self.assertFalse(prop.is_valid(()))
        self.assertFalse(prop.is_valid([]))
        self.assertFalse(prop.is_valid({}))
        self.assertFalse(prop.is_valid(Foo()))

        self.assertTrue(prop.is_valid((0, 127, 255)))
        self.assertFalse(prop.is_valid((0, -127, 255)))
        self.assertFalse(prop.is_valid((0, 127)))
        self.assertFalse(prop.is_valid((0, 127, 1.0)))
        self.assertFalse(prop.is_valid((0, 127, 255, 255)))
        self.assertTrue(prop.is_valid((0, 127, 255, 1.0)))

        self.assertTrue(prop.is_valid("#00aaff"))
        self.assertTrue(prop.is_valid("#00AAFF"))
        self.assertTrue(prop.is_valid("#00AaFf"))
        self.assertFalse(prop.is_valid("00aaff"))
        self.assertFalse(prop.is_valid("00AAFF"))
        self.assertFalse(prop.is_valid("00AaFf"))
        self.assertFalse(prop.is_valid("#00AaFg"))
        self.assertFalse(prop.is_valid("#00AaFff"))

        self.assertTrue(prop.is_valid("blue"))
        self.assertTrue(prop.is_valid("BLUE"))
        self.assertFalse(prop.is_valid("foobar"))

        self.assertEqual(prop.transform((0, 127, 255)), "rgb(0, 127, 255)")
        self.assertEqual(prop.transform((0, 127, 255, 0.1)), "rgba(0, 127, 255, 0.1)")

    def test_DashPattern(self):
        prop = DashPattern()

        self.assertTrue(prop.is_valid(None))
        self.assertFalse(prop.is_valid(False))
        self.assertFalse(prop.is_valid(True))
        self.assertFalse(prop.is_valid(0))
        self.assertFalse(prop.is_valid(1))
        self.assertFalse(prop.is_valid(0.0))
        self.assertFalse(prop.is_valid(1.0))
        self.assertFalse(prop.is_valid(1.0+1.0j))
        self.assertTrue(prop.is_valid(""))
        self.assertTrue(prop.is_valid(()))
        self.assertTrue(prop.is_valid([]))
        self.assertFalse(prop.is_valid({}))
        self.assertFalse(prop.is_valid(Foo()))

        self.assertTrue(prop.is_valid("solid"))
        self.assertTrue(prop.is_valid("dashed"))
        self.assertTrue(prop.is_valid("dotted"))
        self.assertTrue(prop.is_valid("dotdash"))
        self.assertTrue(prop.is_valid("dashdot"))
        self.assertFalse(prop.is_valid("DASHDOT"))

        self.assertTrue(prop.is_valid([1, 2, 3]))
        self.assertFalse(prop.is_valid([1, 2, 3.0]))

        self.assertTrue(prop.is_valid("1 2 3"))
        self.assertFalse(prop.is_valid("1 2 x"))

    def test_Size(self):
        prop = Size()

        self.assertTrue(prop.is_valid(None))
        # TODO: self.assertFalse(prop.is_valid(False))
        # TODO: self.assertFalse(prop.is_valid(True))
        self.assertTrue(prop.is_valid(0))
        self.assertTrue(prop.is_valid(1))
        self.assertTrue(prop.is_valid(0.0))
        self.assertTrue(prop.is_valid(1.0))
        self.assertFalse(prop.is_valid(1.0+1.0j))
        self.assertFalse(prop.is_valid(""))
        self.assertFalse(prop.is_valid(()))
        self.assertFalse(prop.is_valid([]))
        self.assertFalse(prop.is_valid({}))
        self.assertFalse(prop.is_valid(Foo()))

        self.assertTrue(prop.is_valid(100))
        self.assertTrue(prop.is_valid(100.1))
        self.assertFalse(prop.is_valid(-100))
        self.assertFalse(prop.is_valid(-0.001))

    def test_Percent(self):
        prop = Percent()

        self.assertTrue(prop.is_valid(None))
        # TODO: self.assertFalse(prop.is_valid(False))
        # TODO: self.assertFalse(prop.is_valid(True))
        self.assertTrue(prop.is_valid(0))
        self.assertTrue(prop.is_valid(1))
        self.assertTrue(prop.is_valid(0.0))
        self.assertTrue(prop.is_valid(1.0))
        self.assertFalse(prop.is_valid(1.0+1.0j))
        self.assertFalse(prop.is_valid(""))
        self.assertFalse(prop.is_valid(()))
        self.assertFalse(prop.is_valid([]))
        self.assertFalse(prop.is_valid({}))
        self.assertFalse(prop.is_valid(Foo()))

        self.assertTrue(prop.is_valid(0.5))
        self.assertFalse(prop.is_valid(-0.001))
        self.assertFalse(prop.is_valid( 1.001))

    def test_Angle(self):
        prop = Angle()

        self.assertTrue(prop.is_valid(None))
        # TODO: self.assertFalse(prop.is_valid(False))
        # TODO: self.assertFalse(prop.is_valid(True))
        self.assertTrue(prop.is_valid(0))
        self.assertTrue(prop.is_valid(1))
        self.assertTrue(prop.is_valid(0.0))
        self.assertTrue(prop.is_valid(1.0))
        self.assertFalse(prop.is_valid(1.0+1.0j))
        self.assertFalse(prop.is_valid(""))
        self.assertFalse(prop.is_valid(()))
        self.assertFalse(prop.is_valid([]))
        self.assertFalse(prop.is_valid({}))
        self.assertFalse(prop.is_valid(Foo()))

    def test_MinMaxBounds_with_no_datetime(self):
        prop = MinMaxBounds(accept_datetime=False)

        # Valid values
        self.assertTrue(prop.is_valid('auto'))
        self.assertTrue(prop.is_valid(None))
        self.assertTrue(prop.is_valid((12, 13)))
        self.assertTrue(prop.is_valid((-32, -13)))
        self.assertTrue(prop.is_valid((12.1, 13.1)))
        self.assertTrue(prop.is_valid((None, 13.1)))
        self.assertTrue(prop.is_valid((-22, None)))

        # Invalid values
        self.assertFalse(prop.is_valid('string'))
        self.assertFalse(prop.is_valid(12))
        self.assertFalse(prop.is_valid(('a', 'b')))
        self.assertFalse(prop.is_valid((13, 12)))
        self.assertFalse(prop.is_valid((13.1, 12.2)))
        self.assertFalse(prop.is_valid((datetime.date(2012, 10, 1), datetime.date(2012, 12, 2))))

    def test_MinMaxBounds_with_datetime(self):
        prop = MinMaxBounds(accept_datetime=True)

        # Valid values
        self.assertTrue(prop.is_valid((datetime.date(2012, 10, 1), datetime.date(2012, 12, 2))))

        # Invalid values
        self.assertFalse(prop.is_valid((datetime.date(2012, 10, 1), 22)))

def test_HasProps_equals():
    class Foo(HasProps):
        x = Int(12)
        y = String("hello")
        z = List(Int, [1,2,3])

    class FooUnrelated(HasProps):
        x = Int(12)
        y = String("hello")
        z = List(Int, [1,2,3])

    v = Foo().equals(Foo())
    assert v is True

    v = Foo(x=1).equals(Foo(x=1))
    assert v is True

    v = Foo(x=1).equals(Foo(x=2))
    assert v is False

    v = Foo(x=1).equals(1)
    assert v is False

    v = Foo().equals(FooUnrelated())
    assert v is False

def test_HasProps_clone():
    p1 = Plot(plot_width=1000)
    c1 = p1.properties_with_values(include_defaults=False)
    p2 = p1._clone()
    c2 = p2.properties_with_values(include_defaults=False)
    assert c1 == c2

def test_HasProps_pretty():
    class Foo1(HasProps):
        a = Int(12)
        b = String("hello")

    assert Foo1().pretty() == "bokeh.core.tests.test_properties.Foo1(a=12, b='hello')"

    class Foo2(HasProps):
        a = Int(12)
        b = String("hello")
        c = List(Int, [1, 2, 3])

    assert Foo2().pretty() == "bokeh.core.tests.test_properties.Foo2(a=12, b='hello', c=[1, 2, 3])"

    class Foo3(HasProps):
        a = Int(12)
        b = String("hello")
        c = List(Int, [1, 2, 3])
        d = Float(None)

    assert Foo3().pretty() == "bokeh.core.tests.test_properties.Foo3(a=12, b='hello', c=[1, 2, 3], d=None)"

    class Foo4(HasProps):
        a = Int(12)
        b = String("hello")
        c = List(Int, [1, 2, 3])
        d = Float(None)
        e = Instance(Foo1, lambda: Foo1())

    assert Foo4().pretty() == """\
bokeh.core.tests.test_properties.Foo4(
    a=12,
    b='hello',
    c=[1, 2, 3],
    d=None,
    e=bokeh.core.tests.test_properties.Foo1(a=12, b='hello'))"""

    class Foo5(HasProps):
        foo6 = Any            # can't use Instance(".core.tests.test_properties.Foo6")

    class Foo6(HasProps):
        foo5 = Instance(Foo5)

    f5 = Foo5()
    f6 = Foo6(foo5=f5)
    f5.foo6 = f6

    assert f5.pretty() == """\
bokeh.core.tests.test_properties.Foo5(
    foo6=bokeh.core.tests.test_properties.Foo6(
        foo5=bokeh.core.tests.test_properties.Foo5(...)))"""

def test_field_function():
    assert field("foo") == dict(field="foo")
    assert field("foo", "junk") == dict(field="foo", transform="junk")
    assert field("foo", transform="junk") == dict(field="foo", transform="junk")

def test_value_function():
    assert value("foo") == dict(value="foo")
    assert value("foo", "junk") == dict(value="foo", transform="junk")
    assert value("foo", transform="junk") == dict(value="foo", transform="junk")

def test_strict_dataspec_key_values():
    for typ in (NumberSpec, StringSpec, FontSizeSpec, ColorSpec, DataDistanceSpec, ScreenDistanceSpec):
        class Foo(HasProps):
            x = typ("x")
        f = Foo()
        with pytest.raises(ValueError):
            f.x = dict(field="foo", units="junk")

def test_dataspec_dict_to_serializable():
    for typ in (NumberSpec, StringSpec, FontSizeSpec, ColorSpec):
        class Foo(HasProps):
            x = typ("x")
        foo = Foo(x=dict(field='foo'))
        props = foo.properties_with_values(include_defaults=False)
        assert props['x']['field'] == 'foo'
        assert props['x'] is not foo.x

def test_DataDistanceSpec():
    assert issubclass(DataDistanceSpec, UnitsSpec)
    class Foo(HasProps):
        x = DataDistanceSpec("x")
    foo = Foo(x=dict(field='foo'))
    props = foo.properties_with_values(include_defaults=False)
    assert props['x']['units'] == 'data'
    assert props['x']['field'] == 'foo'
    assert props['x'] is not foo.x

def test_ScreenDistanceSpec():
    assert issubclass(ScreenDistanceSpec, UnitsSpec)
    class Foo(HasProps):
        x = ScreenDistanceSpec("x")
    foo = Foo(x=dict(field='foo'))
    props = foo.properties_with_values(include_defaults=False)
    assert props['x']['units'] == 'screen'
    assert props['x']['field'] == 'foo'
    assert props['x'] is not foo.x


def test_strict_unitspec_key_values():
    class FooUnits(HasProps):
        x = DistanceSpec("x")
    f = FooUnits()
    f.x = dict(field="foo", units="screen")
    with pytest.raises(ValueError):
        f.x = dict(field="foo", units="junk", foo="crap")
    class FooUnits(HasProps):
        x = AngleSpec("x")
    f = FooUnits()
    f.x = dict(field="foo", units="deg")
    with pytest.raises(ValueError):
        f.x = dict(field="foo", units="junk", foo="crap")

def test_Property_wrap():
    for x in (Bool, Int, Float, Complex, String, Enum, Color,
              Regex, Seq, Tuple, Instance, Any, Interval, Either,
              DashPattern, Size, Percent, Angle, MinMaxBounds):
        for y in (0, 1, 2.3, "foo", None, (), [], {}):
            r = x.wrap(y)
            assert r == y
            assert isinstance(r, type(y))

def test_List_wrap():
    for y in (0, 1, 2.3, "foo", None, (), {}):
        r = List.wrap(y)
        assert r == y
        assert isinstance(r, type(y))
    r = List.wrap([1,2,3])
    assert r == [1,2,3]
    assert isinstance(r, PropertyValueList)
    r2 = List.wrap(r)
    assert r is r2

def test_Dict_wrap():
    for y in (0, 1, 2.3, "foo", None, (), []):
        r = Dict.wrap(y)
        assert r == y
        assert isinstance(r, type(y))
    r = Dict.wrap(dict(a=1, b=2))
    assert r == dict(a=1, b=2)
    assert isinstance(r, PropertyValueDict)
    r2 = Dict.wrap(r)
    assert r is r2

def test_ColumnData_wrap():
    for y in (0, 1, 2.3, "foo", None, (), []):
        r = ColumnData.wrap(y)
        assert r == y
        assert isinstance(r, type(y))
    r = ColumnData.wrap(dict(a=1, b=2))
    assert r == dict(a=1, b=2)
    assert isinstance(r, PropertyValueColumnData)
    r2 = ColumnData.wrap(r)
    assert r is r2
