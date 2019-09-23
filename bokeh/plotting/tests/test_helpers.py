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
import datetime
import itertools
from mock import mock

# External imports
import numpy as np

# Bokeh imports
from bokeh.models import ColumnDataSource, CDSView, GlyphRenderer, Legend, LegendItem, Marker
from bokeh.models.axes import CategoricalAxis, LinearAxis, LogAxis, MercatorAxis, DatetimeAxis
from bokeh.models.ranges import Range1d, DataRange1d, FactorRange
from bokeh.models.scales import LinearScale, LogScale, CategoricalScale
from bokeh.plotting import Figure

# Module under test
import bokeh.plotting.helpers as bph

#-----------------------------------------------------------------------------
# Setup
#-----------------------------------------------------------------------------

def all_combinations(lst):
    return itertools.chain.from_iterable(
        itertools.combinations(lst, i + 1)
        for i in range(2, len(lst)))

LEGEND_KWS = ['legend', 'legend_label', 'legend_field', 'legend_group']

#-----------------------------------------------------------------------------
# General API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Dev API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Private API
#-----------------------------------------------------------------------------

@pytest.mark.parametrize('key', LEGEND_KWS)
def test__pop_legend_kwarg(key):
    kws = {'foo': 10, key: 'bar'}
    assert bph._pop_legend_kwarg(kws) == {key: "bar"}

@pytest.mark.parametrize('keys', all_combinations(LEGEND_KWS))
def test__pop_legend_kwarg_error(keys):
    kws = dict(zip(keys, range(len(keys))))
    with pytest.raises(ValueError):
        bph._pop_legend_kwarg(kws)

def test__find_legend_item():
    legend = Legend(items=[LegendItem(label=dict(value="foo")), LegendItem(label=dict(field="bar"))])
    assert bph._find_legend_item(dict(value="baz"), legend) is None
    assert bph._find_legend_item(dict(value="foo"), legend) is legend.items[0]
    assert bph._find_legend_item(dict(field="bar"), legend) is legend.items[1]

class Test__handle_legend_deprecated(object):

    @pytest.mark.parametrize('arg', [1, 2.7, None, False, [], {'junk': 10}, {'label': 'foo', 'junk': 10}, {'value': 'foo', 'junk': 10}])
    def test_bad_arg(self, arg):
        with pytest.raises(ValueError):
            bph._handle_legend_deprecated(arg, "legend", "renderer")

    def test_value_string(self):
        legend = Legend(items=[LegendItem(label=dict(value="foo"))])
        renderer = GlyphRenderer(data_source=ColumnDataSource())
        bph._handle_legend_deprecated("foo", legend, renderer)
        assert len(legend.items) == 1
        assert all("value" in item.label for item in legend.items)
        bph._handle_legend_deprecated("bar", legend, renderer)
        assert len(legend.items) == 2
        assert all("value" in item.label for item in legend.items)

    def test_value_dict(self):
        legend = Legend(items=[LegendItem(label=dict(value="foo"))])
        renderer = GlyphRenderer(data_source=ColumnDataSource())
        bph._handle_legend_deprecated(dict(value="foo"), legend, renderer)
        assert len(legend.items) == 1
        assert all("value" in item.label for item in legend.items)
        bph._handle_legend_deprecated(dict(value="bar"), legend, renderer)
        assert len(legend.items) == 2
        assert all("value" in item.label for item in legend.items)

    def test_field_string(self):
        legend = Legend(items=[LegendItem(label=dict(field="foo"))])
        renderer = GlyphRenderer(data_source=ColumnDataSource(data=dict(foo=[], bar=[])))
        bph._handle_legend_deprecated("foo", legend, renderer)
        assert len(legend.items) == 1
        assert all("field" in item.label for item in legend.items)
        bph._handle_legend_deprecated("bar", legend, renderer)
        assert len(legend.items) == 2
        assert all("field" in item.label for item in legend.items)

    def test_field_dict(self):
        legend = Legend(items=[LegendItem(label=dict(field="foo"))])
        renderer = GlyphRenderer(data_source=ColumnDataSource(data=dict(foo=[], bar=[])))
        bph._handle_legend_deprecated(dict(field="foo"), legend, renderer)
        assert len(legend.items) == 1
        assert all("field" in item.label for item in legend.items)
        bph._handle_legend_deprecated(dict(field="bar"), legend, renderer)
        assert len(legend.items) == 2
        assert all("field" in item.label for item in legend.items)


