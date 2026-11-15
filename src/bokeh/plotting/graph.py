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

import logging # isort:skip
log = logging.getLogger(__name__)

#-----------------------------------------------------------------------------
# Imports
#-----------------------------------------------------------------------------

from typing import (
    TYPE_CHECKING,
    Any,
    Callable,
    Mapping,
)

from ..models.graphs import StaticLayoutProvider
from ..models.renderers import GraphRenderer
from ..models.sources import GraphDataSource

if TYPE_CHECKING:
    import networkx as nx

    from ..models.graphs import NodePosition

    type GraphLayout = Mapping[Any, NodePosition]
    type LayoutFunction = GraphLayout | Callable[..., GraphLayout]

#-----------------------------------------------------------------------------
# Globals and constants
#-----------------------------------------------------------------------------

__all__ = (
    "from_networkx",
)

#-----------------------------------------------------------------------------
# General API
#-----------------------------------------------------------------------------

def from_networkx(graph: nx.Graph[Any], layout_function: LayoutFunction, **kwargs: Any) -> GraphRenderer:
        '''
        Generate a ``GraphRenderer`` from a ``networkx.Graph`` object and networkx
        layout function. Any keyword arguments will be passed to the
        layout function.

        Only two-dimensional layouts are supported.

        Args:
            graph (networkx.Graph) : a networkx graph to render
            layout_function (function or dict) : a networkx layout function or mapping of node keys to positions.
                The position is a two element sequence containing the x and y coordinate.

        Returns:
            instance (GraphRenderer)

        .. note::
            Node and edge attributes may be lists or tuples. However, a given
            attribute must either have *all* lists or tuple values, or *all*
            scalar values, for nodes or edges it is defined on.

        .. warning::
            Node attributes labeled 'index' and edge attributes labeled 'start' or 'end' are ignored.
            If you want to convert these attributes, please re-label them to other names.

        Raises:
            ValueError

        '''

        graph_renderer = GraphRenderer(data_source=GraphDataSource(graph))

        if callable(layout_function):
            graph_layout = layout_function(graph, **kwargs)
        else:
            graph_layout = layout_function

            node_keys = graph.nodes()
            if set(node_keys) != set(layout_function.keys()):
                from ..util.warnings import warn

                warn("Node keys in 'layout_function' don't match node keys in the graph. "
                     "These nodes may not be displayed correctly.")

        graph_renderer.layout_provider = StaticLayoutProvider(graph_layout=dict(graph_layout))

        return graph_renderer

#-----------------------------------------------------------------------------
# Dev API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Code
#-----------------------------------------------------------------------------
