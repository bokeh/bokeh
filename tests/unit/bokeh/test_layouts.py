#-----------------------------------------------------------------------------
# Copyright (c) Anaconda, Inc., and Bokeh Contributors.
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
from unittest import mock

# Bokeh imports
from bokeh.core.validation import check_integrity, process_validation_issues
from bokeh.layouts import (
    column,
    grid,
    gridplot,
    group_tools,
    layout,
    row,
)
from bokeh.models import (
    BoxAnnotation,
    BoxSelectTool,
    Column,
    GlyphRenderer,
    GridBox,
    GridPlot,
    HoverTool,
    LayoutDOM,
    PanTool,
    Row,
    SaveTool,
    Spacer,
    TapTool,
    ToolProxy,
)
from bokeh.plotting import figure

#-----------------------------------------------------------------------------
# Setup
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# General API
#-----------------------------------------------------------------------------

def test_gridplot_merge_tools_flat() -> None:
    p1, p2, p3, p4 = figure(), figure(), figure(), figure()

    gridplot([[p1, p2], [p3, p4]], merge_tools=True)

    for p in p1, p2, p3, p4:
        assert p.toolbar_location is None

def test_gridplot_merge_tools_with_None() -> None:
    p1, p2, p3, p4 = figure(), figure(), figure(), figure()

    gridplot([[p1, None, p2], [p3, p4, None]], merge_tools=True)

    for p in p1, p2, p3, p4:
        assert p.toolbar_location is None

def test_gridplot_merge_tools_nested() -> None:
    p1, p2, p3, p4, p5, p6, p7 = figure(), figure(), figure(), figure(), figure(), figure(), figure()
    r1 = row(p1, p2)
    r2 = row(p3, p4)
    c = column(row(p5), row(p6))

    gridplot([[r1, r2], [c, p7]], merge_tools=True)

    for p in p1, p2, p3, p4, p5, p6, p7:
        assert p.toolbar_location is None

def test_gridplot_merge_toolbar_properties__issue_13265() -> None:
    p1 = figure(active_inspect=None)
    p2 = figure(active_inspect=None)
    p3 = figure(active_inspect=None)

    gp0 = gridplot([[p1, p2, p3]], merge_tools=True)
    assert gp0.toolbar.active_inspect is None

    gp1 = gridplot([[p1, p2, p3]], merge_tools=False)
    assert gp1.toolbar.active_inspect == "auto"

    p4 = figure(active_inspect=None)
    p5 = figure(active_inspect=None)
    p6 = figure(active_inspect="auto")

    with pytest.warns(UserWarning, match="found multiple competing values for 'toolbar.active_inspect' property; using the latest value"):
        gp2 = gridplot([[p4, p5, p6]], merge_tools=True)
    assert gp2.toolbar.active_inspect == "auto"

def test_gridplot_toolbar_options__issue_13369() -> None:
    p1 = figure()
    p2 = figure()
    p3 = figure()

    gp0 = gridplot([[p1, p2, p3]], merge_tools=True, toolbar_options=dict(logo="grey", autohide=True))
    assert gp0.toolbar.logo == "grey"
    assert gp0.toolbar.autohide is True

    gp1 = gridplot([[p1, p2, p3]], merge_tools=False, toolbar_options=dict(logo="grey", autohide=True))
    assert gp1.toolbar.logo == "grey"
    assert gp1.toolbar.autohide is True

    gp2 = gridplot([[p1, p2, p3]], merge_tools=True)
    assert gp2.toolbar.logo == "normal"
    assert gp2.toolbar.autohide is False

    gp3 = gridplot([[p1, p2, p3]], merge_tools=False)
    assert gp3.toolbar.logo == "normal"
    assert gp3.toolbar.autohide is False

def test_gridplot_None() -> None:
    def p():
        p = figure()
        p.scatter([1, 2, 3], [4, 5, 6])
        return p

    p0, p1, p2, p3 = p(), p(), p(), p()
    g = gridplot([[p0, p1], [None, None], [p2, p3]], toolbar_location=None)

    assert isinstance(g, GridPlot) and len(g.children) == 4
    assert g.children == [(p0, 0, 0), (p1, 0, 1), (p2, 2, 0), (p3, 2, 1)]


def test_gridplot_using_ncols() -> None:
    def p():
        p = figure()
        p.scatter([1, 2, 3], [4, 5, 6])
        return p

    p0, p1, p2, p3 = p(), p(), p(), p()
    g = gridplot([p0, p1, p2, p3], ncols=2)

    assert isinstance(g, GridPlot) and len(g.children) == 4
    assert g.children == [(p0, 0, 0), (p1, 0, 1), (p2, 1, 0), (p3, 1, 1)]


def test_layout_simple() -> None:
    p1, p2, p3, p4 = figure(), figure(), figure(), figure()

    grid = layout([[p1, p2], [p3, p4]], sizing_mode='fixed')

    assert isinstance(grid, Column)
    for r in grid.children:
        assert isinstance(r, Row)

def test_layout_kwargs() -> None:
    p1, p2, p3, p4 = figure(), figure(), figure(), figure()

    grid = layout([[p1, p2], [p3, p4]], sizing_mode='fixed', name='simple')

    assert grid.name == 'simple'

def test_layout_nested() -> None:
    p1, p2, p3, p4, p5, p6 = figure(), figure(), figure(), figure(), figure(), figure()

    grid = layout([[[p1, p1], [p2, p2]], [[p3, p4], [p5, p6]]], sizing_mode='fixed')

    assert isinstance(grid, Column)
    for r in grid.children:
        assert isinstance(r, Row)
        for c in r.children:
            assert isinstance(c, Column)

