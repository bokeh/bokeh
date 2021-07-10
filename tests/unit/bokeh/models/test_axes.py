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
from bokeh.models import FixedTicker, MathText

# Module under test
import bokeh.models.axes as bma # isort:skip

#-----------------------------------------------------------------------------
# Setup
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# General API
#-----------------------------------------------------------------------------

def test_ticker_accepts_number_sequences() -> None:
    a = bma.Axis(ticker=[-10, 0, 10, 20.7])
    assert isinstance(a.ticker, FixedTicker)
    assert a.ticker.ticks == [-10, 0, 10, 20.7]

    a = bma.Axis()
    a.ticker = [-10, 0, 10, 20.7]
    assert isinstance(a.ticker, FixedTicker)
    assert a.ticker.ticks == [-10, 0, 10, 20.7]

def test_axis_label_accepts_math_text() -> None:
    a = bma.Axis(axis_label=MathText(text=r"\sin(x)"))
    assert isinstance(a.axis_label, MathText)
    assert a.axis_label.text == r"\sin(x)"

#-----------------------------------------------------------------------------
# Dev API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Private API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Code
#-----------------------------------------------------------------------------
