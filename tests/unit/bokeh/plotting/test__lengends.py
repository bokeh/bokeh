#-----------------------------------------------------------------------------
# Copyright (c) 2012 - 2021, Anaconda, Inc., and Bokeh Contributors.
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

# Standard library imports
import itertools

# Bokeh imports
from bokeh.models import (
    ColumnDataSource,
    GlyphRenderer,
    Legend,
    LegendItem,
)

# Module under test
import bokeh.plotting._legends as bpl # isort:skip

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

@pytest.mark.parametrize('key', LEGEND_KWS)
def test_pop_legend_kwarg(key) -> None:
    kws = {'foo': 10, key: 'bar'}
    assert bpl.pop_legend_kwarg(kws) == {key: "bar"}

@pytest.mark.parametrize('keys', all_combinations(LEGEND_KWS))
def test_pop_legend_kwarg_error(keys) -> None:
    kws = dict(zip(keys, range(len(keys))))
    with pytest.raises(ValueError):
        bpl.pop_legend_kwarg(kws)

#-----------------------------------------------------------------------------
# Private API
#-----------------------------------------------------------------------------

def test__find_legend_item() -> None:
    legend = Legend(items=[LegendItem(label=dict(value="foo")), LegendItem(label=dict(field="bar"))])
    assert bpl._find_legend_item(dict(value="baz"), legend) is None
    assert bpl._find_legend_item(dict(value="foo"), legend) is legend.items[0]
    assert bpl._find_legend_item(dict(field="bar"), legend) is legend.items[1]


class Test__handle_legend_deprecated:
    @pytest.mark.parametrize('arg', [1, 2.7, None, False, [], {'junk': 10}, {'label': 'foo', 'junk': 10}, {'value': 'foo', 'junk': 10}])
    def test_bad_arg(self, arg) -> None:
        with pytest.raises(ValueError):
            bpl._handle_legend_deprecated(arg, "legend", "renderer")

    def test_value_string(self) -> None:
        legend = Legend(items=[LegendItem(label=dict(value="foo"))])
        renderer = GlyphRenderer(data_source=ColumnDataSource())
        bpl._handle_legend_deprecated("foo", legend, renderer)
        assert len(legend.items) == 1
        assert all("value" in item.label for item in legend.items)
        bpl._handle_legend_deprecated("bar", legend, renderer)
        assert len(legend.items) == 2
        assert all("value" in item.label for item in legend.items)

    def test_value_dict(self) -> None:
        legend = Legend(items=[LegendItem(label=dict(value="foo"))])
        renderer = GlyphRenderer(data_source=ColumnDataSource())
        bpl._handle_legend_deprecated(dict(value="foo"), legend, renderer)
        assert len(legend.items) == 1
        assert all("value" in item.label for item in legend.items)
        bpl._handle_legend_deprecated(dict(value="bar"), legend, renderer)
        assert len(legend.items) == 2
        assert all("value" in item.label for item in legend.items)

    def test_field_string(self) -> None:
        legend = Legend(items=[LegendItem(label=dict(field="foo"))])
        renderer = GlyphRenderer(data_source=ColumnDataSource(data=dict(foo=[], bar=[])))
        bpl._handle_legend_deprecated("foo", legend, renderer)
        assert len(legend.items) == 1
        assert all("field" in item.label for item in legend.items)
        bpl._handle_legend_deprecated("bar", legend, renderer)
        assert len(legend.items) == 2
        assert all("field" in item.label for item in legend.items)

    def test_field_dict(self) -> None:
        legend = Legend(items=[LegendItem(label=dict(field="foo"))])
        renderer = GlyphRenderer(data_source=ColumnDataSource(data=dict(foo=[], bar=[])))
        bpl._handle_legend_deprecated(dict(field="foo"), legend, renderer)
        assert len(legend.items) == 1
        assert all("field" in item.label for item in legend.items)
        bpl._handle_legend_deprecated(dict(field="bar"), legend, renderer)
        assert len(legend.items) == 2
        assert all("field" in item.label for item in legend.items)


class Test__handle_legend_field:
    @pytest.mark.parametrize('arg', [1, 2.7, None, False, [], {}])
    def test_bad_arg(self, arg) -> None:
        with pytest.raises(ValueError):
            bpl._handle_legend_field(arg, "legend", "renderer")

    def test_label_already_exists(self) -> None:
        legend = Legend(items=[LegendItem(label=dict(field="foo"))])
        renderer = GlyphRenderer()
        bpl._handle_legend_field("foo", legend, renderer)
        assert len(legend.items) == 1
        assert legend.items[0].label == dict(field="foo")
        assert legend.items[0].renderers == [renderer]

    def test_label_not_already_exists(self) -> None:
        legend = Legend(items=[LegendItem(label=dict(field="foo"))])
        renderer = GlyphRenderer()
        bpl._handle_legend_field("bar", legend, renderer)
        assert len(legend.items) == 2
        assert legend.items[0].label == dict(field="foo")
        assert legend.items[0].renderers == []
        assert legend.items[1].label == dict(field="bar")
        assert legend.items[1].renderers == [renderer]


class Test__handle_legend_group:
    @pytest.mark.parametrize('arg', [1, 2.7, None, False, [], {}])
    def test_bad_arg(self, arg) -> None:
        with pytest.raises(ValueError):
            bpl._handle_legend_group(arg, "legend", "renderer")

    def test_bad_source(self) -> None:
        with pytest.raises(ValueError):
            bpl._handle_legend_group("foo", "legend", GlyphRenderer())
        with pytest.raises(ValueError):
            bpl._handle_legend_group("foo", "legend", GlyphRenderer(data_source=ColumnDataSource(data=dict(bar=[]))))

    def test_items(self) -> None:
        source = ColumnDataSource(data=dict(foo=[10,10,20,30,20,30,40]))
        renderer = GlyphRenderer(data_source=source)
        legend = Legend(items=[])
        bpl._handle_legend_group("foo", legend, renderer)
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


class Test__handle_legend_label:
    @pytest.mark.parametrize('arg', [1, 2.7, None, False, [], {}])
    def test_bad_arg(self, arg) -> None:
        with pytest.raises(ValueError):
            bpl._handle_legend_label(arg, "legend", "renderer")

    def test_label_already_exists(self) -> None:
        legend = Legend(items=[LegendItem(label=dict(value="foo"))])
        renderer = GlyphRenderer()
        bpl._handle_legend_label("foo", legend, renderer)
        assert len(legend.items) == 1
        assert legend.items[0].label == dict(value="foo")
        assert legend.items[0].renderers == [renderer]

    def test_label_not_already_exists(self) -> None:
        legend = Legend(items=[LegendItem(label=dict(value="foo"))])
        renderer = GlyphRenderer()
        bpl._handle_legend_label("bar", legend, renderer)
        assert len(legend.items) == 2
        assert legend.items[0].label == dict(value="foo")
        assert legend.items[0].renderers == []
        assert legend.items[1].label == dict(value="bar")
        assert legend.items[1].renderers == [renderer]
