#-----------------------------------------------------------------------------
# Copyright (c) Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------

# Standard library imports
from abc import abstractmethod
from typing import Any, Sequence, TypedDict, TYPE_CHECKING

if TYPE_CHECKING:
    from typing_extensions import Unpack

# Bokeh imports
from ..model.model import JSEventCallback, Model, _ModelInit
from .expressions import CoordinateTransform, _CoordinateTransformInit

# class _LayoutProviderInit(_ModelInit, total=False):
#     ...

class _LayoutProviderInit(TypedDict, total=False):
    name: str | None
    tags: list[Any]
    js_event_callbacks: dict[str, list[JSEventCallback]]
    js_property_callbacks: dict[str, list[JSEventCallback]]
    subscribed_events: set[str]
    syncable: bool

class LayoutProvider(Model):
    @abstractmethod
    def __init__(self, **kwargs: Unpack[_LayoutProviderInit]) -> None: ...

    @property
    def node_coordinates(self) -> NodeCoordinates: ...
    @property
    def edge_coordinates(self) -> EdgeCoordinates: ...

# class _StaticLayoutProviderInit(_LayoutProviderInit, total=False):
#     graph_layout: dict[int | str, Sequence[float]]

class _StaticLayoutProviderInit(TypedDict, total=False):
    name: str | None
    tags: list[Any]
    js_event_callbacks: dict[str, list[JSEventCallback]]
    js_property_callbacks: dict[str, list[JSEventCallback]]
    subscribed_events: set[str]
    syncable: bool
    graph_layout: dict[int | str, Sequence[float]]

class StaticLayoutProvider(LayoutProvider):
    def __init__(self, **kwargs: Unpack[_StaticLayoutProviderInit]) -> None: ...

    graph_layout: dict[int | str, Sequence[float]] = ...

# class _GraphCoordinatesInit(_CoordinateTransformInit, total=False):
#     layout: LayoutProvider

class _GraphCoordinatesInit(TypedDict, total=False):
    name: str | None
    tags: list[Any]
    js_event_callbacks: dict[str, list[JSEventCallback]]
    js_property_callbacks: dict[str, list[JSEventCallback]]
    subscribed_events: set[str]
    syncable: bool
    layout: LayoutProvider

class GraphCoordinates(CoordinateTransform):
    @abstractmethod
    def __init__(self, **kwargs: Unpack[_GraphCoordinatesInit]) -> None: ...

    layout: LayoutProvider = ...

# class _NodeCoordinatesInit(_GraphCoordinatesInit, total=False):
#     ...

class _NodeCoordinatesInit(TypedDict, total=False):
    name: str | None
    tags: list[Any]
    js_event_callbacks: dict[str, list[JSEventCallback]]
    js_property_callbacks: dict[str, list[JSEventCallback]]
    subscribed_events: set[str]
    syncable: bool
    layout: LayoutProvider

class NodeCoordinates(GraphCoordinates):
    def __init__(self, **kwargs: Unpack[_NodeCoordinatesInit]) -> None: ...

# class _EdgeCoordinatesInit(_GraphCoordinatesInit, total=False):
#     ...

class _EdgeCoordinatesInit(TypedDict, total=False):
    name: str | None
    tags: list[Any]
    js_event_callbacks: dict[str, list[JSEventCallback]]
    js_property_callbacks: dict[str, list[JSEventCallback]]
    subscribed_events: set[str]
    syncable: bool
    layout: LayoutProvider

class EdgeCoordinates(GraphCoordinates):
    def __init__(self, **kwargs: Unpack[_EdgeCoordinatesInit]) -> None: ...

# class _GraphHitTestPolicyInit(_ModelInit, total=False):
#     ...

class _GraphHitTestPolicyInit(TypedDict, total=False):
    name: str | None
    tags: list[Any]
    js_event_callbacks: dict[str, list[JSEventCallback]]
    js_property_callbacks: dict[str, list[JSEventCallback]]
    subscribed_events: set[str]
    syncable: bool

class GraphHitTestPolicy(Model):
    @abstractmethod
    def __init__(self, **kwargs: Unpack[_GraphHitTestPolicyInit]) -> None: ...

# class _EdgesOnlyInit(_GraphHitTestPolicyInit, total=False):
#     ...

class _EdgesOnlyInit(TypedDict, total=False):
    name: str | None
    tags: list[Any]
    js_event_callbacks: dict[str, list[JSEventCallback]]
    js_property_callbacks: dict[str, list[JSEventCallback]]
    subscribed_events: set[str]
    syncable: bool

class EdgesOnly(GraphHitTestPolicy):
    def __init__(self, **kwargs: Unpack[_EdgesOnlyInit]) -> None: ...

# class _NodesOnlyInit(_GraphHitTestPolicyInit, total=False):
#     ...

class _NodesOnlyInit(TypedDict, total=False):
    name: str | None
    tags: list[Any]
    js_event_callbacks: dict[str, list[JSEventCallback]]
    js_property_callbacks: dict[str, list[JSEventCallback]]
    subscribed_events: set[str]
    syncable: bool

class NodesOnly(GraphHitTestPolicy):
    def __init__(self, **kwargs: Unpack[_NodesOnlyInit]) -> None: ...

# class _NodesAndLinkedEdgesInit(_GraphHitTestPolicyInit, total=False):
#     ...

class _NodesAndLinkedEdgesInit(TypedDict, total=False):
    name: str | None
    tags: list[Any]
    js_event_callbacks: dict[str, list[JSEventCallback]]
    js_property_callbacks: dict[str, list[JSEventCallback]]
    subscribed_events: set[str]
    syncable: bool

class NodesAndLinkedEdges(GraphHitTestPolicy):
    def __init__(self, **kwargs: Unpack[_NodesAndLinkedEdgesInit]) -> None: ...

# class _EdgesAndLinkedNodesInit(_GraphHitTestPolicyInit, total=False):
#     ...

class _EdgesAndLinkedNodesInit(TypedDict, total=False):
    name: str | None
    tags: list[Any]
    js_event_callbacks: dict[str, list[JSEventCallback]]
    js_property_callbacks: dict[str, list[JSEventCallback]]
    subscribed_events: set[str]
    syncable: bool

class EdgesAndLinkedNodes(GraphHitTestPolicy):
    def __init__(self, **kwargs: Unpack[_EdgesAndLinkedNodesInit]) -> None: ...

# class _NodesAndAdjacentNodesInit(_GraphHitTestPolicyInit, total=False):
#     ...

class _NodesAndAdjacentNodesInit(TypedDict, total=False):
    name: str | None
    tags: list[Any]
    js_event_callbacks: dict[str, list[JSEventCallback]]
    js_property_callbacks: dict[str, list[JSEventCallback]]
    subscribed_events: set[str]
    syncable: bool

class NodesAndAdjacentNodes(GraphHitTestPolicy):
    def __init__(self, **kwargs: Unpack[_NodesAndAdjacentNodesInit]) -> None: ...
