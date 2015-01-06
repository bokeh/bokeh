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

from collections import OrderedDict
import datetime
import unittest
from mock import patch
import numpy as np
from numpy.testing import assert_array_equal, assert_array_almost_equal

import pandas as pd


from ..models.glyphs import Circle
from ..models import (ColumnDataSource, Grid, GlyphRenderer, Legend, LinearAxis,
                      PanTool, Range1d, Ticker, Text, Wedge, AnnularWedge,
                      FactorRange, DataRange1d, BoxZoomTool, LassoSelectTool,
                      PanTool, PreviewSaveTool, ResetTool, ResizeTool,
                      WheelZoomTool)
from ..document import Document

from ..charts import (Chart, ChartObject, DataAdapter, Area, Bar, Dot, Donut,
                      Line, HeatMap, Histogram, Scatter, Step, TimeSeries,
                      BoxPlot)

#-----------------------------------------------------------------------------
# Classes and functions
#-----------------------------------------------------------------------------

def create_chart(klass, values, compute_values=True, **kws):
    """ Create a new chart klass instance with values and the extra kws keyword
    parameters.

    Args:
        klass (class): chart class to be created
        values (iterable): chart data series
        compute_values (bool): if == True underlying chart attributes (like data,
                ranges, source, etc..) are computed by calling _setup_show,
                _prepare_show and _show_teardown methods.
        **kws (refer to klass arguments specification details)

    Return:
        _chart: klass chart instance
    """
    _chart = klass(
        values, title="title", xlabel="xlabel", ylabel="ylabel",
        legend="top_left", xscale="linear", yscale="linear",
        width=800, height=600, tools=True,
        filename=False, server=False, notebook=False,
        **kws
    )

    if compute_values:
        _chart._setup_show()
        _chart._prepare_show()
        _chart._show_teardown()

    return _chart

