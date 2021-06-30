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
import datetime

# External imports
import numpy as np

# Bokeh imports
from bokeh._testing.util.api import verify_all
from bokeh.util.serialization import convert_date_to_datetime

from _util_property import _TestHasProps, _TestModel

# Module under test
import bokeh.core.property.datetime as bcpd # isort:skip

#-----------------------------------------------------------------------------
# Setup
#-----------------------------------------------------------------------------

ALL = (
    'Date',
    'Datetime',
    'TimeDelta',
)

#-----------------------------------------------------------------------------
# General API
#-----------------------------------------------------------------------------


class Test_Date:
    def test_valid(self) -> None:
        prop = bcpd.Date()
        assert prop.is_valid(datetime.date(2020, 1,11))
        assert prop.is_valid("2020-01-10")

    def test_invalid(self) -> None:
        prop = bcpd.Date()
        assert not prop.is_valid(None)
        assert not prop.is_valid(datetime.datetime(2020, 1,11))
        assert not prop.is_valid("")
        assert not prop.is_valid("02 01 2019")
        assert not prop.is_valid(False)
        assert not prop.is_valid(True)
        assert not prop.is_valid(1.0+1.0j)
        assert not prop.is_valid(())
        assert not prop.is_valid([])
        assert not prop.is_valid({})
        assert not prop.is_valid(_TestHasProps())
        assert not prop.is_valid(_TestModel())

    def test_has_ref(self) -> None:
        prop = bcpd.Date()
        assert not prop.has_ref

    def test_str(self) -> None:
        prop = bcpd.Date()
        assert str(prop) == "Date"


class Test_Datetime:
    def test_valid(self, pd) -> None:
        prop = bcpd.Datetime()
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
        if pd:
            assert prop.is_valid(pd.Timestamp("2010-01-11"))

    def test_invalid(self) -> None:
        prop = bcpd.Datetime()
        assert not prop.is_valid(None)
        assert not prop.is_valid("")
        assert not prop.is_valid("02 01 2019")
        assert not prop.is_valid(False)
        assert not prop.is_valid(True)
        assert not prop.is_valid(1.0+1.0j)
        assert not prop.is_valid(())
        assert not prop.is_valid([])
        assert not prop.is_valid({})
        assert not prop.is_valid(_TestHasProps())
        assert not prop.is_valid(_TestModel())

    def test_is_timestamp(self) -> None:
        assert bcpd.Datetime.is_timestamp(0)
        assert bcpd.Datetime.is_timestamp(0.0)
        assert bcpd.Datetime.is_timestamp(10)
        assert bcpd.Datetime.is_timestamp(10.0)
        assert bcpd.Datetime.is_timestamp(-10)
        assert bcpd.Datetime.is_timestamp(-10)
        assert bcpd.Datetime.is_timestamp(-10.0)
        assert not bcpd.Datetime.is_timestamp(True)
        assert not bcpd.Datetime.is_timestamp(False)

    def test_transform_date(self) -> None:
        t = datetime.date(2020, 1, 11)
        prop = bcpd.Datetime()
        assert prop.transform(t) == convert_date_to_datetime(t)

    def test_transform_str(self) -> None:
        t = datetime.date(2020, 1, 11)
        prop = bcpd.Datetime()
        assert prop.transform("2020-01-11") == convert_date_to_datetime(t)

    def test_has_ref(self) -> None:
        prop = bcpd.Datetime()
        assert not prop.has_ref

    def test_str(self) -> None:
        prop = bcpd.Datetime()
        assert str(prop) == "Datetime"

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

Test___all__ = verify_all(bcpd, ALL)
