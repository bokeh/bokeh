#-----------------------------------------------------------------------------
# Copyright (c) Anaconda, Inc., and Bokeh Contributors.
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
    "Undefined",
)

#-----------------------------------------------------------------------------
# General API
#-----------------------------------------------------------------------------

def test_Undefined() -> None:
    assert (bcpu.Undefined == bcpu.Undefined) is True
    assert (bcpu.Undefined != bcpu.Undefined) is False
    assert (bcpu.Undefined is bcpu.Undefined) is True
    assert (bcpu.Undefined is not bcpu.Undefined) is False
    assert (copy(bcpu.Undefined) is bcpu.Undefined) is True
    assert (copy(bcpu.Undefined) is not bcpu.Undefined) is False
