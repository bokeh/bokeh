from __future__ import absolute_import

import datetime
import time
import numpy as np
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

from bokeh.util.testing import pd ; pd

SPECS = (NumberSpec, ColorSpec, AngleSpec, StringSpec, DistanceSpec, FontSizeSpec, DataDistanceSpec, ScreenDistanceSpec)

class TestValidateDetailDefault(object):

    def test_Angle(self):
        p = Angle()
        with pytest.raises(ValueError) as e:
            p.validate("junk")
        assert not str(e).endswith("ValueError")
    def test_Bool(self):
        p = Bool()
        with pytest.raises(ValueError) as e:
            p.validate("junk")
        assert not str(e).endswith("ValueError")
    def test_Complex(self):
        p = Complex()
        with pytest.raises(ValueError) as e:
            p.validate("junk")
        assert not str(e).endswith("ValueError")
    def test_Float(self):
        p = Float()
        with pytest.raises(ValueError) as e:
            p.validate("junk")
        assert not str(e).endswith("ValueError")
    def test_Int(self):
        p = Int()
        with pytest.raises(ValueError) as e:
            p.validate("junk")
        assert not str(e).endswith("ValueError")
    def test_Interval(self):
        p = Interval(Float, 0.0, 1.0)
        with pytest.raises(ValueError) as e:
            p.validate(2)
        assert not str(e).endswith("ValueError")
    def test_Percent(self):
        p = Percent()
        with pytest.raises(ValueError) as e:
            p.validate(10)
        assert not str(e).endswith("ValueError")
    def test_Size(self):
        p = Size()
        with pytest.raises(ValueError) as e:
            p.validate("junk")
        assert not str(e).endswith("ValueError")


    def test_List(self):
        p = List(Float)
        with pytest.raises(ValueError) as e:
            p.validate("junk")
        assert not str(e).endswith("ValueError")
    def test_Seq(self):
        p = Seq(Float)
        with pytest.raises(ValueError) as e:
            p.validate("junk")
        assert not str(e).endswith("ValueError")
    def test_Dict(self):
        p = Dict(String, Float)
        with pytest.raises(ValueError) as e:
            p.validate("junk")
        assert not str(e).endswith("ValueError")
    def test_Tuple(self):
        p = Tuple(Int, Int)
        with pytest.raises(ValueError) as e:
            p.validate("junk")
        assert not str(e).endswith("ValueError")


    def test_Color(self):
        p = Color()
        with pytest.raises(ValueError) as e:
            p.validate("junk")
        assert not str(e).endswith("ValueError")
    def test_ColumnData(self):
        p = ColumnData(String, Seq(Float))
        with pytest.raises(ValueError) as e:
            p.validate("junk")
        assert not str(e).endswith("ValueError")
    def test_Date(self):
        p = Date()
        with pytest.raises(ValueError) as e:
            p.validate(p)
        assert not str(e).endswith("ValueError")
    def test_DashPattern(self):
        p = DashPattern()
        with pytest.raises(ValueError) as e:
            p.validate("junk")
        assert not str(e).endswith("ValueError")
    def test_Either(self):
        p = Either(Int, Float)
        with pytest.raises(ValueError) as e:
            p.validate("junk")
        assert not str(e).endswith("ValueError")
    def test_Enum(self):
        p = Enum("red", "green")
        with pytest.raises(ValueError) as e:
            p.validate("junk")
        assert not str(e).endswith("ValueError")
    def test_FontSize(self):
        p = FontSize()
        with pytest.raises(ValueError) as e:
            p.validate("junk")
        assert not str(e).endswith("ValueError")
    def test_Instance(self):
        p = Instance(HasProps)
        with pytest.raises(ValueError) as e:
            p.validate("junk")
        assert not str(e).endswith("ValueError")
    def test_MinMaxBounds(self):
        p = MinMaxBounds()
        with pytest.raises(ValueError) as e:
            p.validate(10)
        assert not str(e).endswith("ValueError")
    def test_Regex(self):
        p = Regex("green")
        with pytest.raises(ValueError) as e:
            p.validate("junk")
        assert not str(e).endswith("ValueError")
    def test_String(self):
        p = String()
        with pytest.raises(ValueError) as e:
            p.validate(10)
        assert not str(e).endswith("ValueError")


    @pytest.mark.parametrize('spec', SPECS)
    def test_Spec(self, spec):
        p = spec(default=None)
        with pytest.raises(ValueError) as e:
            p.validate(dict(bad="junk"))
        assert not str(e).endswith("ValueError")


