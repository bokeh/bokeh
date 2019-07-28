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

# External imports
import numpy as np

# Bokeh imports
from bokeh.core.has_props import HasProps
from bokeh.core.properties import Int, Float, String, List, Dict, Instance, Enum, NumberSpec, Override
from bokeh.models import Plot
from bokeh._testing.util.api import verify_all

# Module under test
import bokeh.core.properties as bcp

#-----------------------------------------------------------------------------
# Setup
#-----------------------------------------------------------------------------

ALL = (
    'Angle',
    'AngleSpec',
    'Any',
    'AnyRef',
    'Array',
    'Auto',
    'Bool',
    'Byte',
    'Color',
    'ColorHex',
    'ColorSpec',
    'ColumnData',
    'Complex',
    'DashPattern',
    'DataDistanceSpec',
    'DataSpec',
    'Date',
    'Datetime',
    'Dict',
    'DistanceSpec',
    'Either',
    'Enum',
    'Float',
    'FontSize',
    'FontSizeSpec',
    'HatchPatternSpec',
    'HatchPatternType',
    'Image',
    'Include',
    'Instance',
    'Int',
    'Interval',
    'JSON',
    'List',
    'MarkerSpec',
    'MarkerType',
    'MinMaxBounds',
    'NonNegativeInt',
    'NumberSpec',
    'Override',
    'PandasDataFrame',
    'PandasGroupBy',
    'Percent',
    'PositiveInt',
    'RGB',
    'Regex',
    'RelativeDelta',
    'ScreenDistanceSpec',
    'Seq',
    'Size',
    'String',
    'StringSpec',
    'Struct',
    'TimeDelta',
    'Tuple',
    'UnitsSpec',
    'expr',
    'field',
    'validate',
    'value',
    'without_property_validation'
)

#-----------------------------------------------------------------------------
# General API
#----------------------------------------------------------------------------

# TODO (bev) These tests should be moved to better places

