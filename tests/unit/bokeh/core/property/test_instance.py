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

from _util_property import _TestHasProps, _TestModel, _TestModel2

# Module under test
import bokeh.core.property.instance as bcpi # isort:skip

#-----------------------------------------------------------------------------
# Setup
#-----------------------------------------------------------------------------

ALL = (
    'Instance',
)

#-----------------------------------------------------------------------------
# General API
#-----------------------------------------------------------------------------


class Test_Instance:
    def test_init(self) -> None:
        with pytest.raises(TypeError):
            bcpi.Instance()

    def test_serialized(self) -> None:
        prop = bcpi.Instance(_TestModel)
        assert prop.serialized == True

    def test_readonly(self) -> None:
        prop = bcpi.Instance(_TestModel)
        assert prop.readonly == False

    def test_valid(self) -> None:
        prop = bcpi.Instance(_TestModel)
        assert prop.is_valid(_TestModel())

    def test_invalid(self) -> None:
        prop = bcpi.Instance(_TestModel)
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
        assert not prop.is_valid(_TestModel2())
        assert not prop.is_valid(_TestHasProps())

    def test_has_ref(self) -> None:
        prop = bcpi.Instance(_TestModel)
        assert prop.has_ref

    def test_str(self) -> None:
        prop = bcpi.Instance(_TestModel)
        assert str(prop) == "Instance(_TestModel)"

#-----------------------------------------------------------------------------
# Dev API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Private API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Code
#-----------------------------------------------------------------------------

Test___all__ = verify_all(bcpi, ALL)
