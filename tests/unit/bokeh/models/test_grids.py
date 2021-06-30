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
from bokeh.models import FixedTicker, LinearAxis

# Module under test
import bokeh.models.grids as bmg # isort:skip

#-----------------------------------------------------------------------------
# Setup
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# General API
#-----------------------------------------------------------------------------

def test_ticker_accepts_number_sequences() -> None:
    g = bmg.Grid(ticker=[-10, 0, 10, 20.7])
    assert isinstance(g.ticker, FixedTicker)
    assert g.ticker.ticks == [-10, 0, 10, 20.7]

    g = bmg.Grid()
    g.ticker = [-10, 0, 10, 20.7]
    assert isinstance(g.ticker, FixedTicker)
    assert g.ticker.ticks == [-10, 0, 10, 20.7]

def test_ticker_accepts_axis() -> None:
    g = bmg.Grid(axis=LinearAxis())
    assert isinstance(g.axis, LinearAxis)

    g = bmg.Grid()
    g.axis = LinearAxis()
    assert isinstance(g.axis, LinearAxis)

#-----------------------------------------------------------------------------
# Dev API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Private API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Code
#-----------------------------------------------------------------------------
