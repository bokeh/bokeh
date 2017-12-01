import pytest
from bokeh.plotting import Figure
from bokeh.models.layouts import Row, Column, WidgetBox, LayoutDOM
from bokeh.models.widgets import Slider
from bokeh.models.sources import ColumnDataSource


def check_props(layout):
    assert layout.width is None
    assert layout.height is None
    assert layout.children == []


def check_props_with_sizing_mode(layout):
    assert layout.width is None
    assert layout.height is None
    assert layout.children == []
    assert layout.sizing_mode == 'fixed'


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


def check_widget_wrapped_in_widget_box(layout_callable):
    components = [Slider()]

    layout = layout_callable(*components)
    assert len(layout.children) == 1
    assert isinstance(layout.children[0], WidgetBox)
    assert len(layout.children[0].children) == 1
    assert layout.children[0].children == components


def test_Row():
    check_props_with_sizing_mode(Row())
    check_children_prop(Row)
    check_widget_wrapped_in_widget_box(Row)


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


def test_WidgetBox():
    check_props(WidgetBox())
    check_widget_box_children_prop(WidgetBox)

def test_LayoutDOM_css_classes():
    m = LayoutDOM()
    assert m.css_classes == []
    m.css_classes = ['foo']
    assert m.css_classes == ['foo']
    m.css_classes = ('bar', )
    assert m.css_classes == ['bar']
