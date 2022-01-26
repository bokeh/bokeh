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
        c = bcc.HSL(10, 0.2, 0.2, 0.2)
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
        c = bcc.RGB(123, 12, 234, 0.2)
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
        c = bcc.HSL(10, 0.2, 0.2, 0.2)
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
        c = bcc.RGB(123, 12, 234, 0.2)
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

class Test_HSL:
    def test_init(self) -> None:
        c = bcc.HSL(10, 0.2, 0.3)
        assert c
        assert c.a == 1.0
        assert c.h == 10
        assert c.s == 0.2
        assert c.l == 0.3
        c = bcc.HSL(10, 0.2, 0.3, 0.3)
        assert c
        assert c.a == 0.3
        assert c.h == 10
        assert c.s == 0.2
        assert c.l == 0.3

    def test_repr(self) -> None:
        c = bcc.HSL(10, 0.2, 0.3)
        assert repr(c) == c.to_css()
        c = bcc.HSL(10, 0.2, 0.3, 0.3)
        assert repr(c) == c.to_css()

    def test_copy(self) -> None:
        c = bcc.HSL(10, 0.2, 0.3)
        c2 = c.copy()
        assert c2 is not c
        assert c2.a == c.a
        assert c2.h == c.h
        assert c2.s == c.s
        assert c2.l == c.l

    def test_from_hsl(self) -> None:
        c = bcc.HSL(10, 0.2, 0.3)
        c2 = bcc.HSL.from_hsl(c)
        assert c2 is not c
        assert c2.a == c.a
        assert c2.h == c.h
        assert c2.s == c.s
        assert c2.l == c.l

        c = bcc.HSL(10, 0.2, 0.3, 0.1)
        c2 = bcc.HSL.from_hsl(c)
        assert c2 is not c
        assert c2.a == c.a
        assert c2.h == c.h
        assert c2.s == c.s
        assert c2.l == c.l

    def test_from_rgb(self) -> None:
        c = bcc.RGB(255, 100, 0)
        c2 = bcc.HSL.from_rgb(c)
        assert c2 is not c
        assert c2.a == 1
        assert c2.h == 24
        assert c2.s == 1.0
        assert c2.l == 0.5

        c = bcc.RGB(255, 100, 0, 0.1)
        c2 = bcc.HSL.from_rgb(c)
        assert c2 is not c
        assert c2.a == 0.1
        assert c2.h == 24
        assert c2.s == 1.0
        assert c2.l == 0.5

    def test_to_css(self) -> None:
        c = bcc.HSL(10, 0.2, 0.3)
        assert c.to_css() == "hsl(10, 20.0%, 30.0%)"
        c = bcc.HSL(10, 0.2, 0.3, 0.3)
        assert c.to_css() == "hsla(10, 20.0%, 30.0%, 0.3)"

    def test_to_hsl(self) -> None:
        c = bcc.HSL(10, 0.2, 0.3)
        c2 = c.to_hsl()
        assert c2 is not c
        assert c2.a == c.a
        assert c2.h == c.h
        assert c2.s == c.s
        assert c2.l == c.l

        c = bcc.HSL(10, 0.2, 0.3, 0.1)
        c2 = c.to_hsl()
        assert c2 is not c
        assert c2.a == c.a
        assert c2.h == c.h
        assert c2.s == c.s
        assert c2.l == c.l

    def test_to_rgb(self) -> None:
        c = bcc.HSL(10, 0.2, 0.3)
        c2 = c.to_rgb()
        assert c2 is not c
        assert c2.a == 1.0
        assert c2.r == 92
        assert c2.g == 66
        assert c2.b == 61

        c = bcc.HSL(10, 0.2, 0.3, 0.1)
        c2 = c.to_rgb()
        assert c2 is not c
        assert c.a == 0.1
        assert c2.r == 92
        assert c2.g == 66
        assert c2.b == 61

