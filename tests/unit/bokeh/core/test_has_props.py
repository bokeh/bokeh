#-----------------------------------------------------------------------------
# Copyright (c) 2012 - 2021, Anaconda, Inc., and Bokeh Contributors.
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
from mock import MagicMock, patch

# Bokeh imports
from bokeh.core.properties import (
    Alias,
    AngleSpec,
    Either,
    Int,
    List,
    Nullable,
    NumberSpec,
    Override,
    String,
)
from bokeh.core.property.dataspec import field, value
from bokeh.core.property.descriptors import DataSpecPropertyDescriptor, PropertyDescriptor
from bokeh.core.property.singletons import Intrinsic

# Module under test
import bokeh.core.has_props as hp # isort:skip

#-----------------------------------------------------------------------------
# Setup
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# General API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Dev API
#-----------------------------------------------------------------------------

class Parent(hp.HasProps):
    int1 = Int(default=10)
    ds1 = NumberSpec(default=field("x"))
    lst1 = List(String)

class Child(Parent):
    int2 = Nullable(Int())
    str2 = String(default="foo")
    ds2 = NumberSpec(default=field("y"))
    lst2 = List(Int, default=[1,2,3])

    @property
    def str2_proxy(self):
        return self.str2
    @str2_proxy.setter
    def str2_proxy(self, value):
        self.str2 = value*2

class OverrideChild(Parent):
    int1 = Override(default=20)

class AliasedChild(Child):
    aliased_int1 = Alias("int1")
    aliased_int2 = Alias("int2")

def test_HasProps_default_init() -> None:
    p = Parent()
    assert p.int1 == 10
    assert p.ds1 == field("x")
    assert p.lst1 == []

    c = Child()
    assert c.int1 == 10
    assert c.ds1 == field("x")
    assert c.lst1 == []
    assert c.int2 == None
    assert c.str2 == "foo"
    assert c.ds2 == field("y")
    assert c.lst2 == [1,2,3]

def test_HasProps_kw_init() -> None:
    p = Parent(int1=30, ds1=field("foo"))
    assert p.int1 == 30
    assert p.ds1 == field("foo")
    assert p.lst1 == []

    c = Child(str2="bar", lst2=[2,3,4], ds2=10)
    assert c.int1 == 10
    assert c.ds1 == field("x")
    assert c.lst1 == []
    assert c.int2 == None
    assert c.str2 == "bar"
    assert c.ds2 == 10
    assert c.lst2 == [2,3,4]

def test_HasProps_override() -> None:
    ov = OverrideChild()
    assert ov.int1 == 20
    assert ov.ds1 == field("x")
    assert ov.lst1 == []

def test_HasProps_intrinsic() -> None:
    obj0 = Parent(int1=Intrinsic, ds1=Intrinsic, lst1=Intrinsic)

    assert obj0.int1 == 10
    assert obj0.ds1 == field("x")
    assert obj0.lst1 == []

    obj1 = Parent(int1=30, ds1=field("y"), lst1=["x", "y", "z"])

    assert obj1.int1 == 30
    assert obj1.ds1 == field("y")
    assert obj1.lst1 == ["x", "y", "z"]

    obj1.int1 = Intrinsic
    obj1.ds1 = Intrinsic
    obj1.lst1 = Intrinsic

    assert obj1.int1 == 10
    assert obj1.ds1 == field("x")
    assert obj1.lst1 == []

def test_HasProps_alias() -> None:
    obj0 = AliasedChild()
    assert obj0.int1 == 10
    assert obj0.int2 is None
    assert obj0.aliased_int1 == 10
    assert obj0.aliased_int2 is None
    obj0.int1 = 20
    assert obj0.int1 == 20
    assert obj0.int2 is None
    assert obj0.aliased_int1 == 20
    assert obj0.aliased_int2 is None
    obj0.int2 = 1
    assert obj0.int1 == 20
    assert obj0.int2 == 1
    assert obj0.aliased_int1 == 20
    assert obj0.aliased_int2 == 1
    obj0.aliased_int1 = 30
    assert obj0.int1 == 30
    assert obj0.int2 == 1
    assert obj0.aliased_int1 == 30
    assert obj0.aliased_int2 == 1
    obj0.aliased_int2 = 2
    assert obj0.int1 == 30
    assert obj0.int2 == 2
    assert obj0.aliased_int1 == 30
    assert obj0.aliased_int2 == 2

    obj1 = AliasedChild(int1=20)
    assert obj1.int1 == 20
    assert obj1.int2 is None
    assert obj1.aliased_int1 == 20
    assert obj1.aliased_int2 is None

    obj2 = AliasedChild(int2=1)
    assert obj2.int1 == 10
    assert obj2.int2 == 1
    assert obj2.aliased_int1 == 10
    assert obj2.aliased_int2 == 1

    obj3 = AliasedChild(int1=20, int2=1)
    assert obj3.int1 == 20
    assert obj3.int2 == 1
    assert obj3.aliased_int1 == 20
    assert obj3.aliased_int2 == 1

    obj4 = AliasedChild(aliased_int1=20)
    assert obj4.int1 == 20
    assert obj4.int2 is None
    assert obj4.aliased_int1 == 20
    assert obj4.aliased_int2 is None

    obj5 = AliasedChild(aliased_int2=1)
    assert obj5.int1 == 10
    assert obj5.int2 == 1
    assert obj5.aliased_int1 == 10
    assert obj5.aliased_int2 == 1

    obj6 = AliasedChild(aliased_int1=20, aliased_int2=1)
    assert obj6.int1 == 20
    assert obj6.int2 == 1
    assert obj6.aliased_int1 == 20
    assert obj6.aliased_int2 == 1

