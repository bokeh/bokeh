from __future__ import absolute_import

from bokeh.plotting import Figure
from bokeh.models.layouts import HBox, VBox, VBoxForm
from bokeh.models.widgets import Slider
from bokeh.models.sources import ColumnDataSource

import pytest

## component subclasses are layouts, widgets and plots
components = [HBox(), VBox(), VBoxForm(), Slider(), Figure()]

def check_props(layout):
    assert layout.width == None
    assert layout.height == None
    assert layout.children == []

def check_children_prop(layout_callable):
    layout1 = layout_callable(*components)
    assert layout1.children == components
    layout2 = layout_callable(children=components)
    assert layout2.children == components
    with pytest.raises(ValueError): ## Should raise exception for non-Component child
        layout_callable(ColumnDataSource())

def test_VBox():
    yield check_props, VBox()
    yield check_children_prop, VBox

def test_HBox():
    yield check_props, HBox()
    yield check_children_prop, HBox

def test_VBoxForm():
    yield check_props, VBoxForm()
    yield check_children_prop, VBoxForm
