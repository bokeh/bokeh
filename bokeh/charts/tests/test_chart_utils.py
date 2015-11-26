"""This is the Bokeh charts testing interface.

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
from bokeh.charts.utils import cat_to_polar

#-----------------------------------------------------------------------------
# Classes and functions
#-----------------------------------------------------------------------------


def test_ordered_set():
    pass


def test_collect_attribute_columns():
    pass


def test_df_from_json():
    pass


def test_title_from_columns():
    pass


def test_cat_to_polor(test_data):
    cat_cols = ['cyl', 'origin']

    # we expect back start and end angles for each group level
    level_0 = len(test_data.auto_data[['cyl']].drop_duplicates())
    level_1 = len(test_data.auto_data[['cyl', 'origin']].drop_duplicates())
    num_groups = level_0 + level_1

    out = cat_to_polar(test_data.auto_data, cat_cols, 'displ', 'mean')
    assert len(out) == num_groups