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

from mock import Mock
import pytest

from bokeh.charts.builder import Builder
from bokeh.charts.properties import Dimension
from bokeh.charts.attributes import ColorAttr, DEFAULT_PALETTE

#-----------------------------------------------------------------------------
# Classes and functions
#-----------------------------------------------------------------------------


CUSTOM_PALETTE = ['Red', 'Green', 'Blue']


@pytest.fixture
def test_builder():
    class TestBuilder(Builder):
        default_attributes = {'color': ColorAttr()}
        x = Dimension('x')
        y = Dimension('y')

        dimensions = ['x', 'y']

    return TestBuilder


@pytest.fixture
def simple_builder(test_builder, test_data):
    return test_builder(test_data.pd_data)


@pytest.fixture
def custom_palette_builder(test_builder, test_data):
    return test_builder(test_data.pd_data, palette=CUSTOM_PALETTE)


def test_empty_builder_labels(test_builder):
    builder = test_builder()
    assert builder.xlabel is None
    assert builder.ylabel is None


def test_default_color(simple_builder):
    assert simple_builder.attributes['color'].iterable == DEFAULT_PALETTE


def test_custom_color(custom_palette_builder):
    assert custom_palette_builder.attributes['color'].iterable == CUSTOM_PALETTE

def test_legend_sort(test_data):
    sort_legend = [('color', False)]
    col1, col2, col3 = Mock(), Mock(), Mock()
    legends = [('col1', col1), ('col3', col3), ('col2', col2)]
    items = [('col1', Mock()), ('col2', Mock()), ('col3', Mock())]
    attributes = {
        'color': Mock(columns=['series'], items=items),
        'dash': Mock(columns=['series'], items=items),
        'marker': Mock(columns=['series'], items=items)
    }

    # assert we don't change anything if sort_legend is not specified
    assert Builder._sort_legend([], legends, attributes) == legends
    # assert we sort asc if specified so
    assert Builder._sort_legend([('color', True)], legends, attributes) == \
        [('col1', col1), ('col2', col2), ('col3', col3)]
    # assert we sort desc if specified so
    assert Builder._sort_legend([('color', False)], legends, attributes) == \
        [('col3', col3), ('col2', col2), ('col1', col1)]