class Test__handle_legend_field(object):

    @pytest.mark.parametrize('arg', [1, 2.7, None, False, [], {}])
    def test_bad_arg(self, arg):
        with pytest.raises(ValueError):
            bph._handle_legend_field(arg, "legend", "renderer")

    def test_label_already_exists(self):
        legend = Legend(items=[LegendItem(label=dict(field="foo"))])
        renderer = GlyphRenderer()
        bph._handle_legend_field("foo", legend, renderer)
        assert len(legend.items) == 1
        assert legend.items[0].label == dict(field="foo")
        assert legend.items[0].renderers == [renderer]

    def test_label_not_already_exists(self):
        legend = Legend(items=[LegendItem(label=dict(field="foo"))])
        renderer = GlyphRenderer()
        bph._handle_legend_field("bar", legend, renderer)
        assert len(legend.items) == 2
        assert legend.items[0].label == dict(field="foo")
        assert legend.items[0].renderers == []
        assert legend.items[1].label == dict(field="bar")
        assert legend.items[1].renderers == [renderer]

class Test__handle_legend_group(object):

    @pytest.mark.parametrize('arg', [1, 2.7, None, False, [], {}])
    def test_bad_arg(self, arg):
        with pytest.raises(ValueError):
            bph._handle_legend_group(arg, "legend", "renderer")

    def test_bad_source(self):
        with pytest.raises(ValueError):
            bph._handle_legend_group("foo", "legend", GlyphRenderer())
        with pytest.raises(ValueError):
            bph._handle_legend_group("foo", "legend", GlyphRenderer(data_source=ColumnDataSource(data=dict(bar=[]))))

    def test_items(self):
        source = ColumnDataSource(data=dict(foo=[10,10,20,30,20,30,40]))
        renderer = GlyphRenderer(data_source=source)
        legend = Legend(items=[])
        bph._handle_legend_group("foo", legend, renderer)
        assert len(legend.items) == 4
        assert legend.items[0].label == dict(value="10")
        assert legend.items[0].renderers == [renderer]
        assert legend.items[0].index == 0

        assert legend.items[1].label == dict(value="20")
        assert legend.items[1].renderers == [renderer]
        assert legend.items[1].index == 2

        assert legend.items[2].label == dict(value="30")
        assert legend.items[2].renderers == [renderer]
        assert legend.items[2].index == 3

        assert legend.items[3].label == dict(value="40")
        assert legend.items[3].renderers == [renderer]
        assert legend.items[3].index == 6

class Test__handle_legend_label(object):

    @pytest.mark.parametrize('arg', [1, 2.7, None, False, [], {}])
    def test_bad_arg(self, arg):
        with pytest.raises(ValueError):
            bph._handle_legend_label(arg, "legend", "renderer")

    def test_label_already_exists(self):
        legend = Legend(items=[LegendItem(label=dict(value="foo"))])
        renderer = GlyphRenderer()
        bph._handle_legend_label("foo", legend, renderer)
        assert len(legend.items) == 1
        assert legend.items[0].label == dict(value="foo")
        assert legend.items[0].renderers == [renderer]

    def test_label_not_already_exists(self):
        legend = Legend(items=[LegendItem(label=dict(value="foo"))])
        renderer = GlyphRenderer()
        bph._handle_legend_label("bar", legend, renderer)
        assert len(legend.items) == 2
        assert legend.items[0].label == dict(value="foo")
        assert legend.items[0].renderers == []
        assert legend.items[1].label == dict(value="bar")
        assert legend.items[1].renderers == [renderer]

def test__single_stack_raises_when_spec_in_kwargs():
    with pytest.raises(ValueError) as e:
        bph._single_stack(['a', 'b'], 'foo', foo=10)

    assert str(e.value).endswith("Stack property 'foo' cannot appear in keyword args")

def test__single_stack_raises_when_kwargs_list_lengths_differ():
    with pytest.raises(ValueError) as e:
        bph._single_stack(['a', 'b'], 'foo', baz=[1, 2], quux=[3,4,5])

    assert str(e.value).endswith("Keyword argument sequences for broadcasting must all be the same lengths. Got lengths: [2, 3]")

