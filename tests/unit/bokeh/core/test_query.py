#-----------------------------------------------------------------------------
# Copyright (c) 2012 - 2022, Anaconda, Inc., and Bokeh Contributors.
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

# Bokeh imports
from bokeh.models import (
    Axis,
    BoxZoomTool,
    Circle,
    ColumnDataSource,
    DatetimeAxis,
    Glyph,
    GlyphRenderer,
    Grid,
    Line,
    LinearAxis,
    LogAxis,
    PanTool,
    Plot,
    Range1d,
    Rect,
    ResetTool,
    SaveTool,
    Tool,
    WheelZoomTool,
)

# Module under test
import bokeh.core.query as q # isort:skip

#-----------------------------------------------------------------------------
# Setup
#-----------------------------------------------------------------------------

typcases = {
    Range1d: 3,

    Plot: 1,
    Glyph: 3,

    Axis: 3,
    DatetimeAxis: 1,
    LinearAxis: 2,  # DatetimeAxis is subclass of LinearAxis
    LogAxis: 1,

    Grid: 2,

    Tool: 5,
    BoxZoomTool: 1,
    PanTool: 1,
    SaveTool: 1,
    ResetTool: 1,
    WheelZoomTool: 1,
}

#-----------------------------------------------------------------------------
# General API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Dev API
#-----------------------------------------------------------------------------

def large_plot():
    source = ColumnDataSource(data=dict(x=[0, 1], y=[0, 1]))

    xdr = Range1d(start=0, end=1)
    xdr.tags.append("foo")
    xdr.tags.append("bar")

    ydr = Range1d(start=10, end=20)
    ydr.tags.append("foo")
    ydr.tags.append(11)

    plot = Plot(x_range=xdr, y_range=ydr)

    ydr2 = Range1d(start=0, end=100)
    plot.extra_y_ranges = {"liny": ydr2}

    circle = Circle(x="x", y="y", fill_color="red", size=5, line_color="black")
    plot.add_glyph(source, circle, name="mycircle")

    line = Line(x="x", y="y")
    plot.add_glyph(source, line, name="myline")

    rect = Rect(x="x", y="y", width=1, height=1, fill_color="green")
    plot.add_glyph(source, rect, name="myrect")

    plot.add_layout(DatetimeAxis(), 'below')
    plot.add_layout(LogAxis(), 'left')
    plot.add_layout(LinearAxis(y_range_name="liny"), 'left')

    plot.add_layout(Grid(dimension=0), 'left')
    plot.add_layout(Grid(dimension=1), 'left')

    plot.add_tools(
        BoxZoomTool(), PanTool(), SaveTool(), ResetTool(), WheelZoomTool(),
    )

    return plot

plot = large_plot()

def test_type() -> None:

    for typ, count in typcases.items():
        res = list(q.find(plot.references(), dict(type=typ)))
        assert len(res) == count
        assert all(isinstance(x, typ) for x in res)

def test_tags_with_scalar() -> None:
    cases = {
        11: 1,
        12: 0,
    }

    for tag, count in cases.items():
        res = list(q.find(plot.references(), dict(tags=tag)))
        assert len(res) == count

def test_tags_with_string() -> None:
    cases = {
        "foo": 2,
        "bar": 1,
    }

    for tag, count in cases.items():
        res = list(q.find(plot.references(), dict(tags=tag)))
        assert len(res) == count

def test_tags_with_seq() -> None:
    cases = {
        "foo": 2,
        "bar": 1,
    }

    for tag, count in cases.items():
        res = list(q.find(plot.references(), dict(tags=[tag])))
        assert len(res) == count

    res = list(q.find(plot.references(), dict(tags=list(cases.keys()))))
    assert len(res) == 2

def test_name() -> None:
    cases = {
        "myline": Line,
        "mycircle": Circle,
        "myrect": Rect,
    }

    for name, typ in cases.items():
        res = list(q.find(plot.references(), dict(name=name)))
        assert len(res) == 1
        assert all(isinstance(x.glyph, typ) for x in res)

def test_in() -> None:
    res = list(q.find(plot.references(), dict(name={q.IN: ['a', 'b']})))
    assert len(res) == 0

    res = list(q.find(plot.references(), dict(name={q.IN: ['a', 'mycircle']})))
    assert len(res) == 1

    res = list(q.find(plot.references(), dict(name={q.IN: ['a', 'mycircle', 'myline']})))
    assert len(res) == 2

    res = list(q.find(plot.references(), dict(name={q.IN: ['a', 'mycircle', 'myline', 'myrect']})))
    assert len(res) == 3

    for typ, count in typcases.items():
        res = list(q.find(plot.references(), dict(type={q.IN: [typ]})))
        assert len(res) == count
        assert all(isinstance(x, typ) for x in res)

        res = list(q.find(plot.references(), dict(type={q.IN: [typ, dict]})))
        assert len(res) == count
        assert all(isinstance(x, typ) for x in res)

        res = list(q.find(plot.references(), dict(type={q.IN: [dict]})))
        assert len(res) == 0

    # count adjusted by hand to account for duplicates/subclasses
    res = list(q.find(plot.references(), dict(type={q.IN: list(typcases.keys())})))
    assert len(res) == 17

def test_disjuction() -> None:
    res = list(
        q.find(plot.references(),
        {q.OR: [dict(type=Axis), dict(type=Grid)]})
    )
    assert len(res) == 5

    res = list(
        q.find(plot.references(),
        {q.OR: [dict(type=Axis), dict(name="mycircle")]})
    )
    assert len(res) == 4

    res = list(
        q.find(plot.references(),
        {q.OR: [dict(type=Axis), dict(tags="foo"), dict(name="mycircle")]})
    )
    assert len(res) == 6

    res = list(
        q.find(plot.references(),
        {q.OR: [dict(type=Axis), dict(tags="foo"), dict(name="mycircle"), dict(name="bad")]})
    )
    assert len(res) == 6

def test_conjuction() -> None:
    res = list(
        q.find(plot.references(), dict(type=Axis, tags="foo"))
    )
    assert len(res) == 0

    res = list(
        q.find(plot.references(), dict(type=Range1d, tags="foo"))
    )
    assert len(res) == 2

    res = list(
        q.find(plot.references(), dict(type=GlyphRenderer, name="mycircle"))
    )
    assert len(res) == 1

def test_ops() -> None:
    res = list(
        q.find(plot.references(), {'size': {q.EQ: 5}})
    )
    assert len(res) == 1

    res = list(
        q.find(plot.references(), {'size': {q.NEQ: 5}})
    )
    assert len(res) == 0

    res = list(
        q.find(plot.references(), {'size': {q.GEQ: 5}})
    )
    assert len(res) == 1

    res = list(
        q.find(plot.references(), {'size': {q.LEQ: 5}})
    )
    assert len(res) == 1

    res = list(
        q.find(plot.references(), {'size': {q.GT: 5}})
    )
    assert len(res) == 0

    res = list(
        q.find(plot.references(), {'size': {q.LT: 5}})
    )
    assert len(res) == 0

def test_malformed_exception() -> None:
    with pytest.raises(ValueError):
        q.match(plot, {11: {q.EQ: 5}})

def test_is_single_string_selector() -> None:
    assert q.is_single_string_selector(dict(foo="c"), "foo")
    assert not q.is_single_string_selector(dict(foo="c", bar="d"), "foo")
    assert not q.is_single_string_selector(dict(foo=42), "foo")


#-----------------------------------------------------------------------------
# Private API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Code
#-----------------------------------------------------------------------------
