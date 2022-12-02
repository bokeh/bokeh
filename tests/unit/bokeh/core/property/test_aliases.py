#-----------------------------------------------------------------------------
# Copyright (c) 2012 - 2023, Anaconda, Inc., and Bokeh Contributors.
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
import datetime

# External imports
import numpy as np
import pandas as pd

# Bokeh imports
from tests.support.util.api import verify_all

from _util_property import _TestHasProps, _TestModel

# Module under test
import bokeh.core.property.aliases as bcpc # isort:skip

#-----------------------------------------------------------------------------
# Setup
#-----------------------------------------------------------------------------

ALL = (
    "CoordinateLike",
)

#-----------------------------------------------------------------------------
# General API
#-----------------------------------------------------------------------------


class Test_CoordinateLike:
    def test_valid(self) -> None:
        prop = bcpc.CoordinateLike()
        assert prop.is_valid(-1.0)
        assert prop.is_valid(-1)
        assert prop.is_valid(0)
        assert prop.is_valid(1)
        assert prop.is_valid(0.0)
        assert prop.is_valid(1.0)
        assert prop.is_valid("2020-01-11T13:00:00")
        assert prop.is_valid("2020-01-11")
        assert prop.is_valid(datetime.datetime.now())
        assert prop.is_valid(datetime.time(10,12))
        assert prop.is_valid(np.datetime64("2020-01-11"))
        assert prop.is_valid(pd.Timestamp("2010-01-11"))
        assert prop.is_valid("")
        assert prop.is_valid(("", ""))
        assert prop.is_valid(("", "", ""))
        assert prop.is_valid(False)
        assert prop.is_valid(True)

    def test_invalid(self) -> None:
        prop = bcpc.CoordinateLike()
        assert not prop.is_valid(None)
        assert not prop.is_valid(1.0+1.0j)
        assert not prop.is_valid(())
        assert not prop.is_valid([])
        assert not prop.is_valid({})
        assert not prop.is_valid(_TestHasProps())
        assert not prop.is_valid(_TestModel())

# TODO (bev) class Test_TimeDelta(object)

#-----------------------------------------------------------------------------
# Dev API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Private API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Code
#-----------------------------------------------------------------------------

Test___all__ = verify_all(bcpc, ALL)
