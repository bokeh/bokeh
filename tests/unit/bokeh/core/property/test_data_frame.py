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

# External imports
import pandas as pd

# Bokeh imports
from tests.support.util.api import verify_all

from _util_property import _TestHasProps, _TestModel

# Module under test
import bokeh.core.property.data_frame as bcpp # isort:skip

#-----------------------------------------------------------------------------
# Setup
#-----------------------------------------------------------------------------

ALL = (
    'EagerDataFrame',
    'EagerSeries',
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

class Test_EagerDataFrame:
    def test_valid(self) -> None:
        prop = bcpp.EagerDataFrame()
        assert prop.is_valid(pd.DataFrame())

    def test_valid_polars(self) -> None:
        polars = pytest.importorskip('polars')
        prop = bcpp.EagerDataFrame()
        assert prop.is_valid(polars.DataFrame())

    def test_valid_pyarrow(self) -> None:
        pyarrow = pytest.importorskip('pyarrow')
        prop = bcpp.EagerDataFrame()
        assert prop.is_valid(pyarrow.table({}))

    def test_invalid(self) -> None:
        prop = bcpp.EagerDataFrame()
        assert not prop.is_valid(None)
        assert not prop.is_valid(1.0+1.0j)
        assert not prop.is_valid(())
        assert not prop.is_valid([])
        assert not prop.is_valid({})
        assert not prop.is_valid(_TestHasProps())
        assert not prop.is_valid(_TestModel())

class Test_EagerSeries:
    def test_valid(self) -> None:
        prop = bcpp.EagerSeries()
        assert prop.is_valid(pd.Series(dtype='float64'))

    def test_valid_polars(self) -> None:
        polars = pytest.importorskip('polars')
        prop = bcpp.EagerSeries()
        assert prop.is_valid(polars.Series())

    def test_valid_pyarrow(self) -> None:
        pa = pytest.importorskip('pyarrow')
        prop = bcpp.EagerSeries()
        assert prop.is_valid(pa.chunked_array([], type=pa.int64()))

    def test_invalid(self) -> None:
        prop = bcpp.EagerSeries()
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
