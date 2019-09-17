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
from pytest import raises

# Bokeh imports
from bokeh.models import Slider

# Module under test
from bokeh.models import CustomJS

#-----------------------------------------------------------------------------
# Setup
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# General API
#-----------------------------------------------------------------------------

def test_js_callback():
    slider = Slider()

    cb = CustomJS(code="foo();", args=dict(x=slider))
    assert 'foo()' in cb.code
    assert cb.args['x'] is slider

    cb = CustomJS(code="foo();", args=dict(x=3))
    assert 'foo()' in cb.code
    assert cb.args['x'] == 3

    with raises(AttributeError):  # kwargs not supported
        CustomJS(code="foo();", x=slider)


def test_py_callback():
    slider = Slider()
    foo = None  # fool pyflakes

    def cb(x=slider):
        foo()
    cb = CustomJS.from_py_func(cb)
    assert 'foo()' in cb.code
    assert cb.args['x'] is slider

    def cb(x=4):
        foo()
    cb = CustomJS.from_py_func(cb)
    assert 'foo()' in cb.code
    assert cb.args['x'] == 4

#-----------------------------------------------------------------------------
# Dev API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Private API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Code
#-----------------------------------------------------------------------------
