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

# pyright: reportAbstractUsage=false

import logging # isort:skip
log = logging.getLogger(__name__)

#-----------------------------------------------------------------------------
# Imports
#-----------------------------------------------------------------------------

# Standard library imports
# Public constructor types live in the stubs; declarations below cover local calls.
from typing import TYPE_CHECKING, Any, Literal

# Bokeh imports
from ..core.has_props import abstract
from ..core.property.container import Dict, Len, Seq
from ..core.property.either import Either
from ..core.property.enum import Enum
from ..core.property.instance import Instance
from ..core.property.primitive import Float, Int, String
from ..core.property.required import Required
from ..model import Model
from .expressions import CoordinateTransform

#-----------------------------------------------------------------------------
# Globals and constants
#-----------------------------------------------------------------------------

__all__ = (
    'EdgesAndLinkedNodes',
    'EdgeCoordinates',
    'EdgePointCoordinates',
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

    def edge_point_coordinates(self, point: Literal["start", "end", "control0", "control1"]) -> EdgePointCoordinates:
        return EdgePointCoordinates(layout=self, point=point)

    @property
    def node_coordinates(self) -> NodeCoordinates:
        return NodeCoordinates(layout=self)

    @property
    def edge_coordinates(self) -> EdgeCoordinates:
        return EdgeCoordinates(layout=self)

class StaticLayoutProvider(LayoutProvider):
    '''

    '''

    graph_layout = Dict(Either(Int, String), Len(Seq(Float), 2), default={}, help="""
    The coordinates of the graph nodes in cartesian space. The keys of
    the dictionary correspond to node indices or labels and the values
    are two element sequences containing the x and y coordinates of
    the nodes.

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
    Abstract class for coordinate transform expression obtained from ``LayoutProvider``.

    '''

    layout = Instance(LayoutProvider)

class NodeCoordinates(GraphCoordinates):
    '''
    Node coordinate expression obtained from ``LayoutProvider``.

    '''

    if TYPE_CHECKING:
        def __init__(self, *args: Any, **kwargs: Any) -> None: ...


class EdgeCoordinates(GraphCoordinates):
    '''
    Node coordinate expression obtained from ``LayoutProvider``

    '''

    if TYPE_CHECKING:
        def __init__(self, *args: Any, **kwargs: Any) -> None: ...


class EdgePointCoordinates(GraphCoordinates):
    """ Scalar endpoint or cubic-control coordinates obtained from a graph layout. """

    point = Required(Enum("start", "end", "control0", "control1"))


@abstract
class GraphHitTestPolicy(Model):
    '''

    '''


class EdgesOnly(GraphHitTestPolicy):
    '''
    With the ``EdgesOnly`` policy, only graph edges are able to be selected and
    inspected. There is no selection or inspection of graph nodes.

    '''


class NodesOnly(GraphHitTestPolicy):
    '''
    With the ``NodesOnly`` policy, only graph nodes are able to be selected and
    inspected. There is no selection or inspection of graph edges.

    '''


class NodesAndLinkedEdges(GraphHitTestPolicy):
    '''
    With the ``NodesAndLinkedEdges`` policy, inspection or selection of graph
    nodes will result in the inspection or selection of the node and of the
    linked graph edges. There is no direct selection or inspection of graph
    edges.

    '''


class EdgesAndLinkedNodes(GraphHitTestPolicy):
    '''
    With the ``EdgesAndLinkedNodes`` policy, inspection or selection of graph
    edges will result in the inspection or selection of the edge and of the
    linked graph nodes. There is no direct selection or inspection of graph
    nodes.

    '''


class NodesAndAdjacentNodes(GraphHitTestPolicy):
    '''
    With the ``NodesAndAdjacentNodes`` policy, inspection or selection of
    graph nodes will also result in the inspection or selection any nodes that
    are immediately adjacent (connected by a single edge). There is no
    selection or inspection of graph edges, and no indication of which node is
    the tool-selected one from the policy-selected nodes.

    '''


#-----------------------------------------------------------------------------
# Private API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Code
#-----------------------------------------------------------------------------
