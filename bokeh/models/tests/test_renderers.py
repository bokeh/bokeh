from __future__ import absolute_import

import unittest

from bokeh.models.renderers import GlyphRenderer
from bokeh.plotting import ColumnDataSource, figure
from bokeh.models.ranges import DataRange1d


class TestGlyphRenderer(unittest.TestCase):
    def test_warning_about_colons_in_column_labels(self):
        invalid_labels = ['0', '1:0']
        ds = ColumnDataSource(data={'a': invalid_labels, 'b': invalid_labels})
        plot = figure()
        plot.rect('a', 'b', 1, 1, source=ds)
        renderer = plot.select({'type': GlyphRenderer})[0]

        errors = renderer._check_colon_in_category_label()

        self.assertEqual(errors, [(
            1003,
            'MALFORMED_CATEGORY_LABEL',
            'Category labels are malformed',
            '[field:a] [first_value: 1:0] [field:b] [first_value: 1:0] '
            '[renderer: '
            'GlyphRenderer, ViewModel:GlyphRenderer, ref _id: '
            '%s]' % renderer._id
        )])

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
            'Category labels are malformed',
            '[range:x_range] [first_value: 2:0] '
            '[range:y_range] [first_value: 2:0] '
            '[renderer: Figure, ViewModel:Plot, ref _id: '
            '%s]' % plot._id
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
            'Category labels are malformed',
            '[range:y_range] [first_value: 2:0] '
            '[renderer: Figure, ViewModel:Plot, ref _id: '
            '%s]' % plot._id
        )])




if __name__ == '__main__':
    unittest.main()
