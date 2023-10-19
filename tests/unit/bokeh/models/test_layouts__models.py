#-----------------------------------------------------------------------------
# Copyright (c) 2012 - 2023, Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Boilerplate
#-----------------------------------------------------------------------------
from __future__ import annotations # isort:skip

import pytest ; pytest

#-----------------------------------------------------------------------------
# Imports
#-----------------------------------------------------------------------------

# Bokeh imports
from bokeh.models import ColumnDataSource
from bokeh.models.ui import Tooltip
from bokeh.plotting import figure

# Module under test
from bokeh.models.layouts import Row, Column, LayoutDOM, TabPanel # isort:skip

#-----------------------------------------------------------------------------
# Setup
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# General API
#-----------------------------------------------------------------------------

def check_props(layout: LayoutDOM):
    assert layout.width is None
    assert layout.height is None
    assert layout.children == []

def check_props_with_sizing_mode(layout: LayoutDOM):
    assert layout.width is None
    assert layout.height is None
    assert layout.children == []
    assert layout.sizing_mode is None


def check_children_prop(layout_callable: type[Row | Column]):
    ## component subclasses are layouts, widgets and plots
    components = [Row(), Column(), figure()]

    # Test layout accepts splatted components
    layout1 = layout_callable(*components)
    assert layout1.children == components

    # Test layout accepts children argument
    layout2 = layout_callable(children=components)
    assert layout2.children == components

    # Test value error raised when non-layout is provided as children
    with pytest.raises(ValueError):
        layout_callable(children=[ColumnDataSource()])


def test_Row() -> None:
    check_props_with_sizing_mode(Row())
    check_children_prop(Row)


def test_Column() -> None:
    check_props_with_sizing_mode(Column())
    check_children_prop(Column)


def test_LayoutDOM_css_classes() -> None:
    m = LayoutDOM()
    assert m.css_classes == []
    m.css_classes = ['foo']
    assert m.css_classes == ['foo']
    m.css_classes = ('bar', )
    assert m.css_classes == ['bar']


def test_LayoutDOM_backgroud() -> None:
    obj = LayoutDOM(background="#aabbccff")
    assert obj.styles["background-color"] == "#aabbccff"

    obj = LayoutDOM()
    assert "background-color" not in obj.styles
    obj.background = "#aabbccff"
    assert obj.styles["background-color"] == "#aabbccff"


def test_TabPanel_no_tooltip() -> None:
    p1 = figure(width=300, height=300)
    panel = TabPanel(child=p1, title="test panel")
    assert panel.title == "test panel"
    assert panel.child is not None
    assert panel.tooltip is None


def test_TabPanel_tooltip() -> None:
    p1 = figure(width=300, height=300)
    panel = TabPanel(child=p1, title="test panel", tooltip=Tooltip(content="test tooltip"))
    assert panel.tooltip is not None

#-----------------------------------------------------------------------------
# Dev API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Private API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Code
#-----------------------------------------------------------------------------
