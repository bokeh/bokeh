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
from . import _TestHasProps, _TestModel
from bokeh.colors import RGB
from bokeh._testing.util.api import verify_all

# Module under test
import bokeh.core.property.color as bcpc

#-----------------------------------------------------------------------------
# Setup
#-----------------------------------------------------------------------------

ALL = (
    'Color',
    'RGB',
)

#-----------------------------------------------------------------------------
# General API
#-----------------------------------------------------------------------------

class Test_Color(object):

    def test_valid(self):
        prop = bcpc.Color()
        assert prop.is_valid(None)

        assert prop.is_valid((0, 127, 255))
        assert prop.is_valid((0, 127, 255, 1.0))

        assert prop.is_valid("#00aaff")
        assert prop.is_valid("#00AAFF")
        assert prop.is_valid("#00AaFf")

        assert prop.is_valid("blue")
        assert prop.is_valid("BLUE")

        assert prop.is_valid('rgb(10, 20, 30)')
        assert prop.is_valid('rgba(10, 20, 30, 1)')
        assert prop.is_valid('rgba(10, 20, 30, 0.5)')

        assert prop.is_valid(RGB(10, 20, 30))

    def test_invalid(self):
        prop = bcpc.Color()
        assert not prop.is_valid(False)
        assert not prop.is_valid(True)
        assert not prop.is_valid(0)
        assert not prop.is_valid(1)
        assert not prop.is_valid(0.0)
        assert not prop.is_valid(1.0)
        assert not prop.is_valid(1.0+1.0j)
        assert not prop.is_valid("")
        assert not prop.is_valid(())
        assert not prop.is_valid([])
        assert not prop.is_valid({})
        assert not prop.is_valid(_TestHasProps())
        assert not prop.is_valid(_TestModel())

        assert not prop.is_valid((0, -127, 255))
        assert not prop.is_valid((0, 127))
        assert not prop.is_valid((0, 127, 1.0))
        assert not prop.is_valid((0, 127, 255, 255))

        assert not prop.is_valid('(0, 127, 255)')
        assert not prop.is_valid('rgb(0, -127, 255)')
        assert not prop.is_valid('rgb(0, 127)')
        assert not prop.is_valid('rgb(0, 127, 1.0)')
        assert not prop.is_valid('rgb(256, 1, 1)')
        assert not prop.is_valid('rgb(256, 1, 1, 1.0)')

        assert not prop.is_valid('(10, 20, 30')
        assert not prop.is_valid('rgba(10, 20, 30')
        assert not prop.is_valid('rgba(10, 20, 30)')
        assert not prop.is_valid('rgba(10, 20, 30,)')
        assert not prop.is_valid('rgba(10, 20)')
        assert not prop.is_valid('rgba(10, 20, 256, 1)')
        assert not prop.is_valid('rgba(10, 20, 256, 10)')
        assert not prop.is_valid('rgba(10, 20, 30, 50)')

        assert not prop.is_valid("00aaff")
        assert not prop.is_valid("00AAFF")
        assert not prop.is_valid("00AaFf")
        assert not prop.is_valid("#00AaFg")
        assert not prop.is_valid("#00AaFff")

        assert not prop.is_valid("foobar")

    def test_transform(self):
        prop = bcpc.Color()
        assert prop.transform((0, 127, 255)) == "rgb(0, 127, 255)"
        assert prop.transform((0, 127, 255, 0.1)) == "rgba(0, 127, 255, 0.1)"

    def test_has_ref(self):
        prop = bcpc.Color()
        assert not prop.has_ref

    def test_str(self):
        prop = bcpc.Color()
        assert str(prop) == "Color"

class Test_RGB(object):

    def test_valid(self):
        prop = bcpc.RGB()
        assert prop.is_valid(None)
        assert prop.is_valid(RGB(10, 20, 30))

    def test_invalid(self):
        prop = bcpc.RGB()
        assert not prop.is_valid(False)
        assert not prop.is_valid(True)
        assert not prop.is_valid(0)
        assert not prop.is_valid(1)
        assert not prop.is_valid(0.0)
        assert not prop.is_valid(1.0)
        assert not prop.is_valid(1.0+1.0j)
        assert not prop.is_valid("")
        assert not prop.is_valid(())
        assert not prop.is_valid([])
        assert not prop.is_valid({})
        assert not prop.is_valid(_TestHasProps())
        assert not prop.is_valid(_TestModel())

        assert not prop.is_valid((0, 127, 255))
        assert not prop.is_valid((0, 127, 255, 1.0))
        assert not prop.is_valid((0, -127, 255))
        assert not prop.is_valid((0, 127))
        assert not prop.is_valid((0, 127, 1.0))
        assert not prop.is_valid((0, 127, 255, 255))

        assert not prop.is_valid("#00aaff")
        assert not prop.is_valid("#00AAFF")
        assert not prop.is_valid("#00AaFf")
        assert not prop.is_valid("00aaff")
        assert not prop.is_valid("00AAFF")
        assert not prop.is_valid("00AaFf")
        assert not prop.is_valid("#00AaFg")
        assert not prop.is_valid("#00AaFff")

        assert not prop.is_valid("blue")
        assert not prop.is_valid("BLUE")

        assert not prop.is_valid("foobar")

    def test_has_ref(self):
        prop = bcpc.RGB()
        assert not prop.has_ref

    def test_str(self):
        prop = bcpc.RGB()
        assert str(prop) == "RGB"

#-----------------------------------------------------------------------------
# Dev API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Private API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Code
#-----------------------------------------------------------------------------

Test___all__ = verify_all(bcpc, ALL)
