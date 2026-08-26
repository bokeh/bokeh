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
    'EdgeCoordinates',
    'EdgePointCoordinates',
    'GraphCoordinates',
    'LayoutProvider',
    'NodeCoordinates',
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

    if TYPE_CHECKING:
        def __init__(self, *args: Any, **kwargs: Any) -> None: ...

    point = Required(Enum("start", "end", "control0", "control1"))

#-----------------------------------------------------------------------------
# Private API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Code
#-----------------------------------------------------------------------------
