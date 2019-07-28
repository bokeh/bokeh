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
from . import _TestHasProps, _TestModel
from bokeh.core.properties import Float, Int
from bokeh._testing.util.api import verify_all

# Module under test
import bokeh.core.property.numeric as bcpn

#-----------------------------------------------------------------------------
# Setup
#-----------------------------------------------------------------------------

ALL = (
    'Angle',
    'Byte',
    'Interval',
    'NonNegativeInt',
    'Percent',
    'PositiveInt',
    'Size',
)

#-----------------------------------------------------------------------------
# General API
#-----------------------------------------------------------------------------

class Test_Angle(object):

    def test_valid(self):
        prop = bcpn.Angle()

        assert prop.is_valid(None)

        # TODO (bev) should fail
        assert prop.is_valid(False)
        assert prop.is_valid(True)

        assert prop.is_valid(0)
        assert prop.is_valid(1)
        assert prop.is_valid(0.0)
        assert prop.is_valid(1.0)

    def test_invalid(self):
        prop = bcpn.Angle()

        assert not prop.is_valid(1.0+1.0j)
        assert not prop.is_valid("")
        assert not prop.is_valid(())
        assert not prop.is_valid([])
        assert not prop.is_valid({})
        assert not prop.is_valid(_TestHasProps())
        assert not prop.is_valid(_TestModel())

    def test_has_ref(self):
        prop = bcpn.Angle()
        assert not prop.has_ref

    def test_str(self):
        prop = bcpn.Angle()
        assert str(prop) == "Angle"

class Test_Interval(object):

    def test_init(self):
        with pytest.raises(TypeError):
            bcpn.Interval()

        with pytest.raises(ValueError):
            bcpn.Interval(Int, 0.0, 1.0)

    def test_valid_int(self):
        prop = bcpn.Interval(Int, 0, 255)

        assert prop.is_valid(None)

        # TODO (bev) should fail
        assert prop.is_valid(False)
        assert prop.is_valid(True)

        assert prop.is_valid(0)
        assert prop.is_valid(1)
        assert prop.is_valid(127)

    def test_invalid_int(self):
        prop = bcpn.Interval(Int, 0, 255)

        assert not prop.is_valid(0.0)
        assert not prop.is_valid(1.0)
        assert not prop.is_valid(1.0+1.0j)
        assert not prop.is_valid("")
        assert not prop.is_valid(())
        assert not prop.is_valid([])
        assert not prop.is_valid({})
        assert not prop.is_valid(_TestHasProps())
        assert not prop.is_valid(_TestModel())

        assert not prop.is_valid(-1)
        assert not prop.is_valid(256)

    def test_valid_float(self):
        prop = bcpn.Interval(Float, 0.0, 1.0)

        assert prop.is_valid(None)

        # TODO (bev) should fail
        assert prop.is_valid(False)
        assert prop.is_valid(True)

        assert prop.is_valid(0)
        assert prop.is_valid(1)
        assert prop.is_valid(0.0)
        assert prop.is_valid(1.0)
        assert prop.is_valid(0.5)

    def test_invalid_float(self):
        prop = bcpn.Interval(Float, 0.0, 1.0)

        assert not prop.is_valid(1.0+1.0j)
        assert not prop.is_valid("")
        assert not prop.is_valid(())
        assert not prop.is_valid([])
        assert not prop.is_valid({})
        assert not prop.is_valid(_TestHasProps())
        assert not prop.is_valid(_TestModel())

        assert not prop.is_valid(-0.001)
        assert not prop.is_valid( 1.001)

    def test_has_ref(self):
        prop = bcpn.Interval(Float, 0.0, 1.0)
        assert not prop.has_ref

    def test_str(self):
        prop = bcpn.Interval(Float, 0.0, 1.0)
        assert str(prop) == "Interval(Float, 0.0, 1.0)"

