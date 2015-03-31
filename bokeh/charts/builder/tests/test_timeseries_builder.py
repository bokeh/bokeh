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

import numpy as np
from numpy.testing import assert_array_equal
import pandas as pd

from bokeh.charts import TimeSeries

from bokeh.charts.builder.tests._utils import create_chart

#-----------------------------------------------------------------------------
# Classes and functions
#-----------------------------------------------------------------------------

class TestTimeSeries(unittest.TestCase):
    def test_supported_input(self):
        now = datetime.datetime.now()
        delta = datetime.timedelta(minutes=1)
        dts = [now + delta*i for i in range(5)]
        xyvalues = OrderedDict({'Date': dts})
        y_python = xyvalues['python'] = [2, 3, 7, 5, 26]
        y_pypy = xyvalues['pypy'] = [12, 33, 47, 15, 126]
        y_jython = xyvalues['jython'] = [22, 43, 10, 25, 26]

        xyvaluesdf = pd.DataFrame(xyvalues)
        groups = ['python', 'pypy', 'jython']
        for i, _xy in enumerate([xyvalues, xyvaluesdf]):
            ts = create_chart(TimeSeries, _xy, x_names=['Date'])
            builder = ts._builders[0]
            self.assertEqual(builder.y_names, groups)
            if _xy is xyvaluesdf:
                assert_array_equal(builder._data['Date'], xyvaluesdf['Date'])
            else:
                assert_array_equal(builder._data['Date'], dts)

            assert_array_equal(builder._data['python'], y_python)
            assert_array_equal(builder._data['pypy'], y_pypy)
            assert_array_equal(builder._data['jython'], y_jython)

        lvalues = [[2, 3, 7, 5, 26], [12, 33, 47, 15, 126], [22, 43, 10, 25, 26]]
        for _xy in [lvalues, np.array(lvalues)]:
            hm = create_chart(TimeSeries, _xy, index=dts)
            builder = hm._builders[0]
            self.assertEqual(builder.y_names, ['0', '1', '2'])
            assert_array_equal(builder._data['x'], dts)
            
            assert_array_equal(builder._data['0'], y_python)
            assert_array_equal(builder._data['1'], y_pypy)
            assert_array_equal(builder._data['2'], y_jython)
