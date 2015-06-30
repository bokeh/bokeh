from __future__ import absolute_import
import unittest

from bokeh.models import (
    LinearAxis, PanTool, BoxZoomTool, LassoSelectTool, ResetTool, ResizeTool)

import bokeh.plotting as plt

class TestFigure(unittest.TestCase):

    def test_basic(self):
        p = plt.figure()
        q = plt.figure()
        q.circle([1, 2, 3], [1, 2, 3])
        self.assertNotEqual(p, q)
        r = plt.figure()
        self.assertNotEqual(p, r)
        self.assertNotEqual(q, r)
        p = plt.figure(width=100, height=120)
        self.assertEqual(p.plot_width, 100)
        self.assertEqual(p.plot_height, 120)
        p = plt.figure(plot_width=100, plot_height=120)
        self.assertEqual(p.plot_width, 100)
        self.assertEqual(p.plot_height, 120)
        self.assertRaises(ValueError, plt.figure, plot_width=100, width=120)
        self.assertRaises(ValueError, plt.figure, plot_height=100, height=120)

    def test_xaxis(self):
        p = plt.figure()
        p.circle([1, 2, 3], [1, 2, 3])
        self.assertEqual(len(p.xaxis), 1)

        expected = set(p.xaxis)

        ax = LinearAxis()
        expected.add(ax)
        p.above.append(ax)
        self.assertEqual(set(p.xaxis), expected)

        ax2 = LinearAxis()
        expected.add(ax2)
        p.above.append(ax2)
        self.assertEqual(set(p.xaxis), expected)

        p.left.append(LinearAxis())
        self.assertEqual(set(p.xaxis), expected)

        p.right.append(LinearAxis())
        self.assertEqual(set(p.xaxis), expected)

    def test_yaxis(self):
        p = plt.figure()
        p.circle([1, 2, 3], [1, 2, 3])
        self.assertEqual(len(p.yaxis), 1)

        expected = set(p.yaxis)

        ax = LinearAxis()
        expected.add(ax)
        p.right.append(ax)
        self.assertEqual(set(p.yaxis), expected)

        ax2 = LinearAxis()
        expected.add(ax2)
        p.right.append(ax2)
        self.assertEqual(set(p.yaxis), expected)

        p.above.append(LinearAxis())
        self.assertEqual(set(p.yaxis), expected)

        p.below.append(LinearAxis())
        self.assertEqual(set(p.yaxis), expected)

    def test_axis(self):
        p = plt.figure()
        p.circle([1, 2, 3], [1, 2, 3])
        self.assertEqual(len(p.axis), 2)

        expected = set(p.axis)

        ax = LinearAxis()
        expected.add(ax)
        p.above.append(ax)
        self.assertEqual(set(p.axis), expected)

        ax2 = LinearAxis()
        expected.add(ax2)
        p.below.append(ax2)
        self.assertEqual(set(p.axis), expected)

        ax3 = LinearAxis()
        expected.add(ax3)
        p.left.append(ax3)
        self.assertEqual(set(p.axis), expected)

        ax4 = LinearAxis()
        expected.add(ax4)
        p.right.append(ax4)
        self.assertEqual(set(p.axis), expected)

    def test_xgrid(self):
        p = plt.figure()
        p.circle([1, 2, 3], [1, 2, 3])
        self.assertEqual(len(p.xgrid), 1)
        self.assertEqual(p.xgrid[0].dimension, 0)

    def test_ygrid(self):
        p = plt.figure()
        p.circle([1, 2, 3], [1, 2, 3])
        self.assertEqual(len(p.ygrid), 1)
        self.assertEqual(p.ygrid[0].dimension, 1)

    def test_grid(self):
        p = plt.figure()
        p.circle([1, 2, 3], [1, 2, 3])
        self.assertEqual(len(p.grid), 2)

    def test_legend(self):
        pass

    def test_tools(self):
        TOOLS = "resize,pan,box_zoom,reset,lasso_select"
        fig = plt.figure(tools=TOOLS)
        expected = [ResizeTool, PanTool,  BoxZoomTool, ResetTool, LassoSelectTool]

        self.assertEqual(len(fig.tools), len(expected))
        for i, _type in enumerate(expected):
            self.assertIsInstance(fig.tools[i], _type)

class TestMarkers(unittest.TestCase):

    def check_each_color_input(self, rgbs, func):
        """Runs assertions for each rgb provided with the given function."""
        for rgb in rgbs:
            p = plt.figure()
            func(p, rgb)

    def color_only_checks(self, p, rgb):
        """Helper method for checks specific to color= input."""
        p.circle([1, 2, 3], [1, 2, 3], color=rgb)
        self.assertTupleEqual(p.renderers[-1].glyph.line_color, rgb)
        self.assertTupleEqual(p.renderers[-1].glyph.fill_color, rgb)

        # rgb should always be an integer by the time it is added to property
        [self.assertIsInstance(v, int) for v in p.renderers[-1].glyph.line_color[0:3]]
        [self.assertIsInstance(v, int) for v in p.renderers[-1].glyph.fill_color[0:3]]

    def line_color_input_checks(self, p, rgb):
        """Helper method for checks specific to line_color= only input."""
        p.circle([1, 2, 3], [1, 2, 3], line_color=rgb)
        self.assertTupleEqual(p.renderers[-1].glyph.line_color, rgb)
        # should always be an integer by the time it is added to property
        [self.assertIsInstance(v, int) for v in p.renderers[-1].glyph.line_color[0:3]]

    def test_mixed_inputs(self):
        """Helper method to test mixed global and specific color args."""

        p = plt.figure()
        rgb = (100, 0, 0)
        rgb_other = (0, 100, 0)
        alpha1 = 0.5
        alpha2 = 0.75

        # color/line_color
        p.circle([1, 2, 3], [1, 2, 3], color=rgb, line_color=rgb_other)
        self.assertTupleEqual(p.renderers[-1].glyph.fill_color, rgb)
        self.assertTupleEqual(p.renderers[-1].glyph.line_color, rgb_other)

        # color/fill_color
        p.circle([1, 2, 3], [1, 2, 3], color=rgb, fill_color=rgb_other)
        self.assertTupleEqual(p.renderers[-1].glyph.line_color, rgb)
        self.assertTupleEqual(p.renderers[-1].glyph.fill_color, rgb_other)

        # alpha/line_alpha
        p.circle([1, 2, 3], [1, 2, 3], color=rgb, alpha=alpha1,
                 line_alpha=alpha2)
        self.assertEqual(p.renderers[-1].glyph.line_alpha, alpha2)
        self.assertEqual(p.renderers[-1].glyph.fill_alpha, alpha1)

    def test_color_input_float(self):
        """Test input of rgb with float values."""
        rgbs = [(100., 100., 100.), (50., 100., 50., 0.5)]
        self.check_each_color_input(rgbs=rgbs, func=self.color_only_checks)
        self.check_each_color_input(rgbs=rgbs, func=self.line_color_input_checks)

    def test_color_input_int(self):
        """Test input of rgb with integers."""
        rgbs = [(100, 100, 100), (50, 100, 50, 0.5)]
        self.check_each_color_input(rgbs=rgbs, func=self.color_only_checks)
        self.check_each_color_input(rgbs=rgbs, func=self.line_color_input_checks)

    def test_render_level(self):
        p = plt.figure()
        p.circle([1, 2, 3], [1, 2, 3], level="underlay")
        self.assertEqual(p.renderers[-1].level, "underlay")
        with self.assertRaises(ValueError):
            p.circle([1, 2, 3], [1, 2, 3], level="bad_input")

if __name__ == "__main__":
    unittest.main()
