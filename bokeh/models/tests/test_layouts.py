#-----------------------------------------------------------------------------
# Copyright (c) 2012 - 2019, Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Boilerplate
#-----------------------------------------------------------------------------
from __future__ import absolute_import, division, print_function, unicode_literals

import pytest ; pytest

#-----------------------------------------------------------------------------
# Imports
#-----------------------------------------------------------------------------

# Standard library imports

# External imports

# Bokeh imports
from bokeh.models.widgets import Slider
from bokeh.models.sources import ColumnDataSource
from bokeh.plotting import Figure

# Module under test
from bokeh.models.layouts import Row, Column, LayoutDOM

#-----------------------------------------------------------------------------
# Setup
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# General API
#-----------------------------------------------------------------------------

def check_props(layout):
    assert layout.width is None
    assert layout.height is None
    assert layout.children == []

def check_props_with_sizing_mode(layout):
    assert layout.width is None
    assert layout.height is None
    assert layout.children == []
    assert layout.sizing_mode == None


def check_children_prop(layout_callable):
    ## component subclasses are layouts, widgets and plots
    components = [Row(), Column(), Figure()]

    # Test layout accepts splatted components
    layout1 = layout_callable(*components)
    assert layout1.children == components

    # Test layout accepts children argument
    layout2 = layout_callable(children=components)
    assert layout2.children == components

    # Test value error raised when non-layout is provided as children
    with pytest.raises(ValueError):
        layout_callable(children=[ColumnDataSource()])


def test_Row():
    check_props_with_sizing_mode(Row())
    check_children_prop(Row)


def test_Column():
    check_props_with_sizing_mode(Column())
    check_children_prop(Column)


def check_widget_box_children_prop(layout_callable):
    ## component subclasses are layouts, widgets and plots
    components = [Slider()]

    # Test layout accepts splatted components
    layout1 = layout_callable(*components)
    assert layout1.children == components

    # Test layout accepts children argument
    layout2 = layout_callable(children=components)
    assert layout2.children == components

    # Test value error raised when non-layout is provided as children
    with pytest.raises(ValueError):
        layout_callable(children=[ColumnDataSource()])


def test_LayoutDOM_css_classes():
    m = LayoutDOM()
    assert m.css_classes == []
    m.css_classes = ['foo']
    assert m.css_classes == ['foo']
    m.css_classes = ('bar', )
    assert m.css_classes == ['bar']

#-----------------------------------------------------------------------------
# Dev API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Private API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Code
#-----------------------------------------------------------------------------