class TestChart(unittest.TestCase):

    def setUp(self):
        self.source = ColumnDataSource()
        self.xdr = Range1d()
        self.ydr = Range1d()
        self.glyph = GlyphRenderer()
        self.groups = [self.glyph] * 3
        self.chart = Chart(title="title", xlabel="xlabel", ylabel="ylabel",
                           legend="top_left", xscale="linear", yscale="linear",
                           width=800, height=600, tools=True,
                           filename=False, server=False, notebook=False)
        self.chart.start_plot(xgrid=True, ygrid=True)
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

    def test_chart_tools(self):
        base_args = dict(
            title="title", xlabel="xlabel", ylabel="ylabel",
            legend="top_left", xscale="linear", yscale="linear",
            width=800, height=600, filename=False, server=False, notebook=False
        )
        expected = [
            [PanTool,  WheelZoomTool, ResetTool, PreviewSaveTool],
            [],
            [ResizeTool, PanTool,  BoxZoomTool, ResetTool, LassoSelectTool],
        ]
        scenarios = zip(
                [True, False, "resize,pan,box_zoom,reset,lasso_select"],
                expected
        )
        for tools, expected_tools in scenarios:
            base_args['tools'] = tools
            chart = Chart(**base_args)
            chart.start_plot(xgrid=True, ygrid=True)
            self.assertEqual(len(chart.plot.tools), len(expected_tools))
            for i, _type in enumerate(expected_tools):
                self.assertIsInstance(chart.plot.tools[i], _type)

        # need to change the expected tools because categorical scales
        # automatically removes pan and zoom tools
        expected = [
            [PreviewSaveTool],
            [],
            [ResizeTool, ResetTool, LassoSelectTool],
        ]
        scenarios = zip(
                [True, False, "resize,pan,box_zoom,reset,lasso_select"],
                expected
        )
        for scale in ['xscale', 'yscale']:
            base_args[scale] = 'categorical'
            for i, (tools, expected_tools) in enumerate(scenarios):
                base_args['tools'] = tools
                chart = Chart(**base_args)
                chart.start_plot(xgrid=True, ygrid=True)
                self.assertEqual(len(chart.plot.tools), len(expected_tools))
                for i, _type in enumerate(expected_tools):
                    self.assertIsInstance(chart.plot.tools[i], _type)


    @patch('bokeh.charts._charts.Chart._append_glyph')
    def test_make_segment(self, mock_append_glyph):
        segment = self.chart.make_segment(self.source, 0, 1, 0, 1, "black", 1)
        self.assertEqual(segment.x0, 0)
        self.assertEqual(segment.y0, 1)
        self.assertEqual(segment.x1, 0)
        self.assertEqual(segment.y1, 1)
        self.assertEqual(segment.line_color, "black")
        self.assertEqual(segment.line_width, 1)
        self.chart._append_glyph.assert_called_once_with(self.source, segment)

    @patch('bokeh.charts._charts.Chart._append_glyph')
    def test_make_line(self, mock_append_glyph):
        line = self.chart.make_line(self.source, [0, 1], [0, 1], "black")
        self.assertEqual(line.x, [0, 1])
        self.assertEqual(line.y, [0, 1])
        self.assertEqual(line.line_color, "black")
        self.chart._append_glyph.assert_called_once_with(self.source, line)

    @patch('bokeh.charts._charts.Chart._append_glyph')
    def test_make_quad(self, mock_append_glyph):
        quad = self.chart.make_quad(self.source, [1], [0], [0], [1], "black", "black")
        self.assertEqual(quad.top, [1])
        self.assertEqual(quad.bottom, [0])
        self.assertEqual(quad.left, [0])
        self.assertEqual(quad.right, [1])
        self.assertEqual(quad.fill_color, "black")
        self.assertEqual(quad.line_color, "black")
        self.chart._append_glyph.assert_called_once_with(self.source, quad)

    @patch('bokeh.charts._charts.Chart._append_glyph')
    def test_rect(self, mock_append_glyph):
        rect = self.chart.make_rect(self.source, [1], [0], [0], [1], "black", "black", 1)
        self.assertEqual(rect.x, [1])
        self.assertEqual(rect.y, [0])
        self.assertEqual(rect.width, [0])
        self.assertEqual(rect.height, [1])
        self.assertEqual(rect.fill_color, "black")
        self.assertEqual(rect.line_color, "black")
        self.assertEqual(rect.line_width, 1)
        self.chart._append_glyph.assert_called_once_with(self.source, rect)

    @patch('bokeh.charts._charts.Chart._append_glyph')
    def test_scatter(self, mock_append_glyph):
        scatter = self.chart.make_scatter(self.source, [0], [1], "circle", "black")
        self.assertEqual(scatter.x, [0])
        self.assertEqual(scatter.y, [1])
        self.assertIsInstance(scatter, Circle)
        self.assertEqual(scatter.line_color, "black")
        self.chart._append_glyph.assert_called_once_with(self.source, scatter)

    @patch('bokeh.charts._charts.Chart._append_glyph')
    def test_make_patch(self, mock_append_glyph):
        patch = self.chart.make_patch(self.source, [0, 1], [0, 1], "black")
        self.assertEqual(patch.x, [0, 1])
        self.assertEqual(patch.y, [0, 1])
        self.assertEqual(patch.fill_color, "black")
        self.chart._append_glyph.assert_called_once_with(self.source, patch)

    @patch('bokeh.charts._charts.Chart._append_glyph')
    def test_text(self, mock_append_glyph):
        text = self.chart.make_text(
            self.source, x="x", y="y", text="text", angle=0,
            text_align="center", text_baseline="middle"
        )
        self.assertIsInstance(text, Text)
        self.assertEqual(text.x, "x")
        self.assertEqual(text.y, "y")
        self.assertEqual(text.text, "text")
        self.assertEqual(text.angle, 0)
        self.assertEqual(text.text_align, "center")
        self.assertEqual(text.text_baseline, "middle")
        self.chart._append_glyph.assert_called_once_with(self.source, text)

    @patch('bokeh.charts._charts.Chart._append_glyph')
    def test_wedge(self, mock_append_glyph):
        wedge = self.chart.make_wedge(
            self.source, x=0, y=1, radius=1, line_color="white",
            line_width=2, start_angle="start", end_angle="end", fill_color="colors"
        )

        self.assertIsInstance(wedge, Wedge)
        self.assertEqual(wedge.x, 0)
        self.assertEqual(wedge.y, 1)
        self.assertEqual(wedge.radius, 1)
        self.assertEqual(wedge.line_color, "white")
        self.assertEqual(wedge.fill_color, "colors")
        self.assertEqual(wedge.line_width, 2)
        self.assertEqual(wedge.start_angle, "start")
        self.assertEqual(wedge.end_angle, "end")

        self.chart._append_glyph.assert_called_once_with(self.source, wedge)

    @patch('bokeh.charts._charts.Chart._append_glyph')
    def test_annular(self, mock_append_glyph):
        annular = self.chart.make_annular(
            self.source, x=0, y=10, inner_radius=1, outer_radius=1.5,
            start_angle="start", end_angle="end",
            line_color="white", line_width=2, fill_color="fill"
        )
        self.assertIsInstance(annular, AnnularWedge)
        self.assertEqual(annular.x, 0)
        self.assertEqual(annular.y, 10)
        self.assertEqual(annular.inner_radius, 1)
        self.assertEqual(annular.outer_radius, 1.5)
        self.assertEqual(annular.line_color, "white")
        self.assertEqual(annular.fill_color, "fill")
        self.assertEqual(annular.line_width, 2)
        self.assertEqual(annular.start_angle, "start")
        self.assertEqual(annular.end_angle, "end")
        self.chart._append_glyph.assert_called_once_with(self.source, annular)

    # Thinking about the best way to test the 3 outputs.
    #def test_show(self):
        #pass

    def test__append_glyph(self):
        scatter = self.chart.make_scatter(self.source, 0, 1, "circle", "black")
        self.chart._append_glyph(self.source, scatter)
        circle = self.chart.plot.renderers[-1]
        self.assertIsInstance(circle.glyph, Circle)

    def test_figure(self):
        prev_plot = self.chart.plot
        self.assertEqual(self.chart._plots, [prev_plot])
        self.chart.figure()
        self.assertEqual(self.chart._plots, [prev_plot, self.chart.plot])

        for attr in ["title", "plot_width", "plot_height"]:
            self.assertEqual(getattr(prev_plot, attr), getattr(self.chart.plot, attr))

        # "x_range" and "y_range" are not set because chart explicitly set
        # plot ranges by calling add_data_plot
        self.assertEqual(prev_plot.x_range, self.xdr)
        self.assertEqual(prev_plot.y_range, self.ydr)
        self.assertEqual(self.chart.plot.x_range, None)
        self.assertEqual(self.chart.plot.y_range, None)

        # check that add_data_plot only set ranges for self.chart.plot and not
        # all underlying plots..
        xdr = Range1d()
        ydr = Range1d()
        self.chart.add_data_plot(xdr, ydr)
        self.assertEqual(self.chart.plot.x_range, xdr)
        self.assertEqual(self.chart.plot.y_range, ydr)
        self.assertEqual(prev_plot.x_range, self.xdr)
        self.assertEqual(prev_plot.y_range, self.ydr)


