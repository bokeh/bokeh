import bokeh.layouts as lyt
import pytest
from bokeh.core.enums import SizingMode
from bokeh.plotting import figure

from bokeh.layouts import gridplot
from bokeh.models import Column, Row, Spacer

def test_gridplot_merge_tools_flat():
    p1, p2, p3, p4 = figure(), figure(), figure(), figure()

    lyt.gridplot([[p1, p2], [p3, p4]], merge_tools=True)

    for p in p1, p2, p3, p4:
        assert p.toolbar_location is None


def test_gridplot_merge_tools_with_None():
    p1, p2, p3, p4 = figure(), figure(), figure(), figure()

    lyt.gridplot([[p1, None, p2], [p3, p4, None]], merge_tools=True)

    for p in p1, p2, p3, p4:
        assert p.toolbar_location is None


def test_gridplot_merge_tools_nested():
    p1, p2, p3, p4, p5, p6, p7 = figure(), figure(), figure(), figure(), figure(), figure(), figure()
    r1 = lyt.row(p1, p2)
    r2 = lyt.row(p3, p4)
    c = lyt.column(lyt.row(p5), lyt.row(p6))

    lyt.gridplot([[r1, r2], [c, p7]], merge_tools=True)

    for p in p1, p2, p3, p4, p5, p6, p7:
        assert p.toolbar_location is None


def test_gridplot_None():
    def p():
        p = figure()
        p.circle([1, 2, 3], [4, 5, 6])
        return p

    g = gridplot([[p(), p()], [None, None], [p(), p()]])

    assert isinstance(g, Column) and len(g.children) == 2

    c = g.children[1]
    assert isinstance(c, Column) and len(c.children) == 3

    r = c.children[1]
    assert isinstance(r, Row) and len(r.children) == 2

    s0 = r.children[0]
    assert isinstance(s0, Spacer) and s0.width == 0 and s0.height == 0
    s1 = r.children[1]
    assert isinstance(s1, Spacer) and s1.width == 0 and s1.height == 0


def test_layout_simple():
    p1, p2, p3, p4 = figure(), figure(), figure(), figure()

    grid = lyt.layout([[p1, p2], [p3, p4]], sizing_mode='fixed')

    assert isinstance(grid, lyt.Column)
    for row in grid.children:
        assert isinstance(row, lyt.Row)


def test_layout_nested():
    p1, p2, p3, p4, p5, p6 = figure(), figure(), figure(), figure(), figure(), figure()

    grid = lyt.layout([[[p1, p1], [p2, p2]], [[p3, p4], [p5, p6]]], sizing_mode='fixed')

    assert isinstance(grid, lyt.Column)
    for row in grid.children:
        assert isinstance(row, lyt.Row)
        for col in row.children:
            assert isinstance(col, lyt.Column)


@pytest.mark.parametrize('sizing_mode', SizingMode)
@pytest.mark.unit
def test_layout_sizing_mode(sizing_mode):
    p1, p2, p3, p4 = figure(), figure(), figure(), figure()

    lyt.layout([[p1, p2], [p3, p4]], sizing_mode=sizing_mode)

    for p in p1, p2, p3, p4:
        assert p1.sizing_mode == sizing_mode
