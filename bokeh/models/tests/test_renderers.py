#-----------------------------------------------------------------------------
# Copyright (c) 2012 - 2019, Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Boilerplate
#-----------------------------------------------------------------------------
from __future__ import absolute_import, division, print_function, unicode_literals

import pytest ; pytest

#-----------------------------------------------------------------------------
# Imports
#-----------------------------------------------------------------------------

# Standard library imports

# External imports

# Bokeh imports
from bokeh.models import Circle, MultiLine, ColumnDataSource

# Module under test
from bokeh.models.renderers import GlyphRenderer, GraphRenderer

#-----------------------------------------------------------------------------
# Setup
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# General API
#-----------------------------------------------------------------------------

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

#-----------------------------------------------------------------------------
# Dev API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Private API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Code
#-----------------------------------------------------------------------------
