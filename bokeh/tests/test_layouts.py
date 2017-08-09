import bokeh.layouts as lyt
import pytest
from bokeh.core.enums import SizingMode
from bokeh.plotting import figure


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
def test_layout_sizing_mode(sizing_mode):
    p1, p2, p3, p4 = figure(), figure(), figure(), figure()

    lyt.layout([[p1, p2], [p3, p4]], sizing_mode=sizing_mode)

    for p in p1, p2, p3, p4:
        assert p1.sizing_mode == sizing_mode
