#-----------------------------------------------------------------------------
# Copyright (c) 2012 - 2022, Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Boilerplate
#-----------------------------------------------------------------------------
from __future__ import annotations # isort:skip

import pytest ; pytest

#-----------------------------------------------------------------------------
# Imports
#-----------------------------------------------------------------------------

# External imports
import numpy as np

# Bokeh imports
from bokeh._testing.util.api import verify_all
from bokeh.core.has_props import HasProps
from bokeh.core.properties import (
    Alias,
    Dict,
    Enum,
    Float,
    Instance,
    Int,
    List,
    NotSerialized,
    Nullable,
    NumberSpec,
    Override,
    Readonly,
    String,
)
from bokeh.models import Plot

# Module under test
import bokeh.core.properties as bcp # isort:skip

#-----------------------------------------------------------------------------
# Setup
#-----------------------------------------------------------------------------

ALL = (
    'Alias',
    'Alpha',
    'AlphaSpec',
    'Angle',
    'AngleSpec',
    'Any',
    'AnyRef',
    'Array',
    'Auto',
    'Bool',
    'Byte',
    'Bytes',
    'Color',
    'ColorHex',
    'ColorSpec',
    'ColumnData',
    'Complex',
    'DashPattern',
    'DataSpec',
    'Date',
    'Datetime',
    'Dict',
    'DistanceSpec',
    'Either',
    'Enum',
    'Factor',
    'FactorSeq',
    'Float',
    'FontSize',
    'FontSizeSpec',
    'HatchPatternSpec',
    'HatchPatternType',
    'Image',
    'Include',
    'Instance',
    'InstanceDefault',
    'Int',
    'Interval',
    'JSON',
    'List',
    'MarkerSpec',
    'MarkerType',
    'MathString',
    'MinMaxBounds',
    'NonEmpty',
    'NonNegative',
    'NonNegativeInt',
    'NonNullable',
    'NotSerialized',
    'Nothing',
    'Null',
    'NullStringSpec',
    'Nullable',
    'NumberSpec',
    'Override',
    'PandasDataFrame',
    'PandasGroupBy',
    'Percent',
    'Positive',
    'PositiveInt',
    'RGB',
    'Readonly',
    'Regex',
    'RelativeDelta',
    'Required',
    'RestrictedDict',
    'Seq',
    'Size',
    'SizeSpec',
    'String',
    'StringSpec',
    'Struct',
    'TimeDelta',
    'TextLike',
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


class TestBasic:
    def test_simple_class(self) -> None:
        class Foo(HasProps):
            x = Int(12)
            y = String("hello")
            z = List(Int, [1, 2, 3])
            zz = Dict(String, Int)
            s = Nullable(String(None))

        f = Foo()
        assert f.x == 12
        assert f.y == "hello"
        assert np.array_equal(np.array([1, 2, 3]), f.z)
        assert f.s is None


        assert {"x", "y", "z", "zz", "s"} == f.properties()
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

    def test_enum(self) -> None:
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

    def test_inheritance(self) -> None:
        class Base(HasProps):
            x = Int(12)
            y = String("hello")

        class Child(Base):
            z = Float(3.14)

        c = Child()
        assert frozenset(['x', 'y', 'z']) == frozenset(c.properties())
        assert c.y == "hello"

    def test_set(self) -> None:
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

    def test_accurate_properties_sets(self) -> None:
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

        class Deep(Sub):
            deep_num = Int(12)
            deep_container = List(String)
            deep_child = Instance(HasProps)

        b = Base()
        assert set(b.properties_with_refs()) == {"child"}
        assert b.properties() == {"num", "container", "child"}
        assert list(b.properties(_with_props=True).keys()) == ["num", "container", "child"]

        m = Mixin()
        assert set(m.properties_with_refs()) == {"mixin_child"}
        assert m.properties() == {"mixin_num", "mixin_container", "mixin_child"}
        assert list(m.properties(_with_props=True).keys()) == ["mixin_num", "mixin_container", "mixin_child"]

        s = Sub()
        assert set(s.properties_with_refs()) == {"child", "sub_child", "mixin_child"}
        assert s.properties() == {
            "num", "container", "child",
            "mixin_num", "mixin_container", "mixin_child",
            "sub_num", "sub_container", "sub_child",
        }
        assert list(s.properties(_with_props=True).keys()) == [
            "mixin_num", "mixin_container", "mixin_child", # XXX: it would be better if this was on the second line
            "num", "container", "child",
            "sub_num", "sub_container", "sub_child",
        ]

        d = Deep()
        assert set(d.properties_with_refs()) == {"child", "sub_child", "mixin_child", "deep_child"}
        assert d.properties() == {
            "num", "container", "child",
            "mixin_num", "mixin_container", "mixin_child",
            "sub_num", "sub_container", "sub_child",
            "deep_num", "deep_container", "deep_child",
        }
        assert list(d.properties(_with_props=True).keys()) == [
            "mixin_num", "mixin_container", "mixin_child", # XXX: it would be better if this was on the second line
            "num", "container", "child",
            "sub_num", "sub_container", "sub_child",
            "deep_num", "deep_container", "deep_child",
        ]

        # verify caching
        assert s.properties_with_refs() is s.properties_with_refs()
        assert s.properties() is s.properties()
        assert s.properties(_with_props=True) is s.properties(_with_props=True)

    def test_accurate_dataspecs(self) -> None:
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

        assert {"num"} == set(base.dataspecs())
        assert {"mixin_num"} == set(mixin.dataspecs())
        assert {"num", "mixin_num", "sub_num"} == set(sub.dataspecs())

    def test_not_serialized(self) -> None:
        class NotSerializedModel(HasProps):
            x = NotSerialized(Int(12))
            y = String("hello")

        o = NotSerializedModel()
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

    def test_readonly(self) -> None:
        class ReadonlyModel(HasProps):
            x = Readonly(Int(12))         # with default
            y = Readonly(Nullable(Int())) # without default
            z = String("hello")

        o = ReadonlyModel()
        assert o.x == 12
        assert o.y is None
        assert o.z == 'hello'

        # readonly props are still in the list of props
        assert 'x' in o.properties()
        assert 'y' in o.properties()
        assert 'z' in o.properties()

        assert 'x' in o.properties_with_values(include_defaults=True)
        assert 'y' in o.properties_with_values(include_defaults=True)
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
        assert o.y is None
        assert o.z == 'xyz'

    def test_include_defaults(self) -> None:
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

    def test_include_defaults_with_kwargs(self) -> None:
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

    def test_include_defaults_set_to_same(self) -> None:
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

    def test_override_defaults(self) -> None:
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
        assert 'x' in f_sub_sub.properties_with_values(include_defaults=False)

    # def test_kwargs_init(self) -> None:
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

def test_HasProps_equals() -> None:
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

def test_HasProps_clone() -> None:
    p1 = Plot(width=1000)
    c1 = p1.properties_with_values(include_defaults=False)
    p2 = p1._clone()
    c2 = p2.properties_with_values(include_defaults=False)
    assert c1 == c2

def test_Alias() -> None:
    class Foo(HasProps):
        x = Int(12)
        ax = Alias('x')

    f = Foo(x=10)
    assert f.x == 10
    assert f.ax == 10

    f.x = 20
    assert f.x == 20
    assert f.ax == 20

    f.ax = 30
    assert f.x == 30
    assert f.ax == 30

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
