#-----------------------------------------------------------------------------
# Copyright (c) Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------
'''

'''
#-----------------------------------------------------------------------------
# Boilerplate
#-----------------------------------------------------------------------------
from __future__ import annotations

# pyright: reportAbstractUsage=false, reportArgumentType=false, reportAttributeAccessIssue=false

import logging # isort:skip
log = logging.getLogger(__name__)

#-----------------------------------------------------------------------------
# Imports
#-----------------------------------------------------------------------------

# Standard library imports
from typing import Any

# Bokeh imports
from ...core.property.enum import Enum
from ...core.property.instance import Instance, InstanceDefault
from ...core.property.readonly import Readonly
from ...core.validation import error
from ...core.validation.errors import INVALID_PROPERTY_VALUE, MALFORMED_GRAPH_SOURCE
from ..glyphs import (
    Bezier,
    MultiLine,
    Patches,
    Scatter,
    Segment,
)
from ..graphs import EdgePathProvider, LayoutProvider, StraightEdgePathProvider
from ..selections import GraphSelectionPolicy
from ..sources import ColumnarDataSource, ColumnDataSource, GraphDataSource, IndexedDataSource
from .glyph_renderer import GlyphRenderer
from .renderer import DataRenderer

#-----------------------------------------------------------------------------
# Globals and constants
#-----------------------------------------------------------------------------

__all__ = (
    "GraphRenderer",
)

#-----------------------------------------------------------------------------
# General API
#-----------------------------------------------------------------------------

# TODO: (bev) InstanceDefault would be better for these but the property
# values are also model instances and that is too complicated for now.

def _default_node_renderer(source: IndexedDataSource) -> GlyphRenderer:
    return GlyphRenderer(glyph=Scatter(), data_source=source)

def _default_edge_renderer(source: IndexedDataSource) -> GlyphRenderer:
    return GlyphRenderer(glyph=MultiLine(), data_source=source)

class GraphRenderer(DataRenderer):
    ''' Render graph nodes and edges from a coupled ``GraphDataSource``.

    The node and edge glyph renderers remain independently configurable, but
    their data sources are bound to ``data_source.nodes`` and
    ``data_source.edges`` respectively.
    '''

    def __init__(self, *args: Any, **kwargs: Any) -> None:
        data_source = kwargs.get("data_source")
        node_renderer = kwargs.get("node_renderer")
        edge_renderer = kwargs.get("edge_renderer")

        if data_source is None:
            node_source = node_renderer.data_source if node_renderer is not None else ColumnDataSource(data=dict(index=[]))
            edge_source = edge_renderer.data_source if edge_renderer is not None else ColumnDataSource(data=dict(start=[], end=[]))
            data_source = GraphDataSource(nodes=node_source, edges=edge_source)

        if node_renderer is None:
            node_renderer = _default_node_renderer(data_source.nodes)
        elif node_renderer.data_source is not data_source.nodes:
            raise ValueError("GraphRenderer node_renderer and data_source must use the same node source")

        if edge_renderer is None:
            edge_renderer = _default_edge_renderer(data_source.edges)
        elif edge_renderer.data_source is not data_source.edges:
            raise ValueError("GraphRenderer edge_renderer and data_source must use the same edge source")

        kwargs.update(data_source=data_source, node_renderer=node_renderer, edge_renderer=edge_renderer)
        super().__init__(*args, **kwargs)

    @error(MALFORMED_GRAPH_SOURCE)
    def _check_malformed_graph_source(self):
        missing = []
        node_source = self.data_source.nodes
        edge_source = self.data_source.edges
        if isinstance(node_source, ColumnarDataSource) and "index" not in node_source.column_names:
            missing.append("Field 'index' is missing in GraphDataSource.nodes")
        if isinstance(edge_source, ColumnarDataSource) and "start" not in edge_source.column_names:
            missing.append("Field 'start' is missing in GraphDataSource.edges")
        if isinstance(edge_source, ColumnarDataSource) and "end" not in edge_source.column_names:
            missing.append("Field 'end' is missing in GraphDataSource.edges")
        if missing:
            return " ,".join(missing) + f" [{self}]"

    @error(INVALID_PROPERTY_VALUE)
    def _check_edge_glyph(self):
        glyph = self.edge_renderer.glyph
        if not isinstance(glyph, (MultiLine, Patches, Segment, Bezier)):
            return f"Graph edge glyph must be MultiLine, Patches, Segment, or Bezier [{self}]"

    @error(MALFORMED_GRAPH_SOURCE)
    def _check_bezier_controls(self):
        if isinstance(self.edge_renderer.glyph, Bezier):
            data = self.edge_renderer.data_source.data
            names = ("cx0", "cy0", "cx1", "cy1")
            if any(name in data for name in names):
                count = len(data.get("start", []))
                if any(name not in data or len(data[name]) != count for name in names):
                    return f"Bezier graph edges require four control columns with one value per edge [{self}]"

    data_source = Readonly(Instance(GraphDataSource), default=InstanceDefault(GraphDataSource), help="""
    A topology-aware source coupling the graph's node and edge data sources.
    """)

    layout_provider = Instance(LayoutProvider, help="""
    An instance of a ``LayoutProvider`` that supplies the layout of the network
    graph in cartesian space.
    """)

    edge_path_provider = Instance(EdgePathProvider, default=InstanceDefault(StraightEdgePathProvider), help="""
    An edge path provider that derives sampled paths from the graph topology
    and node layout. Explicit ``xs`` and ``ys`` edge fields take precedence.
    """)

    node_renderer = Readonly(Instance(GlyphRenderer), default=InstanceDefault(GlyphRenderer), help="""
    Instance of a ``GlyphRenderer`` containing an ``XYGlyph`` that will be rendered
    as the graph nodes.
    """)

    edge_renderer = Readonly(Instance(GlyphRenderer), default=InstanceDefault(GlyphRenderer), help="""
    Instance of a ``GlyphRenderer`` containing a ``MultiLine``, ``Patches``, ``Segment``, or ``Bezier`` glyph that will be
    rendered as the graph edges. Segment endpoints follow the layout's edge paths.
    Bezier controls may be supplied in ``cx0``, ``cy0``, ``cx1``, and ``cy1``
    edge-source columns. Without those columns, Bezier edges are straight.
    """)

    selection_target = Enum("nodes", "edges", default="nodes", help="""
    Which graph component receives direct hit tests for selection. Topology
    expansion is configured on ``data_source.selection_policy``.
    """)

    inspection_target = Enum("nodes", "edges", default="nodes", help="""
    Which graph component receives direct hit tests for inspection.
    """)

    inspection_policy = Instance(GraphSelectionPolicy, default=InstanceDefault(GraphSelectionPolicy), help="""
    Controls how transient graph inspections propagate through graph topology,
    independently of ``data_source.selection_policy``.
    """)

#-----------------------------------------------------------------------------
# Dev API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Private API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Code
#-----------------------------------------------------------------------------
