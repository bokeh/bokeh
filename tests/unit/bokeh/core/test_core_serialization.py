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
import datetime as dt
import sys
from typing import Any, Sequence

# External imports
import dateutil.relativedelta as rd
import numpy as np

# Bokeh imports
from bokeh._testing.util.types import Capture
from bokeh.colors import RGB
from bokeh.core.has_props import HasProps
from bokeh.core.properties import (
    Instance,
    Int,
    List,
    Nullable,
    String,
)
from bokeh.core.serialization import Buffer, Serializer
from bokeh.core.types import ID
from bokeh.model import Model
from bokeh.util.dataclasses import NotRequired, Unspecified, dataclass

#-----------------------------------------------------------------------------
# Setup
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# General API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Dev API
#-----------------------------------------------------------------------------

nan = float("nan")
inf = float("inf")

class SomeProps(HasProps):
    p0 = Int(default=1)
    p1 = String()
    p2 = List(Int)

class SomeModel(Model):
    p0 = Int(default=1)
    p1 = String()
    p2 = List(Int)
    p3 = Nullable(Instance(lambda: SomeModel))

@dataclass
class SomeDataClass:
    f0: int
    f1: Sequence[int]
    f2: SomeDataClass | None = None
    f3: NotRequired[bool | None] = Unspecified
    f4: NotRequired[SomeProps] = Unspecified
    f5: NotRequired[SomeModel] = Unspecified

