""" This is the Bokeh charts testing interface.

"""
#-----------------------------------------------------------------------------
# Copyright (c) 2012 - 2014, Continuum Analytics, Inc. All rights reserved.
#
# Powered by the Bokeh Development Team.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Imports
#-----------------------------------------------------------------------------

from __future__ import absolute_import

import unittest

import numpy as np
import pandas as pd

from bokeh.charts._data_source import ChartDataSource
from bokeh.charts._attributes import AttrSpec
from bokeh.sampledata.autompg import autompg

#-----------------------------------------------------------------------------
# Classes and functions
#-----------------------------------------------------------------------------


class TestChartDataSource(unittest.TestCase):
    def setUp(self):
        self._list_data = [[1, 2, 3, 4], [2, 3, 4, 5]]
        self._array_data = [np.array(item) for item in self._list_data]
        self._dict_data = {'col1': self._list_data[0],
                           'col2': self._list_data[1]}
        self._pd_data = pd.DataFrame(self._dict_data)
        self._records_data = self._pd_data.to_dict(orient='records')

        self._auto_data = autompg
        self._single_col_spec = {'test': AttrSpec(df=self._auto_data, columns='cyl',
                                 name='test', iterable=['a', 'b'])}
        self._multi_col_spec = {'test': AttrSpec(df=self._auto_data,
                                                 columns=('cyl', 'origin'),
                                                 name='test', iterable=['a', 'b'])}

    def test_list(self):
        """Test creating chart data source from array-like list data."""
        ds = ChartDataSource.from_data(*self._list_data)
        assert len(ds.columns) == 2
        assert len(ds.index) == 4

    def test_array(self):
        """Test creating chart data source from array-like numpy data."""
        ds = ChartDataSource.from_data(*self._array_data)
        assert len(ds.columns) == 2
        assert len(ds.index) == 4

    def test_pandas(self):
        """Test creating chart data source from existing dataframe."""
        ds = ChartDataSource.from_data(self._pd_data)
        assert len(ds.columns) == 2
        assert len(ds.index) == 4

        ds = ChartDataSource(self._pd_data)
        assert len(ds.columns) == 2
        assert len(ds.index) == 4

    def test_dict(self):
        """Test creating chart data source from dict of arrays."""
        ds = ChartDataSource.from_data(self._dict_data)
        assert len(ds.columns) == 2
        assert len(ds.index) == 4

    def test_records(self):
        """Test creating chart data source from array of dicts."""
        ds = ChartDataSource.from_data(self._records_data)
        assert len(ds.columns) == 2
        assert len(ds.index) == 4

    def test_groupby(self):
        ds = ChartDataSource(df=self._auto_data)
        groups = list(ds.groupby(**self._single_col_spec))
        assert len(groups) == 5

        ds = ChartDataSource(df=self._auto_data)
        groups = list(ds.groupby(**self._multi_col_spec))
        assert len(groups) == 9

    def test_derived_selections(self):
        ds = ChartDataSource.from_data(*self._array_data)
        try:
            selections = [ds[dim] for dim in ds._required_dims]
        except KeyError:
            self.fail('Required dimension not correctly set by ChartDataSource.')

    def test_blaze_data_no_fields(self):
        #import blaze
        pass
