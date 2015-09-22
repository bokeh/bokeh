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

from bokeh._legacy_charts.utils import chunk

#-----------------------------------------------------------------------------
# Classes and functions
#-----------------------------------------------------------------------------

class TestBuilder(unittest.TestCase):

    def test_chunk(self):
        chunk_list = list(chunk(range(5), 2))
        self.assertEqual(len(chunk_list), 3)
        self.assertEqual(len(chunk_list[0]), 2)