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

        y_python = [ 2., 2., 3.,  3., 7., 7.,  5., 5., 26.]
        y_jython = [ 22., 22.,43., 43., 10., 10., 25., 25., 26.]
        y_pypy = [  12., 12., 33., 33., 47., 47., 15., 15., 126.]
        x = [0, 1, 1, 2, 2, 3, 3, 4, 4]

        for i, _xy in enumerate([xyvalues, xyvaluesdf]):
            hm = create_chart(Step, _xy)
            builder = hm._builders[0]
            self.assertEqual(sorted(builder._groups), sorted(list(xyvalues.keys())))
            assert_array_equal(builder._data['x'], x)

            assert_array_equal(builder._data['y_python'], y_python)
            assert_array_equal(builder._data['y_jython'], y_jython)
            assert_array_equal(builder._data['y_pypy'], y_pypy)

        lvalues = [[2, 3, 7, 5, 26], [12, 33, 47, 15, 126], [22, 43, 10, 25, 26]]
        for _xy in [lvalues, np.array(lvalues)]:
            hm = create_chart(Step, _xy)
            builder = hm._builders[0]
            self.assertEqual(builder._groups, ['0', '1', '2'])
            assert_array_equal(builder._data['y_0'], y_python)
            assert_array_equal(builder._data['y_1'], y_pypy)
            assert_array_equal(builder._data['y_2'], y_jython)
