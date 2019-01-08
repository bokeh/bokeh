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
from bokeh.core.properties import Int, Interval, List, Regex
from bokeh._testing.util.api import verify_all

# Module under test
import bokeh.core.property.either as bcpe

#-----------------------------------------------------------------------------
# Setup
#-----------------------------------------------------------------------------

ALL = (
    'Either',
)

#-----------------------------------------------------------------------------
# General API
#-----------------------------------------------------------------------------

class Test_Either(object):

    def test_init(self):
        with pytest.raises(TypeError):
            bcpe.Either()

    def test_valid(self):
        prop = bcpe.Either(Interval(Int, 0, 100), Regex("^x*$"), List(Int))

        assert prop.is_valid(None)

        assert prop.is_valid(0)
        assert prop.is_valid(1)

        assert prop.is_valid("")
        assert prop.is_valid("xxx")
        assert prop.is_valid([])
        assert prop.is_valid([1, 2, 3])
        assert prop.is_valid(100)

        # TODO (bev) should fail
        assert prop.is_valid(False)
        assert prop.is_valid(True)

    def test_invalid(self):
        prop = bcpe.Either(Interval(Int, 0, 100), Regex("^x*$"), List(Int))

        assert not prop.is_valid(0.0)
        assert not prop.is_valid(1.0)
        assert not prop.is_valid(1.0+1.0j)

        assert not prop.is_valid(())
        assert not prop.is_valid({})
        assert not prop.is_valid(_TestHasProps())
        assert not prop.is_valid(_TestModel())

        assert not prop.is_valid(-100)

        assert not prop.is_valid("yyy")

        assert not prop.is_valid([1, 2, ""])

    def test_has_ref(self):
        prop = bcpe.Either(Int, Int)
        assert not prop.has_ref

    def test_str(self):
        prop = bcpe.Either(Int, Int)
        assert str(prop) == "Either(Int, Int)"

#-----------------------------------------------------------------------------
# Dev API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Private API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Code
#-----------------------------------------------------------------------------

Test___all__ = verify_all(bcpe, ALL)