def test__single_stack_raises_when_kwargs_list_lengths_and_stackers_lengths_differ():
    with pytest.raises(ValueError) as e:
        bph._single_stack(['a', 'b', 'c'], 'foo',  baz=[1, 2], quux=[3,4])

    assert str(e.value).endswith("Keyword argument sequences for broadcasting must be the same length as stackers")

def test__single_stack_broadcast_with_no_kwargs():
    stackers = ['a', 'b', 'c', 'd']
    kws = bph._single_stack(stackers, 'start')
    assert len(kws) == len(stackers)
    for i, kw in enumerate(kws):
        assert set(['start', 'name']) == set(kw.keys())
        assert list(kw['start']['expr'].fields) == stackers[:i+1]

def test__single_stack_broadcast_with_scalar_kwargs():
    stackers = ['a', 'b', 'c', 'd']
    kws = bph._single_stack(stackers, 'start', foo=10, bar="baz")
    assert len(kws) == len(stackers)
    for i, kw in enumerate(kws):
        assert set(['start', 'foo', 'bar', 'name']) == set(kw.keys())
        assert list(kw['start']['expr'].fields) == stackers[:i+1]
        assert kw['foo'] == 10
        assert kw['bar'] == "baz"
        assert kw['name'] == stackers[i]

def test__single_stack_broadcast_with_list_kwargs():
    stackers = ['a', 'b', 'c', 'd']
    kws = bph._single_stack(stackers, 'start', foo=[10, 20, 30, 40], bar="baz")
    assert len(kws) == len(stackers)
    for i, kw in enumerate(kws):
        assert set(['start', 'foo', 'bar', 'name']) == set(kw.keys())
        assert list(kw['start']['expr'].fields) == stackers[:i+1]
        assert kw['foo'] == [10, 20, 30, 40][i]
        assert kw['bar'] == "baz"
        assert kw['name'] == stackers[i]

def test__single_stack_broadcast_name_scalar_overrides():
    stackers = ['a', 'b', 'c', 'd']
    kws = bph._single_stack(stackers, 'start', foo=[10, 20, 30, 40], bar="baz", name="name")
    assert len(kws) == len(stackers)
    for i, kw in enumerate(kws):
        assert set(['start', 'foo', 'bar', 'name']) == set(kw.keys())
        assert list(kw['start']['expr'].fields) == stackers[:i+1]
        assert kw['foo'] == [10, 20, 30, 40][i]
        assert kw['bar'] == "baz"
        assert kw['name'] == "name"

def test__single_stack_broadcast_name_list_overrides():
    names = ["aa", "bb", "cc", "dd"]
    stackers = ['a', 'b', 'c', 'd']
    kws = bph._single_stack(stackers, 'start', foo=[10, 20, 30, 40], bar="baz", name=names)
    assert len(kws) == len(stackers)
    for i, kw in enumerate(kws):
        assert set(['start', 'foo', 'bar', 'name']) == set(kw.keys())
        assert list(kw['start']['expr'].fields) == stackers[:i+1]
        assert kw['foo'] == [10, 20, 30, 40][i]
        assert kw['bar'] == "baz"
        assert kw['name'] == names[i]

def test__double_stack_raises_when_spec_in_kwargs():
    with pytest.raises(ValueError) as e:
        bph._double_stack(['a', 'b'], 'foo', 'bar', foo=10)

    assert str(e.value).endswith("Stack property 'foo' cannot appear in keyword args")

    with pytest.raises(ValueError) as e:
        bph._double_stack(['a', 'b'], 'foo', 'bar', bar=10)

    assert str(e.value).endswith("Stack property 'bar' cannot appear in keyword args")

def test__double_stack_raises_when_kwargs_list_lengths_differ():
    with pytest.raises(ValueError) as e:
        bph._double_stack(['a', 'b'], 'foo', 'bar', baz=[1, 2], quux=[3,4,5])

    assert str(e.value).endswith("Keyword argument sequences for broadcasting must all be the same lengths. Got lengths: [2, 3]")

def test__double_stack_raises_when_kwargs_list_lengths_and_stackers_lengths_differ():
    with pytest.raises(ValueError) as e:
        bph._double_stack(['a', 'b', 'c'], 'foo', 'bar', baz=[1, 2], quux=[3,4])

    assert str(e.value).endswith("Keyword argument sequences for broadcasting must be the same length as stackers")

