"""This is the Bokeh charts testing interface.

"""
#-----------------------------------------------------------------------------
# Copyright (c) 2012 - 2014, Continuum Analytics, Inc. All rights reserved.
#
# Powered by the Bokeh Development Team.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Imports
#-----------------------------------------------------------------------------

from __future__ import absolute_import

import unittest
from mock import patch

import numpy as np

from bokeh.charts import Chart
from bokeh.models import (
    ColumnDataSource, Grid, GlyphRenderer, LinearAxis, Range1d, Ticker)
from bokeh.models.ranges import FactorRange
from bokeh.models.tools import (
    BoxZoomTool, LassoSelectTool, PanTool, PreviewSaveTool, ResetTool,
    ResizeTool, WheelZoomTool)

#-----------------------------------------------------------------------------
# Classes and functions
#-----------------------------------------------------------------------------

class TestChart(unittest.TestCase):
    def setUp(self):
        self.source = ColumnDataSource()
        self.xdr = Range1d()
        self.ydr = Range1d()
        self.glyph = GlyphRenderer()
        self._groups = [self.glyph] * 3
        self.chart = Chart(
            title="title", xlabel="xlabel", ylabel="ylabel",
            legend="top_left", xscale="linear", yscale="linear",
            width=800, height=600, tools=True,
            filename=False, server=False, notebook=False,
            xgrid=True, ygrid=False
        )

    def test_title(self):
        self.chart.title = "new_title"
        self.assertEqual(self.chart.title, "new_title")

    def test_xlabel(self):
        self.chart.xlabel("new_xlabel")
        self.assertEqual(self.chart._options.xlabel, "new_xlabel")

    def test_ylabel(self):
        self.chart.ylabel("new_ylabel")
        self.assertEqual(self.chart._options.ylabel, "new_ylabel")

    def test_legend(self):
        self.chart.legend("bottom_right")
        self.assertEqual(self.chart._options.legend, "bottom_right")
        self.chart.legend(True)
        self.assertTrue(self.chart._options.legend)

    def test_xscale(self):
        self.chart.xscale("datetime")
        self.assertEqual(self.chart._options.xscale, "datetime")

    def test_yscale(self):
        self.chart.yscale("datetime")
        self.assertEqual(self.chart._options.yscale, "datetime")

    def test_width(self):
        self.chart.width(400)
        self.assertEqual(self.chart._options.width, 400)

    def test_height(self):
        self.chart.height(400)
        self.assertEqual(self.chart._options.height, 400)

    def test_filename(self):
        self.chart.filename("bar.html")
        self.assertEqual(self.chart._options.filename, "bar.html")
        self.chart.filename(True)
        self.assertTrue(self.chart._options.filename)

    def test_server(self):
        self.chart.server("baz")
        self.assertEqual(self.chart._options.server, "baz")
        self.chart.server(True)
        self.assertTrue(self.chart._options.server)

    def test_notebook(self):
        self.chart.notebook(True)
        self.assertTrue(self.chart._options.notebook)
        self.chart.notebook(False)
        self.assertFalse(self.chart._options.notebook)

    def check_chart_elements(self, expected_tools):
        self.assertIsInstance(self.chart.left[0], LinearAxis)
        self.assertIsInstance(self.chart.renderers[0], LinearAxis)
        self.assertIsInstance(self.chart.below[0], LinearAxis)
        self.assertIsInstance(self.chart.renderers[1], LinearAxis)
        self.assertIsInstance(self.chart.renderers[2], Grid)
        self.assertIsInstance(self.chart.renderers[3], Grid)
        for i, type_ in enumerate(expected_tools):
            self.assertIsInstance(self.chart.tools[i], type_)

    def test_ranges(self):
        """
        Test ranges are not created buy the chart
        """
        self.assertEqual(self.chart.x_range, None)
        self.assertEqual(self.chart.y_range, None)

    def test_make_axis(self):
        axis = self.chart.make_axis("left", "datetime", "foo")
        self.assertEqual(axis.location, "auto")
        self.assertEqual(axis.scale, "time")
        self.assertEqual(axis.axis_label, "foo")

        axis = self.chart.make_axis("left", "categorical", "bar")
        self.assertEqual(axis.location, "auto")
        self.assertEqual(axis.axis_label, "bar")
        self.assertEqual(axis.major_label_orientation, np.pi/4)

        axis = self.chart.make_axis("left", "linear", "foobar")
        self.assertEqual(axis.location, "auto")
        self.assertEqual(axis.axis_label, "foobar")

    def test_make_grid(self):
        axis = self.chart.make_axis("left", "datetime", "foo")
        grid = self.chart.make_grid(0, axis.ticker)
        self.assertEqual(grid.dimension, 0)
        self.assertIsInstance(grid.ticker, Ticker)

    def check_tools_scenario(self, base_args, scenarios, categorical=False):
        for tools, expected_tools in scenarios:
            base_args['tools'] = tools
            chart = Chart(**base_args)
            self.compare_tools(chart.tools, expected_tools)

    def compare_tools(self, tools, expected_tools):
        self.assertEqual(len(tools), len(expected_tools))
        for i, _type in enumerate(expected_tools):
            self.assertIsInstance(tools[i], _type)

    @patch('bokeh.plotting_helpers.warnings.warn')
    def test_chart_tools_linear(self, mock_warn):
        base_args = dict(
            title="title", xlabel="xlabel", ylabel="ylabel",
            legend="top_left", xscale="linear", yscale="linear", xgrid=True, ygrid=True,
            width=800, height=600, filename=False, server=False, notebook=False
        )
        expected = [
            [PanTool,  WheelZoomTool, BoxZoomTool, PreviewSaveTool, ResizeTool, ResetTool],
            [],
            [ResizeTool, PanTool,  BoxZoomTool, ResetTool, LassoSelectTool],
        ]
        scenarios = zip(
            [True, False, "resize,pan,box_zoom,reset,lasso_select"], expected
        )

        self.check_tools_scenario(base_args, scenarios)

        self.check_tools_scenario(base_args, scenarios, categorical=True)

        msg_repeat = "LassoSelectTool are being repeated"
        expected_tools = [ResizeTool, PanTool, BoxZoomTool, ResetTool, LassoSelectTool, LassoSelectTool]
        mock_warn.reset_mock()

        # Finally check repeated tools
        base_args['tools'] = "resize,pan,box_zoom,reset,lasso_select,lasso_select"

        chart = Chart(**base_args)
        chart.x_range = FactorRange()
        chart.tools = []
        chart.create_tools(chart._options.tools)

        self.compare_tools(chart.tools, expected_tools)
        mock_warn.assert_any_call(msg_repeat)
