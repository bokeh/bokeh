"""This is the Bokeh charts testing interface.

"""
#-----------------------------------------------------------------------------
# Copyright (c) 2012 - 2014, Continuum Analytics, Inc. All rights reserved.
#
# Powered by the Bokeh Development Team.
#
# The full license is in the file LICENCE.txt, distributed with this software.
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Imports
#-----------------------------------------------------------------------------

import unittest

from ..charts import Chart, ChartObject
from ..glyphs import Circle
from ..objects import ColumnDataSource, Grid, Glyph, Legend, LinearAxis, PanTool, Range1d, Ticker

from ..document import Document
#from ..session import Session

#-----------------------------------------------------------------------------
# Classes and functions
#-----------------------------------------------------------------------------


class TestChart(unittest.TestCase):

    def setUp(self):
        self.source = ColumnDataSource()
        self.xdr = Range1d()
        self.ydr = Range1d()
        self.glyph = Glyph()
        self.groups = [self.glyph] * 3
        self.chart = Chart(title="title", xlabel="xlabel", ylabel="ylabel",
                           legend="top_left", xscale="linear", yscale="linear",
                           width=800, height=600, tools=True,
                           filename=False, server=False, notebook=False)
        self.chart.start_plot()
        self.chart.add_data_plot(self.xdr, self.ydr)
        self.chart.end_plot(self.groups)

    def test_args(self):
        self.assertEqual(self.chart.title, "title")
        self.assertEqual(self.chart.xlabel, "xlabel")
        self.assertEqual(self.chart.ylabel, "ylabel")
        self.assertEqual(self.chart.legend, "top_left")
        self.assertEqual(self.chart.xscale, "linear")
        self.assertEqual(self.chart.yscale, "linear")
        self.assertEqual(self.chart.plot_width, 800)
        self.assertEqual(self.chart.plot_height, 600)
        self.assertTrue(self.chart.tools)
        self.assertFalse(self.chart.filename)
        self.assertFalse(self.chart.server)
        self.assertFalse(self.chart.notebook)

    def test_start_plot(self):
        self.assertIsInstance(self.chart.plot.left[0], LinearAxis)
        self.assertIsInstance(self.chart.plot.renderers[0], LinearAxis)
        self.assertIsInstance(self.chart.plot.below[0], LinearAxis)
        self.assertIsInstance(self.chart.plot.renderers[1], LinearAxis)
        self.assertIsInstance(self.chart.plot.renderers[2], Grid)
        self.assertIsInstance(self.chart.plot.renderers[3], Grid)
        self.assertIsInstance(self.chart.plot.tools[0], PanTool)

    def test_add_data_plot(self):
        self.assertIsInstance(self.chart.plot.x_range, Range1d)
        self.assertIsInstance(self.chart.plot.y_range, Range1d)

    def test_end_plot(self):
        legend = self.chart.plot.renderers[4]
        self.assertIsInstance(legend, Legend)
        self.assertEqual(legend.orientation, "top_left")
        self.assertIsInstance(self.chart.doc, Document)
        #TODO test server-base charts
        #self.assertIsInstance(self.chart.session, Session)

    def test_make_axis(self):
        axis = self.chart.make_axis("left", "datetime", "foo")
        self.assertEqual(axis.location, "auto")
        self.assertEqual(axis.scale, "time")
        self.assertEqual(axis.axis_label, "foo")

    def test_make_grid(self):
        axis = self.chart.make_axis("left", "datetime", "foo")
        grid = self.chart.make_grid(0, axis.ticker)
        self.assertEqual(grid.dimension, 0)
        self.assertIsInstance(grid.ticker, Ticker)

    def test_make_segment(self):
        segment = self.chart.make_segment(self.source, 0, 1, 0, 1, "black", 1)
        self.assertEqual(segment.x0, 0)
        self.assertEqual(segment.y0, 1)
        self.assertEqual(segment.x1, 0)
        self.assertEqual(segment.y1, 1)
        self.assertEqual(segment.line_color, "black")
        self.assertEqual(segment.line_width, 1)

    def test_make_line(self):
        line = self.chart.make_line(self.source, [0, 1], [0, 1], "black")
        self.assertEqual(line.x, [0, 1])
        self.assertEqual(line.y, [0, 1])
        self.assertEqual(line.line_color, "black")

    def test_make_quad(self):
        quad = self.chart.make_quad(self.source, [1], [0], [0], [1], "black", "black")
        self.assertEqual(quad.top, [1])
        self.assertEqual(quad.bottom, [0])
        self.assertEqual(quad.left, [0])
        self.assertEqual(quad.right, [1])
        self.assertEqual(quad.fill_color, "black")
        self.assertEqual(quad.line_color, "black")

    def test_rect(self):
        rect = self.chart.make_rect(self.source, [1], [0], [0], [1], "black", "black", 1)
        self.assertEqual(rect.x, [1])
        self.assertEqual(rect.y, [0])
        self.assertEqual(rect.width, [0])
        self.assertEqual(rect.height, [1])
        self.assertEqual(rect.fill_color, "black")
        self.assertEqual(rect.line_color, "black")
        self.assertEqual(rect.line_width, 1)

    def test_scatter(self):
        scatter = self.chart.make_scatter(self.source, [0], [1], "circle", "black")
        self.assertEqual(scatter.x, [0])
        self.assertEqual(scatter.y, [1])
        self.assertIsInstance(scatter, Circle)
        self.assertEqual(scatter.line_color, "black")

    # Thinking about the best way to test the 3 outputs.
    #def test_show(self):
        #pass

    def test__append_glyph(self):
        scatter = self.chart.make_scatter(self.source, 0, 1, "circle", "black")
        self.chart._append_glyph(self.source, scatter)
        circle = self.chart.plot.renderers[-1]
        self.assertIsInstance(circle.glyph, Circle)


