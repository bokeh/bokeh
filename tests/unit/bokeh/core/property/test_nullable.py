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
from bokeh.core.properties import Instance, Int, List

from _util_property import _TestHasProps, _TestModel

# Module under test
import bokeh.core.property.nullable as bcpn # isort:skip

#-----------------------------------------------------------------------------
# Setup
#-----------------------------------------------------------------------------

ALL = (
    "NonNullable",
    "Nullable",
)

#-----------------------------------------------------------------------------
# General API
#-----------------------------------------------------------------------------

class Test_Nullable:
    def test_init(self) -> None:
        with pytest.raises(TypeError):
            bcpn.Nullable()
        with pytest.raises(ValueError):
            bcpn.Nullable(Int(help="inner help"))

        prop0 = bcpn.Nullable(Int(), help="help")
        assert prop0._help == prop0.__doc__ == "help"

    def test_valid(self) -> None:
        prop = bcpn.Nullable(List(Int))

        assert prop.is_valid(None)

        assert prop.is_valid([])
        assert prop.is_valid([1, 2, 3])

    def test_invalid(self) -> None:
        prop = bcpn.Nullable(List(Int))

        assert not prop.is_valid(-100)
        assert not prop.is_valid("yyy")
        assert not prop.is_valid([1, 2, ""])

        assert not prop.is_valid(())
        assert not prop.is_valid({})
        assert not prop.is_valid(_TestHasProps())
        assert not prop.is_valid(_TestModel())

    def test_has_ref(self) -> None:
        prop0 = bcpn.Nullable(Int)
        assert not prop0.has_ref
        prop1 = bcpn.Nullable(Instance(_TestModel))
        assert prop1.has_ref

    def test_str(self) -> None:
        prop = bcpn.Nullable(List(Int))
        assert str(prop) == "Nullable(List(Int))"

class Test_NonNullable:
    def test_init(self) -> None:
        with pytest.raises(TypeError):
            bcpn.NonNullable()

    def test_valid(self) -> None:
        prop = bcpn.NonNullable(List(Int))

        assert prop.is_valid([])
        assert prop.is_valid([1, 2, 3])

    def test_invalid(self) -> None:
        prop = bcpn.NonNullable(List(Int))

        assert not prop.is_valid(None)

        assert not prop.is_valid(-100)
        assert not prop.is_valid("yyy")
        assert not prop.is_valid([1, 2, ""])

        assert not prop.is_valid(())
        assert not prop.is_valid({})
        assert not prop.is_valid(_TestHasProps())
        assert not prop.is_valid(_TestModel())

    def test_has_ref(self) -> None:
        prop0 = bcpn.NonNullable(Int)
        assert not prop0.has_ref
        prop1 = bcpn.NonNullable(Instance(_TestModel))
        assert prop1.has_ref

    def test_str(self) -> None:
        prop = bcpn.NonNullable(List(Int))
        assert str(prop) == "NonNullable(List(Int))"

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
