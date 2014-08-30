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
from ..objects import ColumnDataSource, Grid, Glyph, Legend, LinearAxis, PanTool, Range1d

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
        #self.assertIsInstance(test_chart.plot.renderers[0], LinearAxis)
        self.assertIsInstance(test_chart.plot.below[0], LinearAxis)
        #self.assertIsInstance(test_chart.plot.renderers[1], LinearAxis)
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
        pass

    def test_make_grid(self):
        pass

    def test_make_segment(self):
        pass

    def test_make_line(self):
        pass

    def test_make_quad(self):
        pass

    def test_rect(self):
        pass

    def test_scatter(self):
        pass

    def test_show(self):
        pass

    def test__append_glyph(self):
        pass