class TestChartObject(unittest.TestCase):

    def setUp(self):
        self.chart_object = ChartObject(title="title", xlabel="xlabel", ylabel="ylabel",
                                        legend="top_left", xscale="linear", yscale="linear",
                                        width=800, height=600, tools=True,
                                        filename=False, server=False, notebook=False)

    def test_args(self):
        self.assertEqual(self.chart_object._ChartObject__title, "title")
        self.assertEqual(self.chart_object._ChartObject__xlabel, "xlabel")
        self.assertEqual(self.chart_object._ChartObject__ylabel, "ylabel")
        self.assertEqual(self.chart_object._ChartObject__legend, "top_left")
        self.assertEqual(self.chart_object._ChartObject__xscale, "linear")
        self.assertEqual(self.chart_object._ChartObject__yscale, "linear")
        self.assertEqual(self.chart_object._ChartObject__width, 800)
        self.assertEqual(self.chart_object._ChartObject__height, 600)
        self.assertTrue(self.chart_object._ChartObject__tools)
        self.assertFalse(self.chart_object._ChartObject__filename)
        self.assertFalse(self.chart_object._ChartObject__server)
        self.assertFalse(self.chart_object._ChartObject__notebook)

    def test_title(self):
        self.chart_object.title("new_title")
        self.assertEqual(self.chart_object._title, "new_title")

    def test_xlabel(self):
        self.chart_object.xlabel("new_xlabel")
        self.assertEqual(self.chart_object._xlabel, "new_xlabel")

    def test_ylabel(self):
        self.chart_object.ylabel("new_ylabel")
        self.assertEqual(self.chart_object._ylabel, "new_ylabel")

    def test_legend(self):
        self.chart_object.legend("bottom_right")
        self.assertEqual(self.chart_object._legend, "bottom_right")
        self.chart_object.legend(True)
        self.assertTrue(self.chart_object._legend)

    def test_xscale(self):
        self.chart_object.xscale("datetime")
        self.assertEqual(self.chart_object._xscale, "datetime")

    def yscale(self):
        self.chart_object.yscale("datetime")
        self.assertEqual(self.chart_object._yscale, "datetime")

    def test_width(self):
        self.chart_object.width(400)
        self.assertEqual(self.chart_object._width, 400)

    def test_height(self):
        self.chart_object.height(400)
        self.assertEqual(self.chart_object._height, 400)

    def tools(self, tools=True):
        self.chart_object.tools()
        self.assertTrue(self.chart_object._tools)
        self.chart_object.tools(False)
        self.assertTrue(self.chart_object._tools)

    def filename(self, filename):
        self.chart_object.filename("bar.html")
        self.assertEqual(self.chart_object._filename, "bar.html")
        self.chart_object.filename(True)
        self.assertTrue(self.chart_object._filename)

    def server(self, server):
        self.chart_object.server("baz")
        self.assertEqual(self.chart_object._server, "baz")
        self.chart_object.server(True)
        self.assertTrue(self.chart_object._server)

    def notebook(self, notebook=True):
        self.chart_object.notebook()
        self.assertTrue(self.chart_object._notebook)
        self.chart_object.notebook(False)
        self.assertTrue(self.chart_object._notebook)

    def test_check_attr(self):
        self.chart_object.check_attr()
        self.assertEqual(self.chart_object._title, "title")
        self.assertEqual(self.chart_object._xlabel, "xlabel")
        self.assertEqual(self.chart_object._ylabel, "ylabel")
        self.assertEqual(self.chart_object._legend, "top_left")
        self.assertEqual(self.chart_object._xscale, "linear")
        self.assertEqual(self.chart_object._yscale, "linear")
        self.assertEqual(self.chart_object._width, 800)
        self.assertEqual(self.chart_object._height, 600)
        self.assertTrue(self.chart_object._tools)
        self.assertFalse(self.chart_object._filename)
        self.assertFalse(self.chart_object._server)
        self.assertFalse(self.chart_object._notebook)

    def test_create_chart(self):
        self.chart_object.check_attr()
        test_chart_created = self.chart_object.create_chart()
        self.assertIsInstance(test_chart_created, Chart)

    # The following tests would test chart wrapping functions,
    # but I am not sure if repeat all the things because we tests
    # the specific charts functions above, inside the TestChart class.
    # I have also commentining out to avoid spurious test count.
    #def test_start_plot(self):
        #pass

    #def test_get_data(self):
        #pass

    #def test_get_source(self):
        #pass

    #def test_add_data_plot(self):
        #pass

    #def test_draw(self):
        #pass

    #def test_end_plot(self):
        #pass

    #def test_show_chart(self):
        #pass

    def test_chunker(self):
        chunk = self.chart_object._chunker(range(5), 2)
        chunk_list = list(chunk)
        self.assertEqual(len(chunk_list), 3)
        self.assertEqual(len(chunk_list[0]), 2)

    def test_set_colors(self):
        expected_colors = ["#f22c40", "#5ab738", "#407ee7", "#df5320",
                           "#00ad9c", "#c33ff3", "#f22c40"]
        colors = self.chart_object._set_colors(range(7))
        self.assertListEqual(expected_colors, colors)
