#-----------------------------------------------------------------------------
# Copyright (c) 2012 - 2023, Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------

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
from ..core.enums import OutputBackend
from ..core.properties import (
    Bool,
    Dict,
    Enum,
    Float,
    Instance,
    InstanceDefault,
    List,
    String,
)
from .ranges import DataRange1d, Range
from .renderers import LayoutableRenderer
from .renderers import Renderer
from .scales import LinearScale, Scale
from .ui import UIElement

#-----------------------------------------------------------------------------
# Globals and constants
#-----------------------------------------------------------------------------

__all__ = (
    "Canvas",
    "CartesianFrame",
)

#-----------------------------------------------------------------------------
# General API
#-----------------------------------------------------------------------------

class Canvas(UIElement):
    """ """

    # explicit __init__ to support Init signatures
    def __init__(self, *args, **kwargs) -> None:
        super().__init__(*args, **kwargs)

    renderers = List(Instance(Renderer), default=[])

    hidpi = Bool(default=True, help="""
    Whether to use high pixel density mode when available.
    """)

    output_backend = Enum(OutputBackend, default="canvas", help="""
    Specify the output backend for the canvas, which can be either:

    * ``"canvas"`` for raster rendering
    * ``"svg"`` for vector rendering
    * ``"webgl"`` for hardware accelarated raster rendering

    .. note::
        When set to ``"webgl"``, renderers without a WebGL implementation
        will fall back to software rendering onto the canvas.
    """)

class CartesianFrame(LayoutableRenderer):
    """ """

    # explicit __init__ to support Init signatures
    def __init__(self, *args, **kwargs) -> None:
        super().__init__(*args, **kwargs)

    x_range = Instance(Range, default=InstanceDefault(DataRange1d), help="""
    The primary data range of the horizontal dimension.
    """)

    y_range = Instance(Range, default=InstanceDefault(DataRange1d), help="""
    The primary data range of the vertical dimension.
    """)

    x_scale = Instance(Scale, default=InstanceDefault(LinearScale), help="""
    The mapping between x-coordinages in data space and screen space.
    """)

    y_scale = Instance(Scale, default=InstanceDefault(LinearScale), help="""
    The mapping between y-coordinages in data space and screen space.
    """)

    extra_x_ranges = Dict(String, Instance(Range), help="""
    Additional named ranges to make available for mapping x-coordinates.

    This is useful for adding additional axes.
    """)

    extra_y_ranges = Dict(String, Instance(Range), help="""
    Additional named ranges to make available for mapping y-coordinates.

    This is useful for adding additional axes.
    """)

    extra_x_scales = Dict(String, Instance(Scale), help="""
    Additional named scales to make available for mapping x-coordinates.

    This is useful for adding additional axes.

    .. note:: This feature is experimental and may change in the short term.
    """)

    extra_y_scales = Dict(String, Instance(Scale), help="""
    Additional named scales to make available for mapping y-coordinates.

    This is useful for adding additional axes.

    .. note:: This feature is experimental and may change in the short term.
    """)

    renderers = List(Instance(Renderer), help="""
    A list of all glyph renderers for this frame.
    """)

    match_aspect = Bool(default=False, help="""
    Specify the aspect ratio behavior of the plot. Aspect ratio is defined as
    the ratio of width over height. This property controls whether Bokeh should
    attempt to match the (width/height) of *data space* to the (width/height)
    in pixels of *screen space*.

    Default is ``False`` which indicates that the *data* aspect ratio and the
    *screen* aspect ratio vary independently. ``True`` indicates that the plot
    aspect ratio of the axes will match the aspect ratio of the pixel extent
    the axes. The end result is that a 1x1 area in data space is a square in
    pixels, and conversely that a 1x1 pixel is a square in data units.

    .. note::
        This setting only takes effect when there are two dataranges. This
        setting only sets the initial plot draw and subsequent resets. It is
        possible for tools (single axis zoom, unconstrained box zoom) to
        change the aspect ratio.

    .. warning::
        This setting is incompatible with linking dataranges across multiple
        plots. Doing so may result in undefined behavior.
    """)

    aspect_scale = Float(default=1, help="""
    A value to be given for increased aspect ratio control. This value is added
    multiplicatively to the calculated value required for ``match_aspect``.
    ``aspect_scale`` is defined as the ratio of width over height of the figure.

    For example, a plot with ``aspect_scale`` value of 2 will result in a
    square in *data units* to be drawn on the screen as a rectangle with a
    pixel width twice as long as its pixel height.

    .. note::
        This setting only takes effect if ``match_aspect`` is set to ``True``.
    """)

#-----------------------------------------------------------------------------
# Dev API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Private API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Code
#-----------------------------------------------------------------------------
