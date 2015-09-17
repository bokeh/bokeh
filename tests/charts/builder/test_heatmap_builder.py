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

from bokeh.charts import HeatMap
from bokeh.models import FactorRange

from bokeh.charts.builder.tests._utils import create_chart

#-----------------------------------------------------------------------------
# Classes and functions
#-----------------------------------------------------------------------------

class TestHeatMap(unittest.TestCase):
    def test_supported_input(self):
        xyvalues = OrderedDict()
        xyvalues['apples'] = [4,5,8]
        xyvalues['bananas'] = [1,2,4]
        xyvalues['pears'] = [6,5,4]

        xyvaluesdf = pd.DataFrame(xyvalues, index=['2009', '2010', '2011'])

        # prepare some data to check tests results...
        heights = widths = [0.95] * 9
        colors = ['#e2e2e2', '#75968f', '#cc7878', '#ddb7b1', '#a5bab7', '#ddb7b1',
            '#550b1d', '#e2e2e2', '#e2e2e2']
        catx = ['apples', 'bananas', 'pears', 'apples', 'bananas', 'pears',
                'apples', 'bananas', 'pears']
        rates = [4, 1, 6, 5, 2, 5, 8, 4, 4]

        caty = ['a', 'a', 'a', 'b', 'b', 'b', 'c', 'c', 'c']
        for i, _xy in enumerate([xyvalues, xyvaluesdf]):
            hm = create_chart(HeatMap, _xy, palette=colors)
            builder = hm._builders[0]
            # TODO: Fix bug
            #self.assertEqual(sorted(hm.groups), sorted(list(xyvalues.keys())))
            assert_array_equal(builder._data['height'], heights)
            assert_array_equal(builder._data['width'], widths)
            assert_array_equal(builder._data['catx'], catx)
            assert_array_equal(builder._data['rate'], rates)
            assert_array_equal(builder._source._data, builder._data)
            assert_array_equal(hm.x_range.factors, builder._catsx)
            assert_array_equal(hm.y_range.factors, builder._catsy)
            self.assertIsInstance(hm.x_range, FactorRange)
            self.assertIsInstance(hm.y_range, FactorRange)

            # TODO: (bev) not sure what correct behaviour is
            #assert_array_equal(builder._data['color'], colors)

            if i == 0: # if DataFrame
                assert_array_equal(builder._data['caty'], caty)
            else:
                _caty = ['2009']*3 + ['2010']*3 + ['2011']*3
                assert_array_equal(builder._data['caty'], _caty)


        catx = ['0', '1', '2', '0', '1', '2', '0', '1', '2']
        lvalues = [[4,5,8], [1,2,4], [6,5,4]]
        for _xy in [lvalues, np.array(lvalues)]:
            hm = create_chart(HeatMap, _xy, palette=colors)
            builder = hm._builders[0]

            # TODO: FIX bug
            #self.assertEqual(sorted(hm.groups), sorted(list(xyvalues.keys())))
            assert_array_equal(builder._data['height'], heights)
            assert_array_equal(builder._data['width'], widths)
            assert_array_equal(builder._data['catx'], catx)
            assert_array_equal(builder._data['rate'], rates)
            assert_array_equal(builder._source._data, builder._data)
            assert_array_equal(hm.x_range.factors, builder._catsx)
            assert_array_equal(hm.y_range.factors, builder._catsy)
            self.assertIsInstance(hm.x_range, FactorRange)
            self.assertIsInstance(hm.y_range, FactorRange)
            assert_array_equal(builder._data['caty'], caty)

            # TODO: (bev) not sure what correct behaviour is
            # assert_array_equal(builder._data['color'], colors)
