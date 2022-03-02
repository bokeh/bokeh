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

# Standard library imports
from typing import List

# Module under test
import bokeh.util.dataclasses as dc # isort:skip

#-----------------------------------------------------------------------------
# General API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Dev API
#-----------------------------------------------------------------------------

@dc.dataclass
class X:
    f0: int
    f1: List[int]
    f2: X | None = None
    f3: dc.NotRequired[bool | None] = dc.Unspecified

def test_entries() -> None:
    x0 = X(0, [1, 2, 3])
    assert dict(dc.entries(x0)) == dict(f0=0, f1=[1, 2, 3], f2=None)

    x1 = X(0, [1, 2, 3], f3=None)
    assert dict(dc.entries(x1)) == dict(f0=0, f1=[1, 2, 3], f2=None, f3=None)

    with pytest.raises(TypeError):
        list(dc.entries(object()))

def test_is_dataclass() -> None:
    x0 = X(f0 = 0, f1 = [1, 2, 3])

    assert dc.is_dataclass(x0) is True
    assert dc.is_dataclass(type(x0)) is False
    assert dc.is_dataclass(object()) is False

#-----------------------------------------------------------------------------
# Private API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Code
#-----------------------------------------------------------------------------
