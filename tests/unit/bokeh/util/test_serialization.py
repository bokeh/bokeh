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
import base64
import datetime
import os

# External imports
import numpy as np
import pytz

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
        os.environ["BOKEH_SIMPLE_IDS"] = "yes"
        assert bus.make_id() == "1000"
        assert bus.make_id() == "1001"
        assert bus.make_id() == "1002"

    def test_simple_ids_no(self) -> None:
        os.environ["BOKEH_SIMPLE_IDS"] = "no"
        assert len(bus.make_id()) == 36
        assert isinstance(bus.make_id(), str)
        del os.environ["BOKEH_SIMPLE_IDS"]

class Test_make_globally_unique_id:
    def test_basic(self) -> None:
        assert len(bus.make_globally_unique_id()) == 36
        assert isinstance(bus.make_globally_unique_id(), str)

def test_np_consts() -> None:
    assert bus.NP_EPOCH == np.datetime64(0, 'ms')
    assert bus.NP_MS_DELTA == np.timedelta64(1, 'ms')

def test_binary_array_types() -> None:
    assert len(bus.BINARY_ARRAY_TYPES) == 8
    for typ in [np.dtype(np.float32),
                np.dtype(np.float64),
                np.dtype(np.uint8),
                np.dtype(np.int8),
                np.dtype(np.uint16),
                np.dtype(np.int16),
                np.dtype(np.uint32),
                np.dtype(np.int32)]:
        assert typ in bus.BINARY_ARRAY_TYPES

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
    assert bus.is_datetime_type(bus._pd_timestamp(3000000))
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
    assert bus.convert_datetime_type(bus._pd_timestamp(3000000)) == 3.0
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

def test_traverse_data() -> None:
    assert bus.traverse_data(testing) == expected

@pytest.mark.parametrize('dt', bus.BINARY_ARRAY_TYPES)
def test_transform_array_force_list_default(dt) -> None:
    a = np.empty(shape=10, dtype=dt)
    out = bus.transform_array(a)
    assert isinstance(out, dict)

@pytest.mark.parametrize('dt', bus.BINARY_ARRAY_TYPES)
def test_transform_array_force_list_default_with_buffers(dt) -> None:
    a = np.empty(shape=10, dtype=dt)
    bufs = []
    out = bus.transform_array(a, buffers=bufs)
    assert isinstance(out, dict)
    assert len(bufs) == 1
    assert len(bufs[0]) == 2
    assert bufs[0][1] == a.tobytes()
    assert 'shape' in out
    assert out['shape'] == a.shape
    assert 'dtype' in out
    assert out['dtype'] == a.dtype.name
    assert '__buffer__' in out

@pytest.mark.parametrize('dt', bus.BINARY_ARRAY_TYPES)
def test_transform_array_force_list_true(dt) -> None:
    a = np.empty(shape=10, dtype=dt)
    out = bus.transform_array(a, force_list=True)
    assert isinstance(out, list)

def test_transform_series_force_list_default(pd) -> None:
    # default int seems to be int64, can't be encoded!
    df = pd.Series([1, 3, 5, 6, 8])
    out = bus.transform_series(df)
    assert isinstance(out, list)
    assert out == [1, 3, 5, 6, 8]

    df = pd.Series([1, 3, 5, 6, 8], dtype=np.int32)
    out = bus.transform_series(df)
    assert isinstance(out, dict)

    df = pd.Series([1.0, 3, 5, 6, 8])
    out = bus.transform_series(df)
    assert isinstance(out, dict)

    df = pd.Series(np.array([np.nan, np.inf, -np.inf, 0]))
    out = bus.transform_series(df)
    assert isinstance(out, dict)

