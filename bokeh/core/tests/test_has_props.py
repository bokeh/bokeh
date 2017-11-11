from mock import patch
import pytest

import bokeh.core.has_props as hp

from bokeh.core.properties import Int, String, NumberSpec, List, Override, Either
from bokeh.core.property.descriptors import BasicPropertyDescriptor, DataSpecPropertyDescriptor

class Parent(hp.HasProps):
    int1 = Int(default=10)
    ds1 = NumberSpec()
    lst1 = List(String)

class Child(Parent):
    int2 = Int()
    str2 = String(default="foo")
    ds2 = NumberSpec()
    lst2 = List(Int, default=[1,2,3])

    @property
    def str2_proxy(self):
        return self.str2
    @str2_proxy.setter
    def str2_proxy(self, value):
        self.str2 = value*2

class OverrideChild(Parent):
    int1 = Override(default=20)

def test_HasProps_default_init():
    p = Parent()
    assert p.int1 == 10
    assert p.ds1 == None
    assert p.lst1 == []

    c = Child()
    assert c.int1 == 10
    assert c.ds1 == None
    assert c.lst1 == []
    assert c.int2 == None
    assert c.str2 == "foo"
    assert c.ds2 == None
    assert c.lst2 == [1,2,3]

def test_HasProps_kw_init():
    p = Parent(int1=30, ds1="foo")
    assert p.int1 == 30
    assert p.ds1 == "foo"
    assert p.lst1 == []

    c = Child(str2="bar", lst2=[2,3,4], ds2=10)
    assert c.int1 == 10
    assert c.ds1 == None
    assert c.lst1 == []
    assert c.int2 == None
    assert c.str2 == "bar"
    assert c.ds2 == 10
    assert c.lst2 == [2,3,4]

def test_HasProps_override():
    ov = OverrideChild()
    assert ov.int1 == 20
    assert ov.ds1 == None
    assert ov.lst1 == []

def test_HasProps_equals():
    p1 = Parent()
    p2 = Parent()
    assert p1.equals(p2)
    p1.int1 = 25
    assert not p1.equals(p2)
    p2.int1 = 25
    assert p1.equals(p2)

def test_HasProps_update():
    c = Child()
    c.update(**dict(lst2=[1,2], str2="baz", int1=25, ds1=dict(field="foo")))
    assert c.int1 == 25
    assert c.ds1 == dict(field="foo")
    assert c.lst1 == []
    assert c.int2 == None
    assert c.str2 == "baz"
    assert c.ds2 ==  None
    assert c.lst2 == [1,2]

def test_HasProps_set_from_json():
    c = Child()
    c.set_from_json('lst2', [1,2])
    assert c.int1 == 10
    assert c.ds1 == None
    assert c.lst1 == []
    assert c.int2 == None
    assert c.str2 == "foo"
    assert c.ds2 ==  None
    assert c.lst2 == [1,2]

    c.set_from_json('ds1', "foo")
    assert c.int1 == 10
    assert c.ds1 == "foo"
    assert c.lst1 == []
    assert c.int2 == None
    assert c.str2 == "foo"
    assert c.ds2 ==  None
    assert c.lst2 == [1,2]

    c.set_from_json('int2', 100)
    assert c.int1 == 10
    assert c.ds1 == "foo"
    assert c.lst1 == []
    assert c.int2 == 100
    assert c.str2 == "foo"
    assert c.ds2 ==  None
    assert c.lst2 == [1,2]


def test_HasProps_update_from_json():
    c = Child()
    c.update_from_json(dict(lst2=[1,2], str2="baz", int1=25, ds1=dict(field="foo")))
    assert c.int1 == 25
    assert c.ds1 == dict(field="foo")
    assert c.lst1 == []
    assert c.int2 == None
    assert c.str2 == "baz"
    assert c.ds2 ==  None
    assert c.lst2 == [1,2]

@patch('bokeh.core.has_props.HasProps.set_from_json')
def test_HasProps_update_from_json_passes_models_and_setter(mock_set):
    c = Child()
    c.update_from_json(dict(lst1=[1,2]), models="foo", setter="bar")
    assert mock_set.called
    assert mock_set.call_args[0] == ('lst1', [1, 2], 'foo', 'bar')
    assert mock_set.call_args[1] == {}

