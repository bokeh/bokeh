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
from bokeh._testing.util.api import verify_all
from bokeh.core.properties import Int, List, Nullable
from bokeh.model import Model

# Module under test
import bokeh.core.property.descriptors as bcpd # isort:skip

#-----------------------------------------------------------------------------
# Setup
#-----------------------------------------------------------------------------

ALL = (
    'AliasPropertyDescriptor',
    'ColumnDataPropertyDescriptor',
    'DataSpecPropertyDescriptor',
    'PropertyDescriptor',
    'UnitsSpecPropertyDescriptor',
    'UnsetValueError',
)

#-----------------------------------------------------------------------------
# General API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Dev API
#-----------------------------------------------------------------------------
class Foo:
    def prepare_value(self, owner, name, value):
        return value
    def from_json(self, x, models=None, setter=None):
        return 10

class Test_PropertyDescriptor:

    def test___init__(self) -> None:
        class Foo:
            '''doc'''
            pass
        f = Foo()
        d = bcpd.PropertyDescriptor("foo", f)
        assert d.name == "foo"
        assert d.property == f
        assert d.__doc__ == f.__doc__

    def test___str__(self) -> None:
        f = Foo()
        d = bcpd.PropertyDescriptor("foo", f)
        assert str(d) == str(f)

    @patch('bokeh.core.property.descriptors.PropertyDescriptor._get')
    @patch('bokeh.core.property.descriptors.PropertyDescriptor._set')
    def test_set_from_json(self, mock_get: MagicMock, mock_set: MagicMock) -> None:
        f = Foo()
        d = bcpd.PropertyDescriptor("foo", f)
        d.set_from_json(f, "bar", models=10)
        assert mock_get.called_once_with((f, "bar", 10), {})
        assert mock_set.called_once_with((f, "bar", 10), {})

    def test_erializable_value(self) -> None:
        result = {}
        class Foo:
            def serialize_value(self, val):
                result['foo'] = val
        f = Foo()
        f.foo = 10

        d = bcpd.PropertyDescriptor("foo", f)
        d.property = Foo()

        # simulate the __get__ a subclass would have
        d.__get__ = lambda obj, owner: f.foo

        d.serializable_value(f)
        assert result['foo'] == 10

    def test___get__improper(self) -> None:
        f = Foo()
        d = bcpd.PropertyDescriptor("foo", f)
        with pytest.raises(ValueError) as e:
            d.__get__(None, None)
        assert str(e.value).endswith("both 'obj' and 'owner' are None, don't know what to do")

    def test___set__improper(self) -> None:
        f = Foo()
        d = bcpd.PropertyDescriptor("foo", f)
        with pytest.raises(RuntimeError) as e:
            d.__set__("junk", None)
        assert str(e.value).endswith("Cannot set a property value 'foo' on a str instance before HasProps.__init__")

    def test___delete__(self) -> None:
        class Foo(Model):
            foo = Nullable(Int())
            bar = List(Int, default=[10])
            baz = Int(default=20)
            quux = List(Int, default=[30])
        f = Foo()
        f.foo
        f.bar
        f.baz
        f.quux

        calls = []

        def cb(attr, old, new):
            calls.append(attr)

        for name in ['foo', 'bar', 'baz', 'quux']:
            f.on_change(name, cb)

        assert f._property_values == {}
        assert f._unstable_default_values == dict(bar=[10], quux=[30])

        del f.foo
        assert f._property_values == {}
        assert f._unstable_default_values == dict(bar=[10], quux=[30])
        assert calls == []

        f.baz = 50

        assert f.baz == 50
        assert f._unstable_default_values == dict(bar=[10], quux=[30])
        assert calls == ['baz']

        del f.baz
        assert f.baz == 20
        assert f._unstable_default_values == dict(bar=[10], quux=[30])
        assert calls == ['baz', 'baz']

        del f.bar
        assert f._property_values == {}
        assert f._unstable_default_values == dict(quux=[30])
        assert calls == ['baz', 'baz']

        f.bar = [60]
        assert f.bar == [60]
        assert f._unstable_default_values == dict(quux=[30])
        assert calls == ['baz', 'baz', 'bar']

        del f.bar
        assert f.bar == [10]
        assert f._unstable_default_values == dict(bar=[10], quux=[30])
        assert calls == ['baz', 'baz', 'bar', 'bar']

        del f.quux
        assert f._unstable_default_values == dict(bar=[10])
        assert calls == ['baz', 'baz', 'bar', 'bar']

    def test_class_default(self) -> None:
        result = {}
        class Foo:
            def themed_default(*args, **kw):
                result['called'] = True
        f = Foo()
        f.readonly = "stuff"
        d = bcpd.PropertyDescriptor("foo", f)
        d.class_default(d)
        assert result['called']

    def test_serialized(self) -> None:
        class Foo:
            pass

        f = Foo()
        f.serialized = "stuff"
        d = bcpd.PropertyDescriptor("foo", f)
        assert d.serialized == "stuff"

    def test_readonly(self) -> None:
        class Foo:
            pass

        f = Foo()
        f.readonly = "stuff"
        d = bcpd.PropertyDescriptor("foo", f)
        assert d.readonly == "stuff"

    def test_has_ref(self) -> None:
        class Foo:
            pass

        f = Foo()
        f.has_ref = "stuff"
        d = bcpd.PropertyDescriptor("foo", f)
        assert d.has_ref == "stuff"

    @patch('bokeh.core.property.descriptors.PropertyDescriptor._trigger')
    def test__trigger(self, mock_trigger: MagicMock) -> None:
        class Foo:
            _property_values = dict(foo=10, bar=20)

        class Match:
            def matches(*args, **kw): return True

        class NoMatch:
            def matches(*args, **kw): return False
        m = Match()
        nm = NoMatch()
        d1 = bcpd.PropertyDescriptor("foo", m)
        d2 = bcpd.PropertyDescriptor("bar", nm)

        d1.trigger_if_changed(Foo, "junk")
        assert not mock_trigger.called

        d2.trigger_if_changed(Foo, "junk")
        assert mock_trigger.called


class Test_UnitSpecDescriptor:
    def test___init__(self) -> None:
        class Foo:
            '''doc'''
            pass
        f = Foo()
        g = Foo()
        d = bcpd.UnitsSpecPropertyDescriptor("foo", f, g)
        assert d.name == "foo"
        assert d.property == f
        assert d.__doc__ == f.__doc__
        assert d.units_prop == g

class Test_AliasSpecDescriptor:
    def test___init__(self) -> None:
        class Foo:
            '''doc'''
            pass
        f = Foo()
        d = bcpd.AliasPropertyDescriptor("foo", "bar", f)
        assert d.name == "foo"
        assert d.aliased_name == "bar"
        assert d.property == f
        assert d.__doc__ == "This is a compatibility alias for the ``bar`` property"

#-----------------------------------------------------------------------------
# Private API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Code
#-----------------------------------------------------------------------------

Test___all__ = verify_all(bcpd, ALL)
