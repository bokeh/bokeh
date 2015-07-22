from __future__ import absolute_import

import unittest
from bokeh.util.serialization import traverse_data

class TestTraverseData(unittest.TestCase):
    testing = [[float('nan'), 3], [float('-inf'), [float('inf')]]]
    expected = [['NaN', 3.0], ['-Infinity', ['Infinity']]]

    def test_return_valid_json(self):
        self.assertTrue(traverse_data(self.testing) == self.expected)

    def test_with_numpy(self):
        self.assertTrue(traverse_data(self.testing, True) == self.expected)

    def test_without_numpy(self):
        self.assertTrue(traverse_data(self.testing, False) == self.expected)

if __name__ == '__main__':
    unittest.main()
