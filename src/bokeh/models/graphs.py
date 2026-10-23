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
from ..core.property.any import Any as AnyVal
from ..core.property.container import (
    Dict,
    Len,
    Seq,
    Tuple,
)
from ..core.property.dataspec import FloatSpec
from ..core.property.enum import Enum
from ..core.property.instance import Instance
from ..core.property.nullable import Nullable
from ..core.property.numeric import NonNegative, Positive
from ..core.property.primitive import Bool, Float, Int
from ..core.property.required import Required
from ..model import Model
from .expressions import CoordinateTransform

if TYPE_CHECKING:
    from .sources import GraphDataSource

#-----------------------------------------------------------------------------
# Globals and constants
#-----------------------------------------------------------------------------

__all__ = (
    'ArcEdgePathProvider',
    'BezierEdgePathProvider',
    'CircularLayoutProvider',
    'EdgeCoordinates',
    'EdgePointCoordinates',
    'EdgePathProvider',
    'ForceDirectedLayoutProvider',
    'GraphCoordinates',
    'GridLayoutProvider',
    'LayoutProvider',
    'NodeCoordinates',
    'OrthogonalEdgePathProvider',
    'StaticLayoutProvider',
    'StraightEdgePathProvider',
)

#-----------------------------------------------------------------------------
# General API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Dev API
#-----------------------------------------------------------------------------

@abstract
class LayoutProvider(Model):
    ''' Supply node positions for a graph.

    Concrete providers may contain fixed coordinates or compute them in
    BokehJS from the graph topology. Computed layouts are deterministic model
    configuration: server and notebook clients calculate the same rendering
    locally without synchronizing derived coordinate arrays.
    '''

    def node_coordinates(self, source: GraphDataSource) -> NodeCoordinates:
        return NodeCoordinates(layout=self, source=source)

class CircularLayoutProvider(LayoutProvider):
    ''' Place nodes evenly around a circle in source order. '''

    center = Tuple(Float, Float, default=(0, 0), help="""
    Center of the circle in data coordinates.
    """)

    radius = NonNegative(Float, default=1, help="""
    Radius of the circle in data coordinates.
    """)

    start_angle = Float(default=0, help="""
    Angle in radians assigned to the first node.
    """)

    clockwise = Bool(default=False, help="""
    Whether nodes proceed clockwise from ``start_angle``.
    """)

class GridLayoutProvider(LayoutProvider):
    ''' Place nodes on a centered row-major grid in source order. '''

    center = Tuple(Float, Float, default=(0, 0), help="""
    Center of the grid in data coordinates.
    """)

    spacing = Positive(Float, default=1, help="""
    Horizontal and vertical distance between neighboring grid positions.
    """)

    columns = Nullable(Positive(Int), default=None, help="""
    Number of columns, or ``None`` to choose a near-square grid.
    """)

class ForceDirectedLayoutProvider(LayoutProvider):
    ''' Compute a deterministic Fruchterman-Reingold layout in BokehJS.

    This dependency-free implementation is intended for small and medium
    graphs. Its repulsion step is quadratic in the number of nodes. Directed,
    reciprocal, and parallel edges are treated as one undirected connection
    for layout, while retaining their distinct rendering and interaction.
    The normalized result is given a deterministic horizontal orientation.
    '''

    center = Tuple(Float, Float, default=(0, 0), help="""
    Center of the normalized layout in data coordinates.
    """)

    scale = Positive(Float, default=1, help="""
    Half-extent of the normalized layout's longest dimension.
    """)

    seed = Int(default=1, help="""
    Seed used for deterministic initial node positions.
    """)

    iterations = NonNegative(Int, default=100, help="""
    Number of force simulation iterations.
    """)

