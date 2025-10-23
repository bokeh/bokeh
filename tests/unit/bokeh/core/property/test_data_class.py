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
from dataclasses import dataclass

# Bokeh imports
from tests.support.util.api import verify_all

# Module under test
import bokeh.core.property.data_class as bcpd # isort:skip

#-----------------------------------------------------------------------------
# Setup
#-----------------------------------------------------------------------------

ALL = (
    'Dataclass',
)

@dataclass
class DataclassData:
    a: list[int]
    b: list[int]

#-----------------------------------------------------------------------------
# General API
#-----------------------------------------------------------------------------

class Test_Dataclass:
    def test_valid(self) -> None:
        prop = bcpd.Dataclass()
        dc = DataclassData([1, 2, 3], [4, 5, 6])
        assert prop.is_valid(dc)

    def test_invalid(self) -> None:
        prop = bcpd.Dataclass()
        assert not prop.is_valid(DataclassData)

#-----------------------------------------------------------------------------
# Dev API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Private API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Code
#-----------------------------------------------------------------------------

Test___all__ = verify_all(bcpd, ALL)
