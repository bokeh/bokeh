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

        data_keys = ['area_jython', 'area_pypy', 'area_python', 'area_x',
                     'jython', 'pypy', 'python']
        for _xy in [xyvalues, dict(xyvalues), pd.DataFrame(xyvalues)]:
            area = create_chart(Area, _xy)
            builder = area._builders[0]
            pre = builder.prefix
            self.assertEqual(pre, 'area_%s_' % (area._id.lower().replace("-", "_")))
            data_keys = [pre + 'jython', pre + 'pypy', pre + 'python', pre + 'x',
                        'jython', 'pypy', 'python']
            self.assertEqual(sorted(builder.y), sorted(list(xyvalues.keys())))
            self.assertListEqual(sorted(builder._data.keys()), data_keys)
            assert_array_equal(builder._data[pre + 'x'], x)
            assert_array_equal(builder._data[pre + 'jython'], y_jython)
            assert_array_equal(builder._data[pre + 'pypy'], y_pypy)
            assert_array_equal(builder._data[pre + 'python'], y_python)

            self.assertIsInstance(area.x_range, DataRange1d)
            self.assertIsInstance(area.y_range, DataRange1d)
            self.assertEqual(builder._source._data, builder._data)

        data_keys = ['0', '1', '2', 'area_0', 'area_1', 'area_2', 'area_x']
        lvalues = [[2, 3, 7, 5, 26], [12, 33, 47, 15, 126], [22, 43, 10, 25, 26]]
        y_0, y_1, y_2 = y_python, y_pypy, y_jython
        for _xy in [lvalues, np.array(lvalues)]:
            area = create_chart(Area, _xy)
            builder = area._builders[0]
            pre = builder.prefix
            self.assertEqual(pre, 'area_%s_' % (area._id.lower().replace("-", "_")))
            data_keys = ['0', '1', '2', pre + '0', pre + '1', pre + '2', pre + 'x']

            self.assertEqual(builder.y, ['0', '1', '2'])
            self.assertListEqual(sorted(builder._data.keys()), data_keys)
            assert_array_equal(builder._data[pre + 'x'], x)
            assert_array_equal(builder._data[pre + '0'], y_0)
            assert_array_equal(builder._data[pre + '1'], y_1)
            assert_array_equal(builder._data[pre + '2'], y_2)

            self.assertIsInstance(area.x_range, DataRange1d)
            self.assertIsInstance(area.y_range, DataRange1d)
            self.assertEqual(builder._source._data, builder._data)
