from mock import patch
import pytest

import bokeh.core.property.descriptors as pd

def test_PropertyDescriptor__init__():
    d = pd.PropertyDescriptor("foo")
    assert d.name == "foo"

def test_PropertyDescriptor__str__():
    d = pd.PropertyDescriptor("foo")
    assert str(d) == "PropertyDescriptor(foo)"

def test_PropertyDescriptor_abstract():
    d = pd.PropertyDescriptor("foo")
    class Foo(object): pass
    f = Foo()
    with pytest.raises(NotImplementedError):
        d.__get__(f, f.__class__)

    with pytest.raises(NotImplementedError):
        d.__set__(f, 11)

    with pytest.raises(NotImplementedError):
        d.__delete__(f)

    with pytest.raises(NotImplementedError):
        d.class_default(f)

    with pytest.raises(NotImplementedError):
        d.serialized

    with pytest.raises(NotImplementedError):
        d.readonly

    with pytest.raises(NotImplementedError):
        d.has_ref

    with pytest.raises(NotImplementedError):
        d.trigger_if_changed(f, 11)

    with pytest.raises(NotImplementedError):
        d._internal_set(f, 11)

@patch('bokeh.core.property.descriptors.PropertyDescriptor._internal_set')
def test_PropertyDescriptor_set_from_json(mock_iset):
    class Foo(object): pass
    f = Foo()
    d = pd.PropertyDescriptor("foo")
    d.set_from_json(f, "bar", 10)
    assert mock_iset.called_once_with((f, "bar", 10), {})

def test_PropertyDescriptor_serializable_value():
    result = {}
    class Foo(object):
        def serialize_value(self, val):
            result['foo'] = val
    f = Foo()
    f.foo = 10

    d = pd.PropertyDescriptor("foo")
    d.property = Foo()

    # simulate the __get__ a subclass would have
    d.__get__ = lambda obj, owner: f.foo

    d.serializable_value(f)
    assert result['foo'] == 10

def test_add_prop_descriptor_to_class_dupe_name():
    d = pd.PropertyDescriptor("foo")
    new_class_attrs = {'foo': 10}
    with pytest.raises(RuntimeError) as e:
        d.add_prop_descriptor_to_class("bar", new_class_attrs, [], [], {})
    assert str(e).endswith("Two property generators both created bar.foo")

def test_BasicPropertyDescriptor__init__():
    class Foo(object):
        '''doc'''
        pass
    f = Foo()
    d = pd.BasicPropertyDescriptor("foo", f)
    assert d.name == "foo"
    assert d.property == f
    assert d.__doc__ == f.__doc__

def test_BasicPropertyDescriptor__str__():
    class Foo(object): pass
    f = Foo()
    d = pd.BasicPropertyDescriptor("foo", f)
    assert str(d) == str(f)

def test_BasicPropertyDescriptor__get__improper():
    class Foo(object): pass
    f = Foo()
    d = pd.BasicPropertyDescriptor("foo", f)
    with pytest.raises(ValueError) as e:
        d.__get__(None, None)
    assert str(e).endswith("both 'obj' and 'owner' are None, don't know what to do")

def test_BasicPropertyDescriptor__set__improper():
    class Foo(object): pass
    f = Foo()
    d = pd.BasicPropertyDescriptor("foo", f)
    with pytest.raises(RuntimeError) as e:
        d.__set__("junk", None)
    assert str(e).endswith("Cannot set a property value 'foo' on a str instance before HasProps.__init__")

def test_BasicPropertyDescriptor__delete__():
    class Foo(object):
        _property_values = dict(foo=0)
        _unstable_default_values = dict(bar=[10])
    f = Foo()
    d1 = pd.BasicPropertyDescriptor("foo", f)
    d2 = pd.BasicPropertyDescriptor("bar", f)
    d3 = pd.BasicPropertyDescriptor("baz", f)
    d1.__delete__(f)
    assert f._property_values == {}
    assert f._unstable_default_values == dict(bar=[10])
    d2.__delete__(f)
    assert f._property_values == {}
    assert f._unstable_default_values == {}
    d3.__delete__(f)
    assert f._property_values == {}
    assert f._unstable_default_values == {}

def test_BasicPropertyDescriptor_class_default():
    result = {}
    class Foo(object):
        def themed_default(*args, **kw):
            result['called'] = True
    f = Foo()
    f.readonly = "stuff"
    d = pd.BasicPropertyDescriptor("foo", f)
    d.class_default(d)
    assert result['called']

def test_BasicPropertyDescriptor_serialized():
    class Foo(object): pass
    f = Foo()
    f.serialized = "stuff"
    d = pd.BasicPropertyDescriptor("foo", f)
    assert d.serialized == "stuff"

def test_BasicPropertyDescriptor_readonly():
    class Foo(object): pass
    f = Foo()
    f.readonly = "stuff"
    d = pd.BasicPropertyDescriptor("foo", f)
    assert d.readonly == "stuff"

def test_BasicPropertyDescriptor_has_ref():
    class Foo(object): pass
    f = Foo()
    f.has_ref = "stuff"
    d = pd.BasicPropertyDescriptor("foo", f)
    assert d.has_ref == "stuff"

@patch('bokeh.core.property.descriptors.BasicPropertyDescriptor._trigger')
def test_BasicPropertyDescriptor__trigger(mock_trigger):
    class Foo(object):
        _property_values = dict(foo=10, bar=20)
    class Match(object):
        def matches(*args, **kw): return True
    class NoMatch(object):
        def matches(*args, **kw): return False
    m = Match()
    nm = NoMatch()
    d1 = pd.BasicPropertyDescriptor("foo", m)
    d2 = pd.BasicPropertyDescriptor("bar", nm)

    d1.trigger_if_changed(Foo, "junk")
    assert not mock_trigger.called

    d2.trigger_if_changed(Foo, "junk")
    assert mock_trigger.called

def test_UnitsSpecPropertyDescriptor__init__():
    class Foo(object):
        '''doc'''
        pass
    f = Foo()
    g = Foo()
    d = pd.UnitsSpecPropertyDescriptor("foo", f, g)
    assert d.name == "foo"
    assert d.property == f
    assert d.__doc__ == f.__doc__
    assert d.units_prop == g
