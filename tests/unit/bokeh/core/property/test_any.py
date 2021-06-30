#-----------------------------------------------------------------------------
# Copyright (c) 2012 - 2021, Anaconda, Inc., and Bokeh Contributors.
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
from bokeh._testing.util.api import verify_all

from _util_property import _TestHasProps, _TestModel

# Module under test
import bokeh.core.property.any as bcpa # isort:skip

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


class Test_Any:
    def test_valid(self) -> None:
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

    def test_invalid(self) -> None:
        pass

    def test_has_ref(self) -> None:
        prop = bcpa.Any()
        assert not prop.has_ref


class Test_AnyRef:
    def test_valid(self) -> None:
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

    def test_invalid(self) -> None:
        pass

    def test_has_ref(self) -> None:
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
