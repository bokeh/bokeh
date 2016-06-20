import pytest
from bokeh.plotting import Figure
from bokeh.models.layouts import HBox, VBox, VBoxForm, Row, Column, WidgetBox
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
    components = [HBox(), VBox(), VBoxForm(), Figure()]

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


def test_VBox():
    check_props(VBox())
    check_children_prop(VBox)
    check_widget_wrapped_in_widget_box(VBox)


def test_HBox():
    check_props(HBox())
    check_children_prop(HBox)
    check_widget_wrapped_in_widget_box(HBox)


def test_Row():
    check_props_with_sizing_mode(Row())
    check_children_prop(Row)
    check_widget_wrapped_in_widget_box(HBox)


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


def test_VBoxForm():
    check_props(VBoxForm())
    check_widget_box_children_prop(VBoxForm)


def test_WidgetBox():
    check_props(WidgetBox())
    check_widget_box_children_prop(WidgetBox)
