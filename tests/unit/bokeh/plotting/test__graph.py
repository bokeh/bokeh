#-----------------------------------------------------------------------------
# Copyright (c) Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Boilerplate
#-----------------------------------------------------------------------------
from __future__ import annotations

#-----------------------------------------------------------------------------
# Imports
#-----------------------------------------------------------------------------
import pytest

# Bokeh imports
from bokeh.core.properties import field, value
from bokeh.models import (
    ColumnDataSource,
    MultiLine,
    RecordDataSource,
    Scatter,
)

# Module under test
import bokeh.plotting._graph as bpg # isort:skip

#-----------------------------------------------------------------------------
# Setup
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# General API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Dev API
#-----------------------------------------------------------------------------


class Test_get_graph_kwargs:
    def test_convert_dataframes_to_sources(self) -> None:
        pd = pytest.importorskip("pandas")
        node_source = pd.DataFrame(data=dict(foo=[]))
        edge_source = pd.DataFrame(data=dict(start=[], end=[], bar=[]))

        kw = bpg.get_graph_kwargs(node_source, edge_source)

        assert set(kw['node_renderer'].data_source.data.keys()) == {"index", "foo"}
        assert set(kw['edge_renderer'].data_source.data.keys()) == {"index", "start", "end", "bar"}

    def test_edge_mapping_can_defer_endpoints_until_validation(self) -> None:
        kw = bpg.get_graph_kwargs({"index": [0, 1]}, {"weight": [1]})

        assert kw["data_source"].edges.data == {"weight": [1]}

    def test_preserves_alias_named_attributes_with_canonical_topology_columns(self) -> None:
        nodes = {"index": [0, 1], "id": ["a", "b"]}
        edges = {"start": [0], "end": [1], "source": ["attribute"]}
        kw = bpg.get_graph_kwargs(nodes, edges)

        assert kw["data_source"].nodes.data == nodes
        assert kw["data_source"].edges.data == edges

    def test_rejects_duplicate_node_ids_in_column_mappings(self) -> None:
        with pytest.raises(ValueError, match="duplicate graph node identifier"):
            bpg.get_graph_kwargs({"index": [0, 0]}, {"start": [0], "end": [0]})

    def test_handle_sources(self) -> None:
        node_source = ColumnDataSource(data=dict(foo=[]))
        edge_source = ColumnDataSource(data=dict(start=[], end=[], bar=[]))

        kw = bpg.get_graph_kwargs(node_source, edge_source)

        assert set(kw['node_renderer'].data_source.data.keys()) == {"foo"}
        assert set(kw['edge_renderer'].data_source.data.keys()) == {"start", "end", "bar"}
        assert kw['data_source'].nodes is node_source
        assert kw['data_source'].edges is edge_source

    def test_preserves_record_data_sources(self) -> None:
        node_source = RecordDataSource(records=[{"index": "A"}, {"index": "B"}])
        edge_source = RecordDataSource(records=[{"start": "A", "end": "B"}])
        kw = bpg.get_graph_kwargs(node_source, edge_source)

        assert kw['node_renderer'].data_source is node_source
        assert kw['edge_renderer'].data_source is edge_source
        assert kw['data_source'].nodes is node_source
        assert kw['data_source'].edges is edge_source

    def test_handle_node_property_mixins(self) -> None:
        kwargs = dict(node_fill_color="purple", node_selection_fill_color="blue",
                    node_nonselection_fill_color="yellow", node_hover_fill_color="red",
                    node_muted_fill_color="orange", node_radius=0.6)

        kw = bpg.get_graph_kwargs({}, {}, **kwargs)

        r = kw['node_renderer']
        assert r.glyph.fill_color == "purple"
        assert r.selection_glyph.fill_color == "blue"
        assert r.nonselection_glyph.fill_color == "yellow"
        assert r.hover_glyph.fill_color == "red"
        assert r.muted_glyph.fill_color == "orange"

        assert r.glyph.radius == 0.6
        assert r.selection_glyph.radius == 0.6
        assert r.nonselection_glyph.radius == 0.6
        assert r.hover_glyph.radius == 0.6
        assert r.muted_glyph.radius == 0.6

    def test_handle_node_marker(self) -> None:
        kw = bpg.get_graph_kwargs({}, {}, node_marker='x')
        node_glyph = kw['node_renderer'].glyph
        assert isinstance(node_glyph, Scatter) and node_glyph.marker == "x"

    def test_handle_node_marker_value(self) -> None:
        marker = value("diamond")
        kw = bpg.get_graph_kwargs({}, {}, node_marker=marker)
        node_glyph = kw['node_renderer'].glyph
        assert isinstance(node_glyph, Scatter) and node_glyph.marker == marker

    def test_handle_node_marker_dataspec_correctly(self) -> None:
        node_source = {'marker': ['square', 'circle', 'x']}

        kw = bpg.get_graph_kwargs(node_source, {}, node_marker='marker')

        node_glyph = kw['node_renderer'].glyph
        assert isinstance(node_glyph, Scatter)
        assert node_glyph.marker == field('marker')

    def test_handle_prefixed_glyph_properties(self) -> None:
        kw = bpg.get_graph_kwargs({}, {}, node_name="nodes", edge_name="edges")

        assert kw['node_renderer'].glyph.name == "nodes"
        assert kw['edge_renderer'].glyph.name == "edges"

    def test_ignore_unprefixed_glyph_properties(self) -> None:
        kw = bpg.get_graph_kwargs({}, {}, name="graph", tags=["graph"])

        assert kw['name'] == "graph"
        assert kw['node_renderer'].glyph.name is None
        assert kw['node_renderer'].glyph.tags == []
        assert kw['edge_renderer'].glyph.name is None
        assert kw['edge_renderer'].glyph.tags == []

    def test_handle_node_marker_field(self) -> None:
        marker = field("marker")
        kw = bpg.get_graph_kwargs({}, {}, node_marker=marker)
        node_glyph = kw['node_renderer'].glyph
        assert isinstance(node_glyph, Scatter) and node_glyph.marker == marker

    @pytest.mark.parametrize(("marker", "expected"), [
        ({"field": "marker"}, field("marker")),
        ({"value": "diamond"}, value("diamond")),
    ])
    def test_handle_node_marker_dict(self, marker, expected) -> None:
        kw = bpg.get_graph_kwargs({"marker": ["square"]}, {}, node_marker=marker)
        node_glyph = kw['node_renderer'].glyph
        assert isinstance(node_glyph, Scatter) and node_glyph.marker == expected

    def test_handle_edge_property_mixins(self) -> None:
        kwargs = dict(edge_line_color="purple", edge_selection_line_color="blue",
                    edge_nonselection_line_color="yellow", edge_hover_line_color="red",
                    edge_muted_line_color="orange", edge_line_width=23)

        kw = bpg.get_graph_kwargs({}, {}, **kwargs)

        r = kw['edge_renderer']
        assert r.glyph.line_color == "purple"
        assert r.selection_glyph.line_color == "blue"
        assert r.nonselection_glyph.line_color == "yellow"
        assert r.hover_glyph.line_color == "red"
        assert r.muted_glyph.line_color == "orange"

        assert r.glyph.line_width == 23
        assert r.selection_glyph.line_width == 23
        assert r.nonselection_glyph.line_width == 23
        assert r.hover_glyph.line_width == 23
        assert r.muted_glyph.line_width == 23

    def test_default_muted_glyph(self) -> None:
        kwargs = dict(
            edge_line_color="purple", edge_line_alpha=0.7,
            node_fill_color="red", node_fill_alpha=0.8, node_line_color="blue",
        )
        kw = bpg.get_graph_kwargs({}, {}, **kwargs)

        r = kw['edge_renderer']
        assert isinstance(r.muted_glyph, MultiLine)
        assert r.muted_glyph.line_color == "purple"
        assert r.muted_glyph.line_alpha == 0.2
        r = kw['node_renderer']
        assert isinstance(r.muted_glyph, Scatter)
        assert r.muted_glyph.fill_color == "red"
        assert r.muted_glyph.line_alpha == 0.2
        assert r.muted_glyph.line_color == "blue"

    def test_bad_input(self) -> None:
        msg = """\
Failed to auto-convert <class 'int'> to ColumnDataSource.
 Original error: expected a dict, dataclass, or eager dataframe support by Narwhals, got 42"""
        with pytest.raises(ValueError, match=msg):
            bpg.get_graph_kwargs(42, {})

        with pytest.raises(ValueError, match=msg):
            bpg.get_graph_kwargs({}, 42)

#-----------------------------------------------------------------------------
# Private API
#-----------------------------------------------------------------------------
