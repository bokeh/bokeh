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

# External imports
import pandas as pd

# Bokeh imports
from tests.support.util.api import verify_all

from _util_property import _TestHasProps, _TestModel

# Module under test
import bokeh.core.property.pd as bcpp # isort:skip

#-----------------------------------------------------------------------------
# Setup
#-----------------------------------------------------------------------------

ALL = (
    'PandasDataFrame',
    'PandasGroupBy',
)

#-----------------------------------------------------------------------------
# General API
#-----------------------------------------------------------------------------


class Test_PandasDataFrame:
    def test_valid(self) -> None:
        prop = bcpp.PandasDataFrame()
        assert prop.is_valid(pd.DataFrame())

    def test_invalid(self) -> None:
        prop = bcpp.PandasDataFrame()
        assert not prop.is_valid(None)
        assert not prop.is_valid(1.0+1.0j)
        assert not prop.is_valid(())
        assert not prop.is_valid([])
        assert not prop.is_valid({})
        assert not prop.is_valid(_TestHasProps())
        assert not prop.is_valid(_TestModel())


class Test_PandasGroupBy:
    def test_valid(self) -> None:
        prop = bcpp.PandasGroupBy()
        assert prop.is_valid(pd.core.groupby.GroupBy(pd.DataFrame()))

    def test_invalid(self) -> None:
        prop = bcpp.PandasGroupBy()
        assert not prop.is_valid(None)
        assert not prop.is_valid(1.0+1.0j)
        assert not prop.is_valid(())
        assert not prop.is_valid([])
        assert not prop.is_valid({})
        assert not prop.is_valid(_TestHasProps())
        assert not prop.is_valid(_TestModel())

#-----------------------------------------------------------------------------
# Dev API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Private API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Code
#-----------------------------------------------------------------------------

Test___all__ = verify_all(bcpp, ALL)
