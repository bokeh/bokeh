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

from bokeh.charts import Scatter

from bokeh.charts.builder.tests._utils import create_chart

#-----------------------------------------------------------------------------
# Classes and functions
#-----------------------------------------------------------------------------

class TestScatter(unittest.TestCase):
    def test_supported_input(self):
        xyvalues = OrderedDict()
        xyvalues['python'] = [(1, 2), (3, 3), (4, 7), (5, 5), (8, 26)]
        xyvalues['pypy'] = [(1, 12), (2, 23), (4, 47), (5, 15), (8, 46)]
        xyvalues['jython'] = [(1, 22), (2, 43), (4, 10), (6, 25), (8, 26)]

        xyvaluesdf = pd.DataFrame(xyvalues)

        y_python = [2, 3, 7, 5, 26]
        y_pypy = [12, 23, 47, 15, 46]
        y_jython = [22, 43, 10, 25, 26]
        x_python = [1, 3, 4, 5, 8]
        x_pypy = [1, 2, 4, 5, 8]
        x_jython = [1, 2, 4, 6, 8]

        for i, _xy in enumerate([xyvalues, xyvaluesdf]):
            hm = create_chart(Scatter, _xy)
            builder = hm._builders[0]
            self.assertEqual(sorted(builder._groups), sorted(list(xyvalues.keys())))
            assert_array_equal(builder._data['y_python'], y_python)
            assert_array_equal(builder._data['y_jython'], y_jython)
            assert_array_equal(builder._data['y_pypy'], y_pypy)
            assert_array_equal(builder._data['x_python'], x_python)
            assert_array_equal(builder._data['x_jython'], x_jython)
            assert_array_equal(builder._data['x_pypy'], x_pypy)

        lvalues = [xyvalues['python'], xyvalues['pypy'], xyvalues['jython']]
        for _xy in [lvalues, np.array(lvalues)]:
            hm = create_chart(Scatter, _xy)
            builder = hm._builders[0]
            self.assertEqual(builder._groups, ['0', '1', '2'])
            assert_array_equal(builder._data['y_0'], y_python)
            assert_array_equal(builder._data['y_1'], y_pypy)
            assert_array_equal(builder._data['y_2'], y_jython)
            assert_array_equal(builder._data['x_0'], x_python)
            assert_array_equal(builder._data['x_1'], x_pypy)
            assert_array_equal(builder._data['x_2'], x_jython)
