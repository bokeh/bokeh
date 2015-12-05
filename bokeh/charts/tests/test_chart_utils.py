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
from bokeh.charts.utils import build_wedge_source, build_wedge_text_source

import pytest
from bokeh.models.sources import ColumnDataSource

#-----------------------------------------------------------------------------
# Classes and functions
#-----------------------------------------------------------------------------


@pytest.fixture
def polar_cats(test_data):
    cat_cols = ['cyl', 'origin']
    return build_wedge_source(test_data.auto_data, cat_cols,
                              'displ', 'mean')

def test_ordered_set():
    pass


def test_collect_attribute_columns():
    pass


def test_df_from_json():
    pass


def test_title_from_columns():
    pass


def test_cat_to_polor(test_data, polar_cats):
    """Check known example for how many rows should exist based on columns."""

    # we expect back start and end angles for each group level
    level_0 = len(test_data.auto_data[['cyl']].drop_duplicates())
    level_1 = len(test_data.auto_data[['cyl', 'origin']].drop_duplicates())
    num_groups = level_0 + level_1

    assert len(polar_cats) == num_groups


def test_create_wedge_text(polar_cats):
    """Check for type of output and columns in output for wedge text source."""
    text_data = build_wedge_text_source(polar_cats)
    assert isinstance(text_data, ColumnDataSource)
    assert all(col in text_data.column_names for col in
               ['x', 'y', 'text', 'text_angle']) is True