def test_HasProps_set():
    c = Child()
    c.update(**dict(lst2=[1,2], str2="baz", int1=25, ds1=dict(field="foo")))
    assert c.int1 == 25
    assert c.ds1 == dict(field="foo")
    assert c.lst1 == []
    assert c.int2 == None
    assert c.str2 == "baz"
    assert c.ds2 ==  None
    assert c.lst2 == [1,2]

    c.str2_proxy = "some"
    assert c.str2 == "somesome"
    assert c.str2_proxy == "somesome"

def test_HasProps_set_error():
    c = Child()
    with pytest.raises(AttributeError) as e:
        c.int3 = 10
    assert str(e).endswith("unexpected attribute 'int3' to Child, similar attributes are int2 or int1")
    with pytest.raises(AttributeError) as e:
        c.junkjunk = 10
    assert str(e).endswith("unexpected attribute 'junkjunk' to Child, possible attributes are ds1, ds2, int1, int2, lst1, lst2 or str2")


def test_HasProps_lookup():
    p = Parent()
    d = p.lookup('int1')
    assert isinstance(d, BasicPropertyDescriptor)
    assert d.name == 'int1'
    d = p.lookup('ds1')
    assert isinstance(d, DataSpecPropertyDescriptor)
    assert d.name == 'ds1'
    d = p.lookup('lst1')
    assert isinstance(d, BasicPropertyDescriptor)
    assert d.name == 'lst1'

def test_HasProps_apply_theme():
    c = Child()
    theme = dict(int2=10, lst1=["foo", "bar"])
    c.apply_theme(theme)
    assert c.themed_values() is theme
    c.apply_theme(theme)
    assert c.themed_values() is theme

    assert c.int2 == 10
    assert c.lst1 == ["foo", "bar"]

    assert c.int1 == 10
    assert c.ds1 == None
    assert c.str2 == "foo"
    assert c.ds2 == None
    assert c.lst2 == [1,2,3]

    c.int2 = 25
    assert c.int2 == 25
    assert c.lst1 == ["foo", "bar"]

    assert c.int1 == 10
    assert c.ds1 == None
    assert c.str2 == "foo"
    assert c.ds2 == None
    assert c.lst2 == [1,2,3]

    c.ds2 = "foo"
    assert c.int2 == 25
    assert c.lst1 == ["foo", "bar"]

    assert c.int1 == 10
    assert c.ds1 == None
    assert c.str2 == "foo"
    assert c.ds2 == "foo"
    assert c.lst2 == [1,2,3]

def test_HasProps_unapply_theme():
    c = Child()
    theme = dict(int2=10, lst1=["foo", "bar"])
    c.apply_theme(theme)
    assert c.int2 == 10
    assert c.lst1 == ["foo", "bar"]

    assert c.int1 == 10
    assert c.ds1 == None
    assert c.str2 == "foo"
    assert c.ds2 == None
    assert c.lst2 == [1,2,3]

    c.unapply_theme()
    assert c.int2 == None
    assert c.lst1 == []

    assert c.int1 == 10
    assert c.ds1 == None
    assert c.str2 == "foo"
    assert c.ds2 == None
    assert c.lst2 == [1,2,3]

    assert c.themed_values() == None

class EitherSimpleDefault(hp.HasProps):
    foo = Either(List(Int), Int, default=10)

def test_HasProps_apply_theme_either_simple():

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

def test_HasProps_apply_theme_either_container():

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

def test_HasProps_apply_theme_func_default():

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

# TODO (bev) need to skip for now
# def test_HasProps_pretty():
#     p = Parent()
#     assert p.pretty() == "bokeh.core.tests.test_has_props.Parent(ds1=None, int1=10, lst1=[])"
#     old = hp.IPython
#     hp.IPython = False
#     with pytest.raises(RuntimeError):
#         p.pretty()
#     hp.IPython = old

def test_HasProps_pprint(capsys):
    p = Parent()
    p.pprint()
    out, err = capsys.readouterr()
    assert out == "bokeh.core.tests.test_has_props.Parent(ds1=None, int1=10, lst1=[])\n"
    assert err == ""
