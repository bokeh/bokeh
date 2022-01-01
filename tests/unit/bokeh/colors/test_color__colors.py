#-----------------------------------------------------------------------------
# Copyright (c) 2012 - 2022, Anaconda, Inc., and Bokeh Contributors.
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

# Bokeh imports
from bokeh.colors.hsl import HSL
from bokeh.colors.rgb import RGB

# Module under test
import bokeh.colors.color as bcc # isort:skip

#-----------------------------------------------------------------------------
# Setup
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# General API
#-----------------------------------------------------------------------------


class Test_Color:

    def test_clamp(self) -> None:
        assert bcc.Color.clamp(10) == 10
        assert bcc.Color.clamp(10, 20) == 10
        assert bcc.Color.clamp(10, 5) == 5
        assert bcc.Color.clamp(-10) == 0

    def test_darken(self) -> None:
        c = HSL(10, 0.2, 0.2, 0.2)
        c2 = c.darken(0.1)
        assert c2 is not c
        assert c2.a == 0.2
        assert c2.h == 10
        assert c2.s == 0.2
        assert c2.l == 0.1

        c2 = c.darken(0.3)
        assert c2 is not c
        assert c2.a == 0.2
        assert c2.h == 10
        assert c2.s == 0.2
        assert c2.l == 0

    def test_darken_rgb(self) -> None:
        c = RGB(123, 12, 234, 0.2)
        c2 = c.darken(0.1)
        assert c2 is not c
        assert c2.a == 0.2
        assert c2.r == 97
        assert c2.g == 10
        assert c2.b == 185

        c2 = c.darken(1.2)
        assert c2 is not c
        assert c2.a == 0.2
        assert c2.r == 0
        assert c2.g == 0
        assert c2.b == 0

    def test_lighten(self) -> None:
        c = HSL(10, 0.2, 0.2, 0.2)
        c2 = c.lighten(0.2)
        assert c2 is not c
        assert c2.a == 0.2
        assert c2.h == 10
        assert c2.s == 0.2
        assert c2.l == 0.4

        c2 = c.lighten(1.2)
        assert c2 is not c
        assert c2.a == 0.2
        assert c2.h == 10
        assert c2.s == 0.2
        assert c2.l == 1.0

    def test_lighten_rgb(self) -> None:
        c = RGB(123, 12, 234, 0.2)
        c2 = c.lighten(0.1)
        assert c2 is not c
        assert c2.a == 0.2
        assert c2.r == 148
        assert c2.g == 52
        assert c2.b == 245

        c2 = c.lighten(1.2)
        assert c2 is not c
        assert c2.a == 0.2
        assert c2.r == 255
        assert c2.g == 255
        assert c2.b == 255

#-----------------------------------------------------------------------------
# Dev API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Private API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Code
#-----------------------------------------------------------------------------
