from __future__ import absolute_import
import unittest


class TestRange1d(unittest.TestCase):

    def setUp(self):
        from bokeh.models.ranges import Range1d
        self.range1d = Range1d

    def test_init(self):
        self.assertRaises(ValueError, self.range1d, 1, 2, start=1, end=2)
        self.assertRaises(ValueError, self.range1d, 1, 2, 3)
        range1d = self.range1d(1, 2)
        assert range1d
        range1d = self.range1d(start=1, end=2)
        assert range1d

class TestFactorRange(unittest.TestCase):

    def setUp(self):
        from bokeh.models.ranges import FactorRange
        self.factorRange = FactorRange

    def test_init(self):
        self.assertRaises(ValueError, self.factorRange, [1, 2, 3], factors=[1, 2, 3])
        self.assertRaises(ValueError, self.factorRange, [1, 2, 3, 4])
        factorRange = self.factorRange(1, 2)
        assert factorRange
        factorRange = self.factorRange(factors=[1, 2, 3, 4, 5])
        assert factorRange



if __name__ == "__main__":
    unittest.main()
