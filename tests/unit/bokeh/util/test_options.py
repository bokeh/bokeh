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

# Bokeh imports
from bokeh.core.properties import Int, Nullable, String

# Module under test
from bokeh.util.options import Options # isort:skip

#-----------------------------------------------------------------------------
# Setup
#-----------------------------------------------------------------------------

class DummyOpts(Options):
    foo = String(default="thing")
    bar = Nullable(Int())

#-----------------------------------------------------------------------------
# General API
#-----------------------------------------------------------------------------

def test_empty() -> None:
    empty = dict()
    o = DummyOpts(empty)
    assert o.foo == "thing"
    assert o.bar == None
    assert empty == {}

def test_exact() -> None:
    exact = dict(foo="stuff", bar=10)
    o = DummyOpts(exact)
    assert o.foo == "stuff"
    assert o.bar == 10
    assert exact == {}

def test_extra() -> None:
    extra = dict(foo="stuff", bar=10, baz=22.2)
    o = DummyOpts(extra)
    assert o.foo == "stuff"
    assert o.bar == 10
    assert extra == {'baz': 22.2}

def test_mixed() -> None:
    mixed = dict(foo="stuff", baz=22.2)
    o = DummyOpts(mixed)
    assert o.foo == "stuff"
    assert o.bar == None
    assert mixed == {'baz': 22.2}

#-----------------------------------------------------------------------------
# Dev API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Private API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Code
#-----------------------------------------------------------------------------
