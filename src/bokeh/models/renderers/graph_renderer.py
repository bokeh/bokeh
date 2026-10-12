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
from ...core.property.instance import Instance, InstanceDefault
from ...core.validation import error
from ...core.validation.errors import INVALID_PROPERTY_VALUE, MALFORMED_GRAPH_SOURCE
from ..glyphs import (
    Bezier,
    MultiLine,
    Patches,
    Scatter,
    Segment,
)
from ..graphs import GraphHitTestPolicy, LayoutProvider, NodesOnly
from ..sources import ColumnDataSource
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

_DEFAULT_NODE_RENDERER = lambda: GlyphRenderer(
    glyph=Scatter(), data_source=ColumnDataSource(data=dict(index=[])),
)

_DEFAULT_EDGE_RENDERER = lambda: GlyphRenderer(
    glyph=MultiLine(), data_source=ColumnDataSource(data=dict(start=[], end=[])),
)

class GraphRenderer(DataRenderer):
    '''

    '''

    # explicit __init__ to support Init signatures
    def __init__(self, *args: Any, **kwargs: Any) -> None:
        super().__init__(*args, **kwargs)

    @error(MALFORMED_GRAPH_SOURCE)
    def _check_malformed_graph_source(self):
        missing = []
        if "index" not in self.node_renderer.data_source.column_names:
            missing.append("Column 'index' is missing in GraphSource.node_renderer.data_source")
        if "start" not in self.edge_renderer.data_source.column_names:
            missing.append("Column 'start' is missing in GraphSource.edge_renderer.data_source")
        if "end" not in self.edge_renderer.data_source.column_names:
            missing.append("Column 'end' is missing in GraphSource.edge_renderer.data_source")
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

    layout_provider = Instance(LayoutProvider, help="""
    An instance of a ``LayoutProvider`` that supplies the layout of the network
    graph in cartesian space.
    """)

    node_renderer = Instance(GlyphRenderer, default=_DEFAULT_NODE_RENDERER, help="""
    Instance of a ``GlyphRenderer`` containing an ``XYGlyph`` that will be rendered
    as the graph nodes.
    """)

    edge_renderer = Instance(GlyphRenderer, default=_DEFAULT_EDGE_RENDERER, help="""
    Instance of a ``GlyphRenderer`` containing a ``MultiLine``, ``Patches``, ``Segment``, or ``Bezier`` glyph that will be
    rendered as the graph edges. Segment endpoints follow the layout's edge paths.
    Bezier controls may be supplied in ``cx0``, ``cy0``, ``cx1``, and ``cy1``
    edge-source columns. Without those columns, Bezier edges are straight.
    """)

    selection_policy = Instance(GraphHitTestPolicy, default=InstanceDefault(NodesOnly), help="""
    An instance of a ``GraphHitTestPolicy`` that provides the logic for selection
    of graph components.
    """)

    inspection_policy = Instance(GraphHitTestPolicy, default=InstanceDefault(NodesOnly), help="""
    An instance of a ``GraphHitTestPolicy`` that provides the logic for inspection
    of graph components.
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
