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
