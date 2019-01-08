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
from bokeh._testing.util.api import verify_all

# Module under test
import bokeh.core.property.regex as bcpr

#-----------------------------------------------------------------------------
# Setup
#-----------------------------------------------------------------------------

ALL = (
    'Regex',
)

#-----------------------------------------------------------------------------
# General API
#-----------------------------------------------------------------------------

class Test_Regex(object):

    def test_init(self):
        with pytest.raises(TypeError):
            bcpr.Regex()

    def test_valid(self):
        prop = bcpr.Regex("^x*$")

        assert prop.is_valid(None)

        assert prop.is_valid("")
        assert prop.is_valid("x")

    def test_invalid(self):
        prop = bcpr.Regex("^x*$")

        assert not prop.is_valid("xy")

        assert not prop.is_valid(False)
        assert not prop.is_valid(True)
        assert not prop.is_valid(0)
        assert not prop.is_valid(1)
        assert not prop.is_valid(0.0)
        assert not prop.is_valid(1.0)
        assert not prop.is_valid(1.0+1.0j)

        assert not prop.is_valid(())
        assert not prop.is_valid([])
        assert not prop.is_valid({})
        assert not prop.is_valid(_TestHasProps())
        assert not prop.is_valid(_TestModel())

    def test_has_ref(self):
        prop = bcpr.Regex("")
        assert not prop.has_ref

    def test_str(self):
        prop = bcpr.Regex("")
        assert str(prop).startswith("Regex(")

#-----------------------------------------------------------------------------
# Dev API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Private API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Code
#-----------------------------------------------------------------------------

Test___all__ = verify_all(bcpr, ALL)
