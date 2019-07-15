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
from . import _TestHasProps, _TestModel
from bokeh._testing.util.api import verify_all

# Module under test
import bokeh.core.property.pandas as bcpp

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

class Test_PandasDataFrame(object):

    def test_valid(self, pd):
        prop = bcpp.PandasDataFrame()
        assert prop.is_valid(pd.DataFrame())

    def test_invalid(self):
        prop = bcpp.PandasDataFrame()
        assert not prop.is_valid(None)
        assert not prop.is_valid(1.0+1.0j)
        assert not prop.is_valid(())
        assert not prop.is_valid([])
        assert not prop.is_valid({})
        assert not prop.is_valid(_TestHasProps())
        assert not prop.is_valid(_TestModel())

class Test_PandasGroupBy(object):

    def test_valid(self, pd):
        prop = bcpp.PandasGroupBy()
        assert prop.is_valid(pd.core.groupby.GroupBy(pd.DataFrame()))

    def test_invalid(self):
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
