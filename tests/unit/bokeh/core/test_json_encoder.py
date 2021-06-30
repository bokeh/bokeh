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
import datetime as dt
import decimal
from collections import deque

# External imports
import dateutil.relativedelta as rd
import numpy as np

# Bokeh imports
from bokeh.colors import RGB
from bokeh.core.has_props import HasProps
from bokeh.core.properties import Int, String
from bokeh.models import Range1d

# Module under test

#-----------------------------------------------------------------------------
# Setup
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# General API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Dev API
#-----------------------------------------------------------------------------

class HP(HasProps):
    foo = Int(default=10)
    bar = String()


class TestBokehJSONEncoder:
    def setup_method(self, test_method):
        from bokeh.core.json_encoder import BokehJSONEncoder
        self.encoder = BokehJSONEncoder()

    def test_fail(self) -> None:
        with pytest.raises(TypeError):
            self.encoder.default({'testing': 1})

    def test_panda_series(self, pd) -> None:
        s = pd.Series([1, 3, 5, 6, 8])
        assert self.encoder.default(s) == [1, 3, 5, 6, 8]

    def test_numpyarray(self) -> None:
        a = np.arange(5)
        assert self.encoder.default(a) == [0, 1, 2, 3, 4]

    def test_numpyint(self) -> None:
        npint = np.asscalar(np.int64(1))
        assert self.encoder.default(npint) == 1
        assert isinstance(self.encoder.default(npint), int)

    def test_numpyfloat(self) -> None:
        npfloat = np.float64(1.33)
        assert self.encoder.default(npfloat) == 1.33
        assert isinstance(self.encoder.default(npfloat), float)

    def test_numpybool_(self) -> None:
        nptrue = np.bool_(True)
        assert self.encoder.default(nptrue) == True
        assert isinstance(self.encoder.default(nptrue), bool)

    def test_numpydatetime64(self) -> None:
        npdt64 = np.datetime64('2017-01-01')
        assert self.encoder.default(npdt64) == 1483228800000.0
        assert isinstance(self.encoder.default(npdt64), float)

    def test_time(self) -> None:
        dttime = dt.time(12, 32, 15)
        assert self.encoder.default(dttime) == 45135000.0
        assert isinstance(self.encoder.default(dttime), float)

    def test_relativedelta(self) -> None:
        rdelt = rd.relativedelta()
        assert isinstance(self.encoder.default(rdelt), dict)

    def test_decimal(self) -> None:
        dec = decimal.Decimal(20.3)
        assert self.encoder.default(dec) == 20.3
        assert isinstance(self.encoder.default(dec), float)

    def test_model(self) -> None:
        m = Range1d(start=10, end=20)
        assert self.encoder.default(m) == m.ref
        assert isinstance(self.encoder.default(m), dict)

    def test_hasprops(self) -> None:
        hp = HP()
        assert self.encoder.default(hp) == {}
        assert isinstance(self.encoder.default(hp), dict)

        hp.foo = 15
        assert self.encoder.default(hp) == {'foo': 15}
        assert isinstance(self.encoder.default(hp), dict)

        hp.bar = "test"
        assert self.encoder.default(hp) == {'foo': 15, 'bar': 'test'}
        assert isinstance(self.encoder.default(hp), dict)

    def test_color(self) -> None:
        c = RGB(16, 32, 64)
        assert self.encoder.default(c) == "rgb(16, 32, 64)"
        assert isinstance(self.encoder.default(c), str)

        c = RGB(16, 32, 64, 0.1)
        assert self.encoder.default(c) == "rgba(16, 32, 64, 0.1)"
        assert isinstance(self.encoder.default(c), str)

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

    def test_pd_timestamp(self, pd) -> None:
        ts = pd.Timestamp('April 28, 1948')
        assert self.encoder.default(ts) == -684115200000


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
        """ should convert to millis """
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
        """ should convert to millis as-is """

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
        """ should convert time delta to a dictionary """
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

    def test_deque(self) -> None:
        """Test that a deque is deserialized as a list."""
        assert self.serialize(deque([0, 1, 2])) == '[0,1,2]'

    def test_slice(self) -> None:
        """Test that a slice is deserialized as a list."""
        assert self.serialize(slice(2)) == '{"start":null,"step":null,"stop":2}'
        assert self.serialize(slice(0, 2)) == '{"start":0,"step":null,"stop":2}'
        assert self.serialize(slice(0, 10, 2)) == '{"start":0,"step":2,"stop":10}'
        assert self.serialize(slice(0, None, 2)) == '{"start":0,"step":2,"stop":null}'
        assert self.serialize(slice(None, None, None)) == '{"start":null,"step":null,"stop":null}'

    def test_bad_kwargs(self) -> None:
        with pytest.raises(ValueError):
            self.serialize([1], allow_nan=True)
        with pytest.raises(ValueError):
            self.serialize([1], separators=("a", "b"))
        with pytest.raises(ValueError):
            self.serialize([1], sort_keys=False)

#-----------------------------------------------------------------------------
# Private API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Code
#-----------------------------------------------------------------------------
