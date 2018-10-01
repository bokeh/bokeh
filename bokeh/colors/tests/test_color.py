#-----------------------------------------------------------------------------
# Copyright (c) 2012 - 2018, Anaconda, Inc. All rights reserved.
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

#-----------------------------------------------------------------------------
# Imports
#-----------------------------------------------------------------------------

# Standard library imports

# External imports

# Bokeh imports
from bokeh.colors.hsl import HSL

# Module under test
import bokeh.colors.color as bcc

#-----------------------------------------------------------------------------
# Setup
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# General API
#-----------------------------------------------------------------------------

class Test_Color(object):

    def test_init(self):
        c = bcc.Color()
        assert c

    def test_abstract(self):
        c = bcc.Color()

        with pytest.raises(NotImplementedError):
            c.copy()

        with pytest.raises(NotImplementedError):
            c.from_hsl("foo")
        with pytest.raises(NotImplementedError):
            c.from_rgb("foo")

        with pytest.raises(NotImplementedError):
            c.to_css()
        with pytest.raises(NotImplementedError):
            c.to_hsl()
        with pytest.raises(NotImplementedError):
            c.to_rgb()

    def test_repr(self):
        c = bcc.Color()
        with pytest.raises(NotImplementedError):
            repr(c)

    def test_clamp(self):
        assert bcc.Color.clamp(10) == 10
        assert bcc.Color.clamp(10, 20) == 10
        assert bcc.Color.clamp(10, 5) == 5
        assert bcc.Color.clamp(-10) == 0

    def test_darken(self):
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

    def test_lighten(self):
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

#-----------------------------------------------------------------------------
# Dev API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Private API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Code
#-----------------------------------------------------------------------------
