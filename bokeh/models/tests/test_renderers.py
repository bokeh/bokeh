from __future__ import absolute_import

import unittest

from bokeh.plotting import figure
from bokeh.models.ranges import DataRange1d

class TestGlyphRenderer(unittest.TestCase):
    def test_warning_about_colons_in_column_labels_for_axis(self):
        invalid_labels = ['0', '1', '2:0']
        plot = figure(
            x_range=invalid_labels,
            y_range=invalid_labels,
            plot_width=900,
            plot_height=400,
        )

        errors = plot._check_colon_in_category_label()

        self.assertEqual(errors, [(
            1003,
            'MALFORMED_CATEGORY_LABEL',
            'Category labels cannot contain colons',
            '[range:x_range] [first_value: 2:0] '
            '[range:y_range] [first_value: 2:0] '
            '[renderer: Figure(id=%r, ...)]' % plot._id
        )])

    def test_validates_colons_only_in_factorial_range(self):
        plot = figure(
            x_range=DataRange1d(start=0.0, end=2.2),
            y_range=['0', '1', '2:0'],
            plot_width=900,
            plot_height=400,
        )

        errors = plot._check_colon_in_category_label()

        self.assertEqual(errors, [(
            1003,
            'MALFORMED_CATEGORY_LABEL',
            'Category labels cannot contain colons',
            '[range:y_range] [first_value: 2:0] '
            '[renderer: Figure(id=%r, ...)]' % plot._id
        )])

if __name__ == '__main__':
    unittest.main()
