from bokeh.models import ColumnDataSource
from bokeh.models.ranges import Range1d, DataRange1d, FactorRange
from bokeh.models.scales import LinearScale, LogScale, CategoricalScale
from bokeh.plotting.helpers import (
    _get_legend_item_label, _get_scale
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

def test__get_scale_numeric_range_linear_axis():
    s = _get_scale(Range1d(), "linear")
    assert isinstance(s, LinearScale)

    s = _get_scale(Range1d(), "datetime")
    assert isinstance(s, LinearScale)

    s = _get_scale(Range1d(), "auto")
    assert isinstance(s, LinearScale)

def test__get_scale_numeric_range_log_axis():
    s = _get_scale(DataRange1d(), "log")
    assert isinstance(s, LogScale)

def test__get_scale_factor_range():
    s = _get_scale(FactorRange(), "auto")
    assert isinstance(s, CategoricalScale)
