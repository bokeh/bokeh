#-----------------------------------------------------------------------------
# Copyright (c) 2012 - 2014, Continuum Analytics, Inc. All rights reserved.
#
# Powered by the Bokeh Development Team.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------

from __future__ import absolute_import

import pytest
from bokeh.charts.builders.line_builder import LineBuilder


@pytest.fixture
def line_builder_array(test_data):
    line_builder = LineBuilder(test_data.list_data)
    line_builder.create()
    return line_builder


@pytest.fixture
def line_builder_df_no_inputs(wide_data_with_cat):
    line_builder = LineBuilder(wide_data_with_cat)
    line_builder.create()
    return line_builder


def test_array_input(line_builder_array):
    """A list of two lists of values in should result in 2 composite glyphs."""
    assert len(line_builder_array.comp_glyphs) == 2


def test_array_input_assignment(line_builder_array):
    """Make sure array input is derived to a measurement name, value data source."""
    assert line_builder_array.y.selection == 'value'


def test_df_only_input(line_builder_df_no_inputs):
    assert len(line_builder_df_no_inputs.comp_glyphs) == 2