def test__double_stack_broadcast_with_no_kwargs():
    stackers = ['a', 'b', 'c', 'd']
    kws = bph._double_stack(stackers, 'start', 'end')
    assert len(kws) == len(stackers)
    for i, kw in enumerate(kws):
        assert set(['start', 'end', 'name']) == set(kw.keys())
        assert list(kw['start']['expr'].fields) == stackers[:i]
        assert list(kw['end']['expr'].fields) == stackers[:(i+1)]

def test__double_stack_broadcast_with_scalar_kwargs():
    stackers = ['a', 'b', 'c', 'd']
    kws = bph._double_stack(stackers, 'start', 'end', foo=10, bar="baz")
    assert len(kws) == len(stackers)
    for i, kw in enumerate(kws):
        assert set(['start', 'end', 'foo', 'bar', 'name']) == set(kw.keys())
        assert list(kw['start']['expr'].fields) == stackers[:i]
        assert list(kw['end']['expr'].fields) == stackers[:(i+1)]
        assert kw['foo'] == 10
        assert kw['bar'] == "baz"
        assert kw['name'] == stackers[i]

def test__double_stack_broadcast_with_list_kwargs():
    stackers = ['a', 'b', 'c', 'd']
    kws = bph._double_stack(stackers, 'start', 'end', foo=[10, 20, 30, 40], bar="baz")
    assert len(kws) == len(stackers)
    for i, kw in enumerate(kws):
        assert set(['start', 'end', 'foo', 'bar', 'name']) == set(kw.keys())
        assert list(kw['start']['expr'].fields) == stackers[:i]
        assert list(kw['end']['expr'].fields) == stackers[:(i+1)]
        assert kw['foo'] == [10, 20, 30, 40][i]
        assert kw['bar'] == "baz"
        assert kw['name'] == stackers[i]

def test__double_stack_broadcast_name_scalar_overrides():
    stackers = ['a', 'b', 'c', 'd']
    kws = bph._double_stack(stackers, 'start', 'end', foo=[10, 20, 30, 40], bar="baz", name="name")
    assert len(kws) == len(stackers)
    for i, kw in enumerate(kws):
        assert set(['start', 'end', 'foo', 'bar', 'name']) == set(kw.keys())
        assert list(kw['start']['expr'].fields) == stackers[:i]
        assert list(kw['end']['expr'].fields) == stackers[:(i+1)]
        assert kw['foo'] == [10, 20, 30, 40][i]
        assert kw['bar'] == "baz"
        assert kw['name'] == "name"

def test__double_stack_broadcast_name_list_overrides():
    names = ["aa", "bb", "cc", "dd"]
    stackers = ['a', 'b', 'c', 'd']
    kws = bph._double_stack(stackers, 'start', 'end', foo=[10, 20, 30, 40], bar="baz", name=names)
    assert len(kws) == len(stackers)
    for i, kw in enumerate(kws):
        assert set(['start', 'end', 'foo', 'bar', 'name']) == set(kw.keys())
        assert list(kw['start']['expr'].fields) == stackers[:i]
        assert list(kw['end']['expr'].fields) == stackers[:(i+1)]
        assert kw['foo'] == [10, 20, 30, 40][i]
        assert kw['bar'] == "baz"
        assert kw['name'] == names[i]

def test__graph_will_convert_dataframes_to_sources(pd):
    node_source = pd.DataFrame(data=dict(foo=[]))
    edge_source = pd.DataFrame(data=dict(start=[], end=[], bar=[]))

    kw = bph._graph(node_source, edge_source)

    # 'index' column is added from pandas df
    assert set(kw['node_renderer'].data_source.data.keys()) == {"index", "foo"}
    assert set(kw['edge_renderer'].data_source.data.keys()) == {"index", "start", "end", "bar"}

def test__graph_will_handle_sources_correctly():
    node_source = ColumnDataSource(data=dict(foo=[]))
    edge_source = ColumnDataSource(data=dict(start=[], end=[], bar=[]))

    kw = bph._graph(node_source, edge_source)

    assert set(kw['node_renderer'].data_source.data.keys()) == {"foo"}
    assert set(kw['edge_renderer'].data_source.data.keys()) == {"start", "end", "bar"}

