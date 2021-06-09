#-----------------------------------------------------------------------------
# Copyright (c) 2012 - 2021, Anaconda, Inc., and Bokeh Contributors.
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
from bokeh.models import (
    Circle,
    ColumnDataSource,
    IndexFilter,
    Line,
    MultiLine,
    Patch,
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


class TestGlyphRenderer:
    @pytest.mark.parametrize('glyph', [Line, Patch])
    def test_check_cdsview_filters_with_connected_error(self, glyph) -> None:
        renderer = bmr.GlyphRenderer(data_source=ColumnDataSource())
        renderer.glyph = glyph()

        check = renderer._check_cdsview_filters_with_connected()
        assert check == []

        renderer.view.filters = [IndexFilter()]
        check = renderer._check_cdsview_filters_with_connected()
        assert check != []


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