@pytest.mark.parametrize('detail', [True, False])
class TestValidateDetailExplicit(object):

    def test_Angle(self, detail):
        p = Angle()
        with pytest.raises(ValueError) as e:
            p.validate("junk", detail)
        assert str(e).endswith("ValueError") == (not detail)
    def test_Bool(self, detail):
        p = Bool()
        with pytest.raises(ValueError) as e:
            p.validate("junk", detail)
        assert str(e).endswith("ValueError") == (not detail)
    def test_Complex(self, detail):
        p = Complex()
        with pytest.raises(ValueError) as e:
            p.validate("junk", detail)
        assert str(e).endswith("ValueError") == (not detail)
    def test_Float(self, detail):
        p = Float()
        with pytest.raises(ValueError) as e:
            p.validate("junk", detail)
        assert str(e).endswith("ValueError") == (not detail)
    def test_Int(self, detail):
        p = Int()
        with pytest.raises(ValueError) as e:
            p.validate("junk", detail)
        assert str(e).endswith("ValueError") == (not detail)
    def test_Interval(self, detail):
        p = Interval(Float, 0.0, 1.0)
        with pytest.raises(ValueError) as e:
            p.validate(2, detail)
        assert str(e).endswith("ValueError") == (not detail)
    def test_Percent(self, detail):
        p = Percent()
        with pytest.raises(ValueError) as e:
            p.validate(10, detail)
        assert str(e).endswith("ValueError") == (not detail)
    def test_Size(self, detail):
        p = Size()
        with pytest.raises(ValueError) as e:
            p.validate("junk", detail)
        assert str(e).endswith("ValueError") == (not detail)




    def test_List(self, detail):
        p = List(Float)
        with pytest.raises(ValueError) as e:
            p.validate("junk", detail)
        assert str(e).endswith("ValueError") == (not detail)
    def test_Seq(self, detail):
        p = Seq(Float)
        with pytest.raises(ValueError) as e:
            p.validate("junk", detail)
        assert str(e).endswith("ValueError") == (not detail)
    def test_Dict(self, detail):
        p = Dict(String, Float)
        with pytest.raises(ValueError) as e:
            p.validate("junk", detail)
        assert str(e).endswith("ValueError") == (not detail)
    def test_Tuple(self, detail):
        p = Tuple(Int, Int)
        with pytest.raises(ValueError) as e:
            p.validate("junk", detail)
        assert str(e).endswith("ValueError") == (not detail)




    def test_Color(self, detail):
        p = Color()
        with pytest.raises(ValueError) as e:
            p.validate("junk", detail)
        assert str(e).endswith("ValueError") == (not detail)
    def test_ColumnData(self, detail):
        p = ColumnData(String, Seq(Float))
        with pytest.raises(ValueError) as e:
            p.validate("junk", detail)
        assert str(e).endswith("ValueError") == (not detail)
    def test_Date(self, detail):
        p = Date()
        with pytest.raises(ValueError) as e:
            p.validate(p, detail)
        assert str(e).endswith("ValueError") == (not detail)
    def test_DashPattern(self, detail):
        p = DashPattern()
        with pytest.raises(ValueError) as e:
            p.validate("junk", detail)
        assert str(e).endswith("ValueError") == (not detail)
    def test_Either(self, detail):
        p = Either(Int, Float)
        with pytest.raises(ValueError) as e:
            p.validate("junk", detail)
        assert str(e).endswith("ValueError") == (not detail)
    def test_Enum(self, detail):
        p = Enum("red", "green")
        with pytest.raises(ValueError) as e:
            p.validate("junk", detail)
        assert str(e).endswith("ValueError") == (not detail)
    def test_FontSize(self, detail):
        p = FontSize()
        with pytest.raises(ValueError) as e:
            p.validate("junk", detail)
        assert str(e).endswith("ValueError") == (not detail)
    def test_Instance(self, detail):
        p = Instance(HasProps)
        with pytest.raises(ValueError) as e:
            p.validate("junk", detail)
        assert str(e).endswith("ValueError") == (not detail)
    def test_MinMaxBounds(self, detail):
        p = MinMaxBounds()
        with pytest.raises(ValueError) as e:
            p.validate(10, detail)
        assert str(e).endswith("ValueError") == (not detail)
    def test_Regex(self, detail):
        p = Regex("green")
        with pytest.raises(ValueError) as e:
            p.validate("junk", detail)
        assert str(e).endswith("ValueError") == (not detail)
    def test_String(self, detail):
        p = String()
        with pytest.raises(ValueError) as e:
            p.validate(10, detail)
        assert str(e).endswith("ValueError") == (not detail)



    @pytest.mark.parametrize('spec', SPECS)
    def test_Spec(self, detail, spec):
        p = spec(default=None)
        with pytest.raises(ValueError) as e:
            p.validate(dict(bad="junk"), detail)
        assert str(e).endswith("ValueError") == (not detail)



class Test_Date(object):
    def test_validate_seconds(self):
        t = time.time()
        d = Date()
        assert d.transform(t) == datetime.date.today()

    def test_validate_milliseconds(self):
        t = time.time() * 1000
        d = Date()
        assert d.transform(t) == datetime.date.today()

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
        assert o.x == 12
        assert o.y == 42
        assert not hasattr(o, 'z')

        assert 'x' in o.properties_with_values(include_defaults=True)
        assert 'y' in o.properties_with_values(include_defaults=True)
        assert 'x' not in o.properties_with_values(include_defaults=False)
        assert 'y' not in o.properties_with_values(include_defaults=False)

        o = IncludesDelegateWithoutPrefixUsingOverride()
        assert o.x == 12
        assert o.y == 'world'
        assert not hasattr(o, 'z')

        assert 'x' in o.properties_with_values(include_defaults=True)
        assert 'y' in o.properties_with_values(include_defaults=True)
        assert 'x' not in o.properties_with_values(include_defaults=False)
        assert 'y' not in o.properties_with_values(include_defaults=False)

        o2 = IncludesDelegateWithPrefix()
        assert o2.z_x == 12
        assert o2.z_y == 57
        assert not hasattr(o2, 'z')
        assert not hasattr(o2, 'x')
        assert not hasattr(o2, 'y')

        assert 'z' not in o2.properties_with_values(include_defaults=True)
        assert 'x' not in o2.properties_with_values(include_defaults=True)
        assert 'y' not in o2.properties_with_values(include_defaults=True)
        assert 'z_x' in o2.properties_with_values(include_defaults=True)
        assert 'z_y' in o2.properties_with_values(include_defaults=True)
        assert 'z_x' not in o2.properties_with_values(include_defaults=False)
        assert 'z_y' not in o2.properties_with_values(include_defaults=False)

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

