import unittest
import json
import pandas as pd
import numpy as np

class TestNumpyJSONEncoder(unittest.TestCase):
	def setUp(self):
		from bokeh.protocol import NumpyJSONEncoder
		self.encoder = NumpyJSONEncoder()

	def test_fail(self):
		self.assertRaises(TypeError,self.encoder.default , {'testing' : 1})

	def test_panda_series(self):
		s = pd.Series([1,3,5,6,8])
		self.assertEqual(self.encoder.default(s),[1,3,5,6,8])

	def test_numpyarray(self):
		a = np.arange(5)
		self.assertEqual(self.encoder.default(a),[0,1,2,3,4])

	def test_numpyint(self):
		npint = np.int64(1)
		self.assertEqual(self.encoder.default(npint),1)
		self.assertIsInstance(self.encoder.default(npint),int)

	def test_numpyfloat(self):
		npfloat = np.float64(1.33)
		self.assertEqual(self.encoder.default(npfloat),1.33)
		self.assertIsInstance(self.encoder.default(npfloat),float)

	def test_pd_timestamp(self):
		ts = pd.tslib.Timestamp('April 28, 1948')
		self.assertEqual(self.encoder.default(ts),-684115200000)

class TestSerializeJson(unittest.TestCase):
	def setUp(self):
		from bokeh.protocol import serialize_json
		self.serialize = serialize_json

	def test_with_basic(self):
		self.assertEqual(self.serialize({'test' : [1 ,2 ,3]}), '{"test": [1, 2, 3]}')

	def test_with_np_array(self):
		a = np.arange(5)
		self.assertEqual(self.serialize(a),'[0, 1, 2, 3, 4]')

	def test_with_pd_series(self):
		s = pd.Series([0,1,2,3,4])
		self.assertEqual(self.serialize(s),'[0, 1, 2, 3, 4]')

	def test_with_pd_ts(self):
		ts = pd.tslib.Timestamp('April 28, 1948')
		self.assertEqual(self.serialize(ts), '-684115200000.0')



# class TestDefaultSerializeData(unittest.TestCase):
# 	def test_with_property(self):
# 		from bokeh.protocol import default_serialize_data

# class TestDefaultDeserializeData(unittest.TestCase):
# 	def test_with_property(self):
# 		from bokeh.protocol import default_deserialize_data

# class TestProtocolHelper(unittest.TestCase):
# 	def setUp(self):
# 		from bokeh.protocol import ProtocolHelper
# 		self.ph = ProtocolHelper()
	




if __name__ == "__main__":
    unittest.main()