def test__graph_properly_handle_node_property_mixins():
    kwargs = dict(node_fill_color="purple", node_selection_fill_color="blue",
                  node_nonselection_fill_color="yellow", node_hover_fill_color="red",
                  node_muted_fill_color="orange", node_radius=0.6)

    kw = bph._graph({}, {}, **kwargs)

    r = kw['node_renderer']
    assert r.glyph.fill_color == "purple"
    assert r.selection_glyph.fill_color == "blue"
    assert r.nonselection_glyph.fill_color == "yellow"
    assert r.hover_glyph.fill_color == "red"
    assert r.muted_glyph.fill_color == "orange"

    assert r.glyph.radius == 0.6
    assert r.selection_glyph.radius == 0.6
    assert r.nonselection_glyph.radius == 0.6
    assert r.hover_glyph.radius == 0.6
    assert r.muted_glyph.radius == 0.6

def test__graph_properly_handle_edge_property_mixins():
    kwargs = dict(edge_line_color="purple", edge_selection_line_color="blue",
                  edge_nonselection_line_color="yellow", edge_hover_line_color="red",
                  edge_muted_line_color="orange", edge_line_width=23)

    kw = bph._graph({}, {}, **kwargs)

    r = kw['edge_renderer']
    assert r.glyph.line_color == "purple"
    assert r.selection_glyph.line_color == "blue"
    assert r.nonselection_glyph.line_color == "yellow"
    assert r.hover_glyph.line_color == "red"
    assert r.muted_glyph.line_color == "orange"

    assert r.glyph.line_width == 23
    assert r.selection_glyph.line_width == 23
    assert r.nonselection_glyph.line_width == 23
    assert r.hover_glyph.line_width == 23
    assert r.muted_glyph.line_width == 23

_RANGES = [Range1d(), DataRange1d(), FactorRange()]

class Test__get_axis_class(object):

    @pytest.mark.parametrize('range', _RANGES)
    @pytest.mark.unit
    def test_axis_type_None(self, range):
        assert(bph._get_axis_class(None, range, 0)) == (None, {})
        assert(bph._get_axis_class(None, range, 1)) == (None, {})

    @pytest.mark.parametrize('range', _RANGES)
    @pytest.mark.unit
    def test_axis_type_linear(self, range):
        assert(bph._get_axis_class("linear", range, 0)) == (LinearAxis, {})
        assert(bph._get_axis_class("linear", range, 1)) == (LinearAxis, {})

    @pytest.mark.parametrize('range', _RANGES)
    @pytest.mark.unit
    def test_axis_type_log(self, range):
        assert(bph._get_axis_class("log", range, 0)) == (LogAxis, {})
        assert(bph._get_axis_class("log", range, 1)) == (LogAxis, {})

    @pytest.mark.parametrize('range', _RANGES)
    @pytest.mark.unit
    def test_axis_type_datetime(self, range):
        assert(bph._get_axis_class("datetime", range, 0)) == (DatetimeAxis, {})
        assert(bph._get_axis_class("datetime", range, 1)) == (DatetimeAxis, {})

    @pytest.mark.parametrize('range', _RANGES)
    @pytest.mark.unit
    def test_axis_type_mercator(self, range):
        assert(bph._get_axis_class("mercator", range, 0)) == (MercatorAxis, {'dimension': 'lon'})
        assert(bph._get_axis_class("mercator", range, 1)) == (MercatorAxis, {'dimension': 'lat'})

    def test_axis_type_auto(self):
        assert(bph._get_axis_class("auto", FactorRange(), 0)) == (CategoricalAxis, {})
        assert(bph._get_axis_class("auto", FactorRange(), 1)) == (CategoricalAxis, {})
        assert(bph._get_axis_class("auto", DataRange1d(), 0)) == (LinearAxis, {})
        assert(bph._get_axis_class("auto", DataRange1d(), 1)) == (LinearAxis, {})
        assert(bph._get_axis_class("auto", Range1d(), 0)) == (LinearAxis, {})
        assert(bph._get_axis_class("auto", Range1d(), 1)) == (LinearAxis, {})
        assert(bph._get_axis_class("auto", Range1d(start=datetime.datetime(2018, 3, 21)), 0)) == (DatetimeAxis, {})
        assert(bph._get_axis_class("auto", Range1d(start=datetime.datetime(2018, 3, 21)), 1)) == (DatetimeAxis, {})


    @pytest.mark.parametrize('range', _RANGES)
    @pytest.mark.unit
    def test_axis_type_error(self, range):
        with pytest.raises(ValueError):
            bph._get_axis_class("junk", range, 0)
        with pytest.raises(ValueError):
            bph._get_axis_class("junk", range, 1)

