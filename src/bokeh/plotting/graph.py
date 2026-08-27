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

# pyright: reportAttributeAccessIssue=false

import logging # isort:skip
log = logging.getLogger(__name__)

#-----------------------------------------------------------------------------
# Imports
#-----------------------------------------------------------------------------

# Standard library imports
from collections.abc import Callable
from typing import TYPE_CHECKING, Any, Sequence

# Bokeh imports
from ..models.graphs import EdgePathProvider, LayoutProvider, StaticLayoutProvider
from ..models.renderers import GraphRenderer
from ..models.sources import ColumnDataSource, GraphDataSource

if TYPE_CHECKING:
    import networkx as nx

#-----------------------------------------------------------------------------
# Globals and constants
#-----------------------------------------------------------------------------

__all__ = (
    "from_networkx",
)

#-----------------------------------------------------------------------------
# General API
#-----------------------------------------------------------------------------

def from_networkx(
    graph: nx.Graph,
    layout_function: LayoutProvider | Callable[..., dict[int | str, Sequence[float]]] | dict[int | str, Sequence[float]],
    *,
    edge_path_provider: EdgePathProvider | None = None,
    **kwargs: Any,
) -> GraphRenderer:
        '''
        Generate a ``GraphRenderer`` from a ``networkx.Graph`` object and networkx
        layout function. Any keyword arguments will be passed to the
        layout function.

        Only two-dimensional layouts are supported.

        Args:
            graph (networkx.Graph) : a networkx graph to render
            layout_function (LayoutProvider, function, or dict) : a client-side
                Bokeh layout provider, a NetworkX layout function, or a mapping
                of node keys to positions. Positions are two element sequences
                containing x and y coordinates.
            edge_path_provider (EdgePathProvider, optional) : an edge path
                provider used to derive straight or curved edge paths.

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

        data_source = GraphDataSource(graph)
        if edge_path_provider is None:
            graph_renderer = GraphRenderer(data_source=data_source)
        else:
            graph_renderer = GraphRenderer(data_source=data_source, edge_path_provider=edge_path_provider)

        if isinstance(layout_function, LayoutProvider):
            if kwargs:
                raise ValueError("layout keyword arguments cannot be used with a LayoutProvider")
            graph_renderer.layout_provider = layout_function
            return graph_renderer
        elif callable(layout_function):
            graph_layout = layout_function(graph, **kwargs)
        else:
            graph_layout = layout_function

            node_source = graph_renderer.node_renderer.data_source
            assert isinstance(node_source, ColumnDataSource)
            node_keys = node_source.data['index']
            if set(node_keys) != set(layout_function.keys()):
                from ..util.warnings import warn

                warn("Node keys in 'layout_function' don't match node keys in the graph. "
                     "These nodes may not be displayed correctly.")

        graph_renderer.layout_provider = StaticLayoutProvider(graph_layout=graph_layout)

        return graph_renderer

#-----------------------------------------------------------------------------
# Dev API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Code
#-----------------------------------------------------------------------------
