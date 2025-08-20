#-----------------------------------------------------------------------------
# Copyright (c) Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------

# pyright: reportPrivateUsage=false

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
from typing import Any

# Bokeh imports
from bokeh.core.enums import PlaceType as Place
from bokeh.core.properties import field, value
from bokeh.models import (
    ColumnDataSource,
    GlyphRenderer,
    Legend,
    LegendItem,
)
from bokeh.plotting import figure

# Module under test
import bokeh.plotting._legends as bpl # isort:skip

#-----------------------------------------------------------------------------
# Setup
#-----------------------------------------------------------------------------

def all_combinations(lst: list[str]):
    return itertools.chain.from_iterable(
        itertools.combinations(lst, i + 1) for i in range(2, len(lst))
    )

LEGEND_KWS = ['legend', 'legend_label', 'legend_field', 'legend_group']

#-----------------------------------------------------------------------------
# General API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Dev API
#-----------------------------------------------------------------------------

@pytest.mark.parametrize('key', LEGEND_KWS)
def test_pop_legend_kwarg(key: str) -> None:
    kws = {'foo': 10, key: 'bar'}
    assert bpl.pop_legend_kwarg(kws) == ({key: "bar"}, None)

@pytest.mark.parametrize('keys', all_combinations(LEGEND_KWS))
def test_pop_legend_kwarg_error(keys: list[str]) -> None:
    kws = dict(zip(keys, range(len(keys))))
    with pytest.raises(ValueError):
        bpl.pop_legend_kwarg(kws)

#-----------------------------------------------------------------------------
# Private API
#-----------------------------------------------------------------------------

def test__find_legend_item() -> None:
    legend = Legend(items=[LegendItem(label=value("foo")), LegendItem(label=field("bar"))])
    assert bpl._find_legend_item(value("baz"), legend) is None
    assert bpl._find_legend_item(value("foo"), legend) is legend.items[0]
    assert bpl._find_legend_item(field("bar"), legend) is legend.items[1]

class Test__handle_legend_field:
    @pytest.mark.parametrize('arg', [1, 2.7, None, False, [], {}])
    def test_bad_arg(self, arg: Any) -> None:
        with pytest.raises(ValueError):
            bpl._handle_legend_field(arg, Legend(), GlyphRenderer())

    def test_label_already_exists(self) -> None:
        legend = Legend(items=[LegendItem(label=field("foo"))])
        renderer = GlyphRenderer()
        bpl._handle_legend_field("foo", legend, renderer)
        assert len(legend.items) == 1
        assert legend.items[0].label == field("foo")
        assert legend.items[0].renderers == [renderer]

    def test_label_not_already_exists(self) -> None:
        legend = Legend(items=[LegendItem(label=field("foo"))])
        renderer = GlyphRenderer()
        bpl._handle_legend_field("bar", legend, renderer)
        assert len(legend.items) == 2
        assert legend.items[0].label == field("foo")
        assert legend.items[0].renderers == []
        assert legend.items[1].label == field("bar")
        assert legend.items[1].renderers == [renderer]


class Test__handle_legend_group:
    @pytest.mark.parametrize('arg', [1, 2.7, None, False, [], {}])
    def test_bad_arg(self, arg: Any) -> None:
        with pytest.raises(ValueError):
            bpl._handle_legend_group(arg, Legend(), GlyphRenderer())

    def test_bad_source(self) -> None:
        with pytest.raises(ValueError):
            bpl._handle_legend_group("foo", Legend(), GlyphRenderer())
        with pytest.raises(ValueError):
            bpl._handle_legend_group("foo", Legend(), GlyphRenderer(data_source=ColumnDataSource(data=dict(bar=[]))))

    def test_items(self) -> None:
        source = ColumnDataSource(data=dict(foo=[10,10,20,30,20,30,40]))
        renderer = GlyphRenderer(data_source=source)
        legend = Legend(items=[])
        bpl._handle_legend_group("foo", legend, renderer)
        assert len(legend.items) == 4
        assert legend.items[0].label == value("10")
        assert legend.items[0].renderers == [renderer]
        assert legend.items[0].index == 0

        assert legend.items[1].label == value("20")
        assert legend.items[1].renderers == [renderer]
        assert legend.items[1].index == 2

        assert legend.items[2].label == value("30")
        assert legend.items[2].renderers == [renderer]
        assert legend.items[2].index == 3

        assert legend.items[3].label == value("40")
        assert legend.items[3].renderers == [renderer]
        assert legend.items[3].index == 6


class Test__handle_legend_label:
    @pytest.mark.parametrize('arg', [1, 2.7, None, False, [], {}])
    def test_bad_arg(self, arg: Any) -> None:
        with pytest.raises(ValueError):
            bpl._handle_legend_label(arg, Legend(), GlyphRenderer())

    def test_label_already_exists(self) -> None:
        legend = Legend(items=[LegendItem(label=value("foo"))])
        renderer = GlyphRenderer()
        bpl._handle_legend_label("foo", legend, renderer)
        assert len(legend.items) == 1
        assert legend.items[0].label == value("foo")
        assert legend.items[0].renderers == [renderer]

    def test_label_not_already_exists(self) -> None:
        legend = Legend(items=[LegendItem(label=value("foo"))])
        renderer = GlyphRenderer()
        bpl._handle_legend_label("bar", legend, renderer)
        assert len(legend.items) == 2
        assert legend.items[0].label == value("foo")
        assert legend.items[0].renderers == []
        assert legend.items[1].label == value("bar")
        assert legend.items[1].renderers == [renderer]


class Test__get_or_create_legend:
    def test_legend_not_already_exists(self) -> None:
        plot = figure()
        assert plot.legend == []
        legend = bpl._get_or_create_legend(plot, None)
        assert plot.legend == [legend]

    @pytest.mark.parametrize('place', ['above', 'below', 'left', 'right', 'center'])
    def test_legend_already_exists(self, place: Place) -> None:
        plot = figure()
        legend = Legend()
        plot.add_layout(legend, place)

        got_legend = bpl._get_or_create_legend(plot, None)
        assert got_legend == legend

    def test_multiple_legends(self) -> None:
        plot = figure()
        plot.add_layout(Legend())
        plot.add_layout(Legend())

        with pytest.raises(RuntimeError) as e:
            bpl._get_or_create_legend(plot, None)
            assert str(e).endswith('configured with more than one legend renderer, cannot use legend_* convenience arguments')

    def test_legend_name(self) -> None:
        p = figure()
        legend = Legend(name="foo")
        p.add_layout(legend, "below")
        cr = p.circle([1, 2, 3], [1, 2, 3], legend_label="bar", legend_name="foo")

        assert len(legend.items) == 1
        assert legend.items[0].label == value("bar")
        assert legend.items[0].renderers == [cr]

    def test_legend_name_missing(self) -> None:
        p = figure()

        with pytest.raises(RuntimeError):
            p.circle([1, 2, 3], [1, 2, 3], legend_label="bar", legend_name="foo")

    def test_legend_name_multiple(self) -> None:
        p = figure()
        legend0 = Legend(name="foo")
        legend1 = Legend(name="foo")
        p.add_layout(legend0, "below")
        p.add_layout(legend1, "above")

        with pytest.raises(RuntimeError):
            p.circle([1, 2, 3], [1, 2, 3], legend_label="bar", legend_name="foo")