class TestSerializer:

    def test_primitive(self) -> None:
        encoder = Serializer()

        assert encoder.encode(None) is None
        assert encoder.encode(False) == False
        assert encoder.encode(True) == True
        assert encoder.encode("abc") == "abc"

        assert encoder.encode(1) == 1
        assert encoder.encode(1.17) == 1.17

        assert encoder.encode(nan) == dict(type="number", value="nan")

        assert encoder.encode(-inf) == dict(type="number", value="-inf")
        assert encoder.encode(+inf) == dict(type="number", value="+inf")

        assert encoder.buffers == []

    def test_max_int(self, capsys: Capture) -> None:
        encoder = Serializer()
        rep = encoder.encode(2**64)
        assert rep == 2.0**64
        assert isinstance(rep, float)

        out, err = capsys.readouterr()
        assert out == ""
        assert err == "" # "out of range integer may result in loss of precision"

    def test_list(self) -> None:
        v0 = SomeProps(p0=2, p1="a", p2=[1, 2, 3])
        v1 = SomeModel(p0=3, p1="b", p2=[4, 5, 6])
        v2 = SomeDataClass(f0=2, f1=[1, 2, 3])

        val = [None, False, True, "abc", 1, 1.17, nan, -inf, +inf, v0, v1, v2, [nan]]

        encoder = Serializer()
        rep = encoder.encode(val)
        assert rep == [
            None, False, True, "abc", 1, 1.17,
            dict(type="number", value="nan"),
            dict(type="number", value="-inf"),
            dict(type="number", value="+inf"),
            dict(
                type="test_core_serialization.SomeProps",
                attributes=dict(
                    p0=2,
                    p1="a",
                    p2=[1, 2, 3],
                ),
            ),
            dict(
                type="test_core_serialization.SomeModel",
                id=v1.id,
                attributes=dict(
                    p0=3,
                    p1="b",
                    p2=[4, 5, 6],
                ),
            ),
            dict(
                type="test_core_serialization.SomeDataClass",
                attributes=dict(
                    f0=2,
                    f1=[1, 2, 3],
                    f2=None,
                ),
            ),
            [dict(type="number", value="nan")],
        ]
        assert encoder.buffers == []

    def test_list_circular(self) -> None:
        val: Sequence[Any] = [1, 2, 3]
        val.insert(2, val)

        encoder = Serializer()
        with pytest.raises(ValueError):
            encoder.encode(val)

    def test_bytes_binary(self) -> None:
        encoder = Serializer(binary=True)
        val = bytes([0xFF, 0x00, 0x17, 0xFE, 0x00])
        rep = encoder.encode(val)
        assert rep == dict(
            type="bytes",
            data=dict(id="1"),
        )
        assert encoder.buffers == [
            Buffer(id=ID("1"), data=val),
        ]

    def test_bytes_base64(self) -> None:
        encoder = Serializer(binary=False)
        val = bytes([0xFF, 0x00, 0x17, 0xFE, 0x00])
        rep = encoder.encode(val)
        assert rep == dict(
            type="bytes",
            data="/wAX/gA=",
        )
        assert encoder.buffers == []

    def test_ndarray_binary(self) -> None:
        encoder = Serializer(binary=True)
        val = np.array([0, 1, 2, 3, 4, 5], dtype="int32")
        rep = encoder.encode(val)
        assert rep == dict(
            type="ndarray",
            array=dict(
                type="bytes",
                data=dict(id=ID("1")),
            ),
            order=sys.byteorder,
            shape=[6],
            dtype="int32",
        )
        assert encoder.buffers == [
            Buffer(id=ID("1"), data=val.tobytes()),
        ]

    def test_ndarray_base64(self) -> None:
        encoder = Serializer(binary=False)
        val = np.array([0, 1, 2, 3, 4, 5], dtype="int32")
        rep = encoder.encode(val)
        assert rep == dict(
            type="ndarray",
            array=dict(
                type="bytes",
                data="AAAAAAEAAAACAAAAAwAAAAQAAAAFAAAA",
            ),
            order=sys.byteorder,
            shape=[6],
            dtype="int32",
        )
        assert encoder.buffers == []

    def test_ndarray_object(self) -> None:
        @dataclass
        class X:
            f: int = 0
            g: str = "a"

        encoder = Serializer()
        val = np.array([[X()], [X(1)], [X(2, "b")]])

        rep = encoder.encode(val)
        assert rep == dict(
            type="ndarray",
            array=[
                dict(type="test_core_serialization.X", attributes=dict(f=0, g="a")),
                dict(type="test_core_serialization.X", attributes=dict(f=1, g="a")),
                dict(type="test_core_serialization.X", attributes=dict(f=2, g="b")),
            ],
            order=sys.byteorder,
            shape=[3, 1],
            dtype="object",
        )
        assert encoder.buffers == []

    def test_HasProps(self) -> None:
        val = SomeProps(p0=2, p1="a", p2=[1, 2, 3])
        encoder = Serializer()
        rep = encoder.encode(val)
        assert rep == dict(
            type="test_core_serialization.SomeProps",
            attributes=dict(
                p0=2,
                p1="a",
                p2=[1, 2, 3],
            ),
        )
        assert encoder.buffers == []

    def test_Model(self) -> None:
        val = SomeModel(p0=3, p1="b", p2=[4, 5, 6])
        encoder = Serializer()
        rep = encoder.encode(val)
        assert rep == dict(
            type="test_core_serialization.SomeModel",
            id=val.id,
            attributes=dict(
                p0=3,
                p1="b",
                p2=[4, 5, 6],
            ),
        )
        assert encoder.buffers == []

    def test_Model_circular(self) -> None:
        val0 = SomeModel(p0=10)
        val1 = SomeModel(p0=20, p3=val0)
        val2 = SomeModel(p0=30, p3=val1)
        val0.p3 = val2

        encoder = Serializer()
        rep = encoder.encode(val2)

        assert rep == dict(
            type="test_core_serialization.SomeModel",
            id=val2.id,
            attributes=dict(
                p0=30,
                p3=dict(
                    type="test_core_serialization.SomeModel",
                    id=val1.id,
                    attributes=dict(
                        p0=20,
                        p3=dict(
                            type="test_core_serialization.SomeModel",
                            id=val0.id,
                            attributes=dict(
                                p0=10,
                                p3=dict(id=val2.id),
                            ),
                        ),
                    ),
                ),
            ),
        )
        assert encoder.buffers == []

    def test_dataclass(self) -> None:
        val = SomeDataClass(f0=2, f1=[1, 2, 3])
        encoder = Serializer()
        rep = encoder.encode(val)
        assert rep == dict(
            type="test_core_serialization.SomeDataClass",
            attributes=dict(
                f0=2,
                f1=[1, 2, 3],
                f2=None,
            ),
        )
        assert encoder.buffers == []

    def test_dataclass_nested(self) -> None:
        val = SomeDataClass(f0=2, f1=[1, 2, 3], f2=SomeDataClass(f0=3, f1=[4, 5, 6]))
        encoder = Serializer()
        rep = encoder.encode(val)
        assert rep == dict(
            type="test_core_serialization.SomeDataClass",
            attributes=dict(
                f0=2,
                f1=[1, 2, 3],
                f2=dict(
                    type="test_core_serialization.SomeDataClass",
                    attributes=dict(
                        f0=3,
                        f1=[4, 5, 6],
                        f2=None,
                    ),
                ),
            ),
        )
        assert encoder.buffers == []

    def test_dataclass_HasProps_nested(self) -> None:
        v0 = SomeProps(p0=2, p1="a", p2=[1, 2, 3])
        val = SomeDataClass(f0=2, f1=[1, 2, 3], f4=v0)
        encoder = Serializer()
        rep = encoder.encode(val)
        assert rep == dict(
            type="test_core_serialization.SomeDataClass",
            attributes=dict(
                f0=2,
                f1=[1, 2, 3],
                f2=None,
                f4=dict(
                    type="test_core_serialization.SomeProps",
                    attributes=dict(
                        p0=2,
                        p1="a",
                        p2=[1, 2, 3],
                    ),
                ),
            ),
        )
        assert encoder.buffers == []

    def test_dataclass_Model_nested(self) -> None:
        v0 = SomeModel(p0=3, p1="b", p2=[4, 5, 6])
        val = SomeDataClass(f0=2, f1=[1, 2, 3], f5=v0)
        encoder = Serializer()
        rep = encoder.encode(val)
        assert rep == dict(
            type="test_core_serialization.SomeDataClass",
            attributes=dict(
                f0=2,
                f1=[1, 2, 3],
                f2=None,
                f5=dict(
                    type="test_core_serialization.SomeModel",
                    id=v0.id,
                    attributes=dict(
                        p0=3,
                        p1="b",
                        p2=[4, 5, 6],
                    ),
                ),
            ),
        )
        assert encoder.buffers == []

    def test_color_rgb(self) -> None:
        val = RGB(16, 32, 64)
        encoder = Serializer()
        rep = encoder.encode(val)
        assert rep == "rgb(16, 32, 64)"
        assert encoder.buffers == []

    def test_color_rgba(self) -> None:
        val = RGB(16, 32, 64, 0.1)
        encoder = Serializer()
        rep = encoder.encode(val)
        assert rep == "rgba(16, 32, 64, 0.1)"
        assert encoder.buffers == []

    def test_pd_series_base64(self, pd) -> None:
        encoder = Serializer(binary=False)
        val = pd.Series([0, 1, 2, 3, 4, 5], dtype="int32")
        rep = encoder.encode(val)
        assert rep == dict(
            type="ndarray",
            array=dict(
                type="bytes",
                data="AAAAAAEAAAACAAAAAwAAAAQAAAAFAAAA",
            ),
            order=sys.byteorder,
            shape=[6],
            dtype="int32",
        )
        assert encoder.buffers == []

    def test_np_int64(self) -> None:
        encoder = Serializer()
        val = np.int64(1).item()
        rep = encoder.encode(val)
        assert rep == 1
        assert isinstance(rep, int)

    def test_np_float64(self) -> None:
        encoder = Serializer()
        val = np.float64(1.33)
        rep = encoder.encode(val)
        assert rep == 1.33
        assert isinstance(rep, float)

    def test_np_bool(self) -> None:
        encoder = Serializer()
        val = np.bool_(True)
        rep = encoder.encode(val)
        assert rep == True
        assert isinstance(rep, bool)

    def test_np_datetime64(self) -> None:
        encoder = Serializer()
        val = np.datetime64('2017-01-01')
        rep = encoder.encode(val)
        assert rep == 1483228800000.0
        assert isinstance(rep, float)

    def test_dt_time(self) -> None:
        encoder = Serializer()
        val = dt.time(12, 32, 15)
        rep = encoder.encode(val)
        assert rep == 45135000.0
        assert isinstance(rep, float)

    def test_rd_relativedelta(self) -> None:
        encoder = Serializer()
        val = rd.relativedelta()
        rep = encoder.encode(val)
        assert isinstance(rep, dict)

    def test_pd_timestamp(self, pd) -> None:
        encoder = Serializer()
        val = pd.Timestamp('April 28, 1948')
        rep = encoder.encode(val)
        assert rep == -684115200000

    """
    def test_decimal(self) -> None:
        dec = decimal.Decimal(20.3)
        assert self.encoder.default(dec) == 20.3
        assert isinstance(self.encoder.default(dec), float)

    def test_slice(self) -> None:
        c = slice(2)
        assert self.encoder.default(c) == dict(start=None, stop=2, step=None)
        assert isinstance(self.encoder.default(c), dict)

        c = slice(0,2)
        assert self.encoder.default(c) == dict(start=0, stop=2, step=None)
        assert isinstance(self.encoder.default(c), dict)

        c = slice(0, 10, 2)
        assert self.encoder.default(c) == dict(start=0, stop=10, step=2)
        assert isinstance(self.encoder.default(c), dict)

        c = slice(0, None, 2)
        assert self.encoder.default(c) == dict(start=0, stop=None, step=2)
        assert isinstance(self.encoder.default(c), dict)

        c = slice(None, None, None)
        assert self.encoder.default(c) == dict(start=None, stop=None, step=None)
        assert isinstance(self.encoder.default(c), dict)
    """

