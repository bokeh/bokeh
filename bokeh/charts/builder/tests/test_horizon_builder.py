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
            ts = create_chart(Horizon, _xy, x_names=['Date'])
            builder = ts._builders[0]
            pre = builder.prefix
            self.assertEqual(pre, 'horizon_%s_' % (ts._id.lower().replace("-", "_")))

            padded_date = [x for x in _xy['Date']]
            padded_date.insert(0, padded_date[0])
            padded_date.append(padded_date[-1])

            self.assertEqual(builder.num_folds, 3)
            self.assertEqual(builder._series, groups)
            self.assertEqual(builder._fold_height, 126.0 / 3)
            self.assertEqual(builder._groups, ['42.0', '-42.0', '84.0', '-84.0', '126.0', '-126.0'])
            self.assertEqual(len(builder._data[pre + 'x_all']), 12)
            for x in builder._data[pre + 'x_all']:
                assert_array_equal(x, padded_date)

            expected_res = [
                [0., 0., 0., 0., 63., 63., 63., 0.],
                [63., 0., 0., 18., 63., 63., 63., 63.],
                [0., 0., 0., 0., 12., 63., 63., 0.],
                [63., 0., 0., 63., 63., 63., 63., 63.],
                [0., 0., 0., 0., 0., 24., 28.5, 0.],
                [63., 9., 9., 63., 63., 63., 63., 63.],
                [63., 63., 63., 63., 85.5, 126., 126., 63.],
                [126., 63., 63., 76.5, 126., 126., 126., 126.],
                [63., 63., 63., 63., 63., 126., 126., 63.],
                [126., 76.5, 76.5, 126., 126., 126., 126., 126.],
                [63., 63., 63., 63., 63., 126., 126., 63.],
                [126., 126., 126., 126., 126., 126., 126., 126.]
            ]
            for expected, res in zip(expected_res, builder._data[pre+'y_all']):
                assert_array_equal(expected, res)