class TestChartObject(unittest.TestCase):

    def setUp(self):
        self.chart_object = ChartObject(title="title", xlabel="xlabel", ylabel="ylabel",
                                        legend="top_left", xscale="linear", yscale="linear",
                                        width=800, height=600, tools=True,
                                        filename=False, server=False, notebook=False,
                                        facet=False, palette=["#FFFFFF", "#000000"],
                                        xgrid=True, ygrid=False)

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
        self.assertEqual(self.chart_object._ChartObject__facet, False)
        self.assertEqual(self.chart_object._ChartObject__palette, ["#FFFFFF", "#000000"])
        self.assertFalse(self.chart_object._ChartObject__filename)
        self.assertFalse(self.chart_object._ChartObject__server)
        self.assertFalse(self.chart_object._ChartObject__notebook)
        self.assertEqual(self.chart_object._ChartObject__xgrid, True)
        self.assertEqual(self.chart_object._ChartObject__ygrid, False)

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

    def test_yscale(self):
        self.chart_object.yscale("datetime")
        self.assertEqual(self.chart_object._yscale, "datetime")

    def test_width(self):
        self.chart_object.width(400)
        self.assertEqual(self.chart_object._width, 400)

    def test_height(self):
        self.chart_object.height(400)
        self.assertEqual(self.chart_object._height, 400)

    def test_tools(self):
        self.chart_object.tools()
        self.assertTrue(self.chart_object._tools)
        self.chart_object.tools(False)
        self.assertFalse(self.chart_object._tools)

    def test_filename(self):
        self.chart_object.filename("bar.html")
        self.assertEqual(self.chart_object._filename, "bar.html")
        self.chart_object.filename(True)
        self.assertTrue(self.chart_object._filename)

    def test_server(self):
        self.chart_object.server("baz")
        self.assertEqual(self.chart_object._server, "baz")
        self.chart_object.server(True)
        self.assertTrue(self.chart_object._server)

    def test_notebook(self):
        self.chart_object.notebook()
        self.assertTrue(self.chart_object._notebook)
        self.chart_object.notebook(False)
        self.assertFalse(self.chart_object._notebook)

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
        self.assertEqual(self.chart_object._facet, False)
        self.assertEqual(self.chart_object._xgrid, True)
        self.assertEqual(self.chart_object._ygrid, False)

    def test_create_chart(self):
        self.chart_object.check_attr()
        test_chart_created = self.chart_object.create_chart()
        self.assertIsInstance(test_chart_created, Chart)
        self.assertEqual(self.chart_object.chart, test_chart_created)
        self.assertEqual(test_chart_created.title, "title")
        self.assertEqual(test_chart_created.xlabel, "xlabel")
        self.assertEqual(test_chart_created.ylabel, "ylabel")
        self.assertEqual(test_chart_created.legend, "top_left")
        self.assertEqual(test_chart_created.xscale, "linear")
        self.assertEqual(test_chart_created.yscale, "linear")
        self.assertEqual(test_chart_created.plot_width, 800)
        self.assertEqual(test_chart_created.plot_height, 600)
        self.assertTrue(test_chart_created.tools)
        self.assertFalse(test_chart_created.filename)
        self.assertFalse(test_chart_created.server)
        self.assertFalse(test_chart_created.notebook)
        self.assertEqual(self.chart_object._facet, False)
        self.assertEqual(self.chart_object._xgrid, True)
        self.assertEqual(self.chart_object._ygrid, False)

    # The following tests would test chart wrapping functions
    @patch('bokeh.charts._charts.Chart.start_plot')
    def test_start_plot(self, mocked):
        self.chart_object.check_attr()
        self.chart_object.create_chart()
        self.chart_object.start_plot()
        xgrd, ygrd = self.chart_object._xgrid, self.chart_object._ygrid
        self.chart_object.chart.start_plot.assert_called_once_with(xgrd, ygrd)

    @patch('bokeh.charts._charts.Chart.add_data_plot')
    def test_add_data_plot(self, mocked):
        self.chart_object.check_attr()
        self.chart_object.create_chart()
        xdr = self.chart_object.xdr = 0
        ydr = self.chart_object.ydr = 1
        self.chart_object.add_data_plot()
        self.chart_object.chart.add_data_plot.assert_called_once_with(xdr, ydr)

    @patch('bokeh.charts._charts.Chart.end_plot')
    def test_end_plot(self, mocked):
        self.chart_object.check_attr()
        self.chart_object.create_chart()
        groups = self.chart_object.groups = ["A", "B"]
        self.chart_object.end_plot()
        self.chart_object.chart.end_plot.assert_called_once_with(groups)

    @patch('bokeh.charts._charts.Chart.show')
    def test_show_chart(self, mocked):
        self.chart_object.check_attr()
        self.chart_object.create_chart()
        self.chart_object.show_chart()
        self.chart_object.chart.show.assert_called_once_with()

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


class TestArea(unittest.TestCase):
    def test_supported_input(self):
        xyvalues = OrderedDict(
                python=[2, 3, 7, 5, 26],
                pypy=[12, 33, 47, 15, 126],
                jython=[22, 43, 10, 25, 26],
            )

        # prepare some data to check tests results...
        zeros = np.zeros(5)
        x = np.array([4,3,2,1,0,0,1,2,3,4])
        y_jython = np.hstack((zeros, np.array(xyvalues['jython'])))
        y_pypy = np.hstack((zeros, np.array(xyvalues['pypy'])))
        y_python = np.hstack((zeros, np.array(xyvalues['python'])))

        data_keys = ['x', 'y_jython', 'y_pypy', 'y_python']
        for _xy in [xyvalues, dict(xyvalues), pd.DataFrame(xyvalues)]:
            area = create_chart(Area, _xy)

            self.assertEqual(sorted(area.groups), sorted(list(xyvalues.keys())))
            self.assertListEqual(sorted(area.data.keys()), data_keys)
            assert_array_equal(area.data['x'], x)
            assert_array_equal(area.data['y_jython'], y_jython)
            assert_array_equal(area.data['y_pypy'], y_pypy)
            assert_array_equal(area.data['y_python'], y_python)

            self.assertIsInstance(area.xdr, DataRange1d)
            self.assertEqual(area.xdr.sources[0].source, area.source.columns('x').source)
            self.assertIsInstance(area.ydr, Range1d)
            assert_array_almost_equal(area.ydr.start, -12.6, decimal=4)
            assert_array_almost_equal(area.ydr.end, 138.6, decimal=4)
            self.assertEqual(area.source.data, area.data)

        data_keys = ['x', 'y_0', 'y_1', 'y_2']
        lvalues = [[2, 3, 7, 5, 26], [12, 33, 47, 15, 126], [22, 43, 10, 25, 26]]
        y_0, y_1, y_2 = y_python, y_pypy, y_jython
        for _xy in [lvalues, np.array(lvalues)]:
            area = create_chart(Area, _xy)

            # TODO: Fix bug
            #self.assertEqual(area.groups, ['0', '1', '2'])
            self.assertListEqual(sorted(area.data.keys()), data_keys)
            assert_array_equal(area.data['x'], x)
            assert_array_equal(area.data['y_0'], y_0)
            assert_array_equal(area.data['y_1'], y_1)
            assert_array_equal(area.data['y_2'], y_2)

            self.assertIsInstance(area.xdr, DataRange1d)
            self.assertEqual(area.xdr.sources[0].source, area.source.columns('x').source)
            self.assertIsInstance(area.ydr, Range1d)
            assert_array_almost_equal(area.ydr.start, -12.6, decimal=4)
            assert_array_almost_equal(area.ydr.end, 138.6, decimal=4)
            self.assertEqual(area.source.data, area.data)