class TestNumberSpec(object):

    def test_field(self):
        class Foo(HasProps):
            x = NumberSpec("xfield")
        f = Foo()
        assert f.x == "xfield"
        assert Foo.__dict__["x"].serializable_value(f) == {"field": "xfield"}
        f.x = "my_x"
        assert f.x == "my_x"
        assert Foo.__dict__["x"].serializable_value(f) == {"field": "my_x"}

    def test_value(self):
        class Foo(HasProps):
            x = NumberSpec("xfield")
        f = Foo()
        assert f.x, "xfield"
        f.x = 12
        assert f.x == 12
        assert Foo.__dict__["x"].serializable_value(f) == {"value": 12}
        f.x = 15
        assert f.x == 15
        assert Foo.__dict__["x"].serializable_value(f) == {"value": 15}
        f.x = dict(value=32)
        assert Foo.__dict__["x"].serializable_value(f) == {"value": 32}
        f.x = None
        assert Foo.__dict__["x"].serializable_value(f) is None

    def tests_accepts_timedelta(self):
        class Foo(HasProps):
            dt = NumberSpec("dt", accept_datetime=True)
            ndt = NumberSpec("ndt", accept_datetime=False)

        f = Foo()

        f.dt = datetime.timedelta(3, 54)
        assert f.dt == 259254000.0

        # counts as number.Real out of the box
        f.dt = np.timedelta64(3000, "ms")
        assert f.dt == np.timedelta64(3000, "ms")

        f.ndt = datetime.timedelta(3, 54)
        assert f.ndt == 259254000.0

        # counts as number.Real out of the box
        f.ndt = np.timedelta64(3000, "ms")
        assert f.ndt == np.timedelta64(3000, "ms")


    def tests_accepts_timedelta_with_pandas(self, pd):
        class Foo(HasProps):
            dt = NumberSpec("dt", accept_datetime=True)
            ndt = NumberSpec("ndt", accept_datetime=False)

        f = Foo()

        # counts as number.Real out of the box
        f.dt = pd.Timedelta("3000ms")
        assert f.dt == 3000.0

        f.ndt = pd.Timedelta("3000ms")
        assert f.ndt == 3000.0

    def test_accepts_datetime(self):
        class Foo(HasProps):
            dt = NumberSpec("dt", accept_datetime=True)
            ndt = NumberSpec("ndt", accept_datetime=False)

        f = Foo()

        f.dt = datetime.datetime(2016, 5, 11)
        assert f.dt == 1462924800000.0

        f.dt = datetime.date(2016, 5, 11)
        assert f.dt == 1462924800000.0

        f.dt = np.datetime64("2016-05-11")
        assert f.dt == 1462924800000.0


        with pytest.raises(ValueError):
            f.ndt = datetime.datetime(2016, 5, 11)

        with pytest.raises(ValueError):
            f.ndt = datetime.date(2016, 5, 11)

        with pytest.raises(ValueError):
            f.ndt = np.datetime64("2016-05-11")

    def test_default(self):
        class Foo(HasProps):
            y = NumberSpec(default=12)
        f = Foo()
        assert f.y == 12
        assert Foo.__dict__["y"].serializable_value(f) == {"value": 12}
        f.y = "y1"
        assert f.y == "y1"
        # Once we set a concrete value, the default is ignored, because it is unused
        f.y = 32
        assert f.y == 32
        assert Foo.__dict__["y"].serializable_value(f) == {"value": 32}

    def test_multiple_instances(self):
        class Foo(HasProps):
            x = NumberSpec("xfield")

        a = Foo()
        b = Foo()
        a.x = 13
        b.x = 14
        assert a.x == 13
        assert b.x == 14
        assert Foo.__dict__["x"].serializable_value(a) == {"value": 13}
        assert Foo.__dict__["x"].serializable_value(b) == {"value": 14}
        b.x = {"field": "x3"}
        assert Foo.__dict__["x"].serializable_value(a) == {"value": 13}
        assert Foo.__dict__["x"].serializable_value(b) == {"field": "x3"}

    def test_autocreate_no_parens(self):
        class Foo(HasProps):
            x = NumberSpec

        a = Foo()

        assert a.x is None
        a.x = 14
        assert a.x == 14

    def test_set_from_json_keeps_mode(self):
        class Foo(HasProps):
            x = NumberSpec(default=None)

        a = Foo()

        assert a.x is None

        # set as a value
        a.x = 14
        assert a.x == 14
        # set_from_json keeps the previous dict-ness or lack thereof
        a.set_from_json('x', dict(value=16))
        assert a.x == 16
        # but regular assignment overwrites the previous dict-ness
        a.x = dict(value=17)
        assert a.x == dict(value=17)

        # set as a field
        a.x = "bar"
        assert a.x == "bar"
        # set_from_json keeps the previous dict-ness or lack thereof
        a.set_from_json('x', dict(field="foo"))
        assert a.x == "foo"
        # but regular assignment overwrites the previous dict-ness
        a.x = dict(field="baz")
        assert a.x == dict(field="baz")

class TestFontSizeSpec(object):
    def test_font_size_from_string(self):
        class Foo(HasProps):
            x = FontSizeSpec(default=None)

        css_units = "%|em|ex|ch|ic|rem|vw|vh|vi|vb|vmin|vmax|cm|mm|q|in|pc|pt|px"

        a = Foo()
        assert a.x is None

        for unit in css_units.split("|"):

            v = '10%s' % unit
            a.x = v
            assert a.x == v
            assert a.lookup('x').serializable_value(a) == dict(value=v)

            v = '10.2%s' % unit
            a.x = v
            assert a.x == v
            assert a.lookup('x').serializable_value(a) == dict(value=v)

            f = '_10%s' % unit
            a.x = f
            assert a.x == f
            assert a.lookup('x').serializable_value(a) == dict(field=f)

            f = '_10.2%s' % unit
            a.x = f
            assert a.x == f
            assert a.lookup('x').serializable_value(a) == dict(field=f)

        for unit in css_units.upper().split("|"):
            v = '10%s' % unit
            a.x = v
            assert a.x == v
            assert a.lookup('x').serializable_value(a) == dict(value=v)

            v = '10.2%s' % unit
            a.x = v
            assert a.x == v
            assert a.lookup('x').serializable_value(a) == dict(value=v)

            f = '_10%s' % unit
            a.x = f
            assert a.x == f
            assert a.lookup('x').serializable_value(a) == dict(field=f)

            f = '_10.2%s' % unit
            a.x = f
            assert a.x == f
            assert a.lookup('x').serializable_value(a) == dict(field=f)

    def test_bad_font_size_values(self):
        class Foo(HasProps):
            x = FontSizeSpec(default=None)

        a = Foo()

        with pytest.raises(ValueError):
            a.x = "6"

        with pytest.raises(ValueError):
            a.x = 6

        with pytest.raises(ValueError):
            a.x = ""

    def test_fields(self):
        class Foo(HasProps):
            x = FontSizeSpec(default=None)

        a = Foo()

        a.x = "_120"
        assert a.x == "_120"

        a.x = dict(field="_120")
        assert a.x == dict(field="_120")

        a.x = "foo"
        assert a.x == "foo"

        a.x = dict(field="foo")
        assert a.x == dict(field="foo")

class TestAngleSpec(object):
    def test_default_none(self):
        class Foo(HasProps):
            x = AngleSpec(None)

        a = Foo()

        assert a.x is None
        assert a.x_units == 'rad'
        a.x = 14
        assert a.x == 14
        assert a.x_units == 'rad'

    def test_autocreate_no_parens(self):
        class Foo(HasProps):
            x = AngleSpec

        a = Foo()

        assert a.x is None
        assert a.x_units == 'rad'
        a.x = 14
        assert a.x == 14
        assert a.x_units == 'rad'

    def test_default_value(self):
        class Foo(HasProps):
            x = AngleSpec(default=14)

        a = Foo()

        assert a.x == 14
        assert a.x_units == 'rad'

    def test_setting_dict_sets_units(self):
        class Foo(HasProps):
            x = AngleSpec(default=14)

        a = Foo()

        assert a.x == 14
        assert a.x_units == 'rad'

        a.x = { 'value' : 180, 'units' : 'deg' }
        assert a.x == { 'value' : 180 }
        assert a.x_units == 'deg'

    def test_setting_json_sets_units_keeps_dictness(self):
        class Foo(HasProps):
            x = AngleSpec(default=14)

        a = Foo()

        assert a.x == 14
        assert a.x_units == 'rad'

        a.set_from_json('x', { 'value' : 180, 'units' : 'deg' })
        assert a.x == 180
        assert a.x_units == 'deg'

    def test_setting_dict_does_not_modify_original_dict(self):
        class Foo(HasProps):
            x = AngleSpec(default=14)

        a = Foo()

        assert a.x == 14
        assert a.x_units == 'rad'

        new_value = { 'value' : 180, 'units' : 'deg' }
        new_value_copy = copy(new_value)
        assert new_value_copy == new_value

        a.x = new_value
        assert a.x == { 'value' : 180 }
        assert a.x_units == 'deg'

        assert new_value_copy == new_value

