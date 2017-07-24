from __future__ import absolute_import

import unittest

from bokeh.plotting import figure
from bokeh.models import Circle, MultiLine, ColumnDataSource
from bokeh.models.ranges import DataRange1d
from bokeh.models.renderers import GraphRenderer, GlyphRenderer

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

def test_graphrenderer_init_props():
    renderer = GraphRenderer()
    assert renderer.x_range_name == "default"
    assert renderer.y_range_name == "default"
    assert renderer.node_renderer.data_source.data == dict(index=[])
    assert renderer.edge_renderer.data_source.data == dict(start=[], end=[])
    assert renderer.layout_provider is None

def test_graphrenderer_check_malformed_graph_source_no_errors():
    renderer = GraphRenderer()

    check = renderer._check_malformed_graph_source()
    assert check == []

def test_graphrenderer_check_malformed_graph_source_no_node_index():
    node_source = ColumnDataSource()
    node_renderer = GlyphRenderer(data_source=node_source, glyph=Circle())
    renderer = GraphRenderer(node_renderer=node_renderer)

    check = renderer._check_malformed_graph_source()
    assert check != []

def test_graphrenderer_check_malformed_graph_source_no_edge_start_or_end():
    edge_source = ColumnDataSource()
    edge_renderer = GlyphRenderer(data_source=edge_source, glyph=MultiLine())
    renderer = GraphRenderer(edge_renderer=edge_renderer)

    check = renderer._check_malformed_graph_source()
    assert check != []
