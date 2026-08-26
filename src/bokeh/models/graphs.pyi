#-----------------------------------------------------------------------------
# Copyright (c) Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------

# Standard library imports
from abc import abstractmethod
from typing import Literal, Sequence, Unpack

# Bokeh imports
from ..model.model import Model, _ModelInit
from .expressions import CoordinateTransform, _CoordinateTransformInit

class _LayoutProviderInit(_ModelInit, total=False):
    ...

class LayoutProvider(Model):
    @abstractmethod
    def __init__(self, **kwargs: Unpack[_LayoutProviderInit]) -> None: ...

    def edge_point_coordinates(self, point: Literal["start", "end", "control0", "control1"]) -> EdgePointCoordinates: ...

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

class _EdgePointCoordinatesInit(_GraphCoordinatesInit, total=False):
    point: Literal["start", "end", "control0", "control1"]

class EdgePointCoordinates(GraphCoordinates):
    def __init__(self, **kwargs: Unpack[_EdgePointCoordinatesInit]) -> None: ...

    point: Literal["start", "end", "control0", "control1"] = ...
