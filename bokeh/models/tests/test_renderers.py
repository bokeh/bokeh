from __future__ import absolute_import

import unittest

from mock import patch

from bokeh.models.renderers import GlyphRenderer
from bokeh.plotting import ColumnDataSource, figure
from bokeh.validation import check_integrity


class TestGlyphRenderer(unittest.TestCase):
    def test_warning_about_colons_in_column_labels(self):
        sh = ['0', '1:0']
        plot = figure()
        plot.rect('a', 'b', 1, 1, source=ColumnDataSource(data={'a': sh, 'b': sh}))
        renderer = plot.select({'type': GlyphRenderer})[0]

        errors = renderer._check_colon_in_category_label()

        self.assertEqual(errors, [(
            1003,
            'COLON_IN_CATEGORY_LABEL',
            'Category label contains colons',
            '[field:a] [first_value: 1:0] [field:b] [first_value: 1:0] '
            '[renderer: '
            'GlyphRenderer, ViewModel:GlyphRenderer, ref _id: '
            '%s]' % renderer._id
        )])


if __name__ == '__main__':
    unittest.main()
