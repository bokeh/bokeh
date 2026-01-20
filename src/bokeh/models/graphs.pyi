#-----------------------------------------------------------------------------
# Copyright (c) Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------

# Standard library imports
from abc import abstractmethod
from typing import Sequence, Unpack

# Bokeh imports
from ..model.model import Model, ModelInit
from .expressions import CoordinateTransform, CoordinateTransformInit

class LayoutProviderInit(ModelInit, total=False):
    ...

class LayoutProvider(Model):
    @abstractmethod
    def __init__(self, **kwargs: Unpack[LayoutProviderInit]) -> None: ...

    @property
    def node_coordinates(self) -> NodeCoordinates: ...
    @property
    def edge_coordinates(self) -> EdgeCoordinates: ...

class StaticLayoutProviderInit(LayoutProviderInit, total=False):
    graph_layout: dict[int | str, Sequence[float]]

class StaticLayoutProvider(LayoutProvider):
    def __init__(self, **kwargs: Unpack[StaticLayoutProviderInit]) -> None: ...

    graph_layout: dict[int | str, Sequence[float]] = ...

class GraphCoordinatesInit(CoordinateTransformInit, total=False):
    layout: LayoutProvider

class GraphCoordinates(CoordinateTransform):
    @abstractmethod
    def __init__(self, **kwargs: Unpack[GraphCoordinatesInit]) -> None: ...

    layout: LayoutProvider = ...

class NodeCoordinatesInit(GraphCoordinatesInit, total=False):
    ...

class NodeCoordinates(GraphCoordinates):
    def __init__(self, **kwargs: Unpack[NodeCoordinatesInit]) -> None: ...

class EdgeCoordinatesInit(GraphCoordinatesInit, total=False):
    ...

class EdgeCoordinates(GraphCoordinates):
    def __init__(self, **kwargs: Unpack[EdgeCoordinatesInit]) -> None: ...

class GraphHitTestPolicyInit(ModelInit, total=False):
    ...

class GraphHitTestPolicy(Model):
    @abstractmethod
    def __init__(self, **kwargs: Unpack[GraphHitTestPolicyInit]) -> None: ...

class EdgesOnlyInit(GraphHitTestPolicyInit, total=False):
    ...

class EdgesOnly(GraphHitTestPolicy):
    def __init__(self, **kwargs: Unpack[EdgesOnlyInit]) -> None: ...

class NodesOnlyInit(GraphHitTestPolicyInit, total=False):
    ...

class NodesOnly(GraphHitTestPolicy):
    def __init__(self, **kwargs: Unpack[NodesOnlyInit]) -> None: ...

class NodesAndLinkedEdgesInit(GraphHitTestPolicyInit, total=False):
    ...

class NodesAndLinkedEdges(GraphHitTestPolicy):
    def __init__(self, **kwargs: Unpack[NodesAndLinkedEdgesInit]) -> None: ...

class EdgesAndLinkedNodesInit(GraphHitTestPolicyInit, total=False):
    ...

class EdgesAndLinkedNodes(GraphHitTestPolicy):
    def __init__(self, **kwargs: Unpack[EdgesAndLinkedNodesInit]) -> None: ...

class NodesAndAdjacentNodesInit(GraphHitTestPolicyInit, total=False):
    ...

class NodesAndAdjacentNodes(GraphHitTestPolicy):
    def __init__(self, **kwargs: Unpack[NodesAndAdjacentNodesInit]) -> None: ...
