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
from bokeh.models import (
    CustomJSTransform,
    Dodge,
    Interpolator,
    Jitter,
    StepInterpolator,
)

#-----------------------------------------------------------------------------
# Setup
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# General API
#-----------------------------------------------------------------------------

def test_CustomJSTransform() -> None:
    custom_js_transform = CustomJSTransform()
    assert custom_js_transform.func == ""
    assert custom_js_transform.v_func == ""


def test_Dodge() -> None:
    dodge = Dodge()
    assert dodge.value == 0
    assert dodge.range is None


def test_Jitter() -> None:
    jitter = Jitter()
    assert jitter.mean == 0
    assert jitter.width == 1
    assert jitter.distribution == "uniform"
    assert jitter.range is None


def test_Interpolator() -> None:
    interpolator = Interpolator()
    assert interpolator.clip == True


def test_StepInterpolator() -> None:
    stept_interpolator = StepInterpolator()
    assert stept_interpolator.mode == "after"

#-----------------------------------------------------------------------------
# Dev API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Private API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Code
#-----------------------------------------------------------------------------