class Test_RGB:
    def test_init(self) -> None:
        c = bcc.RGB(10, 20, 30)
        assert c
        assert c.a == 1.0
        assert c.r == 10
        assert c.g == 20
        assert c.b == 30

        c = bcc.RGB(10, 20, 30, 0.3)
        assert c
        assert c.a == 0.3
        assert c.r == 10
        assert c.g == 20
        assert c.b == 30

    def test_repr(self) -> None:
        c = bcc.RGB(10, 20, 30)
        assert repr(c) == c.to_css()
        c = bcc.RGB(10, 20, 30, 0.3)
        assert repr(c) == c.to_css()

    def test_copy(self) -> None:
        c = bcc.RGB(10, 20, 30)
        c2 = c.copy()
        assert c2 is not c
        assert c2.a == c.a
        assert c2.r == c.r
        assert c2.g == c.g
        assert c2.b == c.b

    def test_from_hsl(self) -> None:
        c = bcc.HSL(10, 0.1, 0.2)
        c2 = bcc.RGB.from_hsl(c)
        assert c2 is not c
        assert c2.a == 1.0
        assert c2.r == 56
        assert c2.g == 48
        assert c2.b == 46

        c = bcc.HSL(10, 0.1, 0.2, 0.3)
        c2 = bcc.RGB.from_hsl(c)
        assert c2 is not c
        assert c2.a == 0.3
        assert c2.r == 56
        assert c2.g == 48
        assert c2.b == 46

    def test_from_rgb(self) -> None:
        c = bcc.RGB(10, 20, 30)
        c2 = bcc.RGB.from_rgb(c)
        assert c2 is not c
        assert c2.a == c.a
        assert c2.r == c.r
        assert c2.g == c.g
        assert c2.b == c.b

        c = bcc.RGB(10, 20, 30, 0.1)
        c2 = bcc.RGB.from_rgb(c)
        assert c2 is not c
        assert c2.a == c.a
        assert c2.r == c.r
        assert c2.g == c.g
        assert c2.b == c.b

    def test_to_css(self) -> None:
        c = bcc.RGB(10, 20, 30)
        assert c.to_css() == "rgb(10, 20, 30)"
        c = bcc.RGB(10, 20, 30, 0.3)
        assert c.to_css() == "rgba(10, 20, 30, 0.3)"

    def test_to_hex(self) -> None:
        c = bcc.RGB(10, 20, 30)
        assert c.to_hex(), "#%02X%02X%02X" % (c.r, c.g, c.b)

    def test_to_hsl(self) -> None:
        c = bcc.RGB(255, 100, 0)
        c2 = c.to_hsl()
        assert c2 is not c
        assert c2.a == c.a
        assert c2.h == 24
        assert c2.s == 1.0
        assert c2.l == 0.5

        c = bcc.RGB(255, 100, 0, 0.1)
        c2 = c.to_hsl()
        assert c2 is not c
        assert c2.a == c.a
        assert c2.h == 24
        assert c2.s == 1.0
        assert c2.l == 0.5

    def test_to_rgb(self) -> None:
        c = bcc.RGB(10, 20, 30)
        c2 = c.to_rgb()
        assert c2 is not c
        assert c2.a == c.a
        assert c2.r == c.r
        assert c2.g == c.g
        assert c2.b == c.b

        c = bcc.RGB(10, 20, 30, 0.1)
        c2 = c.to_rgb()
        assert c2 is not c
        assert c2.a == c.a
        assert c2.r == c.r
        assert c2.g == c.g
        assert c2.b == c.b

    def test_brightness(self) -> None:
        assert round(bcc.RGB(  0,   0,   0).brightness, 2) == 0.0
        assert round(bcc.RGB(127, 127, 127).brightness, 2) == 0.5
        assert round(bcc.RGB(128, 128, 128).brightness, 2) == 0.5
        assert round(bcc.RGB(255, 255, 255).brightness, 2) == 1.0

#-----------------------------------------------------------------------------
# Dev API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Private API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Code
#-----------------------------------------------------------------------------
