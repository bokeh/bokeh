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

from collections import OrderedDict
import unittest

import numpy as np
from numpy.testing import assert_array_equal
import pandas as pd

from bokeh.charts import ChartDataSource, AttrSpec
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
        self._single_col_spec = [AttrSpec(self._auto_data, columns='cyl',
                                 attribute='test', iterable=['a', 'b'])]
        self._multi_col_spec = [AttrSpec(self._auto_data, columns=('cyl', 'origin'),
                                         attribute='test', iterable=['a', 'b'])]

    def test_list(self):
        ds = ChartDataSource.from_data(*self._list_data)
        assert len(ds.columns) == 2
        assert len(ds.index) == 4

    def test_array(self):
        ds = ChartDataSource.from_data(*self._array_data)
        assert len(ds.columns) == 2
        assert len(ds.index) == 4

    def test_pandas(self):
        ds = ChartDataSource.from_data(self._pd_data)
        assert len(ds.columns) == 2
        assert len(ds.index) == 4

        ds = ChartDataSource(self._pd_data)
        assert len(ds.columns) == 2
        assert len(ds.index) == 4

    def test_dict(self):
        ds = ChartDataSource.from_data(self._dict_data)
        assert len(ds.columns) == 2
        assert len(ds.index) == 4

    def test_records(self):
        ds = ChartDataSource.from_data(self._records_data)
        assert len(ds.columns) == 2
        assert len(ds.index) == 4

    def test_groupby(self):
        ds = ChartDataSource(df=self._auto_data)
        groups = list(ds.groupby(*self._single_col_spec))
        assert len(groups) == 5

        ds = ChartDataSource(df=self._auto_data)
        groups = list(ds.groupby(*self._multi_col_spec))
        assert len(groups) == 9

    def test_selections(self):
        ds = ChartDataSource.from_data(*self._array_data)
        try:
            selections = [ds[dim] for dim in ds._required_dims]
        except KeyError:
            self.fail('Required dimension not correctly set by ChartDataSource.')

    def test_blaze_data_no_fields(self):
        #import blaze
        pass
