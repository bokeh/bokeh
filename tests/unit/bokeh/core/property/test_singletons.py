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

import pytest

#-----------------------------------------------------------------------------
# Imports
#-----------------------------------------------------------------------------

# Standard library imports
from copy import copy, deepcopy
from pickle import dumps, loads

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

@pytest.mark.parametrize(("singleton", "singleton_type"), [
    (bcpu.Undefined, bcpu.UndefinedType),
    (bcpu._NotGiven, bcpu._NotGivenType),
])
def test_singleton(singleton: object, singleton_type: type[object]) -> None:
    assert singleton_type() is singleton
    assert copy(singleton) is singleton
    assert deepcopy(singleton) is singleton
    assert loads(dumps(singleton)) is singleton

def test_NotGiven_repr() -> None:
    assert str(bcpu._NotGiven) == "NotGiven"
    assert repr(bcpu._NotGiven) == "..."
