#-----------------------------------------------------------------------------
# Copyright (c) 2012 - 2021, Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Boilerplate
#-----------------------------------------------------------------------------
import pytest ; pytest

#-----------------------------------------------------------------------------
# Imports
#-----------------------------------------------------------------------------

# External imports
from copy import copy

# Module under test
import bokeh.core.property.undefined as bcpu # isort:skip

#-----------------------------------------------------------------------------
# Setup
#-----------------------------------------------------------------------------

ALL = (
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
