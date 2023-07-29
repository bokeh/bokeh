#-----------------------------------------------------------------------------
# Copyright (c) 2012 - 2023, Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------
"""

"""
#-----------------------------------------------------------------------------
# Boilerplate
#-----------------------------------------------------------------------------
from __future__ import annotations

import logging # isort:skip
log = logging.getLogger(__name__)

#-----------------------------------------------------------------------------
# Imports
#-----------------------------------------------------------------------------

# Bokeh imports
from ...core.has_props import abstract
from ...core.properties import (
    Either,
    Instance,
    Int,
    List,
    Nullable,
    Tuple,
)
#from ..toolbars import Toolbar
from .renderer import Renderer

#-----------------------------------------------------------------------------
# Globals and constants
#-----------------------------------------------------------------------------

__all__ = (
    "LayoutableRenderer",
    "GridRenderer",
    "PlotRenderer",
)

#-----------------------------------------------------------------------------
# General API
#-----------------------------------------------------------------------------

@abstract
class LayoutableRenderer(Renderer):
    """ """

    # explicit __init__ to support Init signatures
    def __init__(self, *args, **kwargs) -> None:
        super().__init__(*args, **kwargs)

class GridRenderer(LayoutableRenderer):
    """ """

    # explicit __init__ to support Init signatures
    def __init__(self, *args, **kwargs) -> None:
        super().__init__(*args, **kwargs)

    # Either(LayoutableRenderer, LayoutableAnnotation)
    items = List(Either(
        #Tuple(Instance(LayoutableRenderer), Int, Int),
        #Tuple(Instance(LayoutableRenderer), Int, Int, Int, Int)), default=[])
        Tuple(Instance(Renderer), Int, Int),
        Tuple(Instance(Renderer), Int, Int, Int, Int)), default=[])

class PlotRenderer(LayoutableRenderer):
    """ """

    # explicit __init__ to support Init signatures
    def __init__(self, *args, **kwargs) -> None:
        super().__init__(*args, **kwargs)

    frame = Instance("bokeh.models.canvas.CartesianFrame")

    left = List(Instance(Renderer), help="""
    A list of renderers to occupy the area to the left of the plot.
    """)

    right = List(Instance(Renderer), help="""
    A list of renderers to occupy the area to the right of the plot.
    """)

    above = List(Instance(Renderer), help="""
    A list of renderers to occupy the area above of the plot.
    """)

    below = List(Instance(Renderer), help="""
    A list of renderers to occupy the area below of the plot.
    """)

    center = List(Instance(Renderer), help="""
    A list of renderers to occupy the center area (frame) of the plot.
    """)

    frame_width = Nullable(Int, help="""
    The width of a plot frame or the inner width of a plot, excluding any
    axes, titles, border padding, etc.
    """)

    frame_height = Nullable(Int, help="""
    The height of a plot frame or the inner height of a plot, excluding any
    axes, titles, border padding, etc.
    """)

    toolbar = Instance("bokeh.models.toolbars.Toolbar")#, default=lambda: Toolbar())

#-----------------------------------------------------------------------------
# Private API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Code
#-----------------------------------------------------------------------------
