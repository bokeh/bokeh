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

import pytest
import unittest

from bokeh._legacy_charts._builder import Builder

pytestmark = pytest.mark.unit

#-----------------------------------------------------------------------------
# Classes and functions
#-----------------------------------------------------------------------------

class TestBuilder(unittest.TestCase):
    def setUp(self):
        self.builder = Builder([], palette=['red', 'green'])

    def test_instantiate(self):
        self.builder.palette = ['red', 'green']