class TestDistanceSpec(object):
    def test_default_none(self):
        class Foo(HasProps):
            x = DistanceSpec(None)

        a = Foo()

        assert a.x is None
        assert a.x_units == 'data'
        a.x = 14
        assert a.x == 14
        assert a.x_units == 'data'

    def test_autocreate_no_parens(self):
        class Foo(HasProps):
            x = DistanceSpec

        a = Foo()

        assert a.x is None
        assert a.x_units == 'data'
        a.x = 14
        assert a.x == 14
        assert a.x_units == 'data'

    def test_default_value(self):
        class Foo(HasProps):
            x = DistanceSpec(default=14)

        a = Foo()

        assert a.x == 14
        assert a.x_units == 'data'

class TestColorSpec(object):

    def test_field(self):
        class Foo(HasProps):
            col = ColorSpec("colorfield")
        desc = Foo.__dict__["col"]
        f = Foo()
        assert f.col == "colorfield"
        assert desc.serializable_value(f) == {"field": "colorfield"}
        f.col = "myfield"
        assert f.col == "myfield"
        assert desc.serializable_value(f) == {"field": "myfield"}

    def test_field_default(self):
        class Foo(HasProps):
            col = ColorSpec(default="red")
        desc = Foo.__dict__["col"]
        f = Foo()
        assert f.col == "red"
        assert desc.serializable_value(f) == {"value": "red"}
        f.col = "myfield"
        assert f.col == "myfield"
        assert desc.serializable_value(f) == {"field": "myfield"}

    def test_default_tuple(self):
        class Foo(HasProps):
            col = ColorSpec(default=(128, 255, 124))
        desc = Foo.__dict__["col"]
        f = Foo()
        assert f.col == (128, 255, 124)
        assert desc.serializable_value(f) == {"value": "rgb(128, 255, 124)"}

    def test_fixed_value(self):
        class Foo(HasProps):
            col = ColorSpec("gray")
        desc = Foo.__dict__["col"]
        f = Foo()
        assert f.col == "gray"
        assert desc.serializable_value(f) == {"value": "gray"}

    def test_named_value(self):
        class Foo(HasProps):
            col = ColorSpec("colorfield")
        desc = Foo.__dict__["col"]
        f = Foo()

        f.col = "red"
        assert f.col == "red"
        assert desc.serializable_value(f) == {"value": "red"}
        f.col = "forestgreen"
        assert f.col == "forestgreen"
        assert desc.serializable_value(f) == {"value": "forestgreen"}

    def test_case_insensitive_named_value(self):
        class Foo(HasProps):
            col = ColorSpec("colorfield")
        desc = Foo.__dict__["col"]
        f = Foo()

        f.col = "RED"
        assert f.col == "RED"
        assert desc.serializable_value(f) == {"value": "RED"}
        f.col = "ForestGreen"
        assert f.col == "ForestGreen"
        assert desc.serializable_value(f) == {"value": "ForestGreen"}

    def test_named_value_set_none(self):
        class Foo(HasProps):
            col = ColorSpec("colorfield")
        desc = Foo.__dict__["col"]
        f = Foo()
        f.col = None
        assert desc.serializable_value(f) == {"value": None}

    def test_named_value_unset(self):
        class Foo(HasProps):
            col = ColorSpec("colorfield")
        desc = Foo.__dict__["col"]
        f = Foo()
        assert desc.serializable_value(f) == {"field": "colorfield"}

    def test_named_color_overriding_default(self):
        class Foo(HasProps):
            col = ColorSpec("colorfield")
        desc = Foo.__dict__["col"]
        f = Foo()
        f.col = "forestgreen"
        assert f.col == "forestgreen"
        assert desc.serializable_value(f) == {"value": "forestgreen"}
        f.col = "myfield"
        assert f.col == "myfield"
        assert desc.serializable_value(f) == {"field": "myfield"}

    def test_hex_value(self):
        class Foo(HasProps):
            col = ColorSpec("colorfield")
        desc = Foo.__dict__["col"]
        f = Foo()
        f.col = "#FF004A"
        assert f.col == "#FF004A"
        assert desc.serializable_value(f) == {"value": "#FF004A"}
        f.col = "myfield"
        assert f.col == "myfield"
        assert desc.serializable_value(f) == {"field": "myfield"}

    def test_tuple_value(self):
        class Foo(HasProps):
            col = ColorSpec("colorfield")
        desc = Foo.__dict__["col"]
        f = Foo()
        f.col = (128, 200, 255)
        assert f.col == (128, 200, 255)
        assert desc.serializable_value(f) == {"value": "rgb(128, 200, 255)"}
        f.col = "myfield"
        assert f.col == "myfield"
        assert desc.serializable_value(f) == {"field": "myfield"}
        f.col = (100, 150, 200, 0.5)
        assert f.col == (100, 150, 200, 0.5)
        assert desc.serializable_value(f) == {"value": "rgba(100, 150, 200, 0.5)"}

    def test_set_dict(self):
        class Foo(HasProps):
            col = ColorSpec("colorfield")
        desc = Foo.__dict__["col"]
        f = Foo()
        f.col = {"field": "myfield"}
        assert f.col == {"field": "myfield"}

        f.col = "field2"
        assert f.col == "field2"
        assert desc.serializable_value(f) == {"field": "field2"}

class TestDashPattern(object):

    def test_named(self):
        class Foo(HasProps):
            pat = DashPattern
        f = Foo()

        assert f.pat == []
        f.pat = "solid"
        assert f.pat == []
        f.pat = "dashed"
        assert f.pat == [6]
        f.pat = "dotted"
        assert f.pat == [2, 4]
        f.pat = "dotdash"
        assert f.pat == [2, 4, 6, 4]
        f.pat = "dashdot"
        assert f.pat == [6, 4, 2, 4]

    def test_string(self):
        class Foo(HasProps):
            pat = DashPattern
        f = Foo()

        f.pat = ""
        assert f.pat == []
        f.pat = "2"
        assert f.pat == [2]
        f.pat = "2 4"
        assert f.pat == [2, 4]
        f.pat = "2 4 6"
        assert f.pat == [2, 4, 6]

        with pytest.raises(ValueError):
            f.pat = "abc 6"

    def test_list(self):
        class Foo(HasProps):
            pat = DashPattern
        f = Foo()

        f.pat = ()
        assert f.pat == ()
        f.pat = (2,)
        assert f.pat == (2,)
        f.pat = (2, 4)
        assert f.pat == (2, 4)
        f.pat = (2, 4, 6)
        assert f.pat == (2, 4, 6)

        with pytest.raises(ValueError):
            f.pat = (2, 4.2)
        with pytest.raises(ValueError):
            f.pat = (2, "a")

    def test_invalid(self):
        class Foo(HasProps):
            pat = DashPattern
        f = Foo()

        with pytest.raises(ValueError):
            f.pat = 10
        with pytest.raises(ValueError):
            f.pat = 10.1
        with pytest.raises(ValueError):
            f.pat = {}


