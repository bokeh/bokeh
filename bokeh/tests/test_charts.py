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
from mock import patch, Mock
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

from ..charts import (Chart, DataAdapter, Area, Bar, Dot, Donut,
                      Line, HeatMap, Histogram, Scatter, Step, TimeSeries,
                      BoxPlot, Horizon)
from ..charts._builder import Builder
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

    return _chart

class TestChart(unittest.TestCase):
    def setUp(self):
        self.source = ColumnDataSource()
        self.xdr = Range1d()
        self.ydr = Range1d()
        self.glyph = GlyphRenderer()
        self.groups = [self.glyph] * 3
        self.chart = Chart(
            title="title", xlabel="xlabel", ylabel="ylabel",
            legend="top_left", xscale="linear", yscale="linear",
            width=800, height=600, tools=True,
            filename=False, server=False, notebook=False,
            xgrid=True, ygrid=False
        )

    def test_args(self):
        self.assertEqual(self.chart.title, "title")
        self.assertEqual(self.chart._Chart__xlabel, "xlabel")
        self.assertEqual(self.chart._Chart__ylabel, "ylabel")
        self.assertEqual(self.chart._Chart__legend, "top_left")
        self.assertEqual(self.chart._Chart__xscale, "linear")
        self.assertEqual(self.chart._Chart__yscale, "linear")
        self.assertEqual(self.chart.plot_width, 800)
        self.assertEqual(self.chart.plot_height, 600)
        self.assertTrue(self.chart._Chart__enabled_tools)
        self.assertFalse(self.chart._Chart__filename)
        self.assertFalse(self.chart._Chart__server)
        self.assertFalse(self.chart._Chart__notebook)
        self.assertEqual(self.chart._Chart__xgrid, True)
        self.assertEqual(self.chart._Chart__ygrid, False)

    def test_title(self):
        self.chart.title = "new_title"
        self.assertEqual(self.chart.title, "new_title")

    def test_xlabel(self):
        self.chart.xlabel("new_xlabel")
        self.assertEqual(self.chart._xlabel, "new_xlabel")

    def test_ylabel(self):
        self.chart.ylabel("new_ylabel")
        self.assertEqual(self.chart._ylabel, "new_ylabel")

    def test_legend(self):
        self.chart.legend("bottom_right")
        self.assertEqual(self.chart._legend, "bottom_right")
        self.chart.legend(True)
        self.assertTrue(self.chart._legend)

    def test_xscale(self):
        self.chart.xscale("datetime")
        self.assertEqual(self.chart._xscale, "datetime")

    def test_yscale(self):
        self.chart.yscale("datetime")
        self.assertEqual(self.chart._yscale, "datetime")

    def test_width(self):
        self.chart.width(400)
        self.assertEqual(self.chart._width, 400)

    def test_height(self):
        self.chart.height(400)
        self.assertEqual(self.chart._height, 400)

    def test_tools(self):
        self.chart.enabled_tools(False)
        self.assertFalse(self.chart._enabled_tools)
        self.chart.enabled_tools()
        self.assertTrue(self.chart._enabled_tools)

    def test_filename(self):
        self.chart.filename("bar.html")
        self.assertEqual(self.chart._filename, "bar.html")
        self.chart.filename(True)
        self.assertTrue(self.chart._filename)

    def test_server(self):
        self.chart.server("baz")
        self.assertEqual(self.chart._server, "baz")
        self.chart.server(True)
        self.assertTrue(self.chart._server)

    def test_notebook(self):
        self.chart.notebook()
        self.assertTrue(self.chart._notebook)
        self.chart.notebook(False)
        self.assertFalse(self.chart._notebook)

    def test_check_attr(self):
        self.chart.check_attr()
        self.assertEqual(self.chart._title, "title")
        self.assertEqual(self.chart._xlabel, "xlabel")
        self.assertEqual(self.chart._ylabel, "ylabel")
        self.assertEqual(self.chart._legend, "top_left")
        self.assertEqual(self.chart._xscale, "linear")
        self.assertEqual(self.chart._yscale, "linear")
        self.assertEqual(self.chart._width, 800)
        self.assertEqual(self.chart._height, 600)
        self.assertTrue(self.chart._tools)
        self.assertFalse(self.chart._filename)
        self.assertFalse(self.chart._server)
        self.assertFalse(self.chart._notebook)
        self.assertEqual(self.chart._xgrid, True)
        self.assertEqual(self.chart._ygrid, False)

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

            if categorical:
                chart.x_range = FactorRange()
                chart.tools = []
                chart.create_tools(chart._enabled_tools)
                self.compare_tools(chart.tools, expected_tools)

                chart = Chart(**base_args)
                chart.y_range = FactorRange()
                chart.tools = []
                chart.create_tools(chart._enabled_tools)
                self.compare_tools(chart.tools, expected_tools)

            else:
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

        # need to change the expected tools because categorical scales
        # automatically removes pan and zoom tools
        expected = [
            [PreviewSaveTool, ResizeTool, ResetTool], [],
            [ResizeTool, ResetTool, LassoSelectTool],
        ]
        scenarios = zip(
                [True, False, "resize,pan,box_zoom,reset,lasso_select"],
                expected
        )
        self.check_tools_scenario(base_args, scenarios, categorical=True)

        msg_repeat = "LassoSelectTool are being repeated"
        msg_removed = "categorical plots do not support pan and zoom operations.\n" \
                      "Removing tool(s): pan, box_zoom"
        expected_tools = [ResizeTool, ResetTool, LassoSelectTool, LassoSelectTool]
        mock_warn.reset_mock()

        # Finally check repeated tools
        base_args['tools'] = "resize,pan,box_zoom,reset,lasso_select,lasso_select"

        chart = Chart(**base_args)
        chart.x_range = FactorRange()
        chart.tools = []
        chart.create_tools(chart._enabled_tools)

        self.compare_tools(chart.tools, expected_tools)
        mock_warn.assert_any_call(msg_repeat)
        mock_warn.assert_any_call(msg_removed)


