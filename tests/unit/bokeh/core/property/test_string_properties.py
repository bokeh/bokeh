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
import bokeh.core.property.string as bcpr # isort:skip

#-----------------------------------------------------------------------------
# Setup
#-----------------------------------------------------------------------------

ALL = (
    'Regex',
    'MathString',
    'Base64String',
)

#-----------------------------------------------------------------------------
# General API
#-----------------------------------------------------------------------------


class Test_Regex:
    def test_init(self) -> None:
        with pytest.raises(TypeError):
            bcpr.Regex()

    def test_valid(self) -> None:
        prop = bcpr.Regex("^x*$")

        assert prop.is_valid("")
        assert prop.is_valid("x")

    def test_invalid(self) -> None:
        prop = bcpr.Regex("^x*$")

        assert not prop.is_valid("xy")

        assert not prop.is_valid(None)
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

    def test_has_ref(self) -> None:
        prop = bcpr.Regex("")
        assert not prop.has_ref

    def test_str(self) -> None:
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
