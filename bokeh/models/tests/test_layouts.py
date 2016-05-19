import pytest
from bokeh.plotting import Figure
from bokeh.models.layouts import HBox, VBox, VBoxForm, Row, Column
from bokeh.models.widgets import Slider
from bokeh.models.sources import ColumnDataSource


def check_props(layout):
    assert layout.width is None
    assert layout.height is None
    assert layout.children == []


def check_props_with_responsive(layout):
    assert layout.width is None
    assert layout.height is None
    assert layout.children == []
    assert layout.responsive == 'width'


def check_children_prop(layout_callable):
    ## component subclasses are layouts, widgets and plots
    components = [HBox(), VBox(), VBoxForm(), Slider(), Figure()]

    # Test layout accepts splatted components
    layout1 = layout_callable(*components)
    assert layout1.children == components

    # Test layout accepts children argument
    layout2 = layout_callable(children=components)
    assert layout2.children == components

    # Test value error raised when non-layout is provided as children
    with pytest.raises(ValueError):
        layout_callable(children=[ColumnDataSource()])


def test_VBox():
    yield check_props, VBox()
    yield check_children_prop, VBox


def test_HBox():
    yield check_props, HBox()
    yield check_children_prop, HBox


def test_VBoxForm():
    yield check_props, VBoxForm()
    yield check_children_prop, VBoxForm


def test_Row():
    yield check_props_with_responsive, Row()
    yield check_children_prop, Row


def test_Column():
    yield check_props_with_responsive, Column()
    yield check_children_prop, Column