class TestBuilder(unittest.TestCase):
    def setUp(self):
        self.builder = Builder("bottom_left", ['red', 'green'])

    def test_instantiate(self):
        self.builder._legend = "Test Leg"
        self.builder._palette = ['red', 'green']
        self.builder._legends = []
        self.builder.data = {}
        self.builder.groups = []
        self.builder.attr = []
        self.builder.groups = []

    @patch('bokeh.charts._builder.DataAdapter')
    def test_prepare_values(self, adapter_mock):
        self.builder = Builder("bottom_left", ['red', 'green'])
        adapter_mock.assert_callled_once_with([], force_alias=False)


        self.builder = Builder([1, 2, 3], "Test Leg", ['red', 'green'])
        self.builder.index = ['b']
        adapter_mock.get_index_and_data.assert_callled_once_with(
            [1, 2, 3], ['b'], force_alias=False
        )

    def test_create(self):
        chart = Mock()

        # prepare the builder with the mocks
        self.builder.make_renderers = Mock(return_value='called!')
        self.legends = ['l1', 'l2']
        self.builder.x_range = "X-Range"
        self.builder.y_range = "Y-Range"

        self.builder.create(chart)

        chart.add_renderers.assert_called_once('called')
        chart.orientation = 'bottom_left'
        chart.add_legend('bottom_left', self.legends)

    def test_scatter(self):
        source = ColumnDataSource({"a": [2, 4, 5]})
        renderer = self.builder.make_scatter(source, [0], [1], "circle", "black")
        scatter = renderer.glyph
        self.assertIsInstance(renderer, GlyphRenderer)
        self.assertEqual(renderer.data_source, source)
        self.assertEqual(scatter.x, [0])
        self.assertEqual(scatter.y, [1])
        self.assertIsInstance(scatter, Circle)
        self.assertEqual(scatter.line_color, "black")

    def test_chunker(self):
        chunk = self.builder._chunker(range(5), 2)
        chunk_list = list(chunk)
        self.assertEqual(len(chunk_list), 3)
        self.assertEqual(len(chunk_list[0]), 2)

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
            builder = area._builders[0]
            self.assertEqual(sorted(builder.groups), sorted(list(xyvalues.keys())))
            self.assertListEqual(sorted(builder.data.keys()), data_keys)
            assert_array_equal(builder.data['x'], x)
            assert_array_equal(builder.data['y_jython'], y_jython)
            assert_array_equal(builder.data['y_pypy'], y_pypy)
            assert_array_equal(builder.data['y_python'], y_python)

            self.assertIsInstance(area.x_range, DataRange1d)
            self.assertEqual(area.x_range.sources[0].source, builder.source.columns('x').source)
            self.assertIsInstance(area.y_range, Range1d)
            assert_array_almost_equal(area.y_range.start, -12.6, decimal=4)
            assert_array_almost_equal(area.y_range.end, 138.6, decimal=4)
            self.assertEqual(builder.source.data, builder.data)

        data_keys = ['x', 'y_0', 'y_1', 'y_2']
        lvalues = [[2, 3, 7, 5, 26], [12, 33, 47, 15, 126], [22, 43, 10, 25, 26]]
        y_0, y_1, y_2 = y_python, y_pypy, y_jython
        for _xy in [lvalues, np.array(lvalues)]:
            area = create_chart(Area, _xy)
            builder = area._builders[0]

            self.assertEqual(builder.groups, ['0', '1', '2'])
            self.assertListEqual(sorted(builder.data.keys()), data_keys)
            assert_array_equal(builder.data['x'], x)
            assert_array_equal(builder.data['y_0'], y_0)
            assert_array_equal(builder.data['y_1'], y_1)
            assert_array_equal(builder.data['y_2'], y_2)

            self.assertIsInstance(area.x_range, DataRange1d)
            self.assertEqual(area.x_range.sources[0].source, builder.source.columns('x').source)
            self.assertIsInstance(area.y_range, Range1d)
            assert_array_almost_equal(area.y_range.start, -12.6, decimal=4)
            assert_array_almost_equal(area.y_range.end, 138.6, decimal=4)
            self.assertEqual(builder.source.data, builder.data)

