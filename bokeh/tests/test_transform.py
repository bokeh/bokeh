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
from bokeh.models import (
    CategoricalColorMapper, CategoricalMarkerMapper, CategoricalPatternMapper, CumSum, Dodge,
    FactorRange, Jitter, LinearColorMapper, LogColorMapper, Stack
)
from bokeh._testing.util.api import verify_all

# Module under test
import bokeh.transform as bt

#-----------------------------------------------------------------------------
# Setup
#-----------------------------------------------------------------------------

ALL = (
    'cumsum',
    'dodge',
    'factor_cmap',
    'factor_hatch',
    'factor_mark',
    'jitter',
    'linear_cmap',
    'log_cmap',
    'stack',
    'transform',
)

#-----------------------------------------------------------------------------
# General API
#-----------------------------------------------------------------------------

Test___all__ = verify_all(bt, ALL)

class Test_cumsum(object):

    def test_basic(object):
        s = bt.cumsum("foo")
        assert isinstance(s, dict)
        assert list(s.keys()) == ["expr"]
        assert isinstance(s['expr'], CumSum)
        assert s['expr'].field == 'foo'
        assert s['expr'].include_zero == False

    def test_include_zero(object):
        s = bt.cumsum("foo", include_zero=True)
        assert isinstance(s, dict)
        assert list(s.keys()) == ["expr"]
        assert isinstance(s['expr'], CumSum)
        assert s['expr'].field == 'foo'
        assert s['expr'].include_zero == True


class Test_dodge(object):

    def test_basic(self):
        t = bt.dodge("foo", 0.5)
        assert isinstance(t, dict)
        assert set(t) == {"field", "transform"}
        assert t['field'] == "foo"
        assert isinstance(t['transform'], Dodge)
        assert t['transform'].value == 0.5
        assert t['transform'].range is None

    def test_with_range(self):
        r = FactorRange("a")
        t = bt.dodge("foo", 0.5, range=r)
        assert isinstance(t, dict)
        assert set(t) == {"field", "transform"}
        assert t['field'] == "foo"
        assert isinstance(t['transform'], Dodge)
        assert t['transform'].value == 0.5
        assert t['transform'].range is r
        assert t['transform'].range.factors == ["a"]

class Test_factor_cmap(object):

    def test_basic(self):
        t = bt.factor_cmap("foo", ["red", "green"], ["foo", "bar"], start=1, end=2, nan_color="pink")
        assert isinstance(t, dict)
        assert set(t) == {"field", "transform"}
        assert t['field'] == "foo"
        assert isinstance(t['transform'], CategoricalColorMapper)
        assert t['transform'].palette == ["red", "green"]
        assert t['transform'].factors == ["foo", "bar"]
        assert t['transform'].start == 1
        assert t['transform'].end == 2
        assert t['transform'].nan_color == "pink"

    def test_defaults(self):
        t = bt.factor_cmap("foo", ["red", "green"], ["foo", "bar"])
        assert isinstance(t, dict)
        assert set(t) == {"field", "transform"}
        assert t['field'] == "foo"
        assert isinstance(t['transform'], CategoricalColorMapper)
        assert t['transform'].palette == ["red", "green"]
        assert t['transform'].factors == ["foo", "bar"]
        assert t['transform'].start == 0
        assert t['transform'].end is None
        assert t['transform'].nan_color == "gray"

class Test_factor_hatch(object):

    def test_basic(self):
        t = bt.factor_hatch("foo", ["+", "-"], ["foo", "bar"], start=1, end=2)
        assert isinstance(t, dict)
        assert set(t) == {"field", "transform"}
        assert t['field'] == "foo"
        assert isinstance(t['transform'], CategoricalPatternMapper)
        assert t['transform'].patterns == ["+", "-"]
        assert t['transform'].factors == ["foo", "bar"]
        assert t['transform'].start == 1
        assert t['transform'].end == 2

    def test_defaults(self):
        t = bt.factor_hatch("foo", ["+", "-"], ["foo", "bar"])
        assert isinstance(t, dict)
        assert set(t) == {"field", "transform"}
        assert t['field'] == "foo"
        assert isinstance(t['transform'], CategoricalPatternMapper)
        assert t['transform'].patterns == ["+", "-"]
        assert t['transform'].factors == ["foo", "bar"]
        assert t['transform'].start == 0
        assert t['transform'].end is None


