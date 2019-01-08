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

# Bokeh imports
from bokeh.colors import HSL

# Module under test
import bokeh.colors.rgb as bcr

#-----------------------------------------------------------------------------
# Setup
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# General API
#-----------------------------------------------------------------------------

class Test_RGB(object):

    def test_init(self):
        c = bcr.RGB(10, 20, 30)
        assert c
        assert c.a == 1.0
        assert c.r == 10
        assert c.g == 20
        assert c.b == 30

        c = bcr.RGB(10, 20, 30, 0.3)
        assert c
        assert c.a == 0.3
        assert c.r == 10
        assert c.g == 20
        assert c.b == 30

    def test_repr(self):
        c = bcr.RGB(10, 20, 30)
        assert repr(c) == c.to_css()
        c = bcr.RGB(10, 20, 30, 0.3)
        assert repr(c) == c.to_css()

    def test_copy(self):
        c = bcr.RGB(10, 0.2, 0.3)
        c2 = c.copy()
        assert c2 is not c
        assert c2.a == c.a
        assert c2.r == c.r
        assert c2.g == c.g
        assert c2.b == c.b

    def test_from_hsl(self):
        c = HSL(10, 0.1, 0.2)
        c2 = bcr.RGB.from_hsl(c)
        assert c2 is not c
        assert c2.a == 1.0
        assert c2.r == 56
        assert c2.g == 48
        assert c2.b == 46

        c = HSL(10, 0.1, 0.2, 0.3)
        c2 = bcr.RGB.from_hsl(c)
        assert c2 is not c
        assert c2.a == 0.3
        assert c2.r == 56
        assert c2.g == 48
        assert c2.b == 46

    def test_from_rgb(self):
        c = bcr.RGB(10, 20, 30)
        c2 = bcr.RGB.from_rgb(c)
        assert c2 is not c
        assert c2.a == c.a
        assert c2.r == c.r
        assert c2.g == c.g
        assert c2.b == c.b

        c = bcr.RGB(10, 20, 30, 0.1)
        c2 = bcr.RGB.from_rgb(c)
        assert c2 is not c
        assert c2.a == c.a
        assert c2.r == c.r
        assert c2.g == c.g
        assert c2.b == c.b

    def test_to_css(self):
        c = bcr.RGB(10, 20, 30)
        assert c.to_css() == "rgb(10, 20, 30)"
        c = bcr.RGB(10, 20, 30, 0.3)
        assert c.to_css() == "rgba(10, 20, 30, 0.3)"

    def test_to_hex(self):
        c = bcr.RGB(10, 20, 30)
        assert c.to_hex(), "#%02X%02X%02X" % (c.r, c.g, c.b)

    def test_to_hsl(self):
        c = bcr.RGB(255, 100, 0)
        c2 = c.to_hsl()
        assert c2 is not c
        assert c2.a == c.a
        assert c2.h == 24
        assert c2.s == 1.0
        assert c2.l == 0.5

        c = bcr.RGB(255, 100, 0, 0.1)
        c2 = c.to_hsl()
        assert c2 is not c
        assert c2.a == c.a
        assert c2.h == 24
        assert c2.s == 1.0
        assert c2.l == 0.5

    def test_to_rgb(self):
        c = bcr.RGB(10, 20, 30)
        c2 = c.to_rgb()
        assert c2 is not c
        assert c2.a == c.a
        assert c2.r == c.r
        assert c2.g == c.g
        assert c2.b == c.b

        c = bcr.RGB(10, 20, 30, 0.1)
        c2 = c.to_rgb()
        assert c2 is not c
        assert c2.a == c.a
        assert c2.r == c.r
        assert c2.g == c.g
        assert c2.b == c.b

#-----------------------------------------------------------------------------
# Dev API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Private API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Code
#-----------------------------------------------------------------------------
