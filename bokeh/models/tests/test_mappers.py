from __future__ import absolute_import

import unittest

from bokeh.models import SegmentedColorMapper, LinearColorMapper
import bokeh.colors as bkColors

class TestSegmentedColorMapper(unittest.TestCase):

    # This method evaluates each of the different methods that a color
    # can be passed to the color mapper class.
    def test_correct_color_transformation(self):
        tmpMapper = SegmentedColorMapper(palette = [bkColors.red, 'red', (255, 0, 0), (255, 0, 0, 0), '#FF0000', '#FF0000FF'])
        self.assertEqual(tmpMapper.palette, ['#FF0000', '#FF0000', '#FF0000', '#FF0000', '#FF0000', '#FF0000'])

    # This method tests to ensure that when a single string is passed
    # instead of a list of colors, that the system fails correctly
    # when the palette is not found.
    def test_fail_to_find_unknown_palette(self):
        self.assertRaises(ValueError, SegmentedColorMapper, palette = 'ThisPaletteDoesNotExist')

    # Check to ensure that if a single alpha value is provided, it is
    # duplicated for the total number of colors defined in the palette
    def test_alpha_broadcasting(self):
        tmpMapper = SegmentedColorMapper(palette=['red', 'white', 'blue'], alpha = 0.5)
        self.assertEqual(tmpMapper.alpha, [0.5, 0.5, 0.5])

    # Check to ensure that an exception is thrown if the alpha value
    # is greater than 1
    def test_alpha_fail_if_greater_than_1(self):
        self.assertRaises(ValueError, SegmentedColorMapper, palette = ['red', 'white'], alpha = 1.1)

    # Check to ensure that an exception is thrown if the alpha value
    # is greater than 1
    def test_alpha_fail_if_less_than_0(self):
        self.assertRaises(ValueError, SegmentedColorMapper, palette = ['red', 'white'], alpha = -1.1)

if __name__ == '__main__':
    unittest.main()