def test_HasProps_equals() -> None:
    p1 = Parent()
    p2 = Parent()
    assert p1.equals(p2)
    p1.int1 = 25
    assert not p1.equals(p2)
    p2.int1 = 25
    assert p1.equals(p2)

def test_HasProps_update() -> None:
    c = Child()
    c.update(**dict(lst2=[1,2], str2="baz", int1=25, ds1=value("foo")))
    assert c.int1 == 25
    assert c.ds1 == value("foo")
    assert c.lst1 == []
    assert c.int2 == None
    assert c.str2 == "baz"
    assert c.ds2 == field("y")
    assert c.lst2 == [1,2]

def test_HasProps_set_from_json() -> None:
    c = Child()
    c.set_from_json('lst2', [1,2])
    assert c.int1 == 10
    assert c.ds1 == field("x")
    assert c.lst1 == []
    assert c.int2 == None
    assert c.str2 == "foo"
    assert c.ds2 == field("y")
    assert c.lst2 == [1,2]

    c.set_from_json('ds1', "foo")
    assert c.int1 == 10
    assert c.ds1 == "foo"
    assert c.lst1 == []
    assert c.int2 == None
    assert c.str2 == "foo"
    assert c.ds2 == field("y")
    assert c.lst2 == [1,2]

    c.set_from_json('int2', 100)
    assert c.int1 == 10
    assert c.ds1 == "foo"
    assert c.lst1 == []
    assert c.int2 == 100
    assert c.str2 == "foo"
    assert c.ds2 == field("y")
    assert c.lst2 == [1,2]


def test_HasProps_update_from_json() -> None:
    c = Child()
    c.update_from_json(dict(lst2=[1,2], str2="baz", int1=25, ds1=field("foo")))
    assert c.int1 == 25
    assert c.ds1 == field("foo")
    assert c.lst1 == []
    assert c.int2 == None
    assert c.str2 == "baz"
    assert c.ds2 == field("y")
    assert c.lst2 == [1,2]

@patch('bokeh.core.has_props.HasProps.set_from_json')
def test_HasProps_update_from_json_passes_models_and_setter(mock_set: MagicMock) -> None:
    c = Child()
    c.update_from_json(dict(lst1=[1,2]), models="foo", setter="bar")
    assert mock_set.called
    assert mock_set.call_args[0] == ('lst1', [1, 2])
    assert mock_set.call_args[1] == {'models': 'foo', 'setter': 'bar'}

def test_HasProps_set() -> None:
    c = Child()
    c.update(**dict(lst2=[1,2], str2="baz", int1=25, ds1=field("foo")))
    assert c.int1 == 25
    assert c.ds1 == field("foo")
    assert c.lst1 == []
    assert c.int2 == None
    assert c.str2 == "baz"
    assert c.ds2 == field("y")
    assert c.lst2 == [1,2]

    c.str2_proxy = "some"
    assert c.str2 == "somesome"
    assert c.str2_proxy == "somesome"

def test_HasProps_set_error() -> None:
    c = Child()
    with pytest.raises(AttributeError) as e:
        c.int3 = 10
    assert str(e.value).endswith("unexpected attribute 'int3' to Child, similar attributes are int2 or int1")
    with pytest.raises(AttributeError) as e:
        c.junkjunk = 10
    assert str(e.value).endswith("unexpected attribute 'junkjunk' to Child, possible attributes are ds1, ds2, int1, int2, lst1, lst2 or str2")


def test_HasProps_lookup() -> None:
    p = Parent()
    d = p.lookup('int1')
    assert isinstance(d, PropertyDescriptor)
    assert d.name == 'int1'
    d = p.lookup('ds1')
    assert isinstance(d, DataSpecPropertyDescriptor)
    assert d.name == 'ds1'
    d = p.lookup('lst1')
    assert isinstance(d, PropertyDescriptor)
    assert d.name == 'lst1'