def test_transform_series_force_list_default_with_buffers(pd) -> None:
    # default int seems to be int64, can't be converted to buffer!
    df = pd.Series([1, 3, 5, 6, 8])
    out = bus.transform_series(df)
    assert isinstance(out, list)
    assert out == [1, 3, 5, 6, 8]

    df = pd.Series([1, 3, 5, 6, 8], dtype=np.int32)
    bufs = []
    out = bus.transform_series(df, buffers=bufs)
    assert isinstance(out, dict)
    assert len(bufs) == 1
    assert len(bufs[0]) == 2
    assert isinstance(bufs[0][0], dict)
    assert list(bufs[0][0]) == ["id"]
    assert bufs[0][1] == np.array(df).tobytes()
    assert 'shape' in out
    assert out['shape'] == df.shape
    assert 'dtype' in out
    assert out['dtype'] == df.dtype.name
    assert '__buffer__' in out

    df = pd.Series([1.0, 3, 5, 6, 8])
    bufs = []
    out = bus.transform_series(df, buffers=bufs)
    assert isinstance(out, dict)
    assert len(bufs) == 1
    assert len(bufs[0]) == 2
    assert isinstance(bufs[0][0], dict)
    assert list(bufs[0][0]) == ["id"]
    assert bufs[0][1] == np.array(df).tobytes()
    assert 'shape' in out
    assert out['shape'] == df.shape
    assert 'dtype' in out
    assert out['dtype'] == df.dtype.name
    assert '__buffer__' in out

    df = pd.Series(np.array([np.nan, np.inf, -np.inf, 0]))
    bufs = []
    out = bus.transform_series(df, buffers=bufs)
    assert isinstance(out, dict)
    assert len(bufs) == 1
    assert len(bufs[0]) == 2
    assert isinstance(bufs[0][0], dict)
    assert list(bufs[0][0]) == ["id"]
    assert bufs[0][1] == np.array(df).tobytes()
    assert 'shape' in out
    assert out['shape'] == df.shape
    assert 'dtype' in out
    assert out['dtype'] == df.dtype.name
    assert '__buffer__' in out

    # PeriodIndex
    df = pd.period_range('1900-01-01','2000-01-01', freq='A')
    bufs = []
    out = bus.transform_series(df, buffers=bufs)
    assert isinstance(out, dict)
    assert len(bufs) == 1
    assert len(bufs[0]) == 2
    assert isinstance(bufs[0][0], dict)
    assert list(bufs[0][0]) == ["id"]
    assert bufs[0][1] == bus.convert_datetime_array(df.to_timestamp().values).tobytes()
    assert 'shape' in out
    assert out['shape'] == df.shape
    assert 'dtype' in out
    assert out['dtype'] == 'float64'
    assert '__buffer__' in out

    # DatetimeIndex
    df = pd.period_range('1900-01-01','2000-01-01', freq='A').to_timestamp()
    bufs = []
    out = bus.transform_series(df, buffers=bufs)
    assert isinstance(out, dict)
    assert len(bufs) == 1
    assert len(bufs[0]) == 2
    assert isinstance(bufs[0][0], dict)
    assert list(bufs[0][0]) == ["id"]
    assert bufs[0][1] == bus.convert_datetime_array(df.values).tobytes()
    assert 'shape' in out
    assert out['shape'] == df.shape
    assert 'dtype' in out
    assert out['dtype'] == 'float64'
    assert '__buffer__' in out

    # TimeDeltaIndex
    df = pd.to_timedelta(np.arange(5), unit='s')
    bufs = []
    out = bus.transform_series(df, buffers=bufs)
    assert isinstance(out, dict)
    assert len(bufs) == 1
    assert len(bufs[0]) == 2
    assert isinstance(bufs[0][0], dict)
    assert list(bufs[0][0]) == ["id"]
    assert bufs[0][1] == bus.convert_datetime_array(df.values).tobytes()
    assert 'shape' in out
    assert out['shape'] == df.shape
    assert 'dtype' in out
    assert out['dtype'] == 'float64'
    assert '__buffer__' in out


def test_transform_series_force_list_true(pd) -> None:
    df = pd.Series([1, 3, 5, 6, 8])
    out = bus.transform_series(df, force_list=True)
    assert isinstance(out, list)

    df = pd.Series([1, 3, 5, 6, 8], dtype=np.int32)
    out = bus.transform_series(df, force_list=True)
    assert isinstance(out, list)

    df = pd.Series([1.0, 3, 5, 6, 8])
    out = bus.transform_series(df, force_list=True)
    assert isinstance(out, list)

    df = pd.Series(np.array([np.nan, np.inf, -np.inf, 0]))
    out = bus.transform_series(df, force_list=True)
    assert isinstance(out, list)

@pytest.mark.parametrize('dt', bus.BINARY_ARRAY_TYPES)
def test_transform_array_to_list(dt) -> None:
    a = np.empty(shape=10, dtype=dt)
    out = bus.transform_array_to_list(a)
    assert isinstance(out, list)

@pytest.mark.parametrize('values', [(['cat', 'dog']), ([1.2, 'apple'])])
def test_transform_array_with_nans_to_list(pd, values) -> None:
    s = pd.Series([np.nan, values[0], values[1]])
    out = bus.transform_array_to_list(s)
    assert isinstance(out, list)
    assert out == ['NaN', values[0], values[1]]

