from __future__ import absolute_import

import unittest

from bokeh.util.serialization import make_id, traverse_data

class DummyRequestCallable():
    def json(self):
        return True

class DummyRequestProperty():
    json = True

class TestMakeId(unittest.TestCase):
    def test_basic(self):
        self.assertEqual(len(make_id()), 36)
        self.assertTrue(isinstance(make_id(), str))

    def test_simple_ids(self):
        import os
        os.environ["BOKEH_SIMPLE_IDS"] = "yes"
        self.assertEqual(make_id(), "1001")
        self.assertEqual(make_id(), "1002")
        del os.environ["BOKEH_SIMPLE_IDS"]

class TestTraverseData(unittest.TestCase):
    testing = [[float('nan'), 3], [float('-inf'), [float('inf')]]]
    expected = [['NaN', 3.0], ['-Infinity', ['Infinity']]]

    def test_return_valid_json(self):
        self.assertTrue(traverse_data(self.testing) == self.expected)

    def test_with_numpy(self):
        self.assertTrue(traverse_data(self.testing, True) == self.expected)

    def test_without_numpy(self):
        self.assertTrue(traverse_data(self.testing, False) == self.expected)

if __name__ == "__main__":
    unittest.main()
