#-----------------------------------------------------------------------------
# Copyright (c) Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------

# Standard library imports
from abc import abstractmethod
from typing import (
    Any,
    Literal,
    Sequence,
    Unpack,
)

# Bokeh imports
from .._specs import FloatSpec
from ..model.model import Model, _ModelInit
from .expressions import CoordinateTransform, _CoordinateTransformInit
from .sources import GraphDataSource

class _LayoutProviderInit(_ModelInit, total=False):
    ...

class LayoutProvider(Model):
    @abstractmethod
    def __init__(self, **kwargs: Unpack[_LayoutProviderInit]) -> None: ...

    def node_coordinates(self, source: GraphDataSource) -> NodeCoordinates: ...
class _CircularLayoutProviderInit(_LayoutProviderInit, total=False):
    center: Sequence[float]
    radius: float
    start_angle: float
    clockwise: bool

class CircularLayoutProvider(LayoutProvider):
    def __init__(self, **kwargs: Unpack[_CircularLayoutProviderInit]) -> None: ...

    center: Sequence[float] = ...
    radius: float = ...
    start_angle: float = ...
    clockwise: bool = ...

class _GridLayoutProviderInit(_LayoutProviderInit, total=False):
    center: Sequence[float]
    spacing: float
    columns: int | None

class GridLayoutProvider(LayoutProvider):
    def __init__(self, **kwargs: Unpack[_GridLayoutProviderInit]) -> None: ...

    center: Sequence[float] = ...
    spacing: float = ...
    columns: int | None = ...

class _ForceDirectedLayoutProviderInit(_LayoutProviderInit, total=False):
    center: Sequence[float]
    scale: float
    seed: int
    iterations: int

class ForceDirectedLayoutProvider(LayoutProvider):
    def __init__(self, **kwargs: Unpack[_ForceDirectedLayoutProviderInit]) -> None: ...

    center: Sequence[float] = ...
    scale: float = ...
    seed: int = ...
    iterations: int = ...

class _StaticLayoutProviderInit(_LayoutProviderInit, total=False):
    graph_layout: dict[Any, Sequence[float]]

class StaticLayoutProvider(LayoutProvider):
    def __init__(self, **kwargs: Unpack[_StaticLayoutProviderInit]) -> None: ...

    graph_layout: dict[Any, Sequence[float]] = ...

class _EdgePathProviderInit(_ModelInit, total=False):
    loop_radius: FloatSpec
    loop_spacing: float
    steps: int

class EdgePathProvider(Model):
    @abstractmethod
    def __init__(self, **kwargs: Unpack[_EdgePathProviderInit]) -> None: ...

    def edge_coordinates(self, source: GraphDataSource, layout: LayoutProvider) -> EdgeCoordinates: ...
    def edge_point_coordinates(self, source: GraphDataSource, layout: LayoutProvider,
            point: Literal["start", "end", "control0", "control1"]) -> EdgePointCoordinates: ...

    loop_radius: FloatSpec = ...
    loop_spacing: float = ...
    steps: int = ...

class _StraightEdgePathProviderInit(_EdgePathProviderInit, total=False):
    ...

class StraightEdgePathProvider(EdgePathProvider):
    def __init__(self, **kwargs: Unpack[_StraightEdgePathProviderInit]) -> None: ...

class _BezierEdgePathProviderInit(_EdgePathProviderInit, total=False):
    curvature: FloatSpec
    parallel_spacing: float

class BezierEdgePathProvider(EdgePathProvider):
    def __init__(self, **kwargs: Unpack[_BezierEdgePathProviderInit]) -> None: ...

    curvature: FloatSpec = ...
    parallel_spacing: float = ...

class _ArcEdgePathProviderInit(_EdgePathProviderInit, total=False):
    curvature: FloatSpec
    parallel_spacing: float

class ArcEdgePathProvider(EdgePathProvider):
    def __init__(self, **kwargs: Unpack[_ArcEdgePathProviderInit]) -> None: ...

    curvature: FloatSpec = ...
    parallel_spacing: float = ...

class _OrthogonalEdgePathProviderInit(_EdgePathProviderInit, total=False):
    orientation: Literal["horizontal", "vertical"]
    offset: FloatSpec
    corner_radius: FloatSpec

class OrthogonalEdgePathProvider(EdgePathProvider):
    def __init__(self, **kwargs: Unpack[_OrthogonalEdgePathProviderInit]) -> None: ...

    orientation: Literal["horizontal", "vertical"] = ...
    offset: FloatSpec = ...
    corner_radius: FloatSpec = ...

class _GraphCoordinatesInit(_CoordinateTransformInit, total=False):
    layout: LayoutProvider
    source: GraphDataSource

class GraphCoordinates(CoordinateTransform):
    @abstractmethod
    def __init__(self, **kwargs: Unpack[_GraphCoordinatesInit]) -> None: ...

    layout: LayoutProvider = ...
    source: GraphDataSource = ...

class _NodeCoordinatesInit(_GraphCoordinatesInit, total=False):
    ...

class NodeCoordinates(GraphCoordinates):
    def __init__(self, **kwargs: Unpack[_NodeCoordinatesInit]) -> None: ...

class _EdgeCoordinatesInit(_GraphCoordinatesInit, total=False):
    path: EdgePathProvider

class EdgeCoordinates(GraphCoordinates):
    def __init__(self, **kwargs: Unpack[_EdgeCoordinatesInit]) -> None: ...

    path: EdgePathProvider = ...

class _EdgePointCoordinatesInit(_GraphCoordinatesInit, total=False):
    path: EdgePathProvider
    point: Literal["start", "end", "control0", "control1"]

class EdgePointCoordinates(GraphCoordinates):
    def __init__(self, **kwargs: Unpack[_EdgePointCoordinatesInit]) -> None: ...

    path: EdgePathProvider = ...
    point: Literal["start", "end", "control0", "control1"] = ...
