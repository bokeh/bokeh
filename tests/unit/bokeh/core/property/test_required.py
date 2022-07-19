#-----------------------------------------------------------------------------
# Copyright (c) 2012 - 2022, Anaconda, Inc., and Bokeh Contributors.
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
import bokeh.core.property.required as bcpr # isort:skip

#-----------------------------------------------------------------------------
# Setup
#-----------------------------------------------------------------------------

ALL = (
    "Required",
)

#-----------------------------------------------------------------------------
# General API
#-----------------------------------------------------------------------------

class Test_Required:
    def test_init(self) -> None:
        with pytest.raises(TypeError):
            bcpr.Required()

    def test_valid(self) -> None:
        prop = bcpr.Required(List(Int))

        assert prop.is_valid([])
        assert prop.is_valid([1, 2, 3])

    def test_invalid(self) -> None:
        prop = bcpr.Required(List(Int))

        assert not prop.is_valid(None)

        assert not prop.is_valid(-100)
        assert not prop.is_valid("yyy")
        assert not prop.is_valid([1, 2, ""])

        assert not prop.is_valid(())
        assert not prop.is_valid({})
        assert not prop.is_valid(_TestHasProps())
        assert not prop.is_valid(_TestModel())

    def test_has_ref(self) -> None:
        prop0 = bcpr.Required(Int)
        assert not prop0.has_ref
        prop1 = bcpr.Required(Instance(_TestModel))
        assert prop1.has_ref

    def test_str(self) -> None:
        prop = bcpr.Required(List(Int))
        assert str(prop) == "Required(List(Int))"

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
