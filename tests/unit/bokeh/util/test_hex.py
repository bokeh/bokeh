#-----------------------------------------------------------------------------
# Copyright (c) Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Boilerplate
#-----------------------------------------------------------------------------
from __future__ import annotations # isort:skip

import pytest ; pytest

#-----------------------------------------------------------------------------
# Imports
#-----------------------------------------------------------------------------

# External imports
import numpy as np

# Module under test
import bokeh.util.hex as buh # isort:skip

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


class Test_axial_to_cartesian:
    def test_default_aspect_pointytop(self) -> None:
        q = np.array([0, 0, 0, 1, -1, 1, -1])
        r = np.array([0, 1, -1, 0, 1, -1, 0])

        x, y = buh.axial_to_cartesian(q, r, 1, "pointytop")

        sq3 = np.sqrt(3)
        assert list(x) == [0, sq3/2, -sq3/2, sq3, -sq3/2, sq3/2, -sq3]
        assert list(y) == [-0.0, -1.5, 1.5, -0.0, -1.5, 1.5, -0.0]


    def test_default_aspect_flattop(self) -> None:
        q = np.array([0, 0, 0, 1, -1, 1, -1])
        r = np.array([0, 1, -1, 0, 1, -1, 0])

        x, y = buh.axial_to_cartesian(q, r, 1, "flattop")

        sq3 = np.sqrt(3)
        assert list(x) == [0.0, 0.0, 0.0, 1.5, -1.5, 1.5, -1.5]
        assert list(y) == [0, -sq3, sq3, -sq3/2, -sq3/2, sq3/2, sq3/2]


class Test_cartesian_to_axial:
    def test_default_aspect_pointytop(self) -> None:
        x = np.array([0, -2, 2, -1.5, -1.5, 1.5, 1.5])
        y = np.array([0, 0, 0, 1.5, -1.5, 1.5, -1.5])

        q, r = buh.cartesian_to_axial(x, y, 1, "pointytop")

        assert list(zip(q, r)) == [
            (0,0), (-1, 0), (1,0), (0,-1), (-1, 1), (1, -1), (0,1),
        ]

    def test_default_aspect_flattop(self) -> None:
        x = np.array([0, 0, 0, 1.5, -1.5, 1.5, -1.5])
        y = np.array([0, -2, 2, -1.5, -1.5, 1.5, 1.5])

        q, r = buh.cartesian_to_axial(x, y, 1, "flattop")

        assert list(zip(q, r)) == [
            (0,0), (0,1), (0,-1), (1, 0), (-1, 1), (1, -1), (-1,0),
        ]


class Test_hexbin:

    def test_gaussian_pointytop(self) -> None:
        bins = buh.hexbin(x, y, 2)
        np.testing.assert_array_equal(bins.q, [0, 0, 1, 1, 1, 2, 2])
        np.testing.assert_array_equal(bins.r, [0, -1, 0, -2, -1, -2, -1])
        np.testing.assert_array_equal(bins.counts, [54, 9, 98, 1, 313, 3, 22])

        pointy_bins = buh.hexbin(x, y, 2, "pointytop")
        np.testing.assert_array_equal(bins.q, pointy_bins.q)
        np.testing.assert_array_equal(bins.r, pointy_bins.r)
        np.testing.assert_array_equal(bins.counts, pointy_bins.counts)

    def test_gaussian_flattop(self) -> None:
        bins = buh.hexbin(x, y, 2, "flattop")
        np.testing.assert_array_equal(bins.q, [0, 0, 1, 1, 1, 2])
        np.testing.assert_array_equal(bins.r, [0, -1, 0, -2, -1, -2])
        np.testing.assert_array_equal(bins.counts, [57, 95, 8, 14, 324, 2])

#-----------------------------------------------------------------------------
# Dev API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Private API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Code
#-----------------------------------------------------------------------------
