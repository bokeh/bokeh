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
from unittest import skipIf

try:
    import pandas as pd
    is_pandas = True
except ImportError as e:
    is_pandas = False

from bokeh.charts.builder import Builder, XYBuilder
from bokeh.charts.properties import Dimension
from bokeh.charts.attributes import ColorAttr, DEFAULT_PALETTE
from bokeh.models import Range1d, FactorRange

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
    col1, col2, col3 = Mock(), Mock(), Mock()
    legends = [('col1', col1), ('col3', col3), ('col2', col2)]
    items = [('col1', Mock()), ('col2', Mock()), ('col3', Mock())]
    attributes = {
        'color': Mock(columns=['series'], items=items),
        'dash': Mock(columns=['series'], items=items),
        'marker': Mock(columns=['series'], items=items)
    }

    # assert we don't change anything if sort_legend is not specified
    assert Builder._sort_legend(None, None, legends, attributes) == legends
    # assert we sort asc if specified so
    assert Builder._sort_legend('color', 'ascending', legends, attributes) == \
        [('col1', col1), ('col2', col2), ('col3', col3)]
    # assert we sort desc if specified so
    assert Builder._sort_legend('color', 'descending', legends, attributes) == \
        [('col3', col3), ('col2', col2), ('col1', col1)]

@skipIf(not is_pandas, "pandas not installed")
def test_created_range_type(test_builder, test_data):
    pd_data = test_data.pd_data.copy()
    pd_data['col3'] = ['a','b','c','b']
    pd_data['col4'] = pd.date_range('1950-01', '1950-05', freq='M')

    builder1 = XYBuilder(pd_data, x='col1')
    assert isinstance(builder1._get_range('x', 1, 4), Range1d)
    assert builder1.xscale == 'linear'

    # "None" as str is for label repr, handles case where there is no x dim
    builder2 = XYBuilder(pd_data, x='col2')
    assert isinstance(builder2._get_range('x', "None", "None"), FactorRange)
    assert builder2.xscale == 'categorical'

    builder3 = XYBuilder(pd_data, x='col3')
    assert isinstance(builder3._get_range('x', 'a', 'c'), FactorRange)
    assert builder3.xscale == 'categorical'

    builder4 = XYBuilder(pd_data, x='col4')
    assert isinstance(builder4._get_range('x', 0, 1), Range1d)
    assert builder4.xscale == 'datetime'

def test_sort_legend(test_builder, test_data):
    test_builder = test_builder(test_data.pd_data, legend_sort_field='color', legend_sort_direction='ascending')

    assert test_builder.legend_sort_field == 'color'
    assert test_builder.legend_sort_direction == 'ascending'
