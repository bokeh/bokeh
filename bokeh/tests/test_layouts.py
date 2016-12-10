from bokeh.plotting import figure

import bokeh.layouts as lyt

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
