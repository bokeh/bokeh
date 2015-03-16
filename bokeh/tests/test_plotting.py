from __future__ import absolute_import
import unittest

from bokeh.models import (
    LinearAxis, PanTool, BoxZoomTool, LassoSelectTool, ResetTool, ResizeTool)

import bokeh.plotting as plt

class TestFigure(unittest.TestCase):

    def test_basic(self):
        p = plt.figure()
        q = plt.figure()
        q.circle([1,2,3], [1,2,3])
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
        p.circle([1,2,3], [1,2,3])
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
        p.circle([1,2,3], [1,2,3])
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
        p.circle([1,2,3], [1,2,3])
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
        p .circle([1,2,3], [1,2,3])
        self.assertEqual(len(p.xgrid), 1)
        self.assertEqual(p.xgrid[0].dimension, 0)

    def test_ygrid(self):
        p = plt.figure()
        p.circle([1,2,3], [1,2,3])
        self.assertEqual(len(p.ygrid), 1)
        self.assertEqual(p.ygrid[0].dimension, 1)

    def test_grid(self):
        p = plt.figure()
        p .circle([1,2,3], [1,2,3])
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

    def test(self):
        pass

if __name__ == "__main__":
    unittest.main()
