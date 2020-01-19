#-----------------------------------------------------------------------------
# Copyright (c) 2012 - 2019, Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Boilerplate
#-----------------------------------------------------------------------------
import pytest ; pytest

#-----------------------------------------------------------------------------
# Imports
#-----------------------------------------------------------------------------

# Bokeh imports
from bokeh.models import ColumnDataSource, Scatter, X

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

#-----------------------------------------------------------------------------
# Private API
#-----------------------------------------------------------------------------

def test__graph_will_convert_dataframes_to_sources(pd):
    node_source = pd.DataFrame(data=dict(foo=[]))
    edge_source = pd.DataFrame(data=dict(start=[], end=[], bar=[]))

    kw = bpg.get_graph_kwargs(node_source, edge_source)

    # 'index' column is added from pandas df
    assert set(kw['node_renderer'].data_source.data.keys()) == {"index", "foo"}
    assert set(kw['edge_renderer'].data_source.data.keys()) == {"index", "start", "end", "bar"}

def test__graph_will_handle_sources_correctly():
    node_source = ColumnDataSource(data=dict(foo=[]))
    edge_source = ColumnDataSource(data=dict(start=[], end=[], bar=[]))

    kw = bpg.get_graph_kwargs(node_source, edge_source)

    assert set(kw['node_renderer'].data_source.data.keys()) == {"foo"}
    assert set(kw['edge_renderer'].data_source.data.keys()) == {"start", "end", "bar"}

def test__graph_properly_handle_node_property_mixins():
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

def test__graph_handles_node_marker_correctly():
    kw = bpg.get_graph_kwargs({}, {}, node_marker='x')
    node_glyph = kw['node_renderer'].glyph
    assert isinstance(node_glyph, X)

def test__graph_handles_node_marker_dataspec_correctly():
    node_source = {'marker': ['square', 'circle', 'x']}

    kw = bpg.get_graph_kwargs(node_source, {}, node_marker='marker')

    node_glyph = kw['node_renderer'].glyph
    assert isinstance(node_glyph, Scatter)
    assert node_glyph.marker == {'field': 'marker'}

def test__graph_properly_handle_edge_property_mixins():
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