def test_HasProps_apply_theme() -> None:
    c = Child()
    theme = dict(int2=10, lst1=["foo", "bar"])
    c.apply_theme(theme)
    assert c.themed_values() is theme
    c.apply_theme(theme)
    assert c.themed_values() is theme

    assert c.int2 == 10
    assert c.lst1 == ["foo", "bar"]

    assert c.int1 == 10
    assert c.ds1 == field("x")
    assert c.str2 == "foo"
    assert c.ds2 == field("y")
    assert c.lst2 == [1,2,3]

    c.int2 = 25
    assert c.int2 == 25
    assert c.lst1 == ["foo", "bar"]

    assert c.int1 == 10
    assert c.ds1 == field("x")
    assert c.str2 == "foo"
    assert c.ds2 == field("y")
    assert c.lst2 == [1,2,3]

    c.ds2 = "foo"
    assert c.int2 == 25
    assert c.lst1 == ["foo", "bar"]

    assert c.int1 == 10
    assert c.ds1 == field("x")
    assert c.str2 == "foo"
    assert c.ds2 == "foo"
    assert c.lst2 == [1,2,3]

def test_HasProps_unapply_theme() -> None:
    c = Child()
    theme = dict(int2=10, lst1=["foo", "bar"])
    c.apply_theme(theme)
    assert c.int2 == 10
    assert c.lst1 == ["foo", "bar"]

    assert c.int1 == 10
    assert c.ds1 == field("x")
    assert c.str2 == "foo"
    assert c.ds2 == field("y")
    assert c.lst2 == [1,2,3]

    c.unapply_theme()
    assert c.int2 == None
    assert c.lst1 == []

    assert c.int1 == 10
    assert c.ds1 == field("x")
    assert c.str2 == "foo"
    assert c.ds2 == field("y")
    assert c.lst2 == [1,2,3]

    assert c.themed_values() == None

class EitherSimpleDefault(hp.HasProps):
    foo = Either(List(Int), Int, default=10)

def test_HasProps_apply_theme_either_simple() -> None:

    # check applying multiple themes
    c = EitherSimpleDefault()
    assert c.foo == 10

    theme = dict(foo=20)
    c.apply_theme(theme)
    assert c.foo == 20

    theme = dict(foo=30)
    c.apply_theme(theme)
    assert c.foo == 30

    # check user set before theme
    c = EitherSimpleDefault()
    theme = dict(foo=30)
    c.foo = 50
    c.apply_theme(theme)
    assert c.foo == 50

    # check user set after theme
    c = EitherSimpleDefault()
    theme = dict(foo=30)
    c.apply_theme(theme)
    c.foo = 50
    assert c.foo == 50

    # check user set alt type
    c = EitherSimpleDefault()
    theme = dict(foo=30)
    c.foo = [50]
    c.apply_theme(theme)
    assert c.foo == [50]

    # check themed alt type
    c = EitherSimpleDefault()
    theme = dict(foo=[100])
    c.apply_theme(theme)
    assert c.foo == [100]

class EitherContainerDefault(hp.HasProps):
    foo = Either(List(Int), Int, default=[10])

def test_HasProps_apply_theme_either_container() -> None:

    # check applying multiple themes
    c = EitherContainerDefault()
    assert c.foo == [10]

    theme = dict(foo=[20])
    c.apply_theme(theme)
    assert c.foo == [20]

    theme = dict(foo=[30])
    c.apply_theme(theme)
    assert c.foo == [30]

    # check user set before theme
    c = EitherContainerDefault()
    theme = dict(foo=[30])
    c.foo = [50]
    c.apply_theme(theme)
    assert c.foo == [50]

    # check user set after theme
    c = EitherContainerDefault()
    theme = dict(foo=[30])
    c.apply_theme(theme)
    c.foo = [50]
    assert c.foo == [50]

    # check user set alt type
    c = EitherContainerDefault()
    theme = dict(foo=[30])
    c.foo = 50
    c.apply_theme(theme)
    assert c.foo == 50

    # check themed alt type
    c = EitherContainerDefault()
    theme = dict(foo=100)
    c.apply_theme(theme)
    assert c.foo == 100

class IntFuncDefault(hp.HasProps):
    foo = Int(default=lambda: 10)

def test_HasProps_apply_theme_func_default() -> None:

    # check applying multiple themes
    c = IntFuncDefault()
    assert c.foo == 10

    theme = dict(foo=20)
    c.apply_theme(theme)
    assert c.foo == 20

    theme = dict(foo=30)
    c.apply_theme(theme)
    assert c.foo == 30

    # check user set before theme
    c = IntFuncDefault()
    theme = dict(foo=30)
    c.foo = 50
    c.apply_theme(theme)
    assert c.foo == 50

    # check user set after theme
    c = IntFuncDefault()
    theme = dict(foo=30)
    c.apply_theme(theme)
    c.foo = 50
    assert c.foo == 50

def test_has_props_dupe_prop() -> None:
    try:
        class DupeProps(hp.HasProps):
            bar = AngleSpec()
            bar_units = String()
    except RuntimeError as e:
        assert str(e) == "Two property generators both created DupeProps.bar_units"
    else:
        assert False


#-----------------------------------------------------------------------------
# Private API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Code
#-----------------------------------------------------------------------------
