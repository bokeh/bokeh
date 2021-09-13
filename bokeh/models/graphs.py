#-----------------------------------------------------------------------------
# Copyright (c) 2012 - 2021, Anaconda, Inc., and Bokeh Contributors.
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

# Bokeh imports
from ..core.has_props import abstract
from ..core.properties import (
    Any,
    Dict,
    Either,
    Instance,
    Int,
    Seq,
    String,
)
from ..model import Model
from .expressions import CoordinateTransform

#-----------------------------------------------------------------------------
# Globals and constants
#-----------------------------------------------------------------------------

__all__ = (
    'EdgesAndLinkedNodes',
    'EdgeCoordinates',
    'EdgesOnly',
    'GraphCoordinates',
    'GraphHitTestPolicy',
    'LayoutProvider',
    'NodeCoordinates',
    'NodesAndLinkedEdges',
    'NodesOnly',
    'StaticLayoutProvider',
)

#-----------------------------------------------------------------------------
# General API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Dev API
#-----------------------------------------------------------------------------

@abstract
class LayoutProvider(Model):
    '''

    '''

    @property
    def node_coordinates(self) -> NodeCoordinates:
        return NodeCoordinates(layout=self)

    @property
    def edge_coordinates(self) -> EdgeCoordinates:
        return EdgeCoordinates(layout=self)

class StaticLayoutProvider(LayoutProvider):
    '''

    '''

    graph_layout = Dict(Either(String, Int), Seq(Any), default={}, help="""
    The coordinates of the graph nodes in cartesian space. The dictionary
    keys correspond to a node index and the values are a two element sequence
    containing the x and y coordinates of the node.

    .. code-block:: python

        {
            0 : [0.5, 0.5],
            1 : [1.0, 0.86],
            2 : [0.86, 1],
        }
    """)

@abstract
class GraphCoordinates(CoordinateTransform):
    '''
    Abstract class for coordinate transform expression obtained from ``LayoutProvider``

    '''
    layout = Instance(LayoutProvider)

class NodeCoordinates(GraphCoordinates):
    '''
    Node coordinate expression obtained from ``LayoutProvider``

    '''

    pass

class EdgeCoordinates(GraphCoordinates):
    '''
    Node coordinate expression obtained from ``LayoutProvider``

    '''

    pass

@abstract
class GraphHitTestPolicy(Model):
    '''

    '''

    pass

class EdgesOnly(GraphHitTestPolicy):
    '''
    With the ``EdgesOnly`` policy, only graph edges are able to be selected and
    inspected. There is no selection or inspection of graph nodes.

    '''

    pass

class NodesOnly(GraphHitTestPolicy):
    '''
    With the ``NodesOnly`` policy, only graph nodes are able to be selected and
    inspected. There is no selection or inspection of graph edges.

    '''

    pass

class NodesAndLinkedEdges(GraphHitTestPolicy):
    '''
    With the ``NodesAndLinkedEdges`` policy, inspection or selection of graph
    nodes will result in the inspection or selection of the node and of the
    linked graph edges. There is no direct selection or inspection of graph
    edges.

    '''

    pass

class EdgesAndLinkedNodes(GraphHitTestPolicy):
    '''
    With the ``EdgesAndLinkedNodes`` policy, inspection or selection of graph
    edges will result in the inspection or selection of the edge and of the
    linked graph nodes. There is no direct selection or inspection of graph
    nodes.

    '''

    pass

#-----------------------------------------------------------------------------
# Private API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Code
#-----------------------------------------------------------------------------

# TODO (bev) deprecation: 3.0
def from_networkx(graph, layout_function, **kwargs):
    from bokeh.plotting import from_networkx as real_from_networkx
    from bokeh.util.deprecation import deprecated
    deprecated("Importing from_networkx from bokeh.models.graphs is deprecated and will be removed in Bokeh 3.0. Import from bokeh.plotting instead")
    return real_from_networkx(graph, layout_function, **kwargs)