class TestBar(unittest.TestCase):
    def test_supported_input(self):
        xyvalues = OrderedDict()
        xyvalues['python']=[2, 5]
        xyvalues['pypy']=[12, 40]
        xyvalues['jython']=[22, 30]

        for i, _xy in enumerate([xyvalues, dict(xyvalues), pd.DataFrame(xyvalues)]):
            bar = create_chart(Bar, _xy)

            np.testing.assert_array_equal(bar.data['pypy'], np.array(xyvalues['pypy']))
            np.testing.assert_array_equal(bar.data['python'], np.array(xyvalues['python']))
            np.testing.assert_array_equal(bar.data['jython'], np.array(xyvalues['jython']))

            # test mid values, that should always be y/2 ..
            np.testing.assert_array_equal(bar.data['midpython'], np.array([1, 2.5]))
            np.testing.assert_array_equal(bar.data['midpypy'], np.array([6, 20]))
            np.testing.assert_array_equal(bar.data['midjython'], np.array([11, 15]))

            # stacked values should be 0 as base and + y/2 of the column
            # skipping plain dict case as stacked values randomly fails due to
            # dictionary unordered nature
            if i != 1:
                np.testing.assert_array_equal(bar.data['stackedpython'], np.array([1, 2.5]))
                np.testing.assert_array_equal(bar.data['stackedpypy'], np.array([8, 25]))
                np.testing.assert_array_equal(bar.data['stackedjython'], np.array([25, 60]))

            np.testing.assert_array_equal(bar.data['cat'], np.array(['0', '1']))
            np.testing.assert_array_equal(bar.data['width'], np.array([0.8, 0.8]))
            np.testing.assert_array_equal(bar.data['width_cat'], np.array([0.2, 0.2]))

        lvalues = [[2, 5], [12, 40], [22, 30]]
        for i, _xy in enumerate([lvalues, np.array(lvalues)]):
            bar = create_chart(Bar, _xy)

            np.testing.assert_array_equal(bar.data['0'], np.array(lvalues[0]))
            np.testing.assert_array_equal(bar.data['1'], np.array(lvalues[1]))
            np.testing.assert_array_equal(bar.data['2'], np.array(lvalues[2]))

            # test mid values, that should always be y/2 ..
            np.testing.assert_array_equal(bar.data['mid0'], np.array([1, 2.5]))
            np.testing.assert_array_equal(bar.data['mid1'], np.array([6, 20]))
            np.testing.assert_array_equal(bar.data['mid2'], np.array([11, 15]))

            # stacked values should be 0 as base and + y/2 of the column
            np.testing.assert_array_equal(bar.data['stacked0'], np.array([1, 2.5]))
            np.testing.assert_array_equal(bar.data['stacked1'], np.array([8, 25]))
            np.testing.assert_array_equal(bar.data['stacked2'], np.array([25, 60]))

            np.testing.assert_array_equal(bar.data['cat'], np.array(['0', '1']))
            np.testing.assert_array_equal(bar.data['width'], np.array([0.8, 0.8]))
            np.testing.assert_array_equal(bar.data['width_cat'], np.array([0.2, 0.2]))


class TestHeatMap(unittest.TestCase):
    def test_supported_input(self):
        xyvalues = OrderedDict()
        xyvalues['apples'] = [4,5,8]
        xyvalues['bananas'] = [1,2,4]
        xyvalues['pears'] = [6,5,4]

        xyvaluesdf = pd.DataFrame(xyvalues, index=['2009', '2010', '2011'])

        # prepare some data to check tests results...
        heights = widths = [0.95] * 9
        colors = ['#e2e2e2', '#75968f', '#cc7878', '#ddb7b1', '#a5bab7', '#ddb7b1',
            '#550b1d', '#e2e2e2', '#e2e2e2']
        catx = ['apples', 'bananas', 'pears', 'apples', 'bananas', 'pears',
                'apples', 'bananas', 'pears']
        rates = [4, 1, 6, 5, 2, 5, 8, 4, 4]

        caty = ['a', 'a', 'a', 'b', 'b', 'b', 'c', 'c', 'c']
        for i, _xy in enumerate([xyvalues, xyvaluesdf]):
            hm = create_chart(HeatMap, _xy)
            # TODO: Fix bug
            #self.assertEqual(sorted(hm.groups), sorted(list(xyvalues.keys())))
            assert_array_equal(hm.data['height'], heights)
            assert_array_equal(hm.data['width'], widths)
            assert_array_equal(hm.data['catx'], catx)
            assert_array_equal(hm.data['rate'], rates)
            assert_array_equal(hm.source.data, hm.data)
            assert_array_equal(hm.xdr.factors, hm.catsx)
            assert_array_equal(hm.ydr.factors, hm.catsy)
            self.assertIsInstance(hm.xdr, FactorRange)
            self.assertIsInstance(hm.ydr, FactorRange)
            assert_array_equal(hm.data['color'], colors)

            if i == 0: # if DataFrame
                assert_array_equal(hm.data['caty'], caty)
            else:
                _caty = ['2009']*3 + ['2010']*3 + ['2011']*3
                assert_array_equal(hm.data['caty'], _caty)


        catx = ['0', '1', '2', '0', '1', '2', '0', '1', '2']
        lvalues = [[4,5,8], [1,2,4], [6,5,4]]
        for _xy in [lvalues, np.array(lvalues)]:
            hm = create_chart(HeatMap, _xy)

            # TODO: FIX bug
            #self.assertEqual(sorted(hm.groups), sorted(list(xyvalues.keys())))
            assert_array_equal(hm.data['height'], heights)
            assert_array_equal(hm.data['width'], widths)
            assert_array_equal(hm.data['catx'], catx)
            assert_array_equal(hm.data['rate'], rates)
            assert_array_equal(hm.source.data, hm.data)
            assert_array_equal(hm.xdr.factors, hm.catsx)
            assert_array_equal(hm.ydr.factors, hm.catsy)
            self.assertIsInstance(hm.xdr, FactorRange)
            self.assertIsInstance(hm.ydr, FactorRange)
            assert_array_equal(hm.data['color'], colors)
            assert_array_equal(hm.data['caty'], caty)


