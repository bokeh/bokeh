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
import datetime

# External imports
import numpy as np
import pytz

# Bokeh imports
from bokeh._testing.util.env import envset

# Module under test
import bokeh.util.serialization as bus # isort:skip

#-----------------------------------------------------------------------------
# Setup
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# General API
#-----------------------------------------------------------------------------


class Test_make_id:
    def test_default(self) -> None:
        bus._simple_id = 999
        assert bus.make_id() == "1000"
        assert bus.make_id() == "1001"
        assert bus.make_id() == "1002"

    def test_simple_ids_yes(self) -> None:
        bus._simple_id = 999
        with envset(BOKEH_SIMPLE_IDS="yes"):
            assert bus.make_id() == "1000"
            assert bus.make_id() == "1001"
            assert bus.make_id() == "1002"

    def test_simple_ids_no(self) -> None:
        with envset(BOKEH_SIMPLE_IDS="no"):
            assert len(bus.make_id()) == 36
            assert isinstance(bus.make_id(), str)

class Test_make_globally_unique_id:
    def test_basic(self) -> None:
        assert len(bus.make_globally_unique_id()) == 36
        assert isinstance(bus.make_globally_unique_id(), str)

def test_np_consts() -> None:
    assert bus.NP_EPOCH == np.datetime64(0, 'ms')
    assert bus.NP_MS_DELTA == np.timedelta64(1, 'ms')

def test_binary_array_types() -> None:
    assert len(bus.BINARY_ARRAY_TYPES) == 9
    dtypes = [
        np.dtype(np.bool_),
        np.dtype(np.uint8),
        np.dtype(np.int8),
        np.dtype(np.uint16),
        np.dtype(np.int16),
        np.dtype(np.uint32),
        np.dtype(np.int32),
        #np.dtype(np.uint64),
        #np.dtype(np.int64),
        np.dtype(np.float32),
        np.dtype(np.float64),
    ]
    for dtype in dtypes:
        assert dtype in bus.BINARY_ARRAY_TYPES

def test_datetime_types(pd) -> None:
    if pd is None:
        assert len(bus.DATETIME_TYPES) == 3
    else:
        assert len(bus.DATETIME_TYPES) == 7

def test_is_timedelta_type_non_pandas_types() -> None:
    assert bus.is_timedelta_type(datetime.timedelta(3000))
    assert bus.is_timedelta_type(np.timedelta64(3000, 'ms'))

def test_is_timedelta_type_pandas_types(pd) -> None:
    assert bus.is_timedelta_type(pd.Timedelta("3000ms"))

def test_convert_timedelta_type_non_pandas_types() -> None:
    assert bus.convert_timedelta_type(datetime.timedelta(3000)) == 259200000000.0
    assert bus.convert_timedelta_type(np.timedelta64(3000, 'ms')) == 3000.

def test_convert_timedelta_type_pandas_types(pd) -> None:
    assert bus.convert_timedelta_type(pd.Timedelta("3000ms")) == 3000.0

def test_is_datetime_type_non_pandas_types() -> None:
    assert bus.is_datetime_type(datetime.datetime(2016, 5, 11))
    assert bus.is_datetime_type(datetime.time(3, 54))
    assert bus.is_datetime_type(np.datetime64("2011-05-11"))

def test_is_datetime_type_pandas_types(pd) -> None:
    assert bus.is_datetime_type(pd.Timestamp(3000000))
    assert bus.is_datetime_type(pd.Period('1900', 'A-DEC'))
    assert bus.is_datetime_type(pd.NaT)