class Test_Size(object):

    def test_valid(self):
        prop = bcpn.Size()

        assert prop.is_valid(None)

        # TODO (bev) should fail
        assert prop.is_valid(False)
        assert prop.is_valid(True)

        assert prop.is_valid(0)
        assert prop.is_valid(1)
        assert prop.is_valid(0.0)
        assert prop.is_valid(1.0)
        assert prop.is_valid(100)
        assert prop.is_valid(100.1)

    def test_invalid(self):
        prop = bcpn.Size()

        assert not prop.is_valid(1.0+1.0j)
        assert not prop.is_valid("")
        assert not prop.is_valid(())
        assert not prop.is_valid([])
        assert not prop.is_valid({})
        assert not prop.is_valid(_TestHasProps())
        assert not prop.is_valid(_TestModel())

        assert not prop.is_valid(-100)
        assert not prop.is_valid(-0.001)

    def test_has_ref(self):
        prop = bcpn.Size()
        assert not prop.has_ref

    def test_str(self):
        prop = bcpn.Size()
        assert str(prop) == "Size"

class Test_Percent(object):

    def test_valid(self):
        prop = bcpn.Percent()

        assert prop.is_valid(None)

        # TODO (bev) should fail
        assert prop.is_valid(False)
        assert prop.is_valid(True)

        assert prop.is_valid(0)
        assert prop.is_valid(1)
        assert prop.is_valid(0.0)
        assert prop.is_valid(1.0)
        assert prop.is_valid(0.5)

    def test_invalid(self):
        prop = bcpn.Percent()

        assert not prop.is_valid(1.0+1.0j)
        assert not prop.is_valid("")
        assert not prop.is_valid(())
        assert not prop.is_valid([])
        assert not prop.is_valid({})
        assert not prop.is_valid(_TestHasProps())
        assert not prop.is_valid(_TestModel())

        assert not prop.is_valid(-0.001)
        assert not prop.is_valid( 1.001)

    def test_has_ref(self):
        prop = bcpn.Percent()
        assert not prop.has_ref

    def test_str(self):
        prop = bcpn.Percent()
        assert str(prop) == "Percent"

class Test_NonNegativeInt(object):

    def test_valid(self):
        prop = bcpn.NonNegativeInt()

        assert prop.is_valid(None)

        # TODO (bev) should fail
        assert prop.is_valid(False)
        assert prop.is_valid(True)

        assert prop.is_valid(0)
        assert prop.is_valid(1)
        assert prop.is_valid(2)
        assert prop.is_valid(100)

    def test_invalid(self):
        prop = bcpn.NonNegativeInt()

        assert not prop.is_valid(-1)
        assert not prop.is_valid(0.0)
        assert not prop.is_valid(1.0)
        assert not prop.is_valid(1.0+1.0j)
        assert not prop.is_valid("")
        assert not prop.is_valid(())
        assert not prop.is_valid([])
        assert not prop.is_valid({})
        assert not prop.is_valid(_TestHasProps())
        assert not prop.is_valid(_TestModel())

        assert not prop.is_valid(-100)
        assert not prop.is_valid(-0.001)

    def test_has_ref(self):
        prop = bcpn.NonNegativeInt()
        assert not prop.has_ref

    def test_str(self):
        prop = bcpn.NonNegativeInt()
        assert str(prop) == "NonNegativeInt"

class Test_PositiveInt(object):

    def test_valid(self):
        prop = bcpn.PositiveInt()

        assert prop.is_valid(None)

        # TODO (bev) should fail
        assert prop.is_valid(True)

        assert prop.is_valid(1)
        assert prop.is_valid(2)
        assert prop.is_valid(100)

    def test_invalid(self):
        prop = bcpn.PositiveInt()

        assert not prop.is_valid(False)

        assert not prop.is_valid(-1)
        assert not prop.is_valid(0)
        assert not prop.is_valid(0.0)
        assert not prop.is_valid(1.0)
        assert not prop.is_valid(1.0+1.0j)
        assert not prop.is_valid("")
        assert not prop.is_valid(())
        assert not prop.is_valid([])
        assert not prop.is_valid({})
        assert not prop.is_valid(_TestHasProps())
        assert not prop.is_valid(_TestModel())

        assert not prop.is_valid(-100)
        assert not prop.is_valid(-0.001)

    def test_has_ref(self):
        prop = bcpn.PositiveInt()
        assert not prop.has_ref

    def test_str(self):
        prop = bcpn.PositiveInt()
        assert str(prop) == "PositiveInt"

#-----------------------------------------------------------------------------
# Dev API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Private API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Code
#-----------------------------------------------------------------------------

Test___all__ = verify_all(bcpn, ALL)
