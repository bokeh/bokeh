#-----------------------------------------------------------------------------
# Copyright (c) 2012 - 2022, Anaconda, Inc., and Bokeh Contributors.
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
    Instance,
    Int,
    Seq,
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
    'NodesAndAdjacentNodes',
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

    # explicit __init__ to support Init signatures
    def __init__(self, *args, **kwargs) -> None:
        super().__init__(*args, **kwargs)

    @property
    def node_coordinates(self) -> NodeCoordinates:
        return NodeCoordinates(layout=self)

    @property
    def edge_coordinates(self) -> EdgeCoordinates:
        return EdgeCoordinates(layout=self)

class StaticLayoutProvider(LayoutProvider):
    '''

    '''

    # explicit __init__ to support Init signatures
    def __init__(self, *args, **kwargs) -> None:
        super().__init__(*args, **kwargs)

    # TODO: Seq(Any).length == 2
    graph_layout = Dict(Int, Seq(Any), default={}, help="""
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

    # explicit __init__ to support Init signatures
    def __init__(self, *args, **kwargs) -> None:
        super().__init__(*args, **kwargs)

    layout = Instance(LayoutProvider)

class NodeCoordinates(GraphCoordinates):
    '''
    Node coordinate expression obtained from ``LayoutProvider``

    '''

    # explicit __init__ to support Init signatures
    def __init__(self, *args, **kwargs) -> None:
        super().__init__(*args, **kwargs)


class EdgeCoordinates(GraphCoordinates):
    '''
    Node coordinate expression obtained from ``LayoutProvider``

    '''

    # explicit __init__ to support Init signatures
    def __init__(self, *args, **kwargs) -> None:
        super().__init__(*args, **kwargs)


@abstract
class GraphHitTestPolicy(Model):
    '''

    '''

    # explicit __init__ to support Init signatures
    def __init__(self, *args, **kwargs) -> None:
        super().__init__(*args, **kwargs)


class EdgesOnly(GraphHitTestPolicy):
    '''
    With the ``EdgesOnly`` policy, only graph edges are able to be selected and
    inspected. There is no selection or inspection of graph nodes.

    '''

    # explicit __init__ to support Init signatures
    def __init__(self, *args, **kwargs) -> None:
        super().__init__(*args, **kwargs)


class NodesOnly(GraphHitTestPolicy):
    '''
    With the ``NodesOnly`` policy, only graph nodes are able to be selected and
    inspected. There is no selection or inspection of graph edges.

    '''

    # explicit __init__ to support Init signatures
    def __init__(self, *args, **kwargs) -> None:
        super().__init__(*args, **kwargs)


class NodesAndLinkedEdges(GraphHitTestPolicy):
    '''
    With the ``NodesAndLinkedEdges`` policy, inspection or selection of graph
    nodes will result in the inspection or selection of the node and of the
    linked graph edges. There is no direct selection or inspection of graph
    edges.

    '''

    # explicit __init__ to support Init signatures
    def __init__(self, *args, **kwargs) -> None:
        super().__init__(*args, **kwargs)


class EdgesAndLinkedNodes(GraphHitTestPolicy):
    '''
    With the ``EdgesAndLinkedNodes`` policy, inspection or selection of graph
    edges will result in the inspection or selection of the edge and of the
    linked graph nodes. There is no direct selection or inspection of graph
    nodes.

    '''

    # explicit __init__ to support Init signatures
    def __init__(self, *args, **kwargs) -> None:
        super().__init__(*args, **kwargs)


class NodesAndAdjacentNodes(GraphHitTestPolicy):
    '''
    With the ``NodesAndAdjacentNodes`` policy, inspection or selection of
    graph nodes will also result in the inspection or selection any nodes that
    are immediately adjacent (connected by a single edge). There is no
    selection or inspection of graph edges, and no indication of which node is
    the tool-selected one from the policy-selected nodes.

    '''

    # explicit __init__ to support Init signatures
    def __init__(self, *args, **kwargs) -> None:
        super().__init__(*args, **kwargs)


#-----------------------------------------------------------------------------
# Private API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Code
#-----------------------------------------------------------------------------
