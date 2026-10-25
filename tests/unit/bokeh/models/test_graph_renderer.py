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

#-----------------------------------------------------------------------------
# Imports
#-----------------------------------------------------------------------------

import pytest

from bokeh.models import (
    Bezier,
    Circle,
    ColumnDataSource,
    MultiLine,
    Patches,
    Segment,
    StaticLayoutProvider,
)

# Module under test
import bokeh.models.renderers as bmr # isort:skip

#-----------------------------------------------------------------------------
# Setup
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# General API
#-----------------------------------------------------------------------------


class TestGraphRenderer:
    def test_init_props(self) -> None:
        layout_provider = StaticLayoutProvider()
        renderer = bmr.GraphRenderer(layout_provider=layout_provider)
        assert renderer.x_range_name == "default"
        assert renderer.y_range_name == "default"
        assert renderer.node_renderer.data_source.data == dict(index=[])
        assert renderer.edge_renderer.data_source.data == dict(start=[], end=[])
        assert renderer.layout_provider == layout_provider

    def test_check_malformed_graph_source_no_errors(self) -> None:
        renderer = bmr.GraphRenderer()

        check = renderer._check_malformed_graph_source()
        assert check == []

    def test_check_malformed_graph_source_no_node_index(self) -> None:
        node_source = ColumnDataSource()
        node_renderer = bmr.GlyphRenderer(data_source=node_source, glyph=Circle())
        renderer = bmr.GraphRenderer(node_renderer=node_renderer)

        check = renderer._check_malformed_graph_source()
        assert check != []

    def test_check_malformed_graph_source_no_edge_start_or_end(self) -> None:
        edge_source = ColumnDataSource()
        edge_renderer = bmr.GlyphRenderer(data_source=edge_source, glyph=MultiLine())
        renderer = bmr.GraphRenderer(edge_renderer=edge_renderer)

        check = renderer._check_malformed_graph_source()
        assert check != []

#-----------------------------------------------------------------------------
# Dev API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Private API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Code
#-----------------------------------------------------------------------------


@pytest.mark.parametrize("glyph", [Segment(), Bezier(), MultiLine(), Patches()])
def test_supported_edge_glyphs(glyph) -> None:
    graph = bmr.GraphRenderer()
    graph.edge_renderer.glyph = glyph
    assert graph._check_edge_glyph() == []


def test_invalid_bezier_controls() -> None:
    graph = bmr.GraphRenderer()
    graph.edge_renderer.glyph = Bezier()
    graph.edge_renderer.data_source.data = dict(start=[0], end=[1], cx0=[0.2])
    assert graph._check_bezier_controls()
    graph.edge_renderer.data_source.data = dict(start=[0], end=[1], cx0=[0.2], cy0=[0.3], cx1=[0.4], cy1=[0.5])
    assert graph._check_bezier_controls() == []
