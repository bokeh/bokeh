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

from bokeh.charts.builders.bar_builder import BarBuilder
from bokeh.charts.stats import CountDistinct

#-----------------------------------------------------------------------------
# Classes and functions
#-----------------------------------------------------------------------------


def test_cat_list_input(test_data):
    """Given values of categorical data, count the records of each unique value."""
    num_items = CountDistinct(values=test_data.cat_list).value
    bar_builder = BarBuilder(test_data.cat_list)
    bar_builder.create()
    assert len(bar_builder.comp_glyphs) == num_items


def test_values_only_input(df_with_cat_index):
    """Given values only input, use index for labels."""
    bar_builder = BarBuilder(df_with_cat_index, values='col1')
    bar_builder.create()
    assert bar_builder.attributes['label'].columns[0] == 'index'
