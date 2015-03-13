#-----------------------------------------------------------------------------
# Copyright (c) 2012 - 2015, Continuum Analytics, Inc. All rights reserved.
#
# Powered by the Bokeh Development Team.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------

from __future__ import absolute_import
import unittest

from bokeh.plotting import figure
from bokeh.models import GlyphRenderer
from bokeh.models.tools import HoverTool, PanTool

import bokeh.models.plots as plots

class TestPlotSelect(unittest.TestCase):

    def setUp(self):
        self._plot = figure(tools='pan')
        self._plot.circle([1,2,3], [3,2,1], name='foo')

    def test_string_arg(self):
        found = self._plot.select('foo')
        self.assertEqual(len(found), 1)

        found = self._plot.select('bar')
        self.assertEqual(len(found), 0)


    def test_type_arg(self):
        found = self._plot.select(PanTool)
        self.assertEqual(len(found), 1)

        found = self._plot.select(HoverTool)
        self.assertEqual(len(found), 0)

    def test_kwargs(self):
        found = self._plot.select(name='foo', type=GlyphRenderer)
        self.assertEqual(len(found), 1)

        found = self._plot.select(name='foo', type=PanTool)
        self.assertEqual(len(found), 0)

    def test_too_many_args(self):
        with self.assertRaises(TypeError) as cm:
             self._plot.select('foo', 'bar')
        self.assertEqual(
            'select accepts at most ONE positional argument.',
            str(cm.exception)
        )

    def test_no_input(self):
        with self.assertRaises(TypeError) as cm:
             self._plot.select()
        self.assertEqual(
            'select requires EITHER a positional argument, OR keyword arguments.',
            str(cm.exception)
        )

    def test_arg_and_kwarg(self):
        with self.assertRaises(TypeError) as cm:
             self._plot.select('foo', type=PanTool)
        self.assertEqual(
            'select accepts EITHER a positional argument, OR keyword arguments (not both).',
            str(cm.exception)
        )




if __name__ == '__main__':
    unittest.main()
