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

# Bokeh imports
from bokeh.core.properties import Int, String, List
from bokeh.models.callbacks import CustomJS

# Module under test
from bokeh.model import Model

#-----------------------------------------------------------------------------
# Setup
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# General API
#-----------------------------------------------------------------------------

class SomeModel(Model):
    a = Int(12)
    b = String("hello")
    c = List(Int, [1, 2, 3])

class Test_js_on_change(object):

    def test_exception_for_no_callbacks(self):
        m = SomeModel()
        with pytest.raises(ValueError):
            m.js_on_change('foo')

    def test_exception_for_bad_callbacks(self):
        m = SomeModel()
        for val in [10, "bar", None, [1], {}, 10.2]:
            with pytest.raises(ValueError):
                m.js_on_change('foo', val)

    def test_with_propname(self):
        cb = CustomJS(code="")
        m0 = SomeModel()
        for name in m0.properties(self):
            m = SomeModel()
            m.js_on_change(name, cb)
            assert m.js_property_callbacks == {"change:%s" % name: [cb]}

    def test_with_non_propname(self):
        cb = CustomJS(code="")
        m1 = SomeModel()
        m1.js_on_change('foo', cb)
        assert m1.js_property_callbacks == {"foo": [cb]}

        m2 = SomeModel()
        m2.js_on_change('change:b', cb)
        assert m2.js_property_callbacks == {"change:b": [cb]}

    def test_with_multple_callbacks(self):
        cb1 = CustomJS(code="")
        cb2 = CustomJS(code="")
        m = SomeModel()
        m.js_on_change('foo', cb1, cb2)
        assert m.js_property_callbacks == {"foo": [cb1, cb2]}

    def test_with_multple_callbacks_separately(self):
        cb1 = CustomJS(code="")
        cb2 = CustomJS(code="")
        m = SomeModel()
        m.js_on_change('foo', cb1)
        assert m.js_property_callbacks == {"foo": [cb1]}
        m.js_on_change('foo', cb2)
        assert m.js_property_callbacks == {"foo": [cb1, cb2]}

    def test_ignores_dupe_callbacks(self):
        cb = CustomJS(code="")
        m = SomeModel()
        m.js_on_change('foo', cb, cb)
        assert m.js_property_callbacks == {"foo": [cb]}

class Test_js_link(object):

    def test_value_error_on_bad_attr(self):
        m1 = SomeModel()
        m2 = SomeModel()
        with pytest.raises(ValueError) as e:
            m1.js_link('junk', m2, 'b')
        assert str(e).endswith("ValueError: %r is not a property of self (%r)" % ("junk", m1))

    def test_value_error_on_bad_other(self):
        m1 = SomeModel()
        with pytest.raises(ValueError) as e:
            m1.js_link('a', 'junk', 'b')
        assert str(e).endswith("ValueError: 'other' is not a Bokeh model: %r" % "junk")

    def test_value_error_on_bad_other_attr(self):
        m1 = SomeModel()
        m2 = SomeModel()
        with pytest.raises(ValueError) as e:
            m1.js_link('a', m2, 'junk')
        assert str(e).endswith("ValueError: %r is not a property of other (%r)" % ("junk", m2))

    def test_creates_customjs(self):
        m1 = SomeModel()
        m2 = SomeModel()
        assert len(m1.js_property_callbacks) == 0
        m1.js_link('a', m2, 'b')
        assert len(m1.js_property_callbacks) == 1
        assert "change:a" in m1.js_property_callbacks
        cbs = m1.js_property_callbacks["change:a"]
        assert len(cbs) == 1
        cb = cbs[0]
        assert isinstance(cb, CustomJS)
        assert cb.args == dict(other=m2)
        assert cb.code == "other.b = this.a"

from bokeh.models import * # NOQA
from bokeh.plotting import * # NOQA
def test_all_builtin_models_default_constructible():
    bad = []
    for name, cls in Model.__class__.model_class_reverse_map.items():
        try:
            cls()
        except:
            bad.append(name)
        assert bad == []

#-----------------------------------------------------------------------------
# Dev API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Private API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Code
#-----------------------------------------------------------------------------
