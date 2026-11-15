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
    Sequence,
    cast,
)

from ..models.graphs import StaticLayoutProvider
from ..models.renderers import GraphRenderer
from ..models.sources import ColumnDataSource

if TYPE_CHECKING:
    import networkx as nx

    from ..models.sources import DataDict

    type GraphLayout = dict[int | str, Sequence[float]]
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

        # Handles nx 1.x vs 2.x data structure change
        # Convert node attributes
        node_dict: DataDict = dict()
        node_attr_keys = [attr_key for node in list(graph.nodes(data=True))
                          for attr_key in node[1].keys()]
        node_attr_keys = list(set(node_attr_keys))

        for attr_key in node_attr_keys:
            values = [node_attr[attr_key] if attr_key in node_attr.keys() else None
                      for _, node_attr in graph.nodes(data=True)]

            values = _handle_sublists(values)

            node_dict[attr_key] = values

        if 'index' in node_attr_keys:
            from ..util.warnings import warn

            warn("Converting node attributes labeled 'index' are skipped. "
                 "If you want to convert these attributes, please re-label with other names.")

        node_dict['index'] = list(graph.nodes())

        # Convert edge attributes
        edge_dict: DataDict = dict()
        edge_attr_keys = [attr_key for edge in graph.edges(data=True)
                          for attr_key in edge[2].keys()]
        edge_attr_keys = list(set(edge_attr_keys))

        for attr_key in edge_attr_keys:
            values = [edge_attr[attr_key] if attr_key in edge_attr.keys() else None
                      for _, _, edge_attr in graph.edges(data=True)]

            values = _handle_sublists(values)

            edge_dict[attr_key] = values

        if 'start' in edge_attr_keys or 'end' in edge_attr_keys:
            from ..util.warnings import warn

            warn("Converting edge attributes labeled 'start' or 'end' are skipped. "
                 "If you want to convert these attributes, please re-label them with other names.")

        edge_dict['start'] = [x[0] for x in graph.edges()]
        edge_dict['end'] = [x[1] for x in graph.edges()]

        graph_renderer = GraphRenderer()
        node_source = cast(ColumnDataSource, graph_renderer.node_renderer.data_source)
        node_source.data = node_dict
        edge_source = cast(ColumnDataSource, graph_renderer.edge_renderer.data_source)
        edge_source.data = edge_dict

        if callable(layout_function):
            graph_layout = layout_function(graph, **kwargs)
        else:
            graph_layout = layout_function

            node_keys = node_dict['index']
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
# Private API
#-----------------------------------------------------------------------------

def _handle_sublists(values: list[Any]) -> list[Any]:
    # if any of the items is non-scalar, they all must be
    if any(isinstance(x, (list, tuple)) for x in values):
        if not all(isinstance(x, (list, tuple)) for x in values if x is not None):
            raise ValueError("Can't mix scalar and non-scalar values for graph attributes")
        return [[] if x is None else list(x) for x in values]
    return values

#-----------------------------------------------------------------------------
# Code
#-----------------------------------------------------------------------------
