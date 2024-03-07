#-----------------------------------------------------------------------------
# Copyright (c) Anaconda, Inc., and Bokeh Contributors.
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

# Standard library imports
import typing as tp
from unittest.mock import (
    ANY,
    MagicMock,
    call,
    patch,
)

# Bokeh imports
from bokeh.core.properties import (
    Alias,
    DeprecatedAlias,
    Int,
    List,
    Nullable,
)
from bokeh.model import Model
from bokeh.util.warnings import BokehDeprecationWarning
from tests.support.util.api import verify_all

# Module under test
import bokeh.core.property.descriptors as bcpd # isort:skip

#-----------------------------------------------------------------------------
# Setup
#-----------------------------------------------------------------------------

ALL = (
    'AliasPropertyDescriptor',
    'ColumnDataPropertyDescriptor',
    'DataSpecPropertyDescriptor',
    'DeprecatedAliasPropertyDescriptor',
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
    def test_set_from_json(self, mock_set: MagicMock, mock_get: MagicMock) -> None:
        f = Foo()
        d = bcpd.PropertyDescriptor("foo", f)
        d.set_from_json(f, "bar")
        assert mock_get.mock_calls == [call(f)]
        assert mock_set.mock_calls == [call(f, mock_get(), 'bar', setter=None)]

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

        calls: list[str] = []

        def cb(attr: str, old: tp.Any, new: tp.Any) -> None:
            calls.append(attr)

        for name in ['foo', 'bar', 'baz', 'quux']:
            f.on_change(name, cb)

        model_unstable_default_values = dict(
            js_event_callbacks={},
            js_property_callbacks={},
            subscribed_events=set(),
            tags=[],
        )

        assert f._property_values == {}
        assert f._unstable_default_values == dict(
            **model_unstable_default_values,
            bar=[10],
            quux=[30],
        )

        del f.foo
        assert f._property_values == {}
        assert f._unstable_default_values == dict(
            **model_unstable_default_values,
            bar=[10],
            quux=[30],
        )
        assert calls == []

        f.baz = 50

        assert f.baz == 50
        assert f._unstable_default_values == dict(
            **model_unstable_default_values,
            bar=[10],
            quux=[30],
        )
        assert calls == ['baz']

        del f.baz
        assert f.baz == 20
        assert f._unstable_default_values == dict(
            **model_unstable_default_values,
            bar=[10],
            quux=[30],
        )
        assert calls == ['baz', 'baz']

        del f.bar
        assert f._property_values == {}
        assert f._unstable_default_values == dict(
            **model_unstable_default_values,
            quux=[30],
        )
        assert calls == ['baz', 'baz']

        f.bar = [60]
        assert f.bar == [60]
        assert f._unstable_default_values == dict(
            **model_unstable_default_values,
            quux=[30],
        )
        assert calls == ['baz', 'baz', 'bar']

        del f.bar
        assert f.bar == [10]
        assert f._unstable_default_values == dict(
            **model_unstable_default_values,
            bar=[10],
            quux=[30],
        )
        assert calls == ['baz', 'baz', 'bar', 'bar']

        del f.quux
        assert f._unstable_default_values == dict(
            **model_unstable_default_values,
            bar=[10],
        )
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

class Test_AliasDescriptor:
    def test___init__(self) -> None:
        f = Alias("bar")
        d = bcpd.AliasPropertyDescriptor("foo", f)
        assert d.name == "foo"
        assert d.aliased_name == "bar"
        assert d.property == f
        assert d.__doc__ == "This is a compatibility alias for the 'bar' property."

    def test_values(self) -> None:
        class Some(Model):
            p0 = Int(default=17)
            p1 = Alias("p0")

        obj = Some()

        assert obj.p0 == 17
        assert obj.p1 == 17

        obj.p0 = 18
        assert obj.p0 == 18
        assert obj.p1 == 18

        obj.p1 = 19
        assert obj.p0 == 19
        assert obj.p1 == 19

class Test_DeprecatedAliasDescriptor:
    def test___init__(self) -> None:
        f = DeprecatedAlias("bar", since=(3, 1, 0))
        d = bcpd.DeprecatedAliasPropertyDescriptor("foo", f)
        assert d.name == "foo"
        assert d.aliased_name == "bar"
        assert d.property == f
        assert d.__doc__ == """\
This is a backwards compatibility alias for the 'bar' property.

.. note::
    Property 'foo' was deprecated in Bokeh 3.1.0 and will be removed
    in the future. Update your code to use 'bar' instead.
"""

    @patch("warnings.warn")
    def test_warns(self, mock_warn: MagicMock) -> None:
        class Some(Model):
            p0 = Int(default=17)
            p1 = DeprecatedAlias("p0", since=(3, 1, 0))

        obj = Some()

        assert obj.p0 == 17
        assert not mock_warn.called

        assert obj.p1 == 17
        mock_warn.assert_called_once_with(
            "'p1' was deprecated in Bokeh 3.1.0 and will be removed, use 'p0' instead.",
            BokehDeprecationWarning,
            stacklevel=ANY,
        )
        mock_warn.reset_mock()

        obj.p0 = 18
        assert not mock_warn.called

        obj.p1 = 19
        mock_warn.assert_called_once_with(
            "'p1' was deprecated in Bokeh 3.1.0 and will be removed, use 'p0' instead.",
            BokehDeprecationWarning,
            stacklevel=ANY,
        )
        mock_warn.reset_mock()

#-----------------------------------------------------------------------------
# Private API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Code
#-----------------------------------------------------------------------------

Test___all__ = verify_all(bcpd, ALL)
