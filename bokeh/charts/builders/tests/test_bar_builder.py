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

import operator

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


def test_grouping_order(test_data):
    df = test_data.auto_data.iloc[:10, :]
    bar_builder = BarBuilder(df, values='mpg', label='origin',
                             group='name', color='name')
    names = df.name.drop_duplicates().values
    bar_builder.create()
    renderers = [renderer for renderer in bar_builder.yield_renderers()]

    # parse the relative x position from the data sources
    x_pos = {renderer.data_source.data['name'][0]: float(renderer.data_source.data[
                                                         'x'][0].split(':')[1]) for
             renderer in renderers}

    # get the order of the names as they appear in their relative positioning
    grouped_names_in_order = list(sorted(x_pos.items(), key=operator.itemgetter(1)))
    grouped_names_in_order = [grouped[0] for grouped in grouped_names_in_order]

    for name, grouped_name in zip(names, grouped_names_in_order):
        assert name == grouped_name
