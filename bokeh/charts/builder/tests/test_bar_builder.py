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

from bokeh.charts import Bar
from bokeh.charts.builder.tests._utils import create_chart
from bokeh.models import Range1d, FactorRange

#-----------------------------------------------------------------------------
# Classes and functions
#-----------------------------------------------------------------------------


def test_array_input(test_data):
    bar_plot = Bar(test_data.cat_list, title="label='cyl'")

# def test_all_positive_input(test_data):
#     source = OrderedDict()
#     source['percent change 1'] = [1, 13]
#     source['percent change 2'] = [12, 40]
#     bar_chart = create_chart(Bar, source)
#     test_data.assertEqual(bar_chart._builders[0].y_range.start, 0)
#     test_data.assertEqual(bar_chart._builders[0].y_range.end, 40 * 1.1)
#
# def test_all_negative_input(test_data):
#     source = OrderedDict()
#     source['percent change 1'] = [-1, -13]
#     source['percent change 2'] = [-12, -40]
#     bar_chart = create_chart(Bar, source)
#     # We want the start to be negative, so that data points downwards
#     test_data.assertEqual(bar_chart._builders[0].y_range.start, -40 * 1.1)
#     test_data.assertEqual(bar_chart._builders[0].y_range.end, 0)
#
# def test_mixed_sign_input(test_data):
#     source = OrderedDict()
#     source['percent change 1'] = [-1, -13]
#     source['percent change 2'] = [12, 40]
#     bar_chart = create_chart(Bar, source)
#     test_data.assertEqual(bar_chart._builders[0].y_range.start, -13 * 1.1)
#     test_data.assertEqual(bar_chart._builders[0].y_range.end, 40 * 1.1)
#
# def test_set_custom_continuous_range(test_data):
#     # Users can specify their own y_range for cases where the
#     # default guess is not what's desired.
#     source = OrderedDict()
#     source['percent change 1'] = [25, -13]
#     source['percent change 2'] = [-12, -40]
#     custom_y_range = Range1d(50, -50)
#     bar_chart = create_chart(Bar, source, continuous_range=custom_y_range)
#     test_data.assertEqual(bar_chart._builders[0].y_range, custom_y_range)
#
# def test_invalid_continuous_range_raises_error(test_data):
#     source = OrderedDict({'p': [0, 1]})
#     bad_y_range = range(0, 50)  # Not a Range object
#     with test_data.assertRaises(ValueError):
#         create_chart(Bar, source, continuous_range=bad_y_range)
#
# def test_non_range1d_continuous_range_raises_value_error(test_data):
#     source = OrderedDict({'p': [0, 1]})
#     non_1d_range = FactorRange(factors=['a', 'b'])
#     with test_data.assertRaises(ValueError):
#         create_chart(Bar, source, continuous_range=non_1d_range)
