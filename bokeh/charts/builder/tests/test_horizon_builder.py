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
import datetime
import unittest

from numpy.testing import assert_array_equal
import pandas as pd

from bokeh.charts import Horizon

from bokeh.charts.builder.tests._utils import create_chart

#-----------------------------------------------------------------------------
# Classes and functions
#-----------------------------------------------------------------------------

class TestHorizon(unittest.TestCase):
    def test_supported_input(self):
        now = datetime.datetime.now()
        delta = datetime.timedelta(minutes=1)
        dts = [now + delta*i for i in range(6)]
        xyvalues = OrderedDict({'Date': dts})
        # Repeat the starting and trailing points in order to
        xyvalues['python'] = [-120, -120, -30, 50, 100, 103]
        xyvalues['pypy'] = [-75, -75, -33, 15, 126, 126]

        xyvaluesdf = pd.DataFrame(xyvalues)
        groups = ['python', 'pypy']
        for i, _xy in enumerate([xyvalues, xyvaluesdf]):
            ts = create_chart(Horizon, _xy, index='Date')
            builder = ts._builders[0]

            padded_date = [x for x in _xy['Date']]
            padded_date.insert(0, padded_date[0])
            padded_date.append(padded_date[-1])

            self.assertEqual(builder.num_folds, 3)
            self.assertEqual(builder._series, groups)
            self.assertEqual(builder._fold_height, 126.0 / 3)
            self.assertEqual(builder._groups, ['42.0', '-42.0', '84.0', '-84.0', '126.0', '-126.0'])
            assert_array_equal(builder._data['x_python'], padded_date)
            assert_array_equal(builder._data['x_pypy'], padded_date)
            assert_array_equal(builder._data['y_fold-3_python'], [63, 9, 9 ,63, 63, 63, 63, 63])
            assert_array_equal(builder._data['y_fold-2_python'], [63, 0, 0, 63, 63, 63, 63, 63])
            assert_array_equal(builder._data['y_fold-1_python'], [63, 0, 0, 18, 63, 63, 63, 63])
            assert_array_equal(builder._data['y_fold1_python'], [0, 0, 0, 0, 63, 63, 63, 0])
            assert_array_equal(builder._data['y_fold2_python'], [0, 0, 0, 0, 12, 63, 63, 0])
            assert_array_equal(builder._data['y_fold3_python'], [0, 0, 0, 0, 0, 24, 28.5, 0])
            assert_array_equal(builder._data['y_fold-3_pypy'], [126, 126, 126, 126, 126, 126, 126, 126])
            assert_array_equal(builder._data['y_fold-2_pypy'], [126, 76.5, 76.5, 126, 126, 126, 126, 126])
            assert_array_equal(builder._data['y_fold-1_pypy'], [126, 63, 63, 76.5, 126, 126, 126, 126])
            assert_array_equal(builder._data['y_fold1_pypy'], [63, 63, 63, 63, 85.5, 126, 126, 63])
            assert_array_equal(builder._data['y_fold2_pypy'], [63, 63, 63, 63, 63, 126, 126, 63])
            assert_array_equal(builder._data['y_fold3_pypy'], [63, 63, 63, 63, 63, 126, 126, 63])
