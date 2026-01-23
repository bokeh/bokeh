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
from ..model.model import Model, _ModelInit
from .expressions import CoordinateTransform, _CoordinateTransformInit

class _LayoutProviderInit(_ModelInit, total=False):
    ...

class LayoutProvider(Model):
    @abstractmethod
    def __init__(self, **kwargs: Unpack[_LayoutProviderInit]) -> None: ...

    @property
    def node_coordinates(self) -> NodeCoordinates: ...
    @property
    def edge_coordinates(self) -> EdgeCoordinates: ...

class _StaticLayoutProviderInit(_LayoutProviderInit, total=False):
    graph_layout: dict[int | str, Sequence[float]]

class StaticLayoutProvider(LayoutProvider):
    def __init__(self, **kwargs: Unpack[_StaticLayoutProviderInit]) -> None: ...

    graph_layout: dict[int | str, Sequence[float]] = ...

class _GraphCoordinatesInit(_CoordinateTransformInit, total=False):
    layout: LayoutProvider

class GraphCoordinates(CoordinateTransform):
    @abstractmethod
    def __init__(self, **kwargs: Unpack[_GraphCoordinatesInit]) -> None: ...

    layout: LayoutProvider = ...

class _NodeCoordinatesInit(_GraphCoordinatesInit, total=False):
    ...

class NodeCoordinates(GraphCoordinates):
    def __init__(self, **kwargs: Unpack[_NodeCoordinatesInit]) -> None: ...

class _EdgeCoordinatesInit(_GraphCoordinatesInit, total=False):
    ...

class EdgeCoordinates(GraphCoordinates):
    def __init__(self, **kwargs: Unpack[_EdgeCoordinatesInit]) -> None: ...

class _GraphHitTestPolicyInit(_ModelInit, total=False):
    ...

class GraphHitTestPolicy(Model):
    @abstractmethod
    def __init__(self, **kwargs: Unpack[_GraphHitTestPolicyInit]) -> None: ...

class _EdgesOnlyInit(_GraphHitTestPolicyInit, total=False):
    ...

class EdgesOnly(GraphHitTestPolicy):
    def __init__(self, **kwargs: Unpack[_EdgesOnlyInit]) -> None: ...

class _NodesOnlyInit(_GraphHitTestPolicyInit, total=False):
    ...

class NodesOnly(GraphHitTestPolicy):
    def __init__(self, **kwargs: Unpack[_NodesOnlyInit]) -> None: ...

class _NodesAndLinkedEdgesInit(_GraphHitTestPolicyInit, total=False):
    ...

class NodesAndLinkedEdges(GraphHitTestPolicy):
    def __init__(self, **kwargs: Unpack[_NodesAndLinkedEdgesInit]) -> None: ...

class _EdgesAndLinkedNodesInit(_GraphHitTestPolicyInit, total=False):
    ...

class EdgesAndLinkedNodes(GraphHitTestPolicy):
    def __init__(self, **kwargs: Unpack[_EdgesAndLinkedNodesInit]) -> None: ...

class _NodesAndAdjacentNodesInit(_GraphHitTestPolicyInit, total=False):
    ...

class NodesAndAdjacentNodes(GraphHitTestPolicy):
    def __init__(self, **kwargs: Unpack[_NodesAndAdjacentNodesInit]) -> None: ...
