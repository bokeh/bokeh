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
import pytest

import numpy as np

from bokeh.charts import Chart, defaults
from bokeh.models import (
    ColumnDataSource, Grid, GlyphRenderer, LinearAxis, Range1d, Ticker)
from bokeh.models.ranges import FactorRange
from bokeh.models.tools import (
    BoxZoomTool, HelpTool, LassoSelectTool, PanTool, SaveTool, ResetTool,
    WheelZoomTool)

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
            responsive=True,
            xgrid=True, ygrid=False
        )

    def test_title(self):
        self.chart.title = "new_title"
        self.assertEqual(self.chart.title.text, "new_title")

    def test_sizing_mode(self):
        self.assertEqual(self.chart.sizing_mode, 'scale_width')

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
        """Test ranges are not created buy the chart."""
        self.assertEqual(self.chart.x_range, None)
        self.assertEqual(self.chart.y_range, None)

    def test_axis_requires_range(self):

        # the axis creation depends on ranges
        with pytest.raises(ValueError):
            self.chart.make_axis("x", "left", "datetime", "foo")

    def test_make_axis(self):

        self.chart.add_ranges('x', Range1d())

        axis = self.chart.make_axis("x", "left", "datetime", "foo")
        self.assertEqual(axis.axis_label, "foo")

        axis = self.chart.make_axis("x", "left", "categorical", "bar")
        self.assertEqual(axis.axis_label, "bar")
        self.assertEqual(axis.major_label_orientation, np.pi/4)

        axis = self.chart.make_axis("x", "left", "linear", "foobar")
        self.assertEqual(axis.axis_label, "foobar")

    def test_make_grid(self):
        self.chart.add_ranges('x', Range1d())
        axis = self.chart.make_axis("x", "left", "datetime", "foo")
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

    @patch('bokeh.plotting.helpers.warnings.warn')
    def test_chart_tools_linear(self, mock_warn):
        base_args = dict(
            title="title", xlabel="xlabel", ylabel="ylabel",
            legend="top_left", xscale="linear", yscale="linear", xgrid=True, ygrid=True,
            width=800, height=600,
        )
        expected = [
            [PanTool,  WheelZoomTool, BoxZoomTool, SaveTool, ResetTool, HelpTool],
            [],
            [PanTool,  BoxZoomTool, ResetTool, LassoSelectTool],
        ]
        scenarios = zip(
            [True, False, "pan,box_zoom,reset,lasso_select"], expected
        )

        self.check_tools_scenario(base_args, scenarios)

        self.check_tools_scenario(base_args, scenarios, categorical=True)

        msg_repeat = "LassoSelectTool are being repeated"
        expected_tools = [PanTool, BoxZoomTool, ResetTool, LassoSelectTool, LassoSelectTool]
        mock_warn.reset_mock()

        # Finally check removing tools
        base_args['tools'] = "pan,box_zoom,reset,lasso_select,lasso_select"

        chart = Chart(**base_args)
        chart.x_range = FactorRange()

        self.compare_tools(chart.tools, expected_tools)
        mock_warn.assert_any_call(msg_repeat)

def test_chart_id():
    chart = Chart(id='1234', title="title")
    assert chart._id == '1234'

def test_defaults():
    c1 = Chart()
    defaults.plot_height = 1000
    defaults.plot_width = 1000
    defaults.tools = False
    c2 = Chart()
    c3 = Chart()

    assert c1.plot_height == 600
    assert c2.plot_height == c3.plot_height == 1000

    assert c1.plot_width == 600
    assert c2.plot_width == c3.plot_width == 1000

    assert c1.tools
    assert c2.tools == c3.tools == []

def test_title_kwarg_no_warning(recwarn):
    Chart(title="title")
    assert len(recwarn) == 0

def test_charts_theme_validation():
    from bokeh.plotting import figure
    p = figure()

    with pytest.raises(ValueError):
        defaults.apply(p)


def test_bar_chart_below_visibility():
    from bokeh.charts import Bar

    # Visible because we have multiple bars
    df = dict(types=['foo', 'bar'], counts=[3, 2])
    p = Bar(df, values='counts')
    p.below[0].visible

    # Visible because we excplicitly specify labels
    df = dict(types=['foo'], counts=[3])
    p = Bar(df, values='counts', label='types')
    assert p.below[0].visible

    # Not visible because only one item and no labels
    df = dict(types=['foo'], counts=[3])
    p = Bar(df, values='counts')
    assert not p.below[0].visible
