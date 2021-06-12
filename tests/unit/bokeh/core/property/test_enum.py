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
from bokeh.core.enums import LineJoin, NamedColor

from _util_property import _TestHasProps, _TestModel

# Module under test
import bokeh.core.property.enum as bcpe # isort:skip

#-----------------------------------------------------------------------------
# Setup
#-----------------------------------------------------------------------------

ALL = (
    'Enum',
)

#-----------------------------------------------------------------------------
# General API
#-----------------------------------------------------------------------------


class Test_Enum:
    def test_init(self) -> None:
        with pytest.raises(TypeError):
            bcpe.Enum()

        with pytest.raises(ValueError):
            bcpe.Enum("red", "green", 1)

        with pytest.raises(ValueError):
            bcpe.Enum("red", "green", "red")

    def test_from_values_valid(self) -> None:
        prop = bcpe.Enum("red", "green", "blue")

        assert prop.is_valid("red")
        assert prop.is_valid("green")
        assert prop.is_valid("blue")

    def test_from_values_invalid(self) -> None:
        prop = bcpe.Enum("red", "green", "blue")

        assert not prop.is_valid(None)
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

        assert not prop.is_valid("RED")
        assert not prop.is_valid("GREEN")
        assert not prop.is_valid("BLUE")

        assert not prop.is_valid(" red")
        assert not prop.is_valid(" green")
        assert not prop.is_valid(" blue")

    def test_from_enum_valid(self) -> None:
        prop = bcpe.Enum(LineJoin)

        assert prop.is_valid("miter")
        assert prop.is_valid("round")
        assert prop.is_valid("bevel")

    def test_from_enum_invalid(self) -> None:
        prop = bcpe.Enum(LineJoin)

        assert not prop.is_valid(None)
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

        assert not prop.is_valid("MITER")
        assert not prop.is_valid("ROUND")
        assert not prop.is_valid("BEVEL")

        assert not prop.is_valid(" miter")
        assert not prop.is_valid(" round")
        assert not prop.is_valid(" bevel")

    def test_case_insensitive_enum_valid(self) -> None:
        prop = bcpe.Enum(NamedColor)

        assert prop.is_valid("red")
        assert prop.is_valid("Red")
        assert prop.is_valid("RED")

    def test_has_ref(self) -> None:
        prop = bcpe.Enum("foo")
        assert not prop.has_ref

    def test_str(self) -> None:
        prop = bcpe.Enum("foo")
        assert str(prop).startswith("Enum(")

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
