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
from bokeh._testing.util.api import verify_all

# Module under test
import bokeh.core.property.any as bcpa

#-----------------------------------------------------------------------------
# Setup
#-----------------------------------------------------------------------------

ALL = (
    'Any',
    'AnyRef'
)

#-----------------------------------------------------------------------------
# General API
#-----------------------------------------------------------------------------

class Test_Any(object):

    def test_valid(self):
        prop = bcpa.Any()
        assert prop.is_valid(None)
        assert prop.is_valid(False)
        assert prop.is_valid(True)
        assert prop.is_valid(0)
        assert prop.is_valid(1)
        assert prop.is_valid(0.0)
        assert prop.is_valid(1.0)
        assert prop.is_valid(1.0+1.0j)
        assert prop.is_valid("")
        assert prop.is_valid(())
        assert prop.is_valid([])
        assert prop.is_valid({})
        assert prop.is_valid(_TestHasProps())
        assert prop.is_valid(_TestModel())

    def test_invalid(self):
        pass

    def test_has_ref(self):
        prop = bcpa.Any()
        assert not prop.has_ref

class Test_AnyRef(object):

    def test_valid(self):
        prop = bcpa.AnyRef()
        assert prop.is_valid(None)
        assert prop.is_valid(False)
        assert prop.is_valid(True)
        assert prop.is_valid(0)
        assert prop.is_valid(1)
        assert prop.is_valid(0.0)
        assert prop.is_valid(1.0)
        assert prop.is_valid(1.0+1.0j)
        assert prop.is_valid("")
        assert prop.is_valid(())
        assert prop.is_valid([])
        assert prop.is_valid({})
        assert prop.is_valid(_TestHasProps())
        assert prop.is_valid(_TestModel())

    def test_invalid(self):
        pass

    def test_has_ref(self):
        prop = bcpa.AnyRef()
        assert prop.has_ref

#-----------------------------------------------------------------------------
# Dev API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Private API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Code
#-----------------------------------------------------------------------------

Test___all__ = verify_all(bcpa, ALL)
