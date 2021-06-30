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

# Standard library imports
from copy import copy

# Module under test
import bokeh.core.property.singletons as bcpu # isort:skip

#-----------------------------------------------------------------------------
# Setup
#-----------------------------------------------------------------------------

ALL = (
    "Intrinsic",
    "Undefined",
)

#-----------------------------------------------------------------------------
# General API
#-----------------------------------------------------------------------------

def test_Undefined() -> None:
    assert (bcpu.Undefined == bcpu.Undefined) == True
    assert (bcpu.Undefined != bcpu.Undefined) == False
    assert (bcpu.Undefined is bcpu.Undefined) == True
    assert (bcpu.Undefined is not bcpu.Undefined) == False
    assert (copy(bcpu.Undefined) is bcpu.Undefined) == True
    assert (copy(bcpu.Undefined) is not bcpu.Undefined) == False

def test_Intrinsic() -> None:
    assert (bcpu.Intrinsic == bcpu.Intrinsic) == True
    assert (bcpu.Intrinsic != bcpu.Intrinsic) == False
    assert (bcpu.Intrinsic is bcpu.Intrinsic) == True
    assert (bcpu.Intrinsic is not bcpu.Intrinsic) == False
    assert (copy(bcpu.Intrinsic) is bcpu.Intrinsic) == True
    assert (copy(bcpu.Intrinsic) is not bcpu.Intrinsic) == False
