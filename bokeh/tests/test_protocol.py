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
		s = np.arange(5)
		self.assertEqual(self.encoder.default(s),[0,1,2,3,4])

	def test_numpyint(self):
		s = np.int64(1)
		self.assertEqual(self.encoder.default(s),1)
		self.assertIsInstance(self.encoder.default(s),int)

	def test_numpyfloat(self):
		s = np.float64(1.33)
		self.assertEqual(self.encoder.default(s),1.33)
		self.assertIsInstance(self.encoder.default(s),float)

	def test_pd_timestamp(self):
		ts = pd.tslib.Timestamp('April 28, 1948')
		self.assertEqual(self.encoder.default(ts),-684115200000)
		
# class TestProtocolHelper(unittest.TestCase):
# 	def setUp(self):
# 		from bokeh.protocol import ProtocolHelper
# 		self.ph = ProtocolHelper()
	
# class TestSerializeJson(unittest.TestCase):
# 	def test_with_property(self):
# 		from bokeh.protocol import serialize_json

# class TestDefaultSerializeData(unittest.TestCase):
# 	def test_with_property(self):
# 		from bokeh.protocol import default_serialize_data

# class TestDefaultDeserializeData(unittest.TestCase):
# 	def test_with_property(self):
# 		from bokeh.protocol import default_deserialize_data



if __name__ == "__main__":
    unittest.main()
