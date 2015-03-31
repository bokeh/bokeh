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

from bokeh.models import ColumnDataSource
from bokeh.models.glyphs import Circle
from bokeh.charts.utils import chunk, make_scatter

#-----------------------------------------------------------------------------
# Classes and functions
#-----------------------------------------------------------------------------

class TestBuilder(unittest.TestCase):

    def test_chunk(self):
        chunk_list = list(chunk(range(5), 2))
        self.assertEqual(len(chunk_list), 3)
        self.assertEqual(len(chunk_list[0]), 2)

    def test_make_scatter(self):
        source = ColumnDataSource({"a": [2, 4, 5]})
        scatter = make_scatter(source, 'a', 'b', "circle", "black")
        self.assertEqual(scatter.x, 'a')
        self.assertEqual(scatter.y, 'b')
        self.assertIsInstance(scatter, Circle)
        self.assertEqual(scatter.line_color, "black")
