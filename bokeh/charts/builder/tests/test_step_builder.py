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

from collections import OrderedDict
import unittest

import numpy as np
from numpy.testing import assert_array_equal
import pandas as pd

from bokeh.charts import Step

from bokeh.charts.builder.tests._utils import create_chart

#-----------------------------------------------------------------------------
# Classes and functions
#-----------------------------------------------------------------------------

class TestStep(unittest.TestCase):
    def test_supported_input(self):
        xyvalues = OrderedDict()
        xyvalues['python'] = [2, 3, 7, 5, 26]
        xyvalues['pypy'] = [12, 33, 47, 15, 126]
        xyvalues['jython'] = [22, 43, 10, 25, 26]
        xyvaluesdf = pd.DataFrame(xyvalues)

        y1_python = [2, 3, 7, 5]
        y2_python = [3, 7, 5, 26]
        y1_jython = [22, 43, 10, 25]
        y2_jython = [43, 10, 25, 26]
        y1_pypy = [12, 33, 47, 15]
        y2_pypy = [33, 47, 15, 126]
        x2 = [1, 2, 3, 4]
        x = [0, 1, 2, 3]

        for i, _xy in enumerate([xyvalues, xyvaluesdf]):
            hm = create_chart(Step, _xy)
            builder = hm._builders[0]
            self.assertEqual(sorted(builder._groups), sorted(list(xyvalues.keys())))
            assert_array_equal(builder._data['x'], x)
            assert_array_equal(builder._data['x2'], x2)

            assert_array_equal(builder._data['y1_python'], y1_python)
            assert_array_equal(builder._data['y2_python'], y2_python)
            assert_array_equal(builder._data['y1_jython'], y1_jython)
            assert_array_equal(builder._data['y2_jython'], y2_jython)
            assert_array_equal(builder._data['y1_pypy'], y1_pypy)
            assert_array_equal(builder._data['y2_pypy'], y2_pypy)


        lvalues = [[2, 3, 7, 5, 26], [12, 33, 47, 15, 126], [22, 43, 10, 25, 26]]
        for _xy in [lvalues, np.array(lvalues)]:
            hm = create_chart(Step, _xy)
            builder = hm._builders[0]
            self.assertEqual(builder._groups, ['0', '1', '2'])
            assert_array_equal(builder._data['y1_0'], y1_python)
            assert_array_equal(builder._data['y2_0'], y2_python)
            assert_array_equal(builder._data['y1_1'], y1_pypy)
            assert_array_equal(builder._data['y2_1'], y2_pypy)
            assert_array_equal(builder._data['y1_2'], y1_jython)
            assert_array_equal(builder._data['y2_2'], y2_jython)