class TestDot(unittest.TestCase):
    def test_supported_input(self):
        xyvalues = OrderedDict()
        xyvalues['python']=[2, 5]
        xyvalues['pypy']=[12, 40]
        xyvalues['jython']=[22, 30]

        xyvaluesdf = pd.DataFrame(xyvalues, index=['lists', 'loops'])

        cat = ['lists', 'loops']
        catjython = ['lists:0.75', 'loops:0.75']
        catpypy = ['lists:0.5', 'loops:0.5']
        catpython = ['lists:0.25', 'loops:0.25']
        python = seg_top_python = [2, 5]
        pypy = seg_top_pypy = [12, 40]
        jython = seg_top_jython = [22, 30]
        zero = [0, 0]

        for i, _xy in enumerate([xyvalues, xyvaluesdf]):
            hm = create_chart(Dot, _xy, cat=cat)

            self.assertEqual(sorted(hm.groups), sorted(list(xyvalues.keys())))
            assert_array_equal(hm.data['cat'], cat)
            assert_array_equal(hm.data['catjython'], catjython)
            assert_array_equal(hm.data['catpython'], catpython)
            assert_array_equal(hm.data['catpypy'], catpypy)

            assert_array_equal(hm.data['python'], python)
            assert_array_equal(hm.data['jython'], jython)
            assert_array_equal(hm.data['pypy'], pypy)

            assert_array_equal(hm.data['seg_top_python'], seg_top_python)
            assert_array_equal(hm.data['seg_top_jython'], seg_top_jython)
            assert_array_equal(hm.data['seg_top_pypy'], seg_top_pypy)

            assert_array_equal(hm.data['z_python'], zero)
            assert_array_equal(hm.data['z_pypy'], zero)
            assert_array_equal(hm.data['z_jython'], zero)
            assert_array_equal(hm.data['zero'], zero)


        lvalues = [[2, 5], [12, 40], [22, 30]]
        for _xy in [lvalues, np.array(lvalues)]:
            hm = create_chart(Dot, _xy, cat=cat)

            self.assertEqual(hm.groups, ['0', '1', '2'])
            assert_array_equal(hm.data['cat'], cat)
            assert_array_equal(hm.data['cat0'], catpython)
            assert_array_equal(hm.data['cat1'], catpypy)
            assert_array_equal(hm.data['cat2'], catjython)
            assert_array_equal(hm.data['0'], python)
            assert_array_equal(hm.data['1'], pypy)
            assert_array_equal(hm.data['2'], jython)

            assert_array_equal(hm.data['seg_top_0'], seg_top_python)
            assert_array_equal(hm.data['seg_top_1'], seg_top_pypy)
            assert_array_equal(hm.data['seg_top_2'], seg_top_jython)

            assert_array_equal(hm.data['z_0'], zero)
            assert_array_equal(hm.data['z_1'], zero)
            assert_array_equal(hm.data['z_2'], zero)
            assert_array_equal(hm.data['zero'], zero)


class TestHistogram(unittest.TestCase):
    def test_supported_input(self):
        mu, sigma = 0, 0.5
        normal = [1, 2, 3, 1]
        lognormal = [5, 4, 4, 1]
        xyvalues = OrderedDict(normal=normal, lognormal=lognormal)

        xyvaluesdf = pd.DataFrame(xyvalues)

        exptected = dict(
            leftnormal=[1., 1.4, 1.8, 2.2, 2.6],
            rightnormal=[1.4, 1.8, 2.2, 2.6, 3.],
            lognormal=[5, 4, 4, 1],
            edgeslognormal=[1., 1.8, 2.6, 3.4, 4.2, 5.],
            bottomlognormal=[0, 0, 0, 0, 0],
            bottomnormal=[0, 0, 0, 0, 0],
            edgesnormal=[1., 1.4, 1.8, 2.2, 2.6, 3.],
            histlognormal=[0.3125, 0., 0., 0.625, 0.3125],
            leftlognormal=[1., 1.8, 2.6, 3.4, 4.2],
            normal=[1, 2, 3, 1],
            rightlognormal=[1.8, 2.6, 3.4, 4.2, 5.],
            histnormal=[1.25, 0., 0.625, 0., 0.625],
        )

        keys = ['leftnormal', 'rightnormal', 'lognormal', 'edgeslognormal',
                'bottomlognormal', 'bottomnormal', 'edgesnormal', 'histlognormal',
                'leftlognormal', 'normal', 'rightlognormal', 'histnormal']

        for i, _xy in enumerate([xyvalues, xyvaluesdf]):
            hm = create_chart(Histogram, _xy, bins=5)

            self.assertEqual(sorted(hm.groups), sorted(list(xyvalues.keys())))
            for key, expected_v in exptected.items():
                assert_array_almost_equal(hm.data[key], expected_v, decimal=2)

        lvalues = [[1, 2, 3, 1], [5, 4, 4, 1]]
        for i, _xy in enumerate([lvalues, np.array(lvalues)]):
            hm = create_chart(Histogram, _xy, bins=5)

            self.assertEqual(hm.groups, ['0', '1'])
            for key, expected_v in exptected.items():
                # replace the keys because we have 0, 1 instead of normal and lognormal
                key = key.replace('lognormal', '1').replace('normal', '0')
                assert_array_almost_equal(hm.data[key], expected_v, decimal=2)

    @patch('bokeh.charts.histogram.np.histogram', return_value=('a', 'b'))
    def test_histogram_params(self, histogram_mock):
        inputs = [[5, 0, 0.5, True], [3, 1, 0, False]]
        normal = [1, 2, 3, 1]
        lognormal = [5, 4, 4, 1]
        xyvalues = OrderedDict()
        xyvalues['normal'] = normal
        xyvalues['lognormal'] = lognormal

        for (bins, mu, sigma, dens) in inputs:
            histogram_mock.reset_mock()
            kws = dict(bins=bins, mu=mu, sigma=sigma, density=dens)
            hm = create_chart(Histogram, xyvalues, compute_values=False, **kws)

            # ensure all class attributes have been correctly set
            for key, value in kws.items():
                self.assertEqual(getattr(hm, key), value)

            hm.get_data()
            # ensure we are calling numpy.histogram with the right args
            calls = histogram_mock.call_args_list
            assert_array_equal(calls[0][0][0], np.array([1, 2, 3, 1]))
            assert_array_equal(calls[1][0][0], np.array([5, 4, 4, 1]))
            self.assertEqual(calls[0][1]['bins'], bins)
            self.assertEqual(calls[1][1]['bins'], bins)
            self.assertEqual(calls[0][1]['density'], dens)
            self.assertEqual(calls[1][1]['density'], dens)