class StaticLayoutProvider(LayoutProvider):
    ''' Supply a fixed mapping from node identifiers to positions.

    '''

    graph_layout = Dict(AnyVal, Len(Seq(Float), 2), default={}, help="""
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
class EdgePathProvider(Model):
    ''' Compute sampled edge paths from graph topology and node positions.

    Explicit ``xs`` and ``ys`` fields on the graph's edge source override
    computed paths for the corresponding edges.
    '''

    def edge_coordinates(self, source: GraphDataSource, layout: LayoutProvider) -> EdgeCoordinates:
        return EdgeCoordinates(path=self, layout=layout, source=source)

    def edge_point_coordinates(self, source: GraphDataSource, layout: LayoutProvider,
            point: Literal["start", "end", "control0", "control1"]) -> EdgePointCoordinates:
        return EdgePointCoordinates(path=self, layout=layout, source=source, point=point)

    loop_radius = FloatSpec(default=0.15, help="""
    Radius in data coordinates for self-loop edges. This may be a fixed value
    or the name of a field on the graph's edge source.
    """)

    loop_spacing = NonNegative(Float, default=0.25, help="""
    Relative radius increment used to separate multiple self-loops on the same
    node.
    """)

    steps = Positive(Int, default=24, help="""
    Number of segments used to sample curved portions of an edge path.
    """)

class StraightEdgePathProvider(EdgePathProvider):
    ''' Connect distinct nodes with straight segments and render self-loops. '''

class BezierEdgePathProvider(EdgePathProvider):
    ''' Sample quadratic Bezier edge paths in BokehJS. '''

    curvature = FloatSpec(default=0.2, help="""
    Signed midpoint offset relative to edge length. This may be a fixed value
    or the name of a field on the graph's edge source.
    """)

    parallel_spacing = Float(default=0.15, help="""
    Additional relative curvature between parallel edges with the same
    direction and endpoints.
    """)

class ArcEdgePathProvider(EdgePathProvider):
    ''' Sample circular-arc edge paths in BokehJS. '''

    curvature = FloatSpec(default=0.2, help="""
    Signed arc sagitta relative to edge length. This may be a fixed value or
    the name of a field on the graph's edge source.
    """)

    parallel_spacing = Float(default=0.15, help="""
    Additional relative curvature between parallel edges with the same
    direction and endpoints.
    """)

class OrthogonalEdgePathProvider(EdgePathProvider):
    ''' Route edges using horizontal and vertical segments in BokehJS. '''

    orientation = Enum("horizontal", "vertical", default="horizontal", help="""
    Direction of the first and last segments of the route.
    """)

    offset = FloatSpec(default=0, help="""
    Offset in data coordinates applied to the route's central segment. This
    may be a fixed value or the name of a field on the graph's edge source.
    """)

    corner_radius = FloatSpec(default=0, help="""
    Distance used to round route corners. This may be a fixed value or the
    name of a field on the graph's edge source.
    """)

@abstract
class GraphCoordinates(CoordinateTransform):
    '''
    Abstract class for coordinate transform expression obtained from ``LayoutProvider``.

    '''

    layout = Instance(LayoutProvider)
    source = Instance("bokeh.models.sources.GraphDataSource")

class NodeCoordinates(GraphCoordinates):
    '''
    Node coordinate expression obtained from ``LayoutProvider``.

    '''

    if TYPE_CHECKING:
        def __init__(self, *args: Any, **kwargs: Any) -> None: ...


class EdgeCoordinates(GraphCoordinates):
    '''
    Edge coordinate expression obtained from ``LayoutProvider``.

    '''

    if TYPE_CHECKING:
        def __init__(self, *args: Any, **kwargs: Any) -> None: ...

    path = Instance(EdgePathProvider)

class EdgePointCoordinates(GraphCoordinates):
    """ Scalar endpoint or cubic-control coordinates obtained from an edge path. """

    if TYPE_CHECKING:
        def __init__(self, *args: Any, **kwargs: Any) -> None: ...

    path = Instance(EdgePathProvider)
    point = Required(Enum("start", "end", "control0", "control1"))

#-----------------------------------------------------------------------------
# Private API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Code
#-----------------------------------------------------------------------------
