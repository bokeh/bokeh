from bokeh.models import ColumnDataSource
from bokeh.plotting.helpers import (
    _get_legend_item_label
)


# _get_legend_item_label
def test_if_legend_is_something_exotic_that_it_is_passed_directly_to_label():
    kwargs = {
        'legend': {'field': 'milk'}
    }
    label = _get_legend_item_label(kwargs)
    assert label == {'field': 'milk'}


def test_if_legend_is_a_string_but_no_source_then_label_is_set_as_value():
    kwargs = {
        'legend': 'label'
    }
    label = _get_legend_item_label(kwargs)
    assert label == {'value': 'label'}


def test_if_legend_is_a_string_and_source_with_that_column_then_field():
    kwargs = {
        'legend': 'label',
        'source': ColumnDataSource(dict(label=[1, 2]))
    }
    label = _get_legend_item_label(kwargs)
    assert label == {'field': 'label'}


def test_if_legend_is_a_string_and_source_without_column_name_then_value():
    kwargs = {
        'legend': 'not_a_column_label',
        'source': ColumnDataSource(dict(label=[1, 2]))
    }
    label = _get_legend_item_label(kwargs)
    assert label == {'value': 'not_a_column_label'}
