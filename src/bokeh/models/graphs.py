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

# Runtime constructors are synthesized; public signatures are defined in the .pyi.
# pyright: reportAbstractUsage=false, reportCallIssue=false

import logging # isort:skip
log = logging.getLogger(__name__)

#-----------------------------------------------------------------------------
# Imports
#-----------------------------------------------------------------------------

# Standard library imports

# Bokeh imports
from ..core.has_props import abstract
from ..core.property.container import Dict, Len, Seq
from ..core.property.either import Either
from ..core.property.instance import Instance
from ..core.property.primitive import Float, Int, String
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


class EdgeCoordinates(GraphCoordinates):
    '''
    Node coordinate expression obtained from ``LayoutProvider``

    '''


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