def test__get_scale_numeric_range_linear_axis():
    s = bph._get_scale(Range1d(), "linear")
    assert isinstance(s, LinearScale)

    s = bph._get_scale(Range1d(), "datetime")
    assert isinstance(s, LinearScale)

    s = bph._get_scale(Range1d(), "auto")
    assert isinstance(s, LinearScale)

def test__get_scale_numeric_range_log_axis():
    s = bph._get_scale(DataRange1d(), "log")
    assert isinstance(s, LogScale)

def test__get_scale_factor_range():
    s = bph._get_scale(FactorRange(), "auto")
    assert isinstance(s, CategoricalScale)

def test__get_range_with_None():
    r = bph._get_range(None)
    assert isinstance(r, DataRange1d)

def test__get_range_with_Range():
    for t in [Range1d, DataRange1d, FactorRange]:
        rng = t()
        r = bph._get_range(rng)
        assert r is rng

def test__get_range_with_ndarray():
    r = bph._get_range(np.array([10, 20]))
    assert isinstance(r, Range1d)
    assert r.start == 10
    assert r.end == 20

def test__get_range_with_too_long_ndarray():
    with pytest.raises(ValueError):
        bph._get_range(np.array([10, 20, 30]))

def test__get_range_with_ndarray_factors():
    f = np.array(["Crosby", "Stills", "Nash", "Young"])
    r = bph._get_range(f)
    assert isinstance(r, FactorRange)
    assert r.factors == list(f)

def test__get_range_with_series(pd):
    r = bph._get_range(pd.Series([20, 30]))
    assert isinstance(r, Range1d)
    assert r.start == 20
    assert r.end == 30

def test__get_range_with_too_long_series(pd):
    with pytest.raises(ValueError):
        bph._get_range(pd.Series([20, 30, 40]))

def test__get_range_with_string_seq():
    f = ["foo" ,"end", "baz"]
    for t in [list, tuple]:
        r = bph._get_range(t(f))
        assert isinstance(r, FactorRange)
        # FactorRange accepts Seq, but _get_range always sets a list copy
        assert r.factors == f

def test__get_range_with_float_bounds():
    r = bph._get_range((1.2, 10))
    assert isinstance(r, Range1d)
    assert r.start == 1.2
    assert r.end == 10

    r = bph._get_range([1.2, 10])
    assert isinstance(r, Range1d)
    assert r.start == 1.2
    assert r.end == 10

def test_get_range_with_pandas_group(pd):
    from bokeh.sampledata.iris import flowers
    g = flowers.groupby('species')
    r = bph._get_range(g)
    assert isinstance(r, FactorRange)
    assert r.factors == ['setosa', 'versicolor', 'virginica'] # should always be sorted

# TODO: ideally, the list of arguments should be received directly from
# GlyphRenderer, but such case requires a system that would be able to generate
# acceptable values for parameters
_renderer_args_values = {
    'name': [None, '', 'test name'],
    'x_range_name': [None, '', 'x range'],
    'y_range_name': [None, '', 'y range'],
    'level': [None, 'overlay'],
    'view': [None, CDSView(source=None)],
    'visible': [None, False, True],
    'muted': [None, False, True]
}
@pytest.mark.parametrize('arg,values', [(arg, _renderer_args_values[arg]) for arg in bph._RENDERER_ARGS])
@pytest.mark.unit
def test__glyph_receives_renderer_arg(arg, values):
    for value in values:
        with mock.patch('bokeh.plotting.helpers.GlyphRenderer', autospec=True) as gr_mock:
            fn = bph._glyph_function(Marker)
            fn(Figure(), x=0, y=0, **{arg: value})
            _, kwargs = gr_mock.call_args
            assert arg in kwargs and kwargs[arg] == value

#-----------------------------------------------------------------------------
# Code
#-----------------------------------------------------------------------------
