#-----------------------------------------------------------------------------
# Copyright (c) Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------

# Standard library imports
from dataclasses import dataclass
from typing import Sequence

# Bokeh imports
from ..core.has_props import abstract
from ..model import Model
from .expressions import CoordinateTransform

@abstract
@dataclass(init=False)
class LayoutProvider(Model):

    @property
    def node_coordinates(self) -> NodeCoordinates: ...

    @property
    def edge_coordinates(self) -> EdgeCoordinates: ...

@dataclass
class StaticLayoutProvider(LayoutProvider):

    graph_layout: dict[int | str, Sequence[float]] = ...

@abstract
@dataclass(init=False)
class GraphCoordinates(CoordinateTransform):

    layout: LayoutProvider = ...

@dataclass
class NodeCoordinates(GraphCoordinates):
    ...

@dataclass
class EdgeCoordinates(GraphCoordinates):
    ...

@abstract
@dataclass(init=False)
class GraphHitTestPolicy(Model):
    ...

@dataclass
class EdgesOnly(GraphHitTestPolicy):
    ...

@dataclass
class NodesOnly(GraphHitTestPolicy):
    ...

@dataclass
class NodesAndLinkedEdges(GraphHitTestPolicy):
    ...

@dataclass
class EdgesAndLinkedNodes(GraphHitTestPolicy):
    ...

@dataclass
class NodesAndAdjacentNodes(GraphHitTestPolicy):
    ...