class TestLine(unittest.TestCase):
    def test_supported_input(self):
        xyvalues = OrderedDict()
        y_python = xyvalues['python'] = [2, 3, 7, 5, 26]
        y_pypy = xyvalues['pypy'] = [12, 33, 47, 15, 126]
        y_jython = xyvalues['jython'] = [22, 43, 10, 25, 26]

        xyvaluesdf = pd.DataFrame(xyvalues)

        for i, _xy in enumerate([xyvalues, xyvaluesdf]):
            hm = create_chart(Line, _xy)

            self.assertEqual(sorted(hm.groups), sorted(list(xyvalues.keys())))
            assert_array_equal(hm.data['x'], [0, 1, 2, 3, 4])
            assert_array_equal(hm.data['y_python'], y_python)
            assert_array_equal(hm.data['y_pypy'], y_pypy)
            assert_array_equal(hm.data['y_jython'], y_jython)

        lvalues = [[2, 3, 7, 5, 26], [12, 33, 47, 15, 126], [22, 43, 10, 25, 26]]
        for _xy in [lvalues, np.array(lvalues)]:
            hm = create_chart(Line, _xy)

            self.assertEqual(hm.groups, ['0', '1', '2'])
            assert_array_equal(hm.data['x'], [0, 1, 2, 3, 4])
            assert_array_equal(hm.data['y_0'], y_python)
            assert_array_equal(hm.data['y_1'], y_pypy)
            assert_array_equal(hm.data['y_2'], y_jython)

class TestScatter(unittest.TestCase):
    def test_supported_input(self):
        xyvalues = OrderedDict()
        xyvalues['python'] = [(1, 2), (3, 3), (4, 7), (5, 5), (8, 26)]
        xyvalues['pypy'] = [(1, 12), (2, 23), (4, 47), (5, 15), (8, 46)]
        xyvalues['jython'] = [(1, 22), (2, 43), (4, 10), (6, 25), (8, 26)]

        xyvaluesdf = pd.DataFrame(xyvalues)

        y_python = [2, 3, 7, 5, 26]
        y_pypy = [12, 23, 47, 15, 46]
        y_jython = [22, 43, 10, 25, 26]
        x_python = [1, 3, 4, 5, 8]
        x_pypy = [1, 2, 4, 5, 8]
        x_jython = [1, 2, 4, 6, 8]

        for i, _xy in enumerate([xyvalues, xyvaluesdf]):
            hm = create_chart(Scatter, _xy)

            self.assertEqual(sorted(hm.groups), sorted(list(xyvalues.keys())))
            assert_array_equal(hm.data['y_python'], y_python)
            assert_array_equal(hm.data['y_jython'], y_jython)
            assert_array_equal(hm.data['y_pypy'], y_pypy)
            assert_array_equal(hm.data['x_python'], x_python)
            assert_array_equal(hm.data['x_jython'], x_jython)
            assert_array_equal(hm.data['x_pypy'], x_pypy)

        lvalues = [xyvalues['python'], xyvalues['pypy'], xyvalues['jython']]
        for _xy in [lvalues, np.array(lvalues)]:
            hm = create_chart(Scatter, _xy)

            self.assertEqual(hm.groups, ['0', '1', '2'])
            assert_array_equal(hm.data['y_0'], y_python)
            assert_array_equal(hm.data['y_1'], y_pypy)
            assert_array_equal(hm.data['y_2'], y_jython)
            assert_array_equal(hm.data['x_0'], x_python)
            assert_array_equal(hm.data['x_1'], x_pypy)
            assert_array_equal(hm.data['x_2'], x_jython)


