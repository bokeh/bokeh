#-----------------------------------------------------------------------------
# Copyright (c) 2012 - 2019, Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Boilerplate
#-----------------------------------------------------------------------------
from __future__ import absolute_import, division, print_function, unicode_literals

import pytest ; pytest

#-----------------------------------------------------------------------------
# Imports
#-----------------------------------------------------------------------------

# Standard library imports

# External imports
import numpy as np

# Bokeh imports

# Module under test
import bokeh.util.hex as buh

#-----------------------------------------------------------------------------
# Setup
#-----------------------------------------------------------------------------

np.random.seed(0)
n = 500
x = 2 + np.random.standard_normal(n)
y = 2 + np.random.standard_normal(n)

#-----------------------------------------------------------------------------
# General API
#-----------------------------------------------------------------------------

class Test_axial_to_cartesian(object):

    def test_default_aspect_pointytop(self):
        q = np.array([0, 0, 0, 1, -1, 1, -1])
        r = np.array([0, 1, -1, 0, 1, -1, 0])

        x, y = buh.axial_to_cartesian(q, r, 1, "pointytop")

        sq3 = np.sqrt(3)
        assert list(x) == [0, sq3/2, -sq3/2, sq3, -sq3/2, sq3/2, -sq3]
        assert list(y) == [-0.0, -1.5, 1.5, -0.0, -1.5, 1.5, -0.0]


    def test_default_aspect_flattop(self):
        q = np.array([0, 0, 0, 1, -1, 1, -1])
        r = np.array([0, 1, -1, 0, 1, -1, 0])

        x, y = buh.axial_to_cartesian(q, r, 1, "flattop")

        sq3 = np.sqrt(3)
        assert list(x) == [0.0, 0.0, 0.0, 1.5, -1.5, 1.5, -1.5]
        assert list(y) == [0, -sq3, sq3, -sq3/2, -sq3/2, sq3/2, sq3/2]

class Test_cartesian_to_axial(object):

    def test_default_aspect_pointytop(self):
        x = np.array([0, -2, 2, -1.5, -1.5, 1.5, 1.5])
        y = np.array([0, 0, 0, 1.5, -1.5, 1.5, -1.5])

        q, r = buh.cartesian_to_axial(x, y, 1, "pointytop")

        assert list(zip(q, r)) == [
            (0,0), (-1, 0), (1,0), (0,-1), (-1, 1), (1, -1), (0,1)
        ]

    def test_default_aspect_flattop(self):
        x = np.array([0, 0, 0, 1.5, -1.5, 1.5, -1.5])
        y = np.array([0, -2, 2, -1.5, -1.5, 1.5, 1.5])

        q, r = buh.cartesian_to_axial(x, y, 1, "flattop")

        assert list(zip(q, r)) == [
            (0,0), (0,1), (0,-1), (1, 0), (-1, 1), (1, -1), (-1,0)
        ]

class Test_hexbin(object):

    # hexbin requires pandas

    def test_gaussian_pointytop(self, pd):
        bins = buh.hexbin(x, y, 2)
        assert list(bins.q) == [0,0,1,1,1,2,2]
        assert list(bins.r) == [-1,0,-2,-1,0,-2,-1]
        assert list(bins.counts) == [9,54,1,313,98,3,22]

        assert bins.equals(buh.hexbin(x, y, 2, "pointytop"))

    def test_gaussian_flattop(self, pd):
        bins = buh.hexbin(x, y, 2, "flattop")
        assert list(bins.q) == [0, 0, 1, 1, 1, 2]
        assert list(bins.r) == [-1, 0, -2, -1, 0, -2]
        assert list(bins.counts) == [95, 57, 14, 324, 8, 2]

#-----------------------------------------------------------------------------
# Dev API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Private API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Code
#-----------------------------------------------------------------------------
