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

from bokeh.charts.utils import chunk

#-----------------------------------------------------------------------------
# Classes and functions
#-----------------------------------------------------------------------------

class TestBuilder(unittest.TestCase):

    def test_chun(self):
        chunk_list = list(chunk(range(5), 2))
        self.assertEqual(len(chunk_list), 3)
        self.assertEqual(len(chunk_list[0]), 2)

