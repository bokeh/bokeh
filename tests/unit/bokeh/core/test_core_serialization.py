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
import decimal
from collections import deque
from typing import Sequence

# External imports
import dateutil.relativedelta as rd
import numpy as np

# Bokeh imports
from bokeh._testing.util.types import Capture
from bokeh.colors import RGB
from bokeh.core.has_props import HasProps
from bokeh.core.properties import Int, List, String
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

        assert encoder.to_serializable(None) is None
        assert encoder.to_serializable(False) == False
        assert encoder.to_serializable(True) == True
        assert encoder.to_serializable("abc") == "abc"

        assert encoder.to_serializable(1) == 1
        assert encoder.to_serializable(1.17) == 1.17

        assert encoder.to_serializable(nan) == dict(type="number", value="nan")

        assert encoder.to_serializable(-inf) == dict(type="number", value="-inf")
        assert encoder.to_serializable(+inf) == dict(type="number", value="+inf")

        assert encoder.references == []
        assert encoder.buffers == []

    def test_max_int(self, capsys: Capture) -> None:
        encoder = Serializer()
        rep = encoder.to_serializable(2**64)
        assert rep == 2.0**64
        assert isinstance(rep, float)

        out, err = capsys.readouterr()
        assert out == ""
        assert err == "" # "out of range integer may result in loss of precision"

    def test_list(self) -> None:
        v0 = SomeProps(p0=2, p1="a", p2=[1, 2, 3])
        v1 = SomeModel(p0=3, p1="b", p2=[4, 5, 6])
        v2 = SomeDataClass(f0=2, f1=[1, 2, 3])

        value = [None, False, True, "abc", 1, 1.17, nan, -inf, +inf, v0, v1, v2, [nan]]

        encoder = Serializer()
        rep = encoder.to_serializable(value)
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
            dict(id=v1.id),
            dict(
                type="test_core_serialization.SomeDataClass",
                attributes=[
                    ("f0", 2),
                    ("f1", [1, 2, 3]),
                    ("f2", None),
                ],
            ),
            [dict(type="number", value="nan")],
        ]

        assert encoder.references == [dict(
            type="test_core_serialization.SomeModel",
            id=v1.id,
            attributes=dict(
                p0=3,
                p1="b",
                p2=[4, 5, 6],
            ),
        )]

        assert encoder.buffers == []

    def test_bytes_binary(self) -> None:
        encoder = Serializer(binary=True)
        value = bytes([0xFF, 0x00, 0x17, 0xFE, 0x00])
        rep = encoder.to_serializable(value)
        assert rep == dict(
            type="bytes",
            data=dict(id="1"),
        )
        assert encoder.references == []
        assert encoder.buffers == [
            Buffer(id=ID("1"), data=value),
        ]

    def test_bytes_base64(self) -> None:
        encoder = Serializer(binary=False)
        value = bytes([0xFF, 0x00, 0x17, 0xFE, 0x00])
        rep = encoder.to_serializable(value)
        assert rep == dict(
            type="bytes",
            data="/wAX/gA=",
        )
        assert encoder.references == []
        assert encoder.buffers == []

    def test_HasProps(self) -> None:
        value = SomeProps(p0=2, p1="a", p2=[1, 2, 3])
        encoder = Serializer()
        rep = encoder.to_serializable(value)
        assert rep == dict(
            type="test_core_serialization.SomeProps",
            attributes=dict(
                p0=2,
                p1="a",
                p2=[1, 2, 3],
            ),
        )
        assert encoder.references == []
        assert encoder.buffers == []

    def test_Model(self) -> None:
        value = SomeModel(p0=3, p1="b", p2=[4, 5, 6])
        encoder = Serializer()
        rep = encoder.to_serializable(value)
        assert rep == dict(id=value.id)
        assert encoder.references == [dict(
            type="test_core_serialization.SomeModel",
            id=value.id,
            attributes=dict(
                p0=3,
                p1="b",
                p2=[4, 5, 6],
            ),
        )]
        assert encoder.buffers == []

    def test_dataclass(self) -> None:
        value = SomeDataClass(f0=2, f1=[1, 2, 3])
        encoder = Serializer()
        rep = encoder.to_serializable(value)
        assert rep == dict(
            type="test_core_serialization.SomeDataClass",
            attributes=[
                ("f0", 2),
                ("f1", [1, 2, 3]),
                ("f2", None),
            ],
        )
        assert encoder.references == []
        assert encoder.buffers == []

    def test_dataclass_nested(self) -> None:
        value = SomeDataClass(f0=2, f1=[1, 2, 3], f2=SomeDataClass(f0=3, f1=[4, 5, 6]))
        encoder = Serializer()
        rep = encoder.to_serializable(value)
        assert rep == dict(
            type="test_core_serialization.SomeDataClass",
            attributes=[
                ("f0", 2),
                ("f1", [1, 2, 3]),
                ("f2", dict(
                    type="test_core_serialization.SomeDataClass",
                    attributes=[
                        ("f0", 3),
                        ("f1", [4, 5, 6]),
                        ("f2", None),
                    ],
                )),
            ],
        )
        assert encoder.references == []
        assert encoder.buffers == []

    def test_dataclass_HasProps_nested(self) -> None:
        v0 = SomeProps(p0=2, p1="a", p2=[1, 2, 3])
        value = SomeDataClass(f0=2, f1=[1, 2, 3], f4=v0)
        encoder = Serializer()
        rep = encoder.to_serializable(value)
        assert rep == dict(
            type="test_core_serialization.SomeDataClass",
            attributes=[
                ("f0", 2),
                ("f1", [1, 2, 3]),
                ("f2", None),
                ("f4", dict(
                    type="test_core_serialization.SomeProps",
                    attributes=dict(
                        p0=2,
                        p1="a",
                        p2=[1, 2, 3],
                    ),
                )),
            ],
        )
        assert encoder.references == []
        assert encoder.buffers == []

    def test_dataclass_Model_nested(self) -> None:
        v0 = SomeModel(p0=3, p1="b", p2=[4, 5, 6])
        value = SomeDataClass(f0=2, f1=[1, 2, 3], f5=v0)
        encoder = Serializer()
        rep = encoder.to_serializable(value)
        assert rep == dict(
            type="test_core_serialization.SomeDataClass",
            attributes=[
                ("f0", 2),
                ("f1", [1, 2, 3]),
                ("f2", None),
                ("f5", dict(id=v0.id)),
            ],
        )
        assert encoder.references == [dict(
            type="test_core_serialization.SomeModel",
            id=v0.id,
            attributes=dict(
                p0=3,
                p1="b",
                p2=[4, 5, 6],
            ),
        )]
        assert encoder.buffers == []

    def test_color(self) -> None:
        value = RGB(16, 32, 64)
        encoder = Serializer()
        rep = encoder.to_serializable(value)
        assert rep == "rgb(16, 32, 64)"
        assert encoder.references == []
        assert encoder.buffers == []

        value = RGB(16, 32, 64, 0.1)
        encoder = Serializer()
        rep = encoder.to_serializable(value)
        assert rep == "rgba(16, 32, 64, 0.1)"
        assert encoder.references == []
        assert encoder.buffers == []

    """
    def test_ndarray(self) -> None:
        a = np.arange(5)
        assert self.encoder.default(a) == [0, 1, 2, 3, 4]

    def test_pd_series(self, pd) -> None:
        value = pd.Series([1, 3, 5, 6, 8])
        encoder = Serializer()
        rep = encoder.to_serializable(value)
        assert rep == [1, 3, 5, 6, 8]

    def test_np_int64(self) -> None:
        npint = np.asscalar(np.int64(1))
        assert self.encoder.default(npint) == 1
        assert isinstance(self.encoder.default(npint), int)

    def test_np_float64(self) -> None:
        npfloat = np.float64(1.33)
        assert self.encoder.default(npfloat) == 1.33
        assert isinstance(self.encoder.default(npfloat), float)

    def test_np_bool(self) -> None:
        nptrue = np.bool_(True)
        assert self.encoder.default(nptrue) == True
        assert isinstance(self.encoder.default(nptrue), bool)

    def test_np_datetime64(self) -> None:
        npdt64 = np.datetime64('2017-01-01')
        assert self.encoder.default(npdt64) == 1483228800000.0
        assert isinstance(self.encoder.default(npdt64), float)

    def test_dt_time(self) -> None:
        dttime = dt.time(12, 32, 15)
        assert self.encoder.default(dttime) == 45135000.0
        assert isinstance(self.encoder.default(dttime), float)

    def test_rd_relativedelta(self) -> None:
        rdelt = rd.relativedelta()
        assert isinstance(self.encoder.default(rdelt), dict)

    def test_pd_timestamp(self, pd) -> None:
        ts = pd.Timestamp('April 28, 1948')
        assert self.encoder.default(ts) == -684115200000

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
"""


#-----------------------------------------------------------------------------
# Private API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Code
#-----------------------------------------------------------------------------