def test_array_encoding_disabled_by_dtype() -> None:

    assert len(bus.BINARY_ARRAY_TYPES) > 0

    dt_ok = bus.BINARY_ARRAY_TYPES
    dt_bad = {np.dtype(x) for x in set(np.typeDict.values()) - {np.void}} - dt_ok

    for dt in dt_ok:
        a = np.empty(shape=10, dtype=dt)
        assert not bus.array_encoding_disabled(a)

    for dt in dt_bad:
        a = np.empty(shape=10, dtype=dt)
        assert bus.array_encoding_disabled(a)

@pytest.mark.parametrize('dt', [np.float32, np.float64, np.int64])
@pytest.mark.parametrize('shape', [(12,), (2, 6), (2,2,3)])
def test_encode_base64_dict(dt, shape) -> None:
    a = np.arange(12, dtype=dt)
    a.reshape(shape)
    d = bus.encode_base64_dict(a)

    assert 'shape' in d
    assert d['shape'] == a.shape

    assert 'dtype' in d
    assert d['dtype'] == a.dtype.name

    assert '__ndarray__' in d
    b64 = base64.b64decode(d['__ndarray__'])
    aa = np.frombuffer(b64, dtype=d['dtype'])
    assert np.array_equal(a, aa)

@pytest.mark.parametrize('dt', [np.float32, np.float64, np.int64])
@pytest.mark.parametrize('shape', [(12,), (2, 6), (2,2,3)])
def test_decode_base64_dict(dt, shape) -> None:
    a = np.arange(12, dtype=dt)
    a.reshape(shape)
    data = base64.b64encode(a).decode('utf-8')
    d = {
        '__ndarray__'  : data,
        'dtype'        : a.dtype.name,
        'shape'        : a.shape
    }
    aa = bus.decode_base64_dict(d)

    assert aa.shape == a.shape

    assert aa.dtype.name == a.dtype.name

    assert np.array_equal(a, aa)

    assert aa.flags['WRITEABLE']

@pytest.mark.parametrize('dt', [np.float32, np.float64, np.int64])
@pytest.mark.parametrize('shape', [(12,), (2, 6), (2,2,3)])
def test_encode_decode_roundtrip(dt, shape) -> None:
    a = np.arange(12, dtype=dt)
    a.reshape(shape)
    d = bus.encode_base64_dict(a)
    aa = bus.decode_base64_dict(d)
    assert np.array_equal(a, aa)


@pytest.mark.parametrize('dt', bus.BINARY_ARRAY_TYPES)
@pytest.mark.parametrize('shape', [(12,), (2, 6), (2,2,3)])
def test_encode_binary_dict(dt, shape) -> None:
    a = np.arange(12, dtype=dt)
    a.reshape(shape)
    bufs = []
    d = bus.encode_binary_dict(a, buffers=bufs)

    assert len(bufs) == 1
    assert len(bufs[0]) == 2
    assert bufs[0][1] == a.tobytes()
    assert 'shape' in d
    assert d['shape'] == a.shape

    assert 'dtype' in d
    assert d['dtype'] == a.dtype.name

    assert '__buffer__' in d

@pytest.mark.parametrize('cols', [None, [], ['a'], ['a', 'b'], ['a', 'b', 'c']])
@pytest.mark.parametrize('dt1', [np.float32, np.float64, np.int64])
@pytest.mark.parametrize('dt2', [np.float32, np.float64, np.int64])
def test_transform_column_source_data_with_buffers(pd, cols, dt1, dt2) -> None:
    d = dict(a=[1,2,3], b=np.array([4,5,6], dtype=dt1), c=pd.Series([7,8,9], dtype=dt2))
    bufs = []
    out = bus.transform_column_source_data(d, buffers=bufs, cols=cols)
    assert set(out) == (set(d) if cols is None else set(cols))
    if 'a' in out:
        assert out['a'] == [1,2,3]
    for x in ['b', 'c']:
        dt = d[x].dtype
        if x in out:
            if dt in bus.BINARY_ARRAY_TYPES:
                assert isinstance(out[x], dict)
                assert 'shape' in out[x]
                assert out[x]['shape'] == d[x].shape
                assert 'dtype' in out[x]
                assert out[x]['dtype'] == d[x].dtype.name
                assert '__buffer__' in out[x]
            else:
                assert isinstance(out[x], list)
                assert out[x] == list(d[x])

#-----------------------------------------------------------------------------
# Dev API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Private API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Code
#-----------------------------------------------------------------------------