class Test_factor_mark(object):

    def test_basic(self):
        t = bt.factor_mark("foo", ["hex", "square"], ["foo", "bar"], start=1, end=2)
        assert isinstance(t, dict)
        assert set(t) == {"field", "transform"}
        assert t['field'] == "foo"
        assert isinstance(t['transform'], CategoricalMarkerMapper)
        assert t['transform'].markers == ["hex", "square"]
        assert t['transform'].factors == ["foo", "bar"]
        assert t['transform'].start == 1
        assert t['transform'].end == 2

    def test_defaults(self):
        t = bt.factor_mark("foo", ["hex", "square"], ["foo", "bar"])
        assert isinstance(t, dict)
        assert set(t) == {"field", "transform"}
        assert t['field'] == "foo"
        assert isinstance(t['transform'], CategoricalMarkerMapper)
        assert t['transform'].markers == ["hex", "square"]
        assert t['transform'].factors == ["foo", "bar"]
        assert t['transform'].start == 0
        assert t['transform'].end is None

class Test_jitter(object):

    def test_basic(self):
        t = bt.jitter("foo", width=0.5, mean=0.1, distribution="normal")
        assert isinstance(t, dict)
        assert set(t) == {"field", "transform"}
        assert t['field'] == "foo"
        assert isinstance(t['transform'], Jitter)
        assert t['transform'].width == 0.5
        assert t['transform'].mean == 0.1
        assert t['transform'].distribution == "normal"
        assert t['transform'].range is None

    def test_defaults(self):
        t = bt.jitter("foo", width=0.5)
        assert isinstance(t, dict)
        assert set(t) == {"field", "transform"}
        assert t['field'] == "foo"
        assert isinstance(t['transform'], Jitter)
        assert t['transform'].width == 0.5
        assert t['transform'].mean == 0
        assert t['transform'].distribution == "uniform"
        assert t['transform'].range is None

    def test_with_range(self):
        r = FactorRange("a")
        t = bt.jitter("foo", width=0.5, mean=0.1, range=r)
        assert isinstance(t, dict)
        assert set(t) == {"field", "transform"}
        assert t['field'] == "foo"
        assert isinstance(t['transform'], Jitter)
        assert t['transform'].width == 0.5
        assert t['transform'].mean == 0.1
        assert t['transform'].distribution == "uniform"
        assert t['transform'].range is r
        assert t['transform'].range.factors == ["a"]

class Test_linear_cmap(object):

    def test_basic(self):
        t = bt.linear_cmap("foo", ["red", "green"], 0, 10, low_color="orange", high_color="blue", nan_color="pink")
        assert isinstance(t, dict)
        assert set(t) == {"field", "transform"}
        assert t['field'] == "foo"
        assert isinstance(t['transform'], LinearColorMapper)
        assert t['transform'].palette == ["red", "green"]
        assert t['transform'].low == 0
        assert t['transform'].high == 10
        assert t['transform'].low_color == "orange"
        assert t['transform'].high_color == "blue"
        assert t['transform'].nan_color == "pink"

    def test_defaults(self):
        t = bt.linear_cmap("foo", ["red", "green"], 0, 10)
        assert isinstance(t, dict)
        assert set(t) == {"field", "transform"}
        assert t['field'] == "foo"
        assert isinstance(t['transform'], LinearColorMapper)
        assert t['transform'].palette == ["red", "green"]
        assert t['transform'].low == 0
        assert t['transform'].high == 10
        assert t['transform'].low_color is None
        assert t['transform'].high_color is None
        assert t['transform'].nan_color == "gray"

class Test_log_cmap(object):

    def test_basic(self):
        t = bt.log_cmap("foo", ["red", "green"], 0, 10, low_color="orange", high_color="blue", nan_color="pink")
        assert isinstance(t, dict)
        assert set(t) == {"field", "transform"}
        assert t['field'] == "foo"
        assert isinstance(t['transform'], LogColorMapper)
        assert t['transform'].palette == ["red", "green"]
        assert t['transform'].low == 0
        assert t['transform'].high == 10
        assert t['transform'].low_color == "orange"
        assert t['transform'].high_color == "blue"
        assert t['transform'].nan_color == "pink"

    def test_defaults(self):
        t = bt.log_cmap("foo", ["red", "green"], 0, 10)
        assert isinstance(t, dict)
        assert set(t) == {"field", "transform"}
        assert t['field'] == "foo"
        assert isinstance(t['transform'], LogColorMapper)
        assert t['transform'].palette == ["red", "green"]
        assert t['transform'].low == 0
        assert t['transform'].high == 10
        assert t['transform'].low_color is None
        assert t['transform'].high_color is None
        assert t['transform'].nan_color == "gray"

class Test_stack(object):

    def test_basic(object):
        s = bt.stack("foo", "junk")
        assert isinstance(s, dict)
        assert list(s.keys()) == ["expr"]
        assert isinstance(s['expr'], Stack)
        assert s['expr'].fields == ('foo', 'junk')

class Test_transform(object):

    def test_basic(object):
        t = bt.transform("foo", "junk")
        assert t == dict(field="foo", transform="junk")

#-----------------------------------------------------------------------------
# Dev API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Private API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Code
#-----------------------------------------------------------------------------
