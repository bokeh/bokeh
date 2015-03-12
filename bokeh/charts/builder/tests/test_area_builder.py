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
from numpy.testing import assert_array_equal, assert_array_almost_equal
import pandas as pd

from bokeh.charts import Area
from bokeh.models import DataRange1d, Range1d

from bokeh.charts.builder.tests._utils import create_chart

#-----------------------------------------------------------------------------
# Classes and functions
#-----------------------------------------------------------------------------

class TestAreaBuilder(unittest.TestCase):

    def test_supported_input(self):
        xyvalues = OrderedDict(
                python=[2, 3, 7, 5, 26],
                pypy=[12, 33, 47, 15, 126],
                jython=[22, 43, 10, 25, 26],
            )

        # prepare some data to check tests results...
        zeros = np.zeros(5)
        x = np.array([4,3,2,1,0,0,1,2,3,4])
        y_jython = np.hstack((zeros, np.array(xyvalues['jython'])))
        y_pypy = np.hstack((zeros, np.array(xyvalues['pypy'])))
        y_python = np.hstack((zeros, np.array(xyvalues['python'])))

        data_keys = ['x', 'y_jython', 'y_pypy', 'y_python']
        for _xy in [xyvalues, dict(xyvalues), pd.DataFrame(xyvalues)]:
            area = create_chart(Area, _xy)
            builder = area._builders[0]
            self.assertEqual(sorted(builder._groups), sorted(list(xyvalues.keys())))
            self.assertListEqual(sorted(builder._data.keys()), data_keys)
            assert_array_equal(builder._data['x'], x)
            assert_array_equal(builder._data['y_jython'], y_jython)
            assert_array_equal(builder._data['y_pypy'], y_pypy)
            assert_array_equal(builder._data['y_python'], y_python)

            self.assertIsInstance(area.x_range, DataRange1d)
            self.assertEqual(area.x_range.sources[0].source, builder._source.columns('x').source)
            self.assertIsInstance(area.y_range, Range1d)
            assert_array_almost_equal(area.y_range.start, -12.6, decimal=4)
            assert_array_almost_equal(area.y_range.end, 138.6, decimal=4)
            self.assertEqual(builder._source._data, builder._data)

        data_keys = ['x', 'y_0', 'y_1', 'y_2']
        lvalues = [[2, 3, 7, 5, 26], [12, 33, 47, 15, 126], [22, 43, 10, 25, 26]]
        y_0, y_1, y_2 = y_python, y_pypy, y_jython
        for _xy in [lvalues, np.array(lvalues)]:
            area = create_chart(Area, _xy)
            builder = area._builders[0]

            self.assertEqual(builder._groups, ['0', '1', '2'])
            self.assertListEqual(sorted(builder._data.keys()), data_keys)
            assert_array_equal(builder._data['x'], x)
            assert_array_equal(builder._data['y_0'], y_0)
            assert_array_equal(builder._data['y_1'], y_1)
            assert_array_equal(builder._data['y_2'], y_2)

            self.assertIsInstance(area.x_range, DataRange1d)
            self.assertEqual(area.x_range.sources[0].source, builder._source.columns('x').source)
            self.assertIsInstance(area.y_range, Range1d)
            assert_array_almost_equal(area.y_range.start, -12.6, decimal=4)
            assert_array_almost_equal(area.y_range.end, 138.6, decimal=4)
            self.assertEqual(builder._source._data, builder._data)