class Foo(HasProps):
    pass

class Bar(HasProps):
    pass

class Baz(HasProps):
    pass

class TestProperties(object):

    def test_Any(self):
        prop = Any()

        assert prop.is_valid(None)
        assert prop.is_valid(False)
        assert prop.is_valid(True)
        assert prop.is_valid(0)
        assert prop.is_valid(1)
        assert prop.is_valid(0.0)
        assert prop.is_valid(1.0)
        assert prop.is_valid(1.0+1.0j)
        assert prop.is_valid("")
        assert prop.is_valid(())
        assert prop.is_valid([])
        assert prop.is_valid({})
        assert prop.is_valid(Foo())

    def test_Bool(self):
        prop = Bool()

        assert prop.is_valid(None)
        assert prop.is_valid(False)
        assert prop.is_valid(True)
        assert not prop.is_valid(0)
        assert not prop.is_valid(1)
        assert not prop.is_valid(0.0)
        assert not prop.is_valid(1.0)
        assert not prop.is_valid(1.0+1.0j)
        assert not prop.is_valid("")
        assert not prop.is_valid(())
        assert not prop.is_valid([])
        assert not prop.is_valid({})
        assert not prop.is_valid(Foo())

        assert prop.is_valid(np.bool8(False))
        assert prop.is_valid(np.bool8(True))
        assert not prop.is_valid(np.int8(0))
        assert not prop.is_valid(np.int8(1))
        assert not prop.is_valid(np.int16(0))
        assert not prop.is_valid(np.int16(1))
        assert not prop.is_valid(np.int32(0))
        assert not prop.is_valid(np.int32(1))
        assert not prop.is_valid(np.int64(0))
        assert not prop.is_valid(np.int64(1))
        assert not prop.is_valid(np.uint8(0))
        assert not prop.is_valid(np.uint8(1))
        assert not prop.is_valid(np.uint16(0))
        assert not prop.is_valid(np.uint16(1))
        assert not prop.is_valid(np.uint32(0))
        assert not prop.is_valid(np.uint32(1))
        assert not prop.is_valid(np.uint64(0))
        assert not prop.is_valid(np.uint64(1))
        assert not prop.is_valid(np.float16(0))
        assert not prop.is_valid(np.float16(1))
        assert not prop.is_valid(np.float32(0))
        assert not prop.is_valid(np.float32(1))
        assert not prop.is_valid(np.float64(0))
        assert not prop.is_valid(np.float64(1))
        assert not prop.is_valid(np.complex64(1.0+1.0j))
        assert not prop.is_valid(np.complex128(1.0+1.0j))
        if hasattr(np, "complex256"):
            assert not prop.is_valid(np.complex256(1.0+1.0j))

    def test_Int(self):
        prop = Int()

        assert prop.is_valid(None)
        # TODO: assert not prop.is_valid(False)
        # TODO: assert not prop.is_valid(True)
        assert prop.is_valid(0)
        assert prop.is_valid(1)
        assert not prop.is_valid(0.0)
        assert not prop.is_valid(1.0)
        assert not prop.is_valid(1.0+1.0j)
        assert not prop.is_valid("")
        assert not prop.is_valid(())
        assert not prop.is_valid([])
        assert not prop.is_valid({})
        assert not prop.is_valid(Foo())

        # TODO: assert not prop.is_valid(np.bool8(False))
        # TODO: assert not prop.is_valid(np.bool8(True))
        assert prop.is_valid(np.int8(0))
        assert prop.is_valid(np.int8(1))
        assert prop.is_valid(np.int16(0))
        assert prop.is_valid(np.int16(1))
        assert prop.is_valid(np.int32(0))
        assert prop.is_valid(np.int32(1))
        assert prop.is_valid(np.int64(0))
        assert prop.is_valid(np.int64(1))
        assert prop.is_valid(np.uint8(0))
        assert prop.is_valid(np.uint8(1))
        assert prop.is_valid(np.uint16(0))
        assert prop.is_valid(np.uint16(1))
        assert prop.is_valid(np.uint32(0))
        assert prop.is_valid(np.uint32(1))
        assert prop.is_valid(np.uint64(0))
        assert prop.is_valid(np.uint64(1))
        assert not prop.is_valid(np.float16(0))
        assert not prop.is_valid(np.float16(1))
        assert not prop.is_valid(np.float32(0))
        assert not prop.is_valid(np.float32(1))
        assert not prop.is_valid(np.float64(0))
        assert not prop.is_valid(np.float64(1))
        assert not prop.is_valid(np.complex64(1.0+1.0j))
        assert not prop.is_valid(np.complex128(1.0+1.0j))
        if hasattr(np, "complex256"):
            assert not prop.is_valid(np.complex256(1.0+1.0j))

    def test_Float(self):
        prop = Float()

        assert prop.is_valid(None)
        # TODO: assert not prop.is_valid(False)
        # TODO: assert not prop.is_valid(True)
        assert prop.is_valid(0)
        assert prop.is_valid(1)
        assert prop.is_valid(0.0)
        assert prop.is_valid(1.0)
        assert not prop.is_valid(1.0+1.0j)
        assert not prop.is_valid("")
        assert not prop.is_valid(())
        assert not prop.is_valid([])
        assert not prop.is_valid({})
        assert not prop.is_valid(Foo())

        # TODO: assert not prop.is_valid(np.bool8(False))
        # TODO: assert not prop.is_valid(np.bool8(True))
        assert prop.is_valid(np.int8(0))
        assert prop.is_valid(np.int8(1))
        assert prop.is_valid(np.int16(0))
        assert prop.is_valid(np.int16(1))
        assert prop.is_valid(np.int32(0))
        assert prop.is_valid(np.int32(1))
        assert prop.is_valid(np.int64(0))
        assert prop.is_valid(np.int64(1))
        assert prop.is_valid(np.uint8(0))
        assert prop.is_valid(np.uint8(1))
        assert prop.is_valid(np.uint16(0))
        assert prop.is_valid(np.uint16(1))
        assert prop.is_valid(np.uint32(0))
        assert prop.is_valid(np.uint32(1))
        assert prop.is_valid(np.uint64(0))
        assert prop.is_valid(np.uint64(1))
        assert prop.is_valid(np.float16(0))
        assert prop.is_valid(np.float16(1))
        assert prop.is_valid(np.float32(0))
        assert prop.is_valid(np.float32(1))
        assert prop.is_valid(np.float64(0))
        assert prop.is_valid(np.float64(1))
        assert not prop.is_valid(np.complex64(1.0+1.0j))
        assert not prop.is_valid(np.complex128(1.0+1.0j))
        if hasattr(np, "complex256"):
            assert not prop.is_valid(np.complex256(1.0+1.0j))

    def test_Complex(self):
        prop = Complex()

        assert prop.is_valid(None)
        # TODO: assert not prop.is_valid(False)
        # TODO: assert not prop.is_valid(True)
        assert prop.is_valid(0)
        assert prop.is_valid(1)
        assert prop.is_valid(0.0)
        assert prop.is_valid(1.0)
        assert prop.is_valid(1.0+1.0j)
        assert not prop.is_valid("")
        assert not prop.is_valid(())
        assert not prop.is_valid([])
        assert not prop.is_valid({})
        assert not prop.is_valid(Foo())

        # TODO: assert not prop.is_valid(np.bool8(False))
        # TODO: assert not prop.is_valid(np.bool8(True))
        assert prop.is_valid(np.int8(0))
        assert prop.is_valid(np.int8(1))
        assert prop.is_valid(np.int16(0))
        assert prop.is_valid(np.int16(1))
        assert prop.is_valid(np.int32(0))
        assert prop.is_valid(np.int32(1))
        assert prop.is_valid(np.int64(0))
        assert prop.is_valid(np.int64(1))
        assert prop.is_valid(np.uint8(0))
        assert prop.is_valid(np.uint8(1))
        assert prop.is_valid(np.uint16(0))
        assert prop.is_valid(np.uint16(1))
        assert prop.is_valid(np.uint32(0))
        assert prop.is_valid(np.uint32(1))
        assert prop.is_valid(np.uint64(0))
        assert prop.is_valid(np.uint64(1))
        assert prop.is_valid(np.float16(0))
        assert prop.is_valid(np.float16(1))
        assert prop.is_valid(np.float32(0))
        assert prop.is_valid(np.float32(1))
        assert prop.is_valid(np.float64(0))
        assert prop.is_valid(np.float64(1))
        assert prop.is_valid(np.complex64(1.0+1.0j))
        assert prop.is_valid(np.complex128(1.0+1.0j))
        if hasattr(np, "complex256"):
            assert prop.is_valid(np.complex256(1.0+1.0j))

    def test_String(self):
        prop = String()

        assert prop.is_valid(None)

        assert not prop.is_valid(False)
        assert not prop.is_valid(True)
        assert not prop.is_valid(0)
        assert not prop.is_valid(1)
        assert not prop.is_valid(0.0)
        assert not prop.is_valid(1.0)
        assert not prop.is_valid(1.0+1.0j)
        assert prop.is_valid("")
        assert prop.is_valid("6")
        assert not prop.is_valid(())
        assert not prop.is_valid([])
        assert not prop.is_valid({})
        assert not prop.is_valid(Foo())

    def test_FontSize(self):

        prop = FontSize()

        assert prop.is_valid(None)

        css_units = "%|em|ex|ch|ic|rem|vw|vh|vi|vb|vmin|vmax|cm|mm|q|in|pc|pt|px"

        for unit in css_units.split("|"):
            v = '10%s' % unit
            assert prop.is_valid(v)

            v = '10.2%s' % unit
            assert prop.is_valid(v)

            v = '_10%s' % unit
            assert not prop.is_valid(v)

            v = '_10.2%s' % unit
            assert not prop.is_valid(v)

        for unit in css_units.upper().split("|"):
            v = '10%s' % unit
            assert prop.is_valid(v)

            v = '10.2%s' % unit
            assert prop.is_valid(v)

            v = '_10%s' % unit
            assert not prop.is_valid(v)

            v = '_10.2%s' % unit
            assert not prop.is_valid(v)

        assert not prop.is_valid(False)
        assert not prop.is_valid(True)
        assert not prop.is_valid(0)
        assert not prop.is_valid(1)
        assert not prop.is_valid(0.0)
        assert not prop.is_valid(1.0)
        assert not prop.is_valid(1.0+1.0j)
        assert not prop.is_valid("")
        assert not prop.is_valid(())
        assert not prop.is_valid([])
        assert not prop.is_valid({})
        assert not prop.is_valid(Foo())


    def test_Regex(self):
        with pytest.raises(TypeError):
            prop = Regex()

        prop = Regex("^x*$")

        assert prop.is_valid(None)
        assert not prop.is_valid(False)
        assert not prop.is_valid(True)
        assert not prop.is_valid(0)
        assert not prop.is_valid(1)
        assert not prop.is_valid(0.0)
        assert not prop.is_valid(1.0)
        assert not prop.is_valid(1.0+1.0j)
        assert prop.is_valid("")
        assert not prop.is_valid(())
        assert not prop.is_valid([])
        assert not prop.is_valid({})
        assert not prop.is_valid(Foo())

    def test_Seq(self):
        with pytest.raises(TypeError):
            prop = Seq()

        prop = Seq(Int)

        assert prop.is_valid(None)
        assert not prop.is_valid(False)
        assert not prop.is_valid(True)
        assert not prop.is_valid(0)
        assert not prop.is_valid(1)
        assert not prop.is_valid(0.0)
        assert not prop.is_valid(1.0)
        assert not prop.is_valid(1.0+1.0j)
        assert not prop.is_valid("")
        assert prop.is_valid(())
        assert prop.is_valid([])
        assert prop.is_valid(np.array([]))
        assert not prop.is_valid(set([]))
        assert not prop.is_valid({})
        assert prop.is_valid((1, 2))
        assert prop.is_valid([1, 2])
        assert prop.is_valid(np.array([1, 2]))
        assert not prop.is_valid({1, 2})
        assert not prop.is_valid({1: 2})
        assert not prop.is_valid(Foo())

    def test_Seq_with_pandas(self, pd):
        with pytest.raises(TypeError):
            prop = Seq()

        prop = Seq(Int)

        df = pd.DataFrame([1, 2])
        assert prop.is_valid(df.index)
        assert prop.is_valid(df.iloc[0])

    def test_List(self):
        with pytest.raises(TypeError):
            prop = List()

        prop = List(Int)

        assert prop.is_valid(None)
        assert not prop.is_valid(False)
        assert not prop.is_valid(True)
        assert not prop.is_valid(0)
        assert not prop.is_valid(1)
        assert not prop.is_valid(0.0)
        assert not prop.is_valid(1.0)
        assert not prop.is_valid(1.0+1.0j)
        assert not prop.is_valid("")
        assert not prop.is_valid(())
        assert prop.is_valid([])
        assert not prop.is_valid({})
        assert not prop.is_valid(Foo())

    def test_Dict(self):
        with pytest.raises(TypeError):
            prop = Dict()

        prop = Dict(String, List(Int))

        assert prop.is_valid(None)
        assert not prop.is_valid(False)
        assert not prop.is_valid(True)
        assert not prop.is_valid(0)
        assert not prop.is_valid(1)
        assert not prop.is_valid(0.0)
        assert not prop.is_valid(1.0)
        assert not prop.is_valid(1.0+1.0j)
        assert not prop.is_valid("")
        assert not prop.is_valid(())
        assert not prop.is_valid([])
        assert prop.is_valid({})
        assert not prop.is_valid(Foo())

    def test_Tuple(self):
        with pytest.raises(TypeError):
            prop = Tuple()

        with pytest.raises(TypeError):
            prop = Tuple(Int)

        prop = Tuple(Int, String, List(Int))

        assert prop.is_valid(None)
        assert not prop.is_valid(False)
        assert not prop.is_valid(True)
        assert not prop.is_valid(0)
        assert not prop.is_valid(1)
        assert not prop.is_valid(0.0)
        assert not prop.is_valid(1.0)
        assert not prop.is_valid(1.0+1.0j)
        assert not prop.is_valid("")
        assert not prop.is_valid(())
        assert not prop.is_valid([])
        assert not prop.is_valid({})
        assert not prop.is_valid(Foo())

        assert prop.is_valid((1, "", [1, 2, 3]))
        assert not prop.is_valid((1.0, "", [1, 2, 3]))
        assert not prop.is_valid((1, True, [1, 2, 3]))
        assert not prop.is_valid((1, "", (1, 2, 3)))
        assert not prop.is_valid((1, "", [1, 2, "xyz"]))

    def test_Instance(self):
        with pytest.raises(TypeError):
            prop = Instance()

        prop = Instance(Foo)

        assert prop.is_valid(None)
        assert not prop.is_valid(False)
        assert not prop.is_valid(True)
        assert not prop.is_valid(0)
        assert not prop.is_valid(1)
        assert not prop.is_valid(0.0)
        assert not prop.is_valid(1.0)
        assert not prop.is_valid(1.0+1.0j)
        assert not prop.is_valid("")
        assert not prop.is_valid(())
        assert not prop.is_valid([])
        assert not prop.is_valid({})
        assert prop.is_valid(Foo())

        assert not prop.is_valid(Bar())
        assert not prop.is_valid(Baz())

    def test_Instance_from_json(self):
        class MapOptions(HasProps):
            lat = Float
            lng = Float
            zoom = Int(12)

        v1 = Instance(MapOptions).from_json(dict(lat=1, lng=2))
        v2 = MapOptions(lat=1, lng=2)
        assert v1.equals(v2)

    def test_Interval(self):
        with pytest.raises(TypeError):
            prop = Interval()

        with pytest.raises(ValueError):
            prop = Interval(Int, 0.0, 1.0)

        prop = Interval(Int, 0, 255)

        assert prop.is_valid(None)
        # TODO: assert not prop.is_valid(False)
        # TODO: assert not prop.is_valid(True)
        assert prop.is_valid(0)
        assert prop.is_valid(1)
        assert not prop.is_valid(0.0)
        assert not prop.is_valid(1.0)
        assert not prop.is_valid(1.0+1.0j)
        assert not prop.is_valid("")
        assert not prop.is_valid(())
        assert not prop.is_valid([])
        assert not prop.is_valid({})
        assert not prop.is_valid(Foo())

        assert prop.is_valid(127)
        assert not prop.is_valid(-1)
        assert not prop.is_valid(256)

        prop = Interval(Float, 0.0, 1.0)

        assert prop.is_valid(None)
        # TODO: assert not prop.is_valid(False)
        # TODO: assert not prop.is_valid(True)
        assert prop.is_valid(0)
        assert prop.is_valid(1)
        assert prop.is_valid(0.0)
        assert prop.is_valid(1.0)
        assert not prop.is_valid(1.0+1.0j)
        assert not prop.is_valid("")
        assert not prop.is_valid(())
        assert not prop.is_valid([])
        assert not prop.is_valid({})
        assert not prop.is_valid(Foo())

        assert prop.is_valid(0.5)
        assert not prop.is_valid(-0.001)
        assert not prop.is_valid( 1.001)

    def test_Either(self):
        with pytest.raises(TypeError):
            prop = Either()

        prop = Either(Interval(Int, 0, 100), Regex("^x*$"), List(Int))

        assert prop.is_valid(None)
        # TODO: assert not prop.is_valid(False)
        # TODO: assert not prop.is_valid(True)
        assert prop.is_valid(0)
        assert prop.is_valid(1)
        assert not prop.is_valid(0.0)
        assert not prop.is_valid(1.0)
        assert not prop.is_valid(1.0+1.0j)
        assert prop.is_valid("")
        assert not prop.is_valid(())
        assert prop.is_valid([])
        assert not prop.is_valid({})
        assert not prop.is_valid(Foo())

        assert prop.is_valid(100)
        assert not prop.is_valid(-100)
        assert prop.is_valid("xxx")
        assert not prop.is_valid("yyy")
        assert prop.is_valid([1, 2, 3])
        assert not prop.is_valid([1, 2, ""])

    def test_Enum(self):
        with pytest.raises(TypeError):
            prop = Enum()

        with pytest.raises(TypeError):
            prop = Enum("red", "green", 1)

        with pytest.raises(TypeError):
            prop = Enum("red", "green", "red")

        prop = Enum("red", "green", "blue")

        assert prop.is_valid(None)
        assert not prop.is_valid(False)
        assert not prop.is_valid(True)
        assert not prop.is_valid(0)
        assert not prop.is_valid(1)
        assert not prop.is_valid(0.0)
        assert not prop.is_valid(1.0)
        assert not prop.is_valid(1.0+1.0j)
        assert not prop.is_valid("")
        assert not prop.is_valid(())
        assert not prop.is_valid([])
        assert not prop.is_valid({})
        assert not prop.is_valid(Foo())

        assert prop.is_valid("red")
        assert prop.is_valid("green")
        assert prop.is_valid("blue")

        assert not prop.is_valid("RED")
        assert not prop.is_valid("GREEN")
        assert not prop.is_valid("BLUE")

        assert not prop.is_valid(" red")
        assert not prop.is_valid(" green")
        assert not prop.is_valid(" blue")

        from bokeh.core.enums import LineJoin
        prop = Enum(LineJoin)

        assert prop.is_valid(None)
        assert not prop.is_valid(False)
        assert not prop.is_valid(True)
        assert not prop.is_valid(0)
        assert not prop.is_valid(1)
        assert not prop.is_valid(0.0)
        assert not prop.is_valid(1.0)
        assert not prop.is_valid(1.0+1.0j)
        assert not prop.is_valid("")
        assert not prop.is_valid(())
        assert not prop.is_valid([])
        assert not prop.is_valid({})
        assert not prop.is_valid(Foo())

        assert prop.is_valid("miter")
        assert prop.is_valid("round")
        assert prop.is_valid("bevel")

        assert not prop.is_valid("MITER")
        assert not prop.is_valid("ROUND")
        assert not prop.is_valid("BEVEL")

        assert not prop.is_valid(" miter")
        assert not prop.is_valid(" round")
        assert not prop.is_valid(" bevel")

        from bokeh.core.enums import NamedColor
        prop = Enum(NamedColor)

        assert prop.is_valid("red")
        assert prop.is_valid("Red")
        assert prop.is_valid("RED")

    def test_Color(self):
        prop = Color()

        assert prop.is_valid(None)
        assert not prop.is_valid(False)
        assert not prop.is_valid(True)
        assert not prop.is_valid(0)
        assert not prop.is_valid(1)
        assert not prop.is_valid(0.0)
        assert not prop.is_valid(1.0)
        assert not prop.is_valid(1.0+1.0j)
        assert not prop.is_valid("")
        assert not prop.is_valid(())
        assert not prop.is_valid([])
        assert not prop.is_valid({})
        assert not prop.is_valid(Foo())

        assert prop.is_valid((0, 127, 255))
        assert not prop.is_valid((0, -127, 255))
        assert not prop.is_valid((0, 127))
        assert not prop.is_valid((0, 127, 1.0))
        assert not prop.is_valid((0, 127, 255, 255))
        assert prop.is_valid((0, 127, 255, 1.0))

        assert prop.is_valid("#00aaff")
        assert prop.is_valid("#00AAFF")
        assert prop.is_valid("#00AaFf")
        assert not prop.is_valid("00aaff")
        assert not prop.is_valid("00AAFF")
        assert not prop.is_valid("00AaFf")
        assert not prop.is_valid("#00AaFg")
        assert not prop.is_valid("#00AaFff")

        assert prop.is_valid("blue")
        assert prop.is_valid("BLUE")
        assert not prop.is_valid("foobar")

        assert prop.transform((0, 127, 255)), "rgb(0, 127, 255)"
        assert prop.transform((0, 127, 255, 0.1)), "rgba(0, 127, 255, 0.1)"

    def test_DashPattern(self):
        prop = DashPattern()

        assert prop.is_valid(None)
        assert not prop.is_valid(False)
        assert not prop.is_valid(True)
        assert not prop.is_valid(0)
        assert not prop.is_valid(1)
        assert not prop.is_valid(0.0)
        assert not prop.is_valid(1.0)
        assert not prop.is_valid(1.0+1.0j)
        assert prop.is_valid("")
        assert prop.is_valid(())
        assert prop.is_valid([])
        assert not prop.is_valid({})
        assert not prop.is_valid(Foo())

        assert prop.is_valid("solid")
        assert prop.is_valid("dashed")
        assert prop.is_valid("dotted")
        assert prop.is_valid("dotdash")
        assert prop.is_valid("dashdot")
        assert not prop.is_valid("DASHDOT")

        assert prop.is_valid([1, 2, 3])
        assert not prop.is_valid([1, 2, 3.0])

        assert prop.is_valid("1 2 3")
        assert not prop.is_valid("1 2 x")

    def test_Size(self):
        prop = Size()

        assert prop.is_valid(None)
        # TODO: assert not prop.is_valid(False)
        # TODO: assert not prop.is_valid(True)
        assert prop.is_valid(0)
        assert prop.is_valid(1)
        assert prop.is_valid(0.0)
        assert prop.is_valid(1.0)
        assert not prop.is_valid(1.0+1.0j)
        assert not prop.is_valid("")
        assert not prop.is_valid(())
        assert not prop.is_valid([])
        assert not prop.is_valid({})
        assert not prop.is_valid(Foo())

        assert prop.is_valid(100)
        assert prop.is_valid(100.1)
        assert not prop.is_valid(-100)
        assert not prop.is_valid(-0.001)

    def test_Percent(self):
        prop = Percent()

        assert prop.is_valid(None)
        # TODO: assert not prop.is_valid(False)
        # TODO: assert not prop.is_valid(True)
        assert prop.is_valid(0)
        assert prop.is_valid(1)
        assert prop.is_valid(0.0)
        assert prop.is_valid(1.0)
        assert not prop.is_valid(1.0+1.0j)
        assert not prop.is_valid("")
        assert not prop.is_valid(())
        assert not prop.is_valid([])
        assert not prop.is_valid({})
        assert not prop.is_valid(Foo())

        assert prop.is_valid(0.5)
        assert not prop.is_valid(-0.001)
        assert not prop.is_valid( 1.001)

    def test_Angle(self):
        prop = Angle()

        assert prop.is_valid(None)
        # TODO: assert not prop.is_valid(False)
        # TODO: assert not prop.is_valid(True)
        assert prop.is_valid(0)
        assert prop.is_valid(1)
        assert prop.is_valid(0.0)
        assert prop.is_valid(1.0)
        assert not prop.is_valid(1.0+1.0j)
        assert not prop.is_valid("")
        assert not prop.is_valid(())
        assert not prop.is_valid([])
        assert not prop.is_valid({})
        assert not prop.is_valid(Foo())

    def test_MinMaxBounds_with_no_datetime(self):
        prop = MinMaxBounds(accept_datetime=False)

        # Valid values
        assert prop.is_valid('auto')
        assert prop.is_valid(None)
        assert prop.is_valid((12, 13))
        assert prop.is_valid((-32, -13))
        assert prop.is_valid((12.1, 13.1))
        assert prop.is_valid((None, 13.1))
        assert prop.is_valid((-22, None))

        # Invalid values
        assert not prop.is_valid('string')
        assert not prop.is_valid(12)
        assert not prop.is_valid(('a', 'b'))
        assert not prop.is_valid((13, 12))
        assert not prop.is_valid((13.1, 12.2))
        assert not prop.is_valid((datetime.date(2012, 10, 1), datetime.date(2012, 12, 2)))

    def test_MinMaxBounds_with_datetime(self):
        prop = MinMaxBounds(accept_datetime=True)

        # Valid values
        assert prop.is_valid((datetime.date(2012, 10, 1), datetime.date(2012, 12, 2)))

        # Invalid values
        assert not prop.is_valid((datetime.date(2012, 10, 1), 22))

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
