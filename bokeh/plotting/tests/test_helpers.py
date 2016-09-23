import pytest

from bokeh.models import ColumnDataSource
from bokeh.plotting.helpers import (
    _process_legend_kwargs
)


# _process_legend_kwargs
def test_process_legend_kwargs_raises_error_if_both_legend_and_label():
    with pytest.raises(RuntimeError):
        kwargs = {
            'label': 'label',
            'legend': 'legend'
        }
        _process_legend_kwargs(kwargs)


def test_if_exotic_label_passed_it_is_unchanged():
    kwargs = {
        'label': ['exotic', 'label']
    }
    _process_legend_kwargs(kwargs)
    assert kwargs.get('label') == ['exotic', 'label']



def test_if_legend_is_something_exotic_that_it_is_passed_directly_to_label():
    kwargs = {
        'legend': {'field': 'milk'}
    }
    _process_legend_kwargs(kwargs)
    assert kwargs.get('legend') is None
    assert kwargs.get('label') == {'field': 'milk'}


def test_if_legend_is_a_string_but_no_source_then_label_is_set_as_value():
    kwargs = {
        'legend': 'label'
    }
    _process_legend_kwargs(kwargs)
    assert kwargs.get('legend') is None
    assert kwargs.get('label') == {'value': 'label'}


def test_if_label_is_a_string_but_no_source_label_is_value():
    kwargs = {
        'label': 'label'
    }
    _process_legend_kwargs(kwargs)
    assert kwargs.get('label') == {'value': 'label'}


def test_if_legend_is_a_string_and_source_with_that_column_then_field():
    kwargs = {
        'legend': 'label',
        'source': ColumnDataSource(dict(label=[1, 2]))
    }
    _process_legend_kwargs(kwargs)
    assert kwargs.get('legend') is None
    assert kwargs.get('label') == {'field': 'label'}


def test_if_label_is_a_string_and_source_with_that_column_then_field():
    kwargs = {
        'label': 'label',
        'source': ColumnDataSource(dict(label=[1, 2]))
    }
    _process_legend_kwargs(kwargs)
    assert kwargs.get('legend') is None
    assert kwargs.get('label') == {'field': 'label'}


def test_if_legend_is_a_string_and_source_without_column_name_then_value():
    kwargs = {
        'legend': 'not_a_column_label',
        'source': ColumnDataSource(dict(label=[1, 2]))
    }
    _process_legend_kwargs(kwargs)
    assert kwargs.get('legend') is None
    assert kwargs.get('label') == {'value': 'not_a_column_label'}


def test_if_label_is_a_string_and_source_without_column_name_then_value():
    kwargs = {
        'label': 'not_a_column_label',
        'source': ColumnDataSource(dict(label=[1, 2]))
    }
    _process_legend_kwargs(kwargs)
    assert kwargs.get('legend') is None
    assert kwargs.get('label') == {'value': 'not_a_column_label'}