class TestBar(unittest.TestCase):
    def test_supported_input(self):
        xyvalues = OrderedDict()
        xyvalues['python']=[2, 5]
        xyvalues['pypy']=[12, 40]
        xyvalues['jython']=[22, 30]

        for i, _xy in enumerate([xyvalues, dict(xyvalues), pd.DataFrame(xyvalues)]):
            bar = create_chart(Bar, _xy)
            builder = bar._builders[0]
            np.testing.assert_array_equal(builder.data['pypy'], np.array(xyvalues['pypy']))
            np.testing.assert_array_equal(builder.data['python'], np.array(xyvalues['python']))
            np.testing.assert_array_equal(builder.data['jython'], np.array(xyvalues['jython']))

            # test mid values, that should always be y/2 ..
            np.testing.assert_array_equal(builder.data['midpython'], np.array([1, 2.5]))
            np.testing.assert_array_equal(builder.data['midpypy'], np.array([6, 20]))
            np.testing.assert_array_equal(builder.data['midjython'], np.array([11, 15]))

            # stacked values should be 0 as base and + y/2 of the column
            # skipping plain dict case as stacked values randomly fails due to
            # dictionary unordered nature
            if i != 1:
                np.testing.assert_array_equal(builder.data['stackedpython'], np.array([1, 2.5]))
                np.testing.assert_array_equal(builder.data['stackedpypy'], np.array([8, 25]))
                np.testing.assert_array_equal(builder.data['stackedjython'], np.array([25, 60]))

            np.testing.assert_array_equal(builder.data['cat'], np.array(['0', '1']))
            np.testing.assert_array_equal(builder.data['width'], np.array([0.8, 0.8]))
            np.testing.assert_array_equal(builder.data['width_cat'], np.array([0.2, 0.2]))

        lvalues = [[2, 5], [12, 40], [22, 30]]
        for i, _xy in enumerate([lvalues, np.array(lvalues)]):
            bar = create_chart(Bar, _xy)
            builder = bar._builders[0]
            np.testing.assert_array_equal(builder.data['0'], np.array(lvalues[0]))
            np.testing.assert_array_equal(builder.data['1'], np.array(lvalues[1]))
            np.testing.assert_array_equal(builder.data['2'], np.array(lvalues[2]))

            # test mid values, that should always be y/2 ..
            np.testing.assert_array_equal(builder.data['mid0'], np.array([1, 2.5]))
            np.testing.assert_array_equal(builder.data['mid1'], np.array([6, 20]))
            np.testing.assert_array_equal(builder.data['mid2'], np.array([11, 15]))

            # stacked values should be 0 as base and + y/2 of the column
            np.testing.assert_array_equal(builder.data['stacked0'], np.array([1, 2.5]))
            np.testing.assert_array_equal(builder.data['stacked1'], np.array([8, 25]))
            np.testing.assert_array_equal(builder.data['stacked2'], np.array([25, 60]))

            np.testing.assert_array_equal(builder.data['cat'], np.array(['0', '1']))
            np.testing.assert_array_equal(builder.data['width'], np.array([0.8, 0.8]))
            np.testing.assert_array_equal(builder.data['width_cat'], np.array([0.2, 0.2]))


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
            builder = hm._builders[0]
            # TODO: Fix bug
            #self.assertEqual(sorted(hm.groups), sorted(list(xyvalues.keys())))
            assert_array_equal(builder.data['height'], heights)
            assert_array_equal(builder.data['width'], widths)
            assert_array_equal(builder.data['catx'], catx)
            assert_array_equal(builder.data['rate'], rates)
            assert_array_equal(builder.source.data, builder.data)
            assert_array_equal(hm.x_range.factors, builder.catsx)
            assert_array_equal(hm.y_range.factors, builder.catsy)
            self.assertIsInstance(hm.x_range, FactorRange)
            self.assertIsInstance(hm.y_range, FactorRange)
            assert_array_equal(builder.data['color'], colors)

            if i == 0: # if DataFrame
                assert_array_equal(builder.data['caty'], caty)
            else:
                _caty = ['2009']*3 + ['2010']*3 + ['2011']*3
                assert_array_equal(builder.data['caty'], _caty)


        catx = ['0', '1', '2', '0', '1', '2', '0', '1', '2']
        lvalues = [[4,5,8], [1,2,4], [6,5,4]]
        for _xy in [lvalues, np.array(lvalues)]:
            hm = create_chart(HeatMap, _xy)
            builder = hm._builders[0]

            # TODO: FIX bug
            #self.assertEqual(sorted(hm.groups), sorted(list(xyvalues.keys())))
            assert_array_equal(builder.data['height'], heights)
            assert_array_equal(builder.data['width'], widths)
            assert_array_equal(builder.data['catx'], catx)
            assert_array_equal(builder.data['rate'], rates)
            assert_array_equal(builder.source.data, builder.data)
            assert_array_equal(hm.x_range.factors, builder.catsx)
            assert_array_equal(hm.y_range.factors, builder.catsy)
            self.assertIsInstance(hm.x_range, FactorRange)
            self.assertIsInstance(hm.y_range, FactorRange)
            assert_array_equal(builder.data['color'], colors)
            assert_array_equal(builder.data['caty'], caty)


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
            builder = hm._builders[0]
            self.assertEqual(sorted(builder.groups), sorted(list(xyvalues.keys())))
            assert_array_equal(builder.data['cat'], cat)
            assert_array_equal(builder.data['catjython'], catjython)
            assert_array_equal(builder.data['catpython'], catpython)
            assert_array_equal(builder.data['catpypy'], catpypy)

            assert_array_equal(builder.data['python'], python)
            assert_array_equal(builder.data['jython'], jython)
            assert_array_equal(builder.data['pypy'], pypy)

            assert_array_equal(builder.data['seg_top_python'], seg_top_python)
            assert_array_equal(builder.data['seg_top_jython'], seg_top_jython)
            assert_array_equal(builder.data['seg_top_pypy'], seg_top_pypy)

            assert_array_equal(builder.data['z_python'], zero)
            assert_array_equal(builder.data['z_pypy'], zero)
            assert_array_equal(builder.data['z_jython'], zero)
            assert_array_equal(builder.data['zero'], zero)


        lvalues = [[2, 5], [12, 40], [22, 30]]
        for _xy in [lvalues, np.array(lvalues)]:
            hm = create_chart(Dot, _xy, cat=cat)
            builder = hm._builders[0]

            self.assertEqual(builder.groups, ['0', '1', '2'])
            assert_array_equal(builder.data['cat'], cat)
            assert_array_equal(builder.data['cat0'], catpython)
            assert_array_equal(builder.data['cat1'], catpypy)
            assert_array_equal(builder.data['cat2'], catjython)
            assert_array_equal(builder.data['0'], python)
            assert_array_equal(builder.data['1'], pypy)
            assert_array_equal(builder.data['2'], jython)

            assert_array_equal(builder.data['seg_top_0'], seg_top_python)
            assert_array_equal(builder.data['seg_top_1'], seg_top_pypy)
            assert_array_equal(builder.data['seg_top_2'], seg_top_jython)

            assert_array_equal(builder.data['z_0'], zero)
            assert_array_equal(builder.data['z_1'], zero)
            assert_array_equal(builder.data['z_2'], zero)
            assert_array_equal(builder.data['zero'], zero)


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
            builder = hm._builders[0]
            self.assertEqual(sorted(builder.groups), sorted(list(xyvalues.keys())))
            for key, expected_v in exptected.items():
                assert_array_almost_equal(builder.data[key], expected_v, decimal=2)

        lvalues = [[1, 2, 3, 1], [5, 4, 4, 1]]
        for i, _xy in enumerate([lvalues, np.array(lvalues)]):
            hm = create_chart(Histogram, _xy, bins=5)
            builder = hm._builders[0]
            self.assertEqual(builder.groups, ['0', '1'])
            for key, expected_v in exptected.items():
                # replace the keys because we have 0, 1 instead of normal and lognormal
                key = key.replace('lognormal', '1').replace('normal', '0')
                assert_array_almost_equal(builder.data[key], expected_v, decimal=2)

    @patch('bokeh.charts.histogram.np.histogram', return_value=([1, 3, 4], [2.4, 4]))
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
            builder = hm._builders[0]
            # ensure all class attributes have been correctly set
            for key, value in kws.items():
                self.assertEqual(getattr(builder, key), value)

            builder.get_data()
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
            builder = hm._builders[0]
            self.assertEqual(sorted(builder.groups), sorted(list(xyvalues.keys())))
            assert_array_equal(builder.data['x'], [0, 1, 2, 3, 4])
            assert_array_equal(builder.data['y_python'], y_python)
            assert_array_equal(builder.data['y_pypy'], y_pypy)
            assert_array_equal(builder.data['y_jython'], y_jython)

        lvalues = [[2, 3, 7, 5, 26], [12, 33, 47, 15, 126], [22, 43, 10, 25, 26]]
        for _xy in [lvalues, np.array(lvalues)]:
            hm = create_chart(Line, _xy)
            builder = hm._builders[0]
            self.assertEqual(builder.groups, ['0', '1', '2'])
            assert_array_equal(builder.data['x'], [0, 1, 2, 3, 4])
            assert_array_equal(builder.data['y_0'], y_python)
            assert_array_equal(builder.data['y_1'], y_pypy)
            assert_array_equal(builder.data['y_2'], y_jython)

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
            builder = hm._builders[0]
            self.assertEqual(sorted(builder.groups), sorted(list(xyvalues.keys())))
            assert_array_equal(builder.data['y_python'], y_python)
            assert_array_equal(builder.data['y_jython'], y_jython)
            assert_array_equal(builder.data['y_pypy'], y_pypy)
            assert_array_equal(builder.data['x_python'], x_python)
            assert_array_equal(builder.data['x_jython'], x_jython)
            assert_array_equal(builder.data['x_pypy'], x_pypy)

        lvalues = [xyvalues['python'], xyvalues['pypy'], xyvalues['jython']]
        for _xy in [lvalues, np.array(lvalues)]:
            hm = create_chart(Scatter, _xy)
            builder = hm._builders[0]
            self.assertEqual(builder.groups, ['0', '1', '2'])
            assert_array_equal(builder.data['y_0'], y_python)
            assert_array_equal(builder.data['y_1'], y_pypy)
            assert_array_equal(builder.data['y_2'], y_jython)
            assert_array_equal(builder.data['x_0'], x_python)
            assert_array_equal(builder.data['x_1'], x_pypy)
            assert_array_equal(builder.data['x_2'], x_jython)


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
            builder = hm._builders[0]
            self.assertEqual(sorted(builder.groups), sorted(list(xyvalues.keys())))
            assert_array_equal(builder.data['x'], x)
            assert_array_equal(builder.data['x2'], x2)

            assert_array_equal(builder.data['y1_python'], y1_python)
            assert_array_equal(builder.data['y2_python'], y2_python)
            assert_array_equal(builder.data['y1_jython'], y1_jython)
            assert_array_equal(builder.data['y2_jython'], y2_jython)
            assert_array_equal(builder.data['y1_pypy'], y1_pypy)
            assert_array_equal(builder.data['y2_pypy'], y2_pypy)


        lvalues = [[2, 3, 7, 5, 26], [12, 33, 47, 15, 126], [22, 43, 10, 25, 26]]
        for _xy in [lvalues, np.array(lvalues)]:
            hm = create_chart(Step, _xy)
            builder = hm._builders[0]
            self.assertEqual(builder.groups, ['0', '1', '2'])
            assert_array_equal(builder.data['y1_0'], y1_python)
            assert_array_equal(builder.data['y2_0'], y2_python)
            assert_array_equal(builder.data['y1_1'], y1_pypy)
            assert_array_equal(builder.data['y2_1'], y2_pypy)
            assert_array_equal(builder.data['y1_2'], y1_jython)
            assert_array_equal(builder.data['y2_2'], y2_jython)


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
                builder = _chart._builders[0]
                self.assertEqual(builder.groups, cat)
                assert_array_equal(builder.data['start'], start)
                assert_array_equal(builder.data['end'], end)
                assert_array_equal(builder.data['colors'], colors)

                # TODO: Test for external ring source values is missing as it needs
                #       some refactoring to expose those values calculation

        lvalues = [[2., 5., 3.], [4., 1., 4.], [6., 4., 3.]]
        lvalues_int = [[2, 5, 3], [4, 1, 4], [6, 4, 3]]
        for lvalues in [lvalues, lvalues_int]:
            for i, _xy in enumerate([lvalues, np.array(lvalues)]):
                _chart = create_chart(Donut, _xy, cat=cat)
                builder = _chart._builders[0]
                self.assertEqual(builder.groups, cat)
                assert_array_equal(builder.data['start'], start)
                assert_array_equal(builder.data['end'], end)
                assert_array_equal(builder.data['colors'], colors)

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
            builder = ts._builders[0]
            self.assertEqual(builder.groups, groups)
            assert_array_equal(builder.data['x_python'], _xy['Date'])
            assert_array_equal(builder.data['x_pypy'], _xy['Date'])
            assert_array_equal(builder.data['x_jython'], _xy['Date'])
            assert_array_equal(builder.data['y_python'], y_python)
            assert_array_equal(builder.data['y_pypy'], y_pypy)
            assert_array_equal(builder.data['y_jython'], y_jython)

        lvalues = [[2, 3, 7, 5, 26], [12, 33, 47, 15, 126], [22, 43, 10, 25, 26]]
        for _xy in [lvalues, np.array(lvalues)]:
            hm = create_chart(TimeSeries, _xy, index=dts)
            builder = hm._builders[0]
            self.assertEqual(builder.groups, ['0', '1', '2'])
            assert_array_equal(builder.data['x_0'], dts)
            assert_array_equal(builder.data['x_1'], dts)
            assert_array_equal(builder.data['x_2'], dts)
            assert_array_equal(builder.data['y_0'], y_python)
            assert_array_equal(builder.data['y_1'], y_pypy)
            assert_array_equal(builder.data['y_2'], y_jython)


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
            'colors': ['#f22c40', '#5ab738', '#407ee7', '#df5320', '#00ad9c', '#c33ff3'],
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
            builder = bp._builders[0]
            self.assertEqual(sorted(builder.groups), sorted(groups))
            for key, expected_v in exptected_datarect.items():
                self.assertEqual(builder._data_rect[key], expected_v)

            for key, expected_v in expected_scatter.items():
                self.assertEqual(builder._data_scatter[key], expected_v)

            for key, expected_v in expected_seg.items():
                self.assertEqual(builder._data_segment[key], expected_v)

            self.assertEqual(len(builder._legends), 3)

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
            builder = bp._builders[0]
            self.assertEqual(sorted(builder.groups), sorted(groups))
            for key, expected_v in exptected_datarect.items():
                self.assertEqual(builder._data_rect[key], expected_v)

            for key, expected_v in expected_scatter.items():
                self.assertEqual(builder._data_scatter[key], expected_v)

            for key, expected_v in expected_seg.items():
                self.assertEqual(builder._data_segment[key], expected_v)

            self.assertEqual(len(builder._legends), 3)

