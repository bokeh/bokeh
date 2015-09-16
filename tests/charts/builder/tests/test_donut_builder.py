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

from bokeh.charts import Donut

from bokeh.charts.builder.tests._utils import create_chart

#-----------------------------------------------------------------------------
# Classes and functions
#-----------------------------------------------------------------------------

class TestDonut(unittest.TestCase):

    def test_supported_input(self):
        xyvalues = OrderedDict()
        # TODO: Fix bug for donut breaking when inputs that are not float
        xyvalues['python'] = [2., 5., 3.]
        xyvalues['pypy'] = [4., 1., 4.]
        xyvalues['jython'] = [6., 4., 3.]

        xyvalues_int = OrderedDict()
        for k, values in xyvalues.items():
            xyvalues_int[k] = [int(val) for val in values]

        for xyvalues in [xyvalues, xyvalues_int]:
            cat = ["sets", "dicts", "odicts"]
            start = [0, 2.3561944901923448, 4.3196898986859651]
            end = [2.3561944901923448, 4.3196898986859651, 6.2831853071795862]
            colors = ['#f22c40', '#5ab738', '#407ee7']

            # TODO: Chart is not working with DataFrames anymore.
            #       Fix it and add test case for , pd.DataFrame(xyvalues)
            for i, _xy in enumerate([xyvalues]):
                _chart = create_chart(Donut, _xy, cat=cat)
                builder = _chart._builders[0]
                self.assertEqual(builder._groups, cat)
                assert_array_equal(builder._data['start'], start)
                assert_array_equal(builder._data['end'], end)
                assert_array_equal(builder._data['colors'], colors)

                # TODO: Test for external ring source values is missing as it needs
                #       some refactoring to expose those values calculation

        lvalues = [[2., 5., 3.], [4., 1., 4.], [6., 4., 3.]]
        lvalues_int = [[2, 5, 3], [4, 1, 4], [6, 4, 3]]
        for lvalues in [lvalues, lvalues_int]:
            for i, _xy in enumerate([lvalues, np.array(lvalues)]):
                _chart = create_chart(Donut, _xy, cat=cat)
                builder = _chart._builders[0]
                self.assertEqual(builder._groups, cat)
                assert_array_equal(builder._data['start'], start)
                assert_array_equal(builder._data['end'], end)
                assert_array_equal(builder._data['colors'], colors)

                # TODO: Test for external ring source values is missing as it needs
                #       some refactoring to expose those values calculation
