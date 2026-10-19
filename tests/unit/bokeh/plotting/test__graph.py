#-----------------------------------------------------------------------------
# Copyright (c) Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Boilerplate
#-----------------------------------------------------------------------------
from __future__ import annotations # isort:skip

import pytest ; pytest

#-----------------------------------------------------------------------------
# Imports
#-----------------------------------------------------------------------------

# Bokeh imports
from bokeh.core.properties import field, value
from bokeh.models import (
    BezierEdgePathProvider,
    ColumnDataSource,
    GraphSelectionPolicy,
    IndexedDataSource,
    MultiLine,
    Scatter,
    StaticLayoutProvider,
)
from bokeh.plotting import figure

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

        # The dataframe index supplies node ids when no explicit id column is
        # present. Edge topology is already explicit, so its generated index
        # is omitted.
        assert set(kw['node_renderer'].data_source.data.keys()) == {"index", "foo"}
        assert set(kw['edge_renderer'].data_source.data.keys()) == {"start", "end", "bar"}

    def test_handle_sources(self) -> None:
        node_source = ColumnDataSource(data=dict(foo=[]))
        edge_source = ColumnDataSource(data=dict(start=[], end=[], bar=[]))

        kw = bpg.get_graph_kwargs(node_source, edge_source)

        assert set(kw['node_renderer'].data_source.data.keys()) == {"foo"}
        assert set(kw['edge_renderer'].data_source.data.keys()) == {"start", "end", "bar"}
        assert kw['data_source'].nodes is node_source
        assert kw['data_source'].edges is edge_source

    def test_handle_storage_neutral_sources(self) -> None:
        class RecordDataSource(IndexedDataSource):
            pass

        node_source = RecordDataSource()
        edge_source = RecordDataSource()
        kw = bpg.get_graph_kwargs(node_source, edge_source)

        assert kw['node_renderer'].data_source is node_source
        assert kw['edge_renderer'].data_source is edge_source
        assert kw['data_source'].nodes is node_source
        assert kw['data_source'].edges is edge_source

    def test_routes_selection_configuration(self) -> None:
        selection_policy = GraphSelectionPolicy(node_hops=2)
        inspection_policy = GraphSelectionPolicy(include_end_nodes=True)
        kw = bpg.get_graph_kwargs(
            {}, {},
            selection_policy=selection_policy,
            inspection_policy=inspection_policy,
            selection_target="nodes",
            inspection_target="edges",
        )

        assert kw["data_source"].selection_policy is selection_policy
        assert kw["inspection_policy"] is inspection_policy
        assert kw["selection_target"] == "nodes"
        assert kw["inspection_target"] == "edges"

    def test_routes_edge_path_provider(self) -> None:
        edge_path_provider = BezierEdgePathProvider(curvature=0.25)

        kw = bpg.get_graph_kwargs({}, {}, edge_path_provider=edge_path_provider)

        assert kw["edge_path_provider"] is edge_path_provider

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
        kw = bpg.get_graph_kwargs({}, {}, node_marker=marker)
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
        with pytest.raises(TypeError):
            bpg.get_graph_kwargs(42, {})

        with pytest.raises(TypeError):
            bpg.get_graph_kwargs({}, 42)


def test_figure_graph_routes_edge_path_provider() -> None:
    edge_path_provider = BezierEdgePathProvider(curvature=0.25)

    renderer = figure().graph(
        {},
        {},
        StaticLayoutProvider(),
        edge_path_provider=edge_path_provider,
    )

    assert renderer.edge_path_provider is edge_path_provider

#-----------------------------------------------------------------------------
# Private API
#-----------------------------------------------------------------------------