"""
    def test_set_data_from_json_list(self) -> None:
        ds = bms.ColumnDataSource()
        data = {"foo": [1, 2, 3]}
        ds.set_from_json('data', data)
        assert ds.data == data

    def test_set_data_from_json_base64(self) -> None:
        ds = bms.ColumnDataSource()
        data = {"foo": np.arange(3, dtype=np.int64)}
        json = transform_column_source_data(data)
        ds.set_from_json('data', json)
        assert np.array_equal(ds.data["foo"], data["foo"])

    def test_set_data_from_json_nested_base64(self) -> None:
        ds = bms.ColumnDataSource()
        data = {"foo": [[np.arange(3, dtype=np.int64)]]}
        json = transform_column_source_data(data)
        ds.set_from_json('data', json)
        assert np.array_equal(ds.data["foo"], data["foo"])

    def test_set_data_from_json_nested_base64_and_list(self) -> None:
        ds = bms.ColumnDataSource()
        data = {"foo": [np.arange(3, dtype=np.int64), [1, 2, 3]]}
        json = transform_column_source_data(data)
        ds.set_from_json('data', json)
        assert np.array_equal(ds.data["foo"], data["foo"])


class TestSerializeJson:
    def setup_method(self, test_method):
        from json import loads

        from bokeh.core.json_encoder import serialize_json
        self.serialize = serialize_json
        self.deserialize = loads

    def test_with_basic(self) -> None:
        assert self.serialize({'test': [1, 2, 3]}) == '{"test":[1,2,3]}'

    def test_pretty(self) -> None:
        assert self.serialize({'test': [1, 2, 3]}, pretty=True) == '{\n  "test": [\n    1,\n    2,\n    3\n  ]\n}'

    def test_with_np_array(self) -> None:
        a = np.arange(5)
        assert self.serialize(a) == '[0,1,2,3,4]'

    def test_with_pd_series(self, pd) -> None:
        s = pd.Series([0, 1, 2, 3, 4])
        assert self.serialize(s) == '[0,1,2,3,4]'

    def test_nans_and_infs(self) -> None:
        arr = np.array([np.nan, np.inf, -np.inf, 0])
        serialized = self.serialize(arr)
        deserialized = self.deserialize(serialized)
        assert deserialized[0] == 'NaN'
        assert deserialized[1] == 'Infinity'
        assert deserialized[2] == '-Infinity'
        assert deserialized[3] == 0

    def test_nans_and_infs_pandas(self, pd) -> None:
        arr = pd.Series(np.array([np.nan, np.inf, -np.inf, 0]))
        serialized = self.serialize(arr)
        deserialized = self.deserialize(serialized)
        assert deserialized[0] == 'NaN'
        assert deserialized[1] == 'Infinity'
        assert deserialized[2] == '-Infinity'
        assert deserialized[3] == 0

    def test_pandas_datetime_types(self, pd) -> None:
        ''' should convert to millis '''
        idx = pd.date_range('2001-1-1', '2001-1-5')
        df = pd.DataFrame({'vals' :idx}, index=idx)
        serialized = self.serialize({'vals' : df.vals,
                                     'idx' : df.index})
        deserialized = self.deserialize(serialized)
        baseline = {
            "vals": [
                978307200000,
                978393600000,
                978480000000,
                978566400000,
                978652800000,
            ],
            "idx": [
                978307200000,
                978393600000,
                978480000000,
                978566400000,
                978652800000,
            ],
        }
        assert deserialized == baseline

    def test_builtin_datetime_types(self) -> None:
        ''' should convert to millis as-is '''

        DT_EPOCH = dt.datetime.utcfromtimestamp(0)

        a = dt.date(2016, 4, 28)
        b = dt.datetime(2016, 4, 28, 2, 20, 50)
        serialized = self.serialize({'a' : [a],
                                     'b' : [b]})
        deserialized = self.deserialize(serialized)

        baseline = {'a': ['2016-04-28'],
                    'b': [(b - DT_EPOCH).total_seconds() * 1000. + b.microsecond / 1000.],
        }
        assert deserialized == baseline

        # test pre-computed values too
        assert deserialized == {
            'a': ['2016-04-28'], 'b': [1461810050000.0]
        }

    def test_builtin_timedelta_types(self) -> None:
        ''' should convert time delta to a dictionary '''
        delta = dt.timedelta(days=42, seconds=1138, microseconds=1337)
        serialized = self.serialize(delta)
        deserialized = self.deserialize(serialized)
        assert deserialized == delta.total_seconds() * 1000

    def test_numpy_timedelta_types(self) -> None:
        delta = np.timedelta64(3000, 'ms')
        serialized = self.serialize(delta)
        deserialized = self.deserialize(serialized)
        assert deserialized == 3000

        delta = np.timedelta64(3000, 's')
        serialized = self.serialize(delta)
        deserialized = self.deserialize(serialized)
        assert deserialized == 3000000

    def test_pandas_timedelta_types(self, pd) -> None:
        delta = pd.Timedelta("3000ms")
        serialized = self.serialize(delta)
        deserialized = self.deserialize(serialized)
        assert deserialized == 3000


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

    def test_to_json(self) -> None:
        child_obj = SomeModelToJson(foo=57, bar="hello")
        obj = SomeModelToJson(child=child_obj, foo=42, bar="world")

        json = obj.to_json(include_defaults=True)
        json_string = serialize_json(json)

        assert json == {
            "child": {"id": child_obj.id},
            "null_child": None,
            "id": obj.id,
            "name": None,
            "tags": [],
            'js_property_callbacks': dict(type="map", entries=[]),
            "js_event_callbacks": dict(type="map", entries=[]),
            "subscribed_events": [],
            "syncable": True,
            "foo": 42,
            "bar": "world",
        }
        assert (
            '{"bar":"world",' +
            '"child":{"id":"%s"},' +
            '"foo":42,' +
            '"id":"%s",' +
            '"js_event_callbacks":{"entries":[],"type":"map"},' +
            '"js_property_callbacks":{"entries":[],"type":"map"},' +
            '"name":null,' +
            '"null_child":null,' +
            '"subscribed_events":[],' +
            '"syncable":true,' +
            '"tags":[]}'
        ) % (child_obj.id, obj.id) == json_string

        json = obj.to_json(include_defaults=False)
        json_string = serialize_json(json)

        assert json == {
            "child": {"id": child_obj.id},
            "id": obj.id,
            "foo": 42,
            "bar": "world",
        }
        assert (
            '{"bar":"world",' +
            '"child":{"id":"%s"},' +
            '"foo":42,' +
            '"id":"%s"}'
        ) % (child_obj.id, obj.id) == json_string

    def test_no_units_in_json(self) -> None:
        from bokeh.models import AnnularWedge
        obj = AnnularWedge()
        json = obj.to_json(include_defaults=True)
        assert 'start_angle' in json
        assert 'start_angle_units' not in json
        assert 'outer_radius' in json
        assert 'outer_radius_units' not in json

    def test_dataspec_field_in_json(self) -> None:
        from bokeh.models import AnnularWedge
        obj = AnnularWedge()
        obj.start_angle = "fieldname"
        json = obj.to_json(include_defaults=True)
        assert 'start_angle' in json
        assert 'start_angle_units' not in json
        assert json["start_angle"] == dict(type="map", entries=[["field", "fieldname"]]) # TODO: dict(type="field", field="fieldname")

    def test_dataspec_value_in_json(self) -> None:
        from bokeh.models import AnnularWedge
        obj = AnnularWedge()
        obj.start_angle = 60
        json = obj.to_json(include_defaults=True)
        assert 'start_angle' in json
        assert 'start_angle_units' not in json
        assert json["start_angle"] == dict(type="map", entries=[["value", 60]]) # TODO: dict(type="value", value=60)


"""


#-----------------------------------------------------------------------------
# Private API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Code
#-----------------------------------------------------------------------------