class TestHorizon(unittest.TestCase):
    def test_supported_input(self):
        now = datetime.datetime.now()
        delta = datetime.timedelta(minutes=1)
        dts = [now + delta*i for i in range(6)]
        dtss = ['%s'%dt for dt in dts]
        xyvalues = OrderedDict({'Date': dts})
        # Repeat the starting and trailing points in order to 
        y_python = xyvalues['python'] = [-120, -120, -30, 50, 100, 103]
        y_pypy = xyvalues['pypy'] = [-75, -75, -33, 15, 126, 126]

        xyvaluesdf = pd.DataFrame(xyvalues)
        groups = ['python', 'pypy']
        for i, _xy in enumerate([xyvalues, xyvaluesdf]):
            ts = create_chart(Horizon, _xy, index='Date')
            padded_date = [x for x in _xy['Date']]
            padded_date.insert(0, padded_date[0])
            padded_date.append(padded_date[-1])

            self.assertEqual(ts.nb_folds, 3)
            self.assertEqual(ts.series, groups)
            self.assertEqual(ts.fold_height, 126.0 / 3)
            self.assertEqual(ts.groups, ['42.0', '-42.0', '84.0', '-84.0', '126.0', '-126.0'])
            assert_array_equal(ts.data['x_python'], padded_date)
            assert_array_equal(ts.data['x_pypy'], padded_date)
            assert_array_equal(ts.data['y_fold-3_python'], [63, 9, 9 ,63, 63, 63, 63, 63])
            assert_array_equal(ts.data['y_fold-2_python'], [63, 0, 0, 63, 63, 63, 63, 63])
            assert_array_equal(ts.data['y_fold-1_python'], [63, 0, 0, 18, 63, 63, 63, 63])
            assert_array_equal(ts.data['y_fold1_python'], [0, 0, 0, 0, 63, 63, 63, 0])
            assert_array_equal(ts.data['y_fold2_python'], [0, 0, 0, 0, 12, 63, 63, 0])
            assert_array_equal(ts.data['y_fold3_python'], [0, 0, 0, 0, 0, 24, 28.5, 0])
            assert_array_equal(ts.data['y_fold-3_pypy'], [126, 126, 126, 126, 126, 126, 126, 126])
            assert_array_equal(ts.data['y_fold-2_pypy'], [126, 76.5, 76.5, 126, 126, 126, 126, 126])
            assert_array_equal(ts.data['y_fold-1_pypy'], [126, 63, 63, 76.5, 126, 126, 126, 126])
            assert_array_equal(ts.data['y_fold1_pypy'], [63, 63, 63, 63, 85.5, 126, 126, 63])
            assert_array_equal(ts.data['y_fold2_pypy'], [63, 63, 63, 63, 63, 126, 126, 63])
            assert_array_equal(ts.data['y_fold3_pypy'], [63, 63, 63, 63, 63, 126, 126, 63])

