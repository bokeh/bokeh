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

from bokeh._legacy_charts import Dot

from ._utils import create_chart

#-----------------------------------------------------------------------------
# Classes and functions
#-----------------------------------------------------------------------------

class TestDot(unittest.TestCase):
    def test_supported_input(self):
        xyvalues = OrderedDict()
        xyvalues['python']=[2, 5]
        xyvalues['pypy']=[12, 40]
        xyvalues['jython']=[22, 30]

        xyvaluesdf = pd.DataFrame(xyvalues, index=['lists', 'loops'])

        cat = ['lists', 'loops']
        catjython = ['lists:0.75', 'loops:0.75']
        catpypy = ['lists:0.5', 'loops:0.5']
        catpython = ['lists:0.25', 'loops:0.25']
        python = seg_top_python = [2, 5]
        pypy = seg_top_pypy = [12, 40]
        jython = seg_top_jython = [22, 30]
        zero = [0, 0]

        for i, _xy in enumerate([xyvalues, xyvaluesdf]):
            hm = create_chart(Dot, _xy, cat=cat)
            builder = hm._builders[0]
            self.assertEqual(sorted(builder._groups), sorted(list(xyvalues.keys())))
            assert_array_equal(builder._data['cat'], cat)
            assert_array_equal(builder._data['catjython'], catjython)
            assert_array_equal(builder._data['catpython'], catpython)
            assert_array_equal(builder._data['catpypy'], catpypy)

            assert_array_equal(builder._data['python'], python)
            assert_array_equal(builder._data['jython'], jython)
            assert_array_equal(builder._data['pypy'], pypy)

            assert_array_equal(builder._data['seg_top_python'], seg_top_python)
            assert_array_equal(builder._data['seg_top_jython'], seg_top_jython)
            assert_array_equal(builder._data['seg_top_pypy'], seg_top_pypy)

            assert_array_equal(builder._data['z_python'], zero)
            assert_array_equal(builder._data['z_pypy'], zero)
            assert_array_equal(builder._data['z_jython'], zero)
            assert_array_equal(builder._data['zero'], zero)


        lvalues = [[2, 5], [12, 40], [22, 30]]
        for _xy in [lvalues, np.array(lvalues)]:
            hm = create_chart(Dot, _xy, cat=cat)
            builder = hm._builders[0]

            self.assertEqual(builder._groups, ['0', '1', '2'])
            assert_array_equal(builder._data['cat'], cat)
            assert_array_equal(builder._data['cat0'], catpython)
            assert_array_equal(builder._data['cat1'], catpypy)
            assert_array_equal(builder._data['cat2'], catjython)
            assert_array_equal(builder._data['0'], python)
            assert_array_equal(builder._data['1'], pypy)
            assert_array_equal(builder._data['2'], jython)

            assert_array_equal(builder._data['seg_top_0'], seg_top_python)
            assert_array_equal(builder._data['seg_top_1'], seg_top_pypy)
            assert_array_equal(builder._data['seg_top_2'], seg_top_jython)

            assert_array_equal(builder._data['z_0'], zero)
            assert_array_equal(builder._data['z_1'], zero)
            assert_array_equal(builder._data['z_2'], zero)
            assert_array_equal(builder._data['zero'], zero)
