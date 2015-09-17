from __future__ import absolute_import

import unittest

import bokeh.query as query

from bokeh.models import (
    Axis, BoxZoomTool, ColumnDataSource, DatetimeAxis, GlyphRenderer, Grid, LinearAxis,
    LogAxis, PanTool, Plot, PreviewSaveTool, Range1d, ResetTool, ResizeTool, Tool, WheelZoomTool,
)
from bokeh.models.glyphs import Glyph, Circle, Line, Rect

def large_plot():
    source = ColumnDataSource(data=dict(x=[0, 1], y=[0, 1]))

    xdr = Range1d(start=0, end=1)
    xdr.tags.append("foo")
    xdr.tags.append("bar")

    ydr = Range1d(start=10, end=20)
    ydr.tags.append("foo")

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
        BoxZoomTool(), PanTool(), PreviewSaveTool(), ResetTool(), ResizeTool(), WheelZoomTool(),
    )

    return plot

class TestMatch(unittest.TestCase):

    def test_type(self):
        pass

typcases = {
    Range1d: 3,

    Plot: 1,
    Glyph: 3,

    Axis: 3,
    DatetimeAxis: 1,
    LinearAxis: 2,  # DatetimeAxis is subclass of LinearAxis
    LogAxis: 1,

    Grid: 2,

    Tool: 6,
    BoxZoomTool: 1,
    PanTool: 1,
    PreviewSaveTool: 1,
    ResetTool: 1,
    ResizeTool: 1,
    WheelZoomTool: 1,
}

class TestFind(unittest.TestCase):

    def setUp(self):
        self.plot = large_plot()

    def test_type(self):

        for typ, count in typcases.items():
            res = list(query.find(self.plot.references(), dict(type=typ)))
            self.assertEqual(len(res), count)
            self.assertTrue(all(isinstance(x, typ) for x in res))

    def test_tags_with_string(self):
        cases = {
            "foo": 2,
            "bar": 1,
        }

        for tag, count in cases.items():
            res = list(query.find(self.plot.references(), dict(tags=tag)))
            self.assertEqual(len(res), count)

    def test_tags_with_seq(self):
        cases = {
            "foo": 2,
            "bar": 1,
        }

        for tag, count in cases.items():
            res = list(query.find(self.plot.references(), dict(tags=[tag])))
            self.assertEqual(len(res), count)

        res = list(query.find(self.plot.references(), dict(tags=list(cases.keys()))))
        self.assertEqual(len(res), 2)

    def test_name(self):
        cases = {
            "myline": Line,
            "mycircle": Circle,
            "myrect": Rect,
        }

        for name, typ in cases.items():
            res = list(query.find(self.plot.references(), dict(name=name)))
            self.assertEqual(len(res), 1)
            self.assertTrue(all(isinstance(x.glyph, typ) for x in res))

    def test_in(self):
        from bokeh.query import IN

        res = list(query.find(self.plot.references(), dict(name={IN: ['a', 'b']})))
        self.assertEqual(len(res), 0)

        res = list(query.find(self.plot.references(), dict(name={IN: ['a', 'mycircle']})))
        self.assertEqual(len(res), 1)

        res = list(query.find(self.plot.references(), dict(name={IN: ['a', 'mycircle', 'myline']})))
        self.assertEqual(len(res), 2)

        res = list(query.find(self.plot.references(), dict(name={IN: ['a', 'mycircle', 'myline', 'myrect']})))
        self.assertEqual(len(res), 3)

        for typ, count in typcases.items():
            res = list(query.find(self.plot.references(), dict(type={IN: [typ]})))
            self.assertEqual(len(res), count)
            self.assertTrue(all(isinstance(x, typ) for x in res))

            res = list(query.find(self.plot.references(), dict(type={IN: [typ, dict]})))
            self.assertEqual(len(res), count)
            self.assertTrue(all(isinstance(x, typ) for x in res))

            res = list(query.find(self.plot.references(), dict(type={IN: [dict]})))
            self.assertEqual(len(res), 0)

        # count adjusted by hand to account for duplicates/subclasses
        res = list(query.find(self.plot.references(), dict(type={IN: list(typcases.keys())})))
        self.assertEqual(len(res), 18)


    def test_disjuction(self):
        from bokeh.query import OR

        res = list(
            query.find(self.plot.references(),
            {OR: [dict(type=Axis), dict(type=Grid)]})
        )
        self.assertEqual(len(res), 5)

        res = list(
            query.find(self.plot.references(),
            {OR: [dict(type=Axis), dict(name="mycircle")]})
        )
        self.assertEqual(len(res), 4)

        res = list(
            query.find(self.plot.references(),
            {OR: [dict(type=Axis), dict(tags="foo"), dict(name="mycircle")]})
        )
        self.assertEqual(len(res), 6)

        res = list(
            query.find(self.plot.references(),
            {OR: [dict(type=Axis), dict(tags="foo"), dict(name="mycircle"), dict(name="bad")]})
        )
        self.assertEqual(len(res), 6)

    def test_conjuction(self):
        res = list(
            query.find(self.plot.references(), dict(type=Axis, tags="foo"))
        )
        self.assertEqual(len(res), 0)

        res = list(
            query.find(self.plot.references(), dict(type=Range1d, tags="foo"))
        )
        self.assertEqual(len(res), 2)

        res = list(
            query.find(self.plot.references(), dict(type=GlyphRenderer, name="mycircle"))
        )
        self.assertEqual(len(res), 1)

    def test_ops(self):
        from bokeh.query import EQ, LEQ, GEQ, LT, GT, NEQ

        res = list(
            query.find(self.plot.references(), {'size': {EQ: 5}})
        )
        self.assertEqual(len(res), 1)

        res = list(
            query.find(self.plot.references(), {'size': {NEQ: 5}})
        )
        self.assertEqual(len(res), 0)

        res = list(
            query.find(self.plot.references(), {'size': {GEQ: 5}})
        )
        self.assertEqual(len(res), 1)

        res = list(
            query.find(self.plot.references(), {'size': {LEQ: 5}})
        )
        self.assertEqual(len(res), 1)

        res = list(
            query.find(self.plot.references(), {'size': {GT: 5}})
        )
        self.assertEqual(len(res), 0)

        res = list(
            query.find(self.plot.references(), {'size': {LT: 5}})
        )
        self.assertEqual(len(res), 0)

if __name__ == "__main__":
    unittest.main()