class TestStep(unittest.TestCase):
    def test_supported_input(self):
        xyvalues = OrderedDict()
        y_python = xyvalues['python'] = [2, 3, 7, 5, 26]
        y_pypy = xyvalues['pypy'] = [12, 33, 47, 15, 126]
        y_jython = xyvalues['jython'] = [22, 43, 10, 25, 26]
        xyvaluesdf = pd.DataFrame(xyvalues)

        y1_python = [2, 3, 7, 5]
        y2_python = [3, 7, 5, 26]
        y1_jython = [22, 43, 10, 25]
        y2_jython = [43, 10, 25, 26]
        y1_pypy = [12, 33, 47, 15]
        y2_pypy = [33, 47, 15, 126]
        x2 = [1, 2, 3, 4]
        x = [0, 1, 2, 3]

        for i, _xy in enumerate([xyvalues, xyvaluesdf]):
            hm = create_chart(Step, _xy)

            self.assertEqual(sorted(hm.groups), sorted(list(xyvalues.keys())))
            assert_array_equal(hm.data['x'], x)
            assert_array_equal(hm.data['x2'], x2)

            assert_array_equal(hm.data['y1_python'], y1_python)
            assert_array_equal(hm.data['y2_python'], y2_python)
            assert_array_equal(hm.data['y1_jython'], y1_jython)
            assert_array_equal(hm.data['y2_jython'], y2_jython)
            assert_array_equal(hm.data['y1_pypy'], y1_pypy)
            assert_array_equal(hm.data['y2_pypy'], y2_pypy)


        lvalues = [[2, 3, 7, 5, 26], [12, 33, 47, 15, 126], [22, 43, 10, 25, 26]]
        for _xy in [lvalues, np.array(lvalues)]:
            hm = create_chart(Step, _xy)

            self.assertEqual(hm.groups, ['0', '1', '2'])
            assert_array_equal(hm.data['y1_0'], y1_python)
            assert_array_equal(hm.data['y2_0'], y2_python)
            assert_array_equal(hm.data['y1_1'], y1_pypy)
            assert_array_equal(hm.data['y2_1'], y2_pypy)
            assert_array_equal(hm.data['y1_2'], y1_jython)
            assert_array_equal(hm.data['y2_2'], y2_jython)


class TestDonut(unittest.TestCase):

    def test_supported_input(self):
        xyvalues = OrderedDict()
        # TODO: Fix bug for donut breaking when inputs that are not float
        xyvalues['python'] = [2., 5., 3.]
        xyvalues['pypy'] = [4., 1., 4.]
        xyvalues['jython'] = [6., 4., 3.]

        xyvalues_int = OrderedDict()
        for k, values in xyvalues.items():
            xyvalues_int[k] = [int(val) for val in values]

        for xyvalues in [xyvalues, xyvalues_int]:
            cat = ["sets", "dicts", "odicts"]
            start = [0, 2.3561944901923448, 4.3196898986859651]
            end = [2.3561944901923448, 4.3196898986859651, 6.2831853071795862]
            colors = ['#f22c40', '#5ab738', '#407ee7']

            # TODO: Chart is not working with DataFrames anymore.
            #       Fix it and add test case for , pd.DataFrame(xyvalues)
            for i, _xy in enumerate([xyvalues]):
                _chart = create_chart(Donut, _xy, cat=cat)

                self.assertEqual(_chart.groups, cat)
                assert_array_equal(_chart.data['start'], start)
                assert_array_equal(_chart.data['end'], end)
                assert_array_equal(_chart.data['colors'], colors)

                # TODO: Test for external ring source values is missing as it needs
                #       some refactoring to expose those values calculation

        lvalues = [[2., 5., 3.], [4., 1., 4.], [6., 4., 3.]]
        lvalues_int = [[2, 5, 3], [4, 1, 4], [6, 4, 3]]
        for lvalues in [lvalues, lvalues_int]:
            for i, _xy in enumerate([lvalues, np.array(lvalues)]):
                _chart = create_chart(Donut, _xy, cat=cat)

                self.assertEqual(_chart.groups, cat)
                assert_array_equal(_chart.data['start'], start)
                assert_array_equal(_chart.data['end'], end)
                assert_array_equal(_chart.data['colors'], colors)

                # TODO: Test for external ring source values is missing as it needs
                #       some refactoring to expose those values calculation


class TestDataAdapter(unittest.TestCase):
    def setUp(self):
        self.values = OrderedDict()
        self.values['first'] = [2., 5., 3.]
        self.values['second'] = [4., 1., 4.]
        self.values['third'] = [6., 4., 3.]

    def test_list(self):
        values = list(self.values.values())
        da = DataAdapter(values)

        self.assertEqual(da.values(), list(self.values.values()))
        self.assertEqual(da.columns, ['0', '1', '2'])
        self.assertEqual(da.keys(), ['0', '1', '2'])
        self.assertEqual(da.index, ['a', 'b', 'c'])

    def test_array(self):
        values = np.array(list(self.values.values()))
        da = DataAdapter(values)

        assert_array_equal(da.values(), list(self.values.values()))
        self.assertEqual(da.columns, ['0', '1', '2'])
        self.assertEqual(da.keys(), ['0', '1', '2'])
        self.assertEqual(da.index, ['a', 'b', 'c'])

    def test_pandas(self):
        values = pd.DataFrame(self.values)
        da = DataAdapter(values)

        # TODO: THIS SHOULD BE FIXED..
        #self.assertEqual(da.values(), list(self.values.values()))
        self.assertEqual(da.columns, ['first', 'second', 'third'])
        self.assertEqual(da.keys(), ['first', 'second', 'third'])
        # We expect data adapter index to be the same as the underlying pandas
        # object and not the default created by DataAdapter
        self.assertEqual(da.index, [0, 1, 2])

    def test_ordered_dict(self):
        da = DataAdapter(self.values)

        self.assertEqual(da.values(), list(self.values.values()))
        self.assertEqual(da.columns, ['first', 'second', 'third'])
        self.assertEqual(da.keys(), ['first', 'second', 'third'])
        self.assertEqual(da.index, ['a', 'b', 'c'])


