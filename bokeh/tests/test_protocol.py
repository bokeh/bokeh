import unittest
import pandas as pd
import numpy as np


class TestNumpyJSONEncoder(unittest.TestCase):

    def setUp(self):
        from bokeh.protocol import NumpyJSONEncoder
        self.encoder = NumpyJSONEncoder()

    def test_fail(self):
        self.assertRaises(TypeError, self.encoder.default, {'testing': 1})

    def test_panda_series(self):
        s = pd.Series([1, 3, 5, 6, 8])
        self.assertEqual(self.encoder.default(s), [1, 3, 5, 6, 8])

    def test_numpyarray(self):
        a = np.arange(5)
        self.assertEqual(self.encoder.default(a), [0, 1, 2, 3, 4])

    def test_numpyint(self):
        npint = np.int64(1)
        self.assertEqual(self.encoder.default(npint), 1)
        self.assertIsInstance(self.encoder.default(npint), int)

    def test_numpyfloat(self):
        npfloat = np.float64(1.33)
        self.assertEqual(self.encoder.default(npfloat), 1.33)
        self.assertIsInstance(self.encoder.default(npfloat), float)

    def test_pd_timestamp(self):
        ts = pd.tslib.Timestamp('April 28, 1948')
        self.assertEqual(self.encoder.default(ts), -684115200000)


class TestSerializeJson(unittest.TestCase):

    def setUp(self):
        from bokeh.protocol import serialize_json
        self.serialize = serialize_json

    def test_with_basic(self):
        self.assertEqual(self.serialize({'test': [1, 2, 3]}), '{"test": [1, 2, 3]}')

    def test_with_np_array(self):
        a = np.arange(5)
        self.assertEqual(self.serialize(a), '[0, 1, 2, 3, 4]')

    def test_with_pd_series(self):
        s = pd.Series([0, 1, 2, 3, 4])
        self.assertEqual(self.serialize(s), '[0, 1, 2, 3, 4]')

    def test_with_pd_ts(self):
        ts = pd.tslib.Timestamp('April 28, 1948')
        self.assertEqual(self.serialize(ts), '-684115200000.0')


class TestDefaultSerializeData(unittest.TestCase):

    def setUp(self):
        from bokeh.protocol import default_serialize_data
        self.serialize_data = default_serialize_data

    def test_with_python_objects(self):
        pobjs = [{'test': 1}, [1, 2, 3, 4], 'string']
        self.assertEqual(self.serialize_data(pobjs), ["(dp1\nS'datatype'\np2\nS'pickle'\np3\ns.", '\x80\x02}q\x01U\x04testq\x02K\x01s.', "(dp1\nS'datatype'\np2\nS'pickle'\np3\ns.", '\x80\x02]q\x01(K\x01K\x02K\x03K\x04e.', "(dp1\nS'datatype'\np2\nS'pickle'\np3\ns.", '\x80\x02U\x06stringq\x01.'])

    def test_with_numpy_arrays(self):
        nparray = np.arange(5)
        self.assertEqual(self.serialize_data([nparray]), ["(dp1\nS'datatype'\np2\nS'numpy'\np3\nsS'dtype'\np4\ncnumpy\ndtype\np5\n(S'i8'\nI0\nI1\ntRp6\n(I3\nS'<'\nNNNI-1\nI-1\nI0\ntbsS'shape'\np7\n(I5\ntp8\ns.", nparray])

    def test_with_mixed(self):
        nparray = np.arange(5)
        objs = [{'test': 1}, [1, 2, 3, 4], 'string', nparray]
        self.assertEqual(self.serialize_data(objs), ["(dp1\nS'datatype'\np2\nS'pickle'\np3\ns.", '\x80\x02}q\x01U\x04testq\x02K\x01s.', "(dp1\nS'datatype'\np2\nS'pickle'\np3\ns.", '\x80\x02]q\x01(K\x01K\x02K\x03K\x04e.', "(dp1\nS'datatype'\np2\nS'pickle'\np3\ns.", '\x80\x02U\x06stringq\x01.', "(dp1\nS'datatype'\np2\nS'numpy'\np3\nsS'dtype'\np4\ncnumpy\ndtype\np5\n(S'i8'\nI0\nI1\ntRp6\n(I3\nS'<'\nNNNI-1\nI-1\nI0\ntbsS'shape'\np7\n(I5\ntp8\ns.", nparray])


class TestDefaultDeserializeData(unittest.TestCase):

    def setUp(self):
        from bokeh.protocol import default_deserialize_data
        from bokeh.protocol import default_serialize_data
        self.deserialize_data = default_deserialize_data
        self.serialize_data = default_serialize_data

    def test_with_python_objects(self):
        pobjs = [{'test': 1}, [1, 2, 3, 4], 'string']
        serialized = self.serialize_data(pobjs)
        self.assertEqual(self.deserialize_data(serialized), pobjs)

    def test_with_numpy_arrays(self):
        nparray = np.arange(5)
        serialized = self.serialize_data([nparray])
        deserialized = self.deserialize_data(serialized)
        self.assertTrue(len(deserialized) == 1)
        self.assertTrue(np.array_equal(deserialized[0], nparray))

    def test_with_mixed(self):
        nparray = np.arange(5)
        objs = [{'test': 1}, [1, 2, 3, 4], 'string', nparray]
        serialized = self.serialize_data(objs)
        deserialized = self.deserialize_data(serialized)
        self.assertTrue(len(deserialized) == 4)
        self.assertEqual(objs[0:2], deserialized[0:2])
        self.assertTrue(np.array_equal(deserialized[3], nparray))

if __name__ == "__main__":
    unittest.main()