class Basictest(object):

    def test_simple_class(self):
        class Foo(HasProps):
            x = Int(12)
            y = String("hello")
            z = List(Int, [1, 2, 3])
            zz = Dict(String, Int)
            s = String(None)

        f = Foo()
        assert f.x == 12
        assert f.y == "hello"
        assert np.array_equal(np.array([1, 2, 3]), f.z)
        assert f.s is None


        assert set(["x", "y", "z", "zz", "s"]) == f.properties()
        with_defaults = f.properties_with_values(include_defaults=True)
        assert dict(x=12, y="hello", z=[1,2,3], zz={}, s=None) == with_defaults
        without_defaults = f.properties_with_values(include_defaults=False)
        assert dict() == without_defaults

        f.x = 18
        assert f.x == 18

        f.y = "bar"
        assert f.y == "bar"

        without_defaults = f.properties_with_values(include_defaults=False)
        assert dict(x=18, y="bar") == without_defaults

        f.z[0] = 100

        without_defaults = f.properties_with_values(include_defaults=False)
        assert dict(x=18, y="bar", z=[100,2,3]) == without_defaults

        f.zz = {'a': 10}

        without_defaults = f.properties_with_values(include_defaults=False)
        assert dict(x=18, y="bar", z=[100,2,3], zz={'a': 10}) == without_defaults

    def test_enum(self):
        class Foo(HasProps):
            x = Enum("blue", "red", "green")     # the first item is the default
            y = Enum("small", "medium", "large", default="large")

        f = Foo()
        assert f.x == "blue"
        assert f.y == "large"

        f.x = "red"
        assert f.x == "red"

        with pytest.raises(ValueError):
            f.x = "yellow"

        f.y = "small"
        assert f.y == "small"

        with pytest.raises(ValueError):
            f.y = "yellow"

    def test_inheritance(self):
        class Base(HasProps):
            x = Int(12)
            y = String("hello")

        class Child(Base):
            z = Float(3.14)

        c = Child()
        assert frozenset(['x', 'y', 'z']) == frozenset(c.properties())
        assert c.y == "hello"

    def test_set(self):
        class Foo(HasProps):
            x = Int(12)
            y = Enum("red", "blue", "green")
            z = String("blah")

        f = Foo()
        assert f.x == 12
        assert f.y == "red"
        assert f.z == "blah"
        f.update(**dict(x=20, y="green", z="hello"))
        assert f.x == 20
        assert f.y == "green"
        assert f.z == "hello"
        with pytest.raises(ValueError):
            f.update(y="orange")

    def test_no_parens(self):
        class Foo(HasProps):
            x = Int
            y = Int()
        f = Foo()
        assert f.x == f.y
        f.x = 13
        assert f.x == 13

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
        assert set(["child"]) == b.properties_with_refs()
        assert set(["container"]) == b.properties_containers()
        assert set(["num", "container", "child"]) == b.properties()
        assert set(["num", "container", "child"]) == b.properties(with_bases=True)
        assert set(["num", "container", "child"]) == b.properties(with_bases=False)

        m = Mixin()
        assert set(["mixin_child"]) == m.properties_with_refs()
        assert set(["mixin_container"]) == m.properties_containers()
        assert set(["mixin_num", "mixin_container", "mixin_child"]) == m.properties()
        assert set(["mixin_num", "mixin_container", "mixin_child"]) == m.properties(with_bases=True)
        assert set(["mixin_num", "mixin_container", "mixin_child"]) == m.properties(with_bases=False)

        s = Sub()
        assert set(["child", "sub_child", "mixin_child"]) == s.properties_with_refs()
        assert set(["container", "sub_container", "mixin_container"]) == s.properties_containers()
        assert set(["num", "container", "child", "mixin_num", "mixin_container", "mixin_child", "sub_num", "sub_container", "sub_child"]) == s.properties()
        assert set(
            ["num", "container", "child", "mixin_num", "mixin_container", "mixin_child", "sub_num", "sub_container", "sub_child"]
        ) == s.properties(with_bases=True)
        assert set(["sub_num", "sub_container", "sub_child"]) == s.properties(with_bases=False)

        # verify caching
        assert s.properties_with_refs() is s.properties_with_refs()
        assert s.properties_containers() is s.properties_containers()
        assert s.properties() is s.properties()
        assert s.properties(with_bases=True) is s.properties(with_bases=True)
        # this one isn't cached because we store it as a list __properties__ and wrap it
        # in a new set every time
        #assert s.properties(with_bases=False) is s.properties(with_bases=False)

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

        assert set(["num"]) == base.dataspecs()
        assert set(["mixin_num"]) == mixin.dataspecs()
        assert set(["num", "mixin_num", "sub_num"]) == sub.dataspecs()

        assert dict(num=base.lookup("num")) ==  base.dataspecs_with_props()
        assert dict(mixin_num=mixin.lookup("mixin_num")) == mixin.dataspecs_with_props()
        assert dict(num=sub.lookup("num"), mixin_num=sub.lookup("mixin_num"), sub_num=sub.lookup("sub_num")) == sub.dataspecs_with_props()

    def test_not_serialized(self):
        class NotSerialized(HasProps):
            x = Int(12, serialized=False)
            y = String("hello")

        o = NotSerialized()
        assert o.x == 12
        assert o.y == 'hello'

        # non-serialized props are still in the list of props
        assert 'x' in o.properties()
        assert 'y' in o.properties()

        # but they aren't in the dict of props with values, since their
        # values are not important (already included in other values,
        # as with the _units properties)
        assert 'x' not in o.properties_with_values(include_defaults=True)
        assert 'y' in o.properties_with_values(include_defaults=True)
        assert 'x' not in o.properties_with_values(include_defaults=False)
        assert 'y' not in o.properties_with_values(include_defaults=False)

        o.x = 42
        o.y = 'world'

        assert 'x' not in o.properties_with_values(include_defaults=True)
        assert 'y' in o.properties_with_values(include_defaults=True)
        assert 'x' not in o.properties_with_values(include_defaults=False)
        assert 'y' in o.properties_with_values(include_defaults=False)

    def test_readonly(self):
        class Readonly(HasProps):
            x = Int(12, readonly=True)    # with default
            y = Int(readonly=True)        # without default
            z = String("hello")

        o = Readonly()
        assert o.x == 12
        assert o.y == None
        assert o.z == 'hello'

        # readonly props are still in the list of props
        assert 'x' in o.properties()
        assert 'y' in o.properties()
        assert 'z' in o.properties()

        # but they aren't in the dict of props with values
        assert 'x' not in o.properties_with_values(include_defaults=True)
        assert 'y' not in o.properties_with_values(include_defaults=True)
        assert 'z' in o.properties_with_values(include_defaults=True)
        assert 'x' not in o.properties_with_values(include_defaults=False)
        assert 'y' not in o.properties_with_values(include_defaults=False)
        assert 'z' not in o.properties_with_values(include_defaults=False)

        with pytest.raises(RuntimeError):
            o.x = 7
        with pytest.raises(RuntimeError):
            o.y = 7
        o.z = "xyz"

        assert o.x == 12
        assert o.y == None
        assert o.z == 'xyz'

    def test_include_defaults(self):
        class IncludeDefaultsTest(HasProps):
            x = Int(12)
            y = String("hello")

        o = IncludeDefaultsTest()
        assert o.x == 12
        assert o.y == 'hello'

        assert 'x' in o.properties_with_values(include_defaults=True)
        assert 'y' in o.properties_with_values(include_defaults=True)
        assert 'x' not in o.properties_with_values(include_defaults=False)
        assert 'y' not in o.properties_with_values(include_defaults=False)

        o.x = 42
        o.y = 'world'

        assert 'x' in o.properties_with_values(include_defaults=True)
        assert 'y' in o.properties_with_values(include_defaults=True)
        assert 'x' in o.properties_with_values(include_defaults=False)
        assert 'y' in o.properties_with_values(include_defaults=False)

    def test_include_defaults_with_kwargs(self):
        class IncludeDefaultsKwargsTest(HasProps):
            x = Int(12)
            y = String("hello")

        o = IncludeDefaultsKwargsTest(x=14, y="world")
        assert o.x == 14
        assert o.y == 'world'

        assert 'x' in o.properties_with_values(include_defaults=True)
        assert 'y' in o.properties_with_values(include_defaults=True)
        assert 'x' in o.properties_with_values(include_defaults=False)
        assert 'y' in o.properties_with_values(include_defaults=False)

    def test_include_defaults_set_to_same(self):
        class IncludeDefaultsSetToSameTest(HasProps):
            x = Int(12)
            y = String("hello")

        o = IncludeDefaultsSetToSameTest()

        assert 'x' in o.properties_with_values(include_defaults=True)
        assert 'y' in o.properties_with_values(include_defaults=True)
        assert 'x' not in o.properties_with_values(include_defaults=False)
        assert 'y' not in o.properties_with_values(include_defaults=False)

        # this should no-op
        o.x = 12
        o.y = "hello"

        assert 'x' in o.properties_with_values(include_defaults=True)
        assert 'y' in o.properties_with_values(include_defaults=True)
        assert 'x' not in o.properties_with_values(include_defaults=False)
        assert 'y' not in o.properties_with_values(include_defaults=False)

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

        assert f_base.x == 12
        assert f_sub.x == 14
        assert f_sub_sub.x == 16

        assert 12 == f_base.properties_with_values(include_defaults=True)['x']
        assert 14 == f_sub.properties_with_values(include_defaults=True)['x']
        assert 16 == f_sub_sub.properties_with_values(include_defaults=True)['x']

        assert 'x' not in f_base.properties_with_values(include_defaults=False)
        assert 'x' not in f_sub.properties_with_values(include_defaults=False)
        assert 'x' not in f_sub_sub.properties_with_values(include_defaults=False)

    # def test_kwargs_init(self):
    #     class Foo(HasProps):
    #         x = String
    #         y = Int
    #         z = Float
    #     f = Foo(x = "hello", y = 14)
    #     assert f.x == "hello"
    #     assert f.y == 14

    #     with pytest.raises(TypeError):
    #         # This should raise a TypeError: object.__init__() takes no parameters
    #         g = Foo(z = 3.14, q = "blah")

class Foo(HasProps):
    pass

class Bar(HasProps):
    pass

class Baz(HasProps):
    pass

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

#-----------------------------------------------------------------------------
# Dev API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Private API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Code
#-----------------------------------------------------------------------------

Test___all__ = verify_all(bcp, ALL)
