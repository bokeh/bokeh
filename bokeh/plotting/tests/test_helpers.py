from bokeh.models import ColumnDataSource
from bokeh.models.ranges import Range1d, DataRange1d, FactorRange
from bokeh.models.scales import LinearScale, LogScale, CategoricalScale
from bokeh.plotting.helpers import (
    _get_legend_item_label, _get_scale, _get_range
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

def test__get_range_with_None():
    r = _get_range(None)
    assert isinstance(r, DataRange1d)

def test__get_range_with_Range():
    for t in [Range1d, DataRange1d, FactorRange]:
        rng = t()
        r = _get_range(rng)
        assert r is rng

def test__get_range_with_string_seq():
    f = ["foo" ,"bar", "baz"]
    for t in [list, tuple]:
        r = _get_range(t(f))
        assert isinstance(r, FactorRange)
        # FactorRange accepts Seq, but _get_range always sets a list copy
        assert r.factors == f

def test__get_range_with_float_bounds():
    r = _get_range((1.2, 10))
    assert isinstance(r, Range1d)
    assert r.start == 1.2
    assert r.end == 10

    r = _get_range([1.2, 10])
    assert isinstance(r, Range1d)
    assert r.start == 1.2
    assert r.end == 10

def test_get_range_with_pandas_group():
    from bokeh.sampledata.iris import flowers
    g = flowers.groupby('species')
    r = _get_range(g)
    assert isinstance(r, FactorRange)
    assert r.factors == ['setosa', 'versicolor', 'virginica']
