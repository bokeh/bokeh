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

from bokeh.charts import Bar, BoxPlot, Chart, ChartObject, Histogram, Scatter
from bokeh.objects import Grid, LinearAxis, PanTool

#-----------------------------------------------------------------------------
# Classes and functions
#-----------------------------------------------------------------------------

test_chart = Chart(title="title", xlabel="xlabel", ylabel="ylabel",
                   legend="top_left", xscale="linear", yscale="linear",
                   width=800, height=600, tools=True,
                   filename=False, server=False, notebook=False)


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
        test_chart.start_plot()
        self.assertIsInstance(test_chart.plot.left[0], LinearAxis)
        self.assertIsInstance(test_chart.plot.below[0], LinearAxis)
        self.assertIsInstance(test_chart.plot.renderers[-1], Grid)
        self.assertIsInstance(test_chart.plot.renderers[-2], Grid)
        self.assertIsInstance(test_chart.plot.tools[0], PanTool)

    def test_add_data_plot(self):
        pass

    def test_end_plot(self):
        pass

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
