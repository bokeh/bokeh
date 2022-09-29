#-----------------------------------------------------------------------------
# Copyright (c) 2012 - 2022, Anaconda, Inc., and Bokeh Contributors.
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

import logging # isort:skip
log = logging.getLogger(__name__)

#-----------------------------------------------------------------------------
# Imports
#-----------------------------------------------------------------------------

# Bokeh imports
from ...core.properties import Instance, InstanceDefault
from ...core.validation import error
from ...core.validation.errors import MALFORMED_GRAPH_SOURCE
from ..glyphs import Circle, MultiLine
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
    glyph=Circle(), data_source=ColumnDataSource(data=dict(index=[]))
)

_DEFAULT_EDGE_RENDERER = lambda: GlyphRenderer(
    glyph=MultiLine(), data_source=ColumnDataSource(data=dict(start=[], end=[]))
)

class GraphRenderer(DataRenderer):
    '''

    '''

    # explicit __init__ to support Init signatures
    def __init__(self, *args, **kwargs) -> None:
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
            return " ,".join(missing) + " [%s]" % self

    layout_provider = Instance(LayoutProvider, help="""
    An instance of a ``LayoutProvider`` that supplies the layout of the network
    graph in cartesian space.
    """)

    node_renderer = Instance(GlyphRenderer, default=_DEFAULT_NODE_RENDERER, help="""
    Instance of a ``GlyphRenderer`` containing an ``XYGlyph`` that will be rendered
    as the graph nodes.
    """)

    edge_renderer = Instance(GlyphRenderer, default=_DEFAULT_EDGE_RENDERER, help="""
    Instance of a ``GlyphRenderer`` containing an ``MultiLine`` Glyph that will be
    rendered as the graph edges.
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
