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

import numpy as np
from numpy.testing import assert_array_equal, assert_array_almost_equal
import pandas as pd

from bokeh.charts import Histogram

from bokeh.charts.builder.tests._utils import create_chart

#-----------------------------------------------------------------------------
# Classes and functions
#-----------------------------------------------------------------------------


def test_supported_input(test_data):
    box_plot = Histogram(test_data.auto_data.mpg.values,
                         title="label='cyl', values='mpg'")

# @patch('bokeh.charts.builder.histogram_builder.np.histogram', return_value=([1, 3, 4], [2.4, 4]))
# def test_histogram_params(self, histogram_mock):
#     inputs = [[5, 0, 0.5, True], [3, 1, 0, False]]
#     normal = [1, 2, 3, 1]
#     lognormal = [5, 4, 4, 1]
#     xyvalues = OrderedDict()
#     xyvalues['normal'] = normal
#     xyvalues['lognormal'] = lognormal
#
#     for (bins, mu, sigma, dens) in inputs:
#         histogram_mock.reset_mock()
#         kws = dict(bins=bins, mu=mu, sigma=sigma, density=dens)
#         hm = create_chart(Histogram, xyvalues, compute_values=False, **kws)
#         builder = hm._builders[0]
#         # ensure all class attributes have been correctly set
#         for key, value in kws.items():
#             self.assertEqual(getattr(builder, key), value)
#
#         builder._process_data()
#         # ensure we are calling numpy.histogram with the right args
#         calls = histogram_mock.call_args_list
#         assert_array_equal(calls[0][0][0], np.array([1, 2, 3, 1]))
#         assert_array_equal(calls[1][0][0], np.array([5, 4, 4, 1]))
#         self.assertEqual(calls[0][1]['bins'], bins)
#         self.assertEqual(calls[1][1]['bins'], bins)
#         self.assertEqual(calls[0][1]['density'], dens)
#         self.assertEqual(calls[1][1]['density'], dens)
