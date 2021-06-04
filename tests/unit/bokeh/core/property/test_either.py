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
from bokeh.core.properties import (
    Int,
    Interval,
    List,
    Regex,
)

from _util_property import _TestHasProps, _TestModel

# Module under test
import bokeh.core.property.either as bcpe # isort:skip

#-----------------------------------------------------------------------------
# Setup
#-----------------------------------------------------------------------------

ALL = (
    'Either',
)

#-----------------------------------------------------------------------------
# General API
#-----------------------------------------------------------------------------


class Test_Either:
    def test_init(self) -> None:
        with pytest.raises(TypeError):
            bcpe.Either()

    def test_valid(self) -> None:
        prop = bcpe.Either(Interval(Int, 0, 100), Regex("^x*$"), List(Int))

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

    def test_invalid(self) -> None:
        prop = bcpe.Either(Interval(Int, 0, 100), Regex("^x*$"), List(Int))

        assert not prop.is_valid(None)

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

    def test_has_ref(self) -> None:
        prop = bcpe.Either(Int, Int)
        assert not prop.has_ref

    def test_str(self) -> None:
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