def test_convert_datetime_type_non_pandas_types() -> None:
    assert bus.convert_datetime_type(datetime.datetime(2018, 1, 3, 15, 37, 59, 922452)) == 1514993879922.452
    assert bus.convert_datetime_type(datetime.datetime(2018, 1, 3, 15, 37, 59)) == 1514993879000.0
    assert bus.convert_datetime_type(datetime.datetime(2016, 5, 11)) == 1462924800000.0
    assert bus.convert_datetime_type(datetime.time(3, 54)) == 14040000.0
    assert bus.convert_datetime_type(datetime.date(2016, 5, 11)) == 1462924800000.0
    assert bus.convert_datetime_type(np.datetime64("2016-05-11")) == 1462924800000.0

def test_convert_datetime_type_pandas_types(pd) -> None:
    assert bus.convert_datetime_type(pd.Timestamp(3000000)) == 3.0
    assert bus.convert_datetime_type(pd.Period('1900', 'A-DEC')) == -2208988800000.0
    assert bus.convert_datetime_type(pd.Period('1900', 'A-DEC')) == bus.convert_datetime_type(np.datetime64("1900-01-01"))
    assert np.isnan(bus.convert_datetime_type(pd.NaT))

@pytest.mark.parametrize('obj', [[1,2], (1,2), dict(), set(), 10.2, "foo"])
def test_convert_datetime_type_array_ignores_non_array(obj) -> None:
    assert bus.convert_datetime_array(obj) is obj

def test_convert_datetime_type_array_ignores_non_datetime_array() -> None:
    a = np.arange(0,10,100)
    assert bus.convert_datetime_array(a) is a

def test_convert_datetime_type_array() -> None:
    a = np.array(['2018-01-03T15:37:59', '2018-01-03T15:37:59.922452', '2016-05-11'], dtype='datetime64')
    r = bus.convert_datetime_array(a)
    assert r[0] == 1514993879000.0
    assert r[1] == 1514993879922.452
    assert r[2] == 1462924800000.0
    assert r.dtype == 'float64'

def test_convert_datetime_type_with_tz() -> None:
    # This ensures datetimes are sent to BokehJS timezone-naive
    # see https://github.com/bokeh/bokeh/issues/6480
    for tz in pytz.all_timezones:
        assert bus.convert_datetime_type(datetime.datetime(2016, 5, 11, tzinfo=datetime.tzinfo(tz))) == 1462924800000.0

testing = [[float('nan'), 3], [float('-inf'), [float('inf')]]]
expected = [['NaN', 3.0], ['-Infinity', ['Infinity']]]

@pytest.mark.parametrize('dt', bus.BINARY_ARRAY_TYPES)
def test_transform_array(dt) -> None:
    a = np.empty(shape=10, dtype=dt)
    out = bus.transform_array(a)
    assert isinstance(out, np.ndarray)

def test_transform_series(pd) -> None:
    # default int seems to be int64, can't be encoded!
    df = pd.Series([1, 3, 5, 6, 8])
    out = bus.transform_series(df)
    assert isinstance(out, np.ndarray)

    df = pd.Series([1, 3, 5, 6, 8], dtype=np.int32)
    out = bus.transform_series(df)
    assert isinstance(out, np.ndarray)

    df = pd.Series([1.0, 3, 5, 6, 8])
    out = bus.transform_series(df)
    assert isinstance(out, np.ndarray)

    df = pd.Series(np.array([np.nan, np.inf, -np.inf, 0]))
    out = bus.transform_series(df)
    assert isinstance(out, np.ndarray)

def test_array_encoding_disabled_by_dtype() -> None:

    assert len(bus.BINARY_ARRAY_TYPES) > 0

    dt_ok = bus.BINARY_ARRAY_TYPES
    dt_bad = {np.dtype(x) for x in set(np.sctypeDict.values()) - {np.void}} - dt_ok

    for dt in dt_ok:
        a = np.empty(shape=10, dtype=dt)
        assert not bus.array_encoding_disabled(a)

    for dt in dt_bad:
        a = np.empty(shape=10, dtype=dt)
        assert bus.array_encoding_disabled(a)

#-----------------------------------------------------------------------------
# Dev API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Private API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Code
#-----------------------------------------------------------------------------
