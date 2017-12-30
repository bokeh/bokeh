#-----------------------------------------------------------------------------
# Copyright (c) 2012 - 2017, Anaconda, Inc. All rights reserved.
#
# Powered by the Bokeh Development Team.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Boilerplate
#-----------------------------------------------------------------------------
from __future__ import absolute_import, division, print_function, unicode_literals

import pytest ; pytest

from bokeh.util.api import DEV, GENERAL ; DEV, GENERAL
from bokeh.util.testing import verify_api ; verify_api

#-----------------------------------------------------------------------------
# Imports
#-----------------------------------------------------------------------------

# Standard library imports

# External imports

# Bokeh imports
from bokeh.colors import RGB

# Module under test
import bokeh.colors.hsl as bch

#-----------------------------------------------------------------------------
# API Definition
#-----------------------------------------------------------------------------

api = {

    GENERAL: (

        ( 'HSL',          (1, 0, 0) ),
        ( 'HSL.copy',     (1, 0, 0) ),
        ( 'HSL.from_hsl', (1, 0, 0) ),
        ( 'HSL.from_rgb', (1, 0, 0) ),
        ( 'HSL.to_css',   (1, 0, 0) ),
        ( 'HSL.to_hsl',   (1, 0, 0) ),
        ( 'HSL.to_rgb',   (1, 0, 0) ),

    ), DEV: (

    )

}

Test_api = verify_api(bch, api)

#-----------------------------------------------------------------------------
# Setup
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# General API
#-----------------------------------------------------------------------------

class Test_HSL(object):

    def test_init(self):
        c = bch.HSL(10, 0.2, 0.3)
        assert c
        assert c.a == 1.0
        assert c.h == 10
        assert c.s == 0.2
        assert c.l == 0.3
        c = bch.HSL(10, 0.2, 0.3, 0.3)
        assert c
        assert c.a == 0.3
        assert c.h == 10
        assert c.s == 0.2
        assert c.l == 0.3

    def test_repr(self):
        c = bch.HSL(10, 0.2, 0.3)
        assert repr(c) == c.to_css()
        c = bch.HSL(10, 0.2, 0.3, 0.3)
        assert repr(c) == c.to_css()

    def test_copy(self):
        c = bch.HSL(10, 0.2, 0.3)
        c2 = c.copy()
        assert c2 is not c
        assert c2.a == c.a
        assert c2.h == c.h
        assert c2.s == c.s
        assert c2.l == c.l

    def test_from_hsl(self):
        c = bch.HSL(10, 0.2, 0.3)
        c2 = bch.HSL.from_hsl(c)
        assert c2 is not c
        assert c2.a == c.a
        assert c2.h == c.h
        assert c2.s == c.s
        assert c2.l == c.l

        c = bch.HSL(10, 0.2, 0.3, 0.1)
        c2 = bch.HSL.from_hsl(c)
        assert c2 is not c
        assert c2.a == c.a
        assert c2.h == c.h
        assert c2.s == c.s
        assert c2.l == c.l

    def test_from_rgb(self):
        c = RGB(255, 100, 0)
        c2 = bch.HSL.from_rgb(c)
        assert c2 is not c
        assert c2.a == 1
        assert c2.h == 24
        assert c2.s == 1.0
        assert c2.l == 0.5

        c = RGB(255, 100, 0, 0.1)
        c2 = bch.HSL.from_rgb(c)
        assert c2 is not c
        assert c2.a == 0.1
        assert c2.h == 24
        assert c2.s == 1.0
        assert c2.l == 0.5

    def test_to_css(self):
        c = bch.HSL(10, 0.2, 0.3)
        assert c.to_css() == "hsl(10, 20.0%, 30.0%)"
        c = bch.HSL(10, 0.2, 0.3, 0.3)
        assert c.to_css() == "hsla(10, 20.0%, 30.0%, 0.3)"

    def test_to_hsl(self):
        c = bch.HSL(10, 0.2, 0.3)
        c2 = c.to_hsl()
        assert c2 is not c
        assert c2.a == c.a
        assert c2.h == c.h
        assert c2.s == c.s
        assert c2.l == c.l

        c = bch.HSL(10, 0.2, 0.3, 0.1)
        c2 = c.to_hsl()
        assert c2 is not c
        assert c2.a == c.a
        assert c2.h == c.h
        assert c2.s == c.s
        assert c2.l == c.l

    def test_to_rgb(self):
        c = bch.HSL(10, 0.2, 0.3)
        c2 = c.to_rgb()
        assert c2 is not c
        assert c2.a == 1.0
        assert c2.r == 92
        assert c2.g == 66
        assert c2.b == 61

        c = bch.HSL(10, 0.2, 0.3, 0.1)
        c2 = c.to_rgb()
        assert c2 is not c
        assert c.a == 0.1
        assert c2.r == 92
        assert c2.g == 66
        assert c2.b == 61

#-----------------------------------------------------------------------------
# Dev API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Private API
#-----------------------------------------------------------------------------