class TestTimeSeries(unittest.TestCase):
    def test_supported_input(self):
        now = datetime.datetime.now()
        delta = datetime.timedelta(minutes=1)
        dts = [now + delta*i for i in range(5)]
        dtss = ['%s'%dt for dt in dts]
        xyvalues = OrderedDict({'Date': dts})
        y_python = xyvalues['python'] = [2, 3, 7, 5, 26]
        y_pypy = xyvalues['pypy'] = [12, 33, 47, 15, 126]
        y_jython = xyvalues['jython'] = [22, 43, 10, 25, 26]

        xyvaluesdf = pd.DataFrame(xyvalues)
        groups = ['python', 'pypy', 'jython']
        for i, _xy in enumerate([xyvalues, xyvaluesdf]):
            ts = create_chart(TimeSeries, _xy, index='Date')

            self.assertEqual(ts.groups, groups)
            assert_array_equal(ts.data['x_python'], _xy['Date'])
            assert_array_equal(ts.data['x_pypy'], _xy['Date'])
            assert_array_equal(ts.data['x_jython'], _xy['Date'])
            assert_array_equal(ts.data['y_python'], y_python)
            assert_array_equal(ts.data['y_pypy'], y_pypy)
            assert_array_equal(ts.data['y_jython'], y_jython)

        lvalues = [[2, 3, 7, 5, 26], [12, 33, 47, 15, 126], [22, 43, 10, 25, 26]]
        for _xy in [lvalues, np.array(lvalues)]:
            hm = create_chart(TimeSeries, _xy, index=dts)

            self.assertEqual(hm.groups, ['0', '1', '2'])
            assert_array_equal(hm.data['x_0'], dts)
            assert_array_equal(hm.data['x_1'], dts)
            assert_array_equal(hm.data['x_2'], dts)
            assert_array_equal(hm.data['y_0'], y_python)
            assert_array_equal(hm.data['y_1'], y_pypy)
            assert_array_equal(hm.data['y_2'], y_jython)


class TestBoxPlot(unittest.TestCase):
    def test_supported_input(self):
        xyvalues = OrderedDict([
            ('bronze', np.array([7.0, 10.0, 8.0, 7.0, 4.0, 4.0, 1.0, 5.0, 2.0, 1.0,
                        4.0, 2.0, 1.0, 2.0, 4.0, 1.0, 0.0, 1.0, 1.0, 2.0,
                        0.0, 1.0, 0.0, 0.0, 1.0, 1.0])),
            ('silver', np.array([8., 4., 6., 4., 8., 3., 3., 2., 5., 6.,
                        1., 4., 2., 3., 2., 0., 0., 1., 2., 1.,
                        3.,  0.,  0.,  1.,  0.,  0.])),
            ('gold', np.array([6., 6., 6., 8., 4., 8., 6., 3., 2., 2.,  2.,  1.,
                      3., 1., 0., 5., 4., 2., 0., 0., 0., 1., 1., 0., 0.,
                      0.]))
        ])
        xyvaluesdf = pd.DataFrame(xyvalues)
        exptected_datarect = {
            'colors': ['#f22c40', '#5ab738', '#407ee7'],
            'groups': ['bronze', 'silver', 'gold'],
            'iqr_centers': [2.5, 2.5, 2.5],
            'iqr_lengths': [3.0, 3.0, 4.5],
            'lower_center_boxes': [1.25, 1.5, 1.125],
            'lower_height_boxes': [0.5, 1.0, 1.75],
            'upper_center_boxes': [2.75, 3.0, 3.375],
            'upper_height_boxes': [2.5, 2.0, 2.75],
            'width': [0.8, 0.8, 0.8]
        }
        expected_scatter = {
            'colors': ['#f22c40', '#f22c40', '#f22c40', '#f22c40', '#5ab738', '#5ab738'],
            'out_x': ['bronze', 'bronze', 'bronze', 'bronze', 'silver', 'silver'],
            'out_y': [7.0, 10.0, 8.0, 7.0, 8.0, 8.0]
        }
        expected_seg = {
            'lower': [-3.0, -2.5, -4.75],
             'q0': [1.0, 1.0, 0.25],
             'q2': [4.0, 4.0, 4.75],
             'upper': [6.0, 6.5, 8.75]
        }
        groups = ['bronze', 'silver', 'gold']

        for i, _xy in enumerate([xyvalues, xyvaluesdf]):
            bp = create_chart(BoxPlot, _xy, marker='circle', outliers=True)

            self.assertEqual(sorted(bp.groups), sorted(groups))
            for key, expected_v in exptected_datarect.items():
                self.assertEqual(bp.data_rect[key], expected_v)

            for key, expected_v in expected_scatter.items():
                self.assertEqual(bp.data_scatter[key], expected_v)

            for key, expected_v in expected_seg.items():
                self.assertEqual(bp.data_segment[key], expected_v)

        lvalues = [
            np.array([7.0, 10.0, 8.0, 7.0, 4.0, 4.0, 1.0, 5.0, 2.0, 1.0,
                    4.0, 2.0, 1.0, 2.0, 4.0, 1.0, 0.0, 1.0, 1.0, 2.0,
                    0.0, 1.0, 0.0, 0.0, 1.0, 1.0]),
            np.array([8., 4., 6., 4., 8., 3., 3., 2., 5., 6.,
                    1., 4., 2., 3., 2., 0., 0., 1., 2., 1.,
                    3.,  0.,  0.,  1.,  0.,  0.]),
            np.array([6., 6., 6., 8., 4., 8., 6., 3., 2., 2.,  2.,  1.,
                    3., 1., 0., 5., 4., 2., 0., 0., 0., 1., 1., 0., 0.,
                    0.])
        ]
        groups = exptected_datarect['groups'] = ['0', '1', '2']
        expected_scatter['out_x'] = ['0', '0', '0', '0', '1', '1']
        for i, _xy in enumerate([lvalues, np.array(lvalues)]):
            bp = create_chart(BoxPlot, _xy, marker='circle', outliers=True)

            self.assertEqual(sorted(bp.groups), sorted(groups))
            for key, expected_v in exptected_datarect.items():
                self.assertEqual(bp.data_rect[key], expected_v)

            for key, expected_v in expected_scatter.items():
                self.assertEqual(bp.data_scatter[key], expected_v)

            for key, expected_v in expected_seg.items():
                self.assertEqual(bp.data_segment[key], expected_v)