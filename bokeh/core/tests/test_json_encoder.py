from __future__ import absolute_import

import unittest
from unittest import skipIf

from collections import deque
import datetime as dt
import decimal
import time

import numpy as np
from six import string_types

try:
    import pandas as pd
    is_pandas = True
except ImportError as e:
    is_pandas = False

import dateutil.relativedelta as rd

from bokeh.colors import RGB
from bokeh.core.has_props import HasProps
from bokeh.core.properties import Int, String
from bokeh.models import Range1d

class HP(HasProps):
    foo = Int(default=10)
    bar = String()

class TestBokehJSONEncoder(unittest.TestCase):

    def setUp(self):
        from bokeh.core.json_encoder import BokehJSONEncoder
        self.encoder = BokehJSONEncoder()

    def test_fail(self):
        self.assertRaises(TypeError, self.encoder.default, {'testing': 1})

    @skipIf(not is_pandas, "pandas does not work in PyPy.")
    def test_panda_series(self):
        s = pd.Series([1, 3, 5, 6, 8])
        self.assertEqual(self.encoder.default(s), [1, 3, 5, 6, 8])

    def test_numpyarray(self):
        a = np.arange(5)
        self.assertEqual(self.encoder.default(a), [0, 1, 2, 3, 4])

    def test_numpyint(self):
        npint = np.asscalar(np.int64(1))
        self.assertEqual(self.encoder.default(npint), 1)
        self.assertIsInstance(self.encoder.default(npint), int)

    def test_numpyfloat(self):
        npfloat = np.float64(1.33)
        self.assertEqual(self.encoder.default(npfloat), 1.33)
        self.assertIsInstance(self.encoder.default(npfloat), float)

    def test_numpybool_(self):
        nptrue = np.bool_(True)
        self.assertEqual(self.encoder.default(nptrue), True)
        self.assertIsInstance(self.encoder.default(nptrue), bool)

    def test_numpydatetime64(self):
        npdt64 = np.datetime64('2017-01-01')
        self.assertEqual(self.encoder.default(npdt64), 1483228800000.0)
        self.assertIsInstance(self.encoder.default(npdt64), float)

    def test_time(self):
        dttime = dt.time(12, 32, 15)
        self.assertEqual(self.encoder.default(dttime), 45135000.0)
        self.assertIsInstance(self.encoder.default(dttime), float)

    def test_relativedelta(self):
        rdelt = rd.relativedelta()
        self.assertIsInstance(self.encoder.default(rdelt), dict)

    def test_decimal(self):
        dec = decimal.Decimal(20.3)
        self.assertEqual(self.encoder.default(dec), 20.3)
        self.assertIsInstance(self.encoder.default(dec), float)

    def test_model(self):
        m = Range1d(start=10, end=20)
        self.assertEqual(self.encoder.default(m), m.ref)
        self.assertIsInstance(self.encoder.default(m), dict)

    def test_hasprops(self):
        hp = HP()
        self.assertEqual(self.encoder.default(hp), {})
        self.assertIsInstance(self.encoder.default(hp), dict)

        hp.foo = 15
        self.assertEqual(self.encoder.default(hp), {'foo': 15})
        self.assertIsInstance(self.encoder.default(hp), dict)

        hp.bar = "test"
        self.assertEqual(self.encoder.default(hp), {'foo': 15, 'bar': 'test'})
        self.assertIsInstance(self.encoder.default(hp), dict)

    def test_color(self):
        c = RGB(16, 32, 64)
        self.assertEqual(self.encoder.default(c), "rgb(16, 32, 64)")
        self.assertIsInstance(self.encoder.default(c), string_types)

        c = RGB(16, 32, 64, 0.1)
        self.assertEqual(self.encoder.default(c), "rgba(16, 32, 64, 0.1)")
        self.assertIsInstance(self.encoder.default(c), string_types)

    @skipIf(not is_pandas, "pandas does not work in PyPy.")
    def test_pd_timestamp(self):
        ts = pd.tslib.Timestamp('April 28, 1948')
        self.assertEqual(self.encoder.default(ts), -684115200000)

class TestSerializeJson(unittest.TestCase):

    def setUp(self):
        from bokeh.core.json_encoder import serialize_json
        from json import loads
        self.serialize = serialize_json
        self.deserialize = loads

    def test_with_basic(self):
        self.assertEqual(self.serialize({'test': [1, 2, 3]}), '{"test":[1,2,3]}')

    def test_pretty(self):
        self.assertEqual(self.serialize({'test': [1, 2, 3]}, pretty=True), '{\n  "test": [\n    1,\n    2,\n    3\n  ]\n}')

    def test_with_np_array(self):
        a = np.arange(5)
        self.assertEqual(self.serialize(a), '[0,1,2,3,4]')

    @skipIf(not is_pandas, "pandas does not work in PyPy.")
    def test_with_pd_series(self):
        s = pd.Series([0, 1, 2, 3, 4])
        self.assertEqual(self.serialize(s), '[0,1,2,3,4]')

    def test_nans_and_infs(self):
        arr = np.array([np.nan, np.inf, -np.inf, 0])
        serialized = self.serialize(arr)
        deserialized = self.deserialize(serialized)
        assert deserialized[0] == 'NaN'
        assert deserialized[1] == 'Infinity'
        assert deserialized[2] == '-Infinity'
        assert deserialized[3] == 0

    @skipIf(not is_pandas, "pandas does not work in PyPy.")
    def test_nans_and_infs_pandas(self):
        arr = pd.Series(np.array([np.nan, np.inf, -np.inf, 0]))
        serialized = self.serialize(arr)
        deserialized = self.deserialize(serialized)
        assert deserialized[0] == 'NaN'
        assert deserialized[1] == 'Infinity'
        assert deserialized[2] == '-Infinity'
        assert deserialized[3] == 0

    @skipIf(not is_pandas, "pandas does not work in PyPy.")
    def test_pandas_datetime_types(self):
        """should convert to millis
        """
        idx = pd.date_range('2001-1-1', '2001-1-5')
        df = pd.DataFrame({'vals' :idx}, index=idx)
        serialized = self.serialize({'vals' : df.vals,
                                     'idx' : df.index})
        deserialized = self.deserialize(serialized)
        baseline = {u'vals': [978307200000,
                              978393600000,
                              978480000000,
                              978566400000,
                              978652800000],
                    u'idx': [978307200000,
                             978393600000,
                             978480000000,
                             978566400000,
                             978652800000]
        }
        assert deserialized == baseline

    def test_builtin_datetime_types(self):
        """ should convert to millis as-is
        """

        a = dt.date(2016, 4, 28)
        b = dt.datetime(2016, 4, 28, 2, 20, 50)
        serialized = self.serialize({'a' : [a],
                                     'b' : [b]})
        deserialized = self.deserialize(serialized)

        baseline = {u'a': [time.mktime(a.timetuple())*1000],
                    u'b': [time.mktime(b.timetuple())*1000],
        }
        assert deserialized == baseline

    def test_builtin_timedelta_types(self):
        """ should convert time delta to a dictionary
        """
        delta = dt.timedelta(days=42, seconds=1138, microseconds=1337)
        serialized = self.serialize(delta)
        deserialized = self.deserialize(serialized)
        assert deserialized == delta.total_seconds() * 1000

    def test_deque(self):
        """Test that a deque is deserialized as a list."""
        self.assertEqual(self.serialize(deque([0, 1, 2])), '[0,1,2]')

    def test_bad_kwargs(self):
        self.assertRaises(ValueError, self.serialize, [1], allow_nan=True)
        self.assertRaises(ValueError, self.serialize, [1], separators=("a", "b"))
        self.assertRaises(ValueError, self.serialize, [1], sort_keys=False)

if __name__ == "__main__":
    unittest.main()
