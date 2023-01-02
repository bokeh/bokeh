#-----------------------------------------------------------------------------
# Copyright (c) 2012 - 2023, Anaconda, Inc., and Bokeh Contributors.
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

# Module under test
import bokeh.models.filters as bmf # isort:skip

#-----------------------------------------------------------------------------
# Setup
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# General API
#-----------------------------------------------------------------------------

def test_Filter_set_operators() -> None:
    f0 = ~bmf.BooleanFilter()
    assert isinstance(f0, bmf.InversionFilter)

    f1 = bmf.BooleanFilter() & bmf.IndexFilter()
    assert isinstance(f1, bmf.IntersectionFilter)
    assert len(f1.operands) == 2

    f2 = bmf.BooleanFilter() | bmf.IndexFilter()
    assert isinstance(f2, bmf.UnionFilter)
    assert len(f2.operands) == 2

    f3 = bmf.BooleanFilter() - bmf.IndexFilter()
    assert isinstance(f3, bmf.DifferenceFilter)
    assert len(f3.operands) == 2

    f4 = bmf.BooleanFilter() ^ bmf.IndexFilter()
    assert isinstance(f4, bmf.SymmetricDifferenceFilter)
    assert len(f4.operands) == 2

#-----------------------------------------------------------------------------
# Dev API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Private API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Code
#-----------------------------------------------------------------------------
