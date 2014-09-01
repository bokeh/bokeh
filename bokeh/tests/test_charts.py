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

from ..charts import Bar, BoxPlot, Chart, ChartObject, Histogram, Scatter
from ..glyphs import Circle
from ..objects import ColumnDataSource, Grid, Glyph, Legend, LinearAxis, PanTool, Range1d, Ticker

from ..document import Document
#from ..session import Session

#-----------------------------------------------------------------------------
# Classes and functions
#-----------------------------------------------------------------------------

source = ColumnDataSource()
xdr = Range1d()
ydr = Range1d()
glyph = Glyph()
groups = [glyph] * 3
test_chart = Chart(title="title", xlabel="xlabel", ylabel="ylabel",
                   legend="top_left", xscale="linear", yscale="linear",
                   width=800, height=600, tools=True,
                   filename=False, server=False, notebook=False)
test_chart.start_plot()
test_chart.add_data_plot(xdr, ydr)
test_chart.end_plot(groups)


class TestChart(unittest.TestCase):

    def test_args(self):
        self.assertEqual(test_chart.title, "title")
        self.assertEqual(test_chart.xlabel, "xlabel")
        self.assertEqual(test_chart.ylabel, "ylabel")
        self.assertEqual(test_chart.legend, "top_left")
        self.assertEqual(test_chart.xscale, "linear")
        self.assertEqual(test_chart.yscale, "linear")
        self.assertEqual(test_chart.plot_width, 800)
        self.assertEqual(test_chart.plot_height, 600)
        self.assertTrue(test_chart.tools)
        self.assertFalse(test_chart.filename)
        self.assertFalse(test_chart.server)
        self.assertFalse(test_chart.notebook)

    def test_start_plot(self):
        self.assertIsInstance(test_chart.plot.left[0], LinearAxis)
        self.assertIsInstance(test_chart.plot.renderers[0], LinearAxis)
        self.assertIsInstance(test_chart.plot.below[0], LinearAxis)
        self.assertIsInstance(test_chart.plot.renderers[1], LinearAxis)
        self.assertIsInstance(test_chart.plot.renderers[2], Grid)
        self.assertIsInstance(test_chart.plot.renderers[3], Grid)
        self.assertIsInstance(test_chart.plot.tools[0], PanTool)

    def test_add_data_plot(self):
        self.assertIsInstance(test_chart.plot.x_range, Range1d)
        self.assertIsInstance(test_chart.plot.y_range, Range1d)

    def test_end_plot(self):
        legend = test_chart.plot.renderers[4]
        self.assertIsInstance(legend, Legend)
        self.assertEqual(legend.orientation, "top_left")
        self.assertIsInstance(test_chart.doc, Document)
        #TODO test server-base charts
        #self.assertIsInstance(test_chart.session, Session)

    def test_make_axis(self):
        axis = test_chart.make_axis("left", "datetime", "foo")
        self.assertEqual(axis.location, "auto")
        self.assertEqual(axis.scale, "time")
        self.assertEqual(axis.axis_label, "foo")

    def test_make_grid(self):
        axis = test_chart.make_axis("left", "datetime", "foo")
        grid = test_chart.make_grid(0, axis.ticker)
        self.assertEqual(grid.dimension, 0)
        self.assertIsInstance(grid.ticker, Ticker)

    def test_make_segment(self):
        segment = test_chart.make_segment(source, 0, 1, 0, 1, "black", 1)
        self.assertEqual(segment.x0, 0)
        self.assertEqual(segment.y0, 1)
        self.assertEqual(segment.x1, 0)
        self.assertEqual(segment.y1, 1)
        self.assertEqual(segment.line_color, "black")
        self.assertEqual(segment.line_width, 1)

    def test_make_line(self):
        line = test_chart.make_line(source, [0, 1], [0, 1], "black")
        self.assertEqual(line.x, [0, 1])
        self.assertEqual(line.y, [0, 1])
        self.assertEqual(line.line_color, "black")

    def test_make_quad(self):
        quad = test_chart.make_quad(source, 1, 0, 0, 1, "black", "black")
        self.assertEqual(quad.top, 1)
        self.assertEqual(quad.bottom, 0)
        self.assertEqual(quad.left, 0)
        self.assertEqual(quad.right, 1)
        self.assertEqual(quad.fill_color, "black")
        self.assertEqual(quad.line_color, "black")

    def test_rect(self):
        rect = test_chart.make_rect(source, 1, 0, 0, 1, "black", "black", 1)
        self.assertEqual(rect.x, 1)
        self.assertEqual(rect.y, 0)
        self.assertEqual(rect.width, 0)
        self.assertEqual(rect.height, 1)
        self.assertEqual(rect.fill_color, "black")
        self.assertEqual(rect.line_color, "black")
        self.assertEqual(rect.line_width, 1)

    def test_scatter(self):
        scatter = test_chart.make_scatter(source, 0, 1, "circle", "black")
        self.assertEqual(scatter.x, 0)
        self.assertEqual(scatter.y, 1)
        self.assertIsInstance(scatter, Circle)
        self.assertEqual(scatter.line_color, "black")

    def test_show(self):
        # Thinking about the best way to test the 3 outputs.
        pass

    def test__append_glyph(self):
        scatter = test_chart.make_scatter(source, 0, 1, "circle", "black")
        test_chart._append_glyph(source, scatter)
        circle = test_chart.plot.renderers[-1]
        self.assertIsInstance(circle.glyph, Circle)