def test_grid() -> None:
    s0 = Spacer()
    s1 = Spacer()
    s2 = Spacer()
    s3 = Spacer()
    s4 = Spacer()
    s5 = Spacer()
    s6 = Spacer()

    g0 = grid([])
    assert g0.children == []

    g1 = grid(column(s0, row(column(s1, s2, s3, s4, s5), s6)))
    assert g1.children == [
        (s0, 0, 0, 1, 2),
        (s1, 1, 0, 1, 1),
        (s2, 2, 0, 1, 1),
        (s3, 3, 0, 1, 1),
        (s4, 4, 0, 1, 1),
        (s5, 5, 0, 1, 1),
        (s6, 1, 1, 5, 1),
    ]

    g2 = grid([s0, [[s1, s2, s3, s4, s5], s6]])
    assert g2.children == [
        (s0, 0, 0, 1, 2),
        (s1, 1, 0, 1, 1),
        (s2, 2, 0, 1, 1),
        (s3, 3, 0, 1, 1),
        (s4, 4, 0, 1, 1),
        (s5, 5, 0, 1, 1),
        (s6, 1, 1, 5, 1),
    ]

    g3 = grid([s0, s1, s2, s3, s4, s5, s6], ncols=2)
    assert g3.children == [
        (s0, 0, 0, 1, 1),
        (s1, 0, 1, 1, 1),
        (s2, 1, 0, 1, 1),
        (s3, 1, 1, 1, 1),
        (s4, 2, 0, 1, 1),
        (s5, 2, 1, 1, 1),
        (s6, 3, 0, 1, 2),
    ]

    g4 = grid([s0, s1, s2, s3, s4, s5, s6, None], ncols=2)
    assert g4.children == [
        (s0, 0, 0, 1, 1),
        (s1, 0, 1, 1, 1),
        (s2, 1, 0, 1, 1),
        (s3, 1, 1, 1, 1),
        (s4, 2, 0, 1, 1),
        (s5, 2, 1, 1, 1),
        (s6, 3, 0, 1, 1),
    ]

    with pytest.raises(NotImplementedError):
        grid("""
        +----+----+----+----+
        | s1 | s2 | s3 |    |
        +---------+----+ s4 |
        |    s5   | s5 |    |
        +---------+----+----+
        """)

def test_repeated_children() -> None:
    def test(layout: LayoutDOM) -> None:
        with mock.patch("bokeh.core.validation.check.log") as mock_logger:
            issues = check_integrity([layout])
            process_validation_issues(issues)
        assert mock_logger.error.call_count == 1
        assert mock_logger.error.call_args[0][0].startswith("E-1027 (REPEATED_LAYOUT_CHILD): The same model can't be used multiple times in a layout")

    p0 = figure()
    p1 = figure()

    test(Row(children=[p0, p1, p0]))
    test(row(p0, p1, p0))

    test(Column(children=[p0, p1, p0]))
    test(column(p0, p1, p0))

    test(GridBox(children=[(p0, 0, 0), (p1, 1, 0), (p0, 2, 0)]))
    test(gridplot([[p0], [p1], [p0]], toolbar_location=None))

def test_group_tools() -> None:
    pan0 = PanTool(dimensions="both")
    pan1 = PanTool(dimensions="both")
    pan2 = PanTool(dimensions="width")
    pan3 = PanTool(dimensions="width")
    pan4 = PanTool(dimensions="width")
    pan5 = PanTool(dimensions="height")
    tap0 = TapTool(behavior="select")
    tap1 = TapTool(behavior="select")
    tap2 = TapTool(behavior="inspect")
    save0 = SaveTool(filename="foo.png")
    save1 = SaveTool(filename="foo.png")
    select0 = BoxSelectTool(overlay=BoxAnnotation())
    select1 = BoxSelectTool(overlay=BoxAnnotation())
    select2 = BoxSelectTool(overlay=BoxAnnotation())
    hover0 = HoverTool(renderers=[GlyphRenderer()])
    hover1 = HoverTool(renderers=[GlyphRenderer()])
    hover2 = HoverTool(renderers=[GlyphRenderer()])

    tools = [
        pan0, tap0, pan2, pan1, tap1, pan5, pan4, pan3, tap2, save0,
        save1, select0, hover0, hover1, select1, select2, hover2,
    ]

    grouped = group_tools(tools, merge=lambda cls, tools: SaveTool() if issubclass(cls, SaveTool) else None)

    assert len(grouped) == 8
    t0, t1, t2, t3, t4, t5, t6, t7 = grouped

    assert isinstance(t0, ToolProxy)
    assert isinstance(t1, ToolProxy)
    assert isinstance(t2, ToolProxy)
    assert isinstance(t3, ToolProxy)
    assert isinstance(t4, ToolProxy)
    assert isinstance(t5, SaveTool)
    assert isinstance(t6, ToolProxy)
    assert isinstance(t7, ToolProxy)

    assert t0.tools == [pan0, pan1]
    assert t1.tools == [pan2, pan4, pan3]
    assert t2.tools == [pan5]
    assert t3.tools == [tap0, tap1]
    assert t4.tools == [tap2]
    assert t5 != save0 and t5 != save1 and t5.filename is None
    assert t6.tools == [select0, select1, select2]
    assert t7.tools == [hover0, hover1, hover2]

#-----------------------------------------------------------------------------
# Dev API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Private API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Code
#-----------------------------------------------------------------------------
