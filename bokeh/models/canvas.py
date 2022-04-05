#-----------------------------------------------------------------------------
# Copyright (c) 2012 - 2022, Anaconda, Inc., and Bokeh Contributors.
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
    Instance,
    InstanceDefault,
    String,
)
from ..model import Model
from .ranges import DataRange1d, Range
from .scales import LinearScale, Scale

#-----------------------------------------------------------------------------
# Globals and constants
#-----------------------------------------------------------------------------

__all__ = (
    "Canvas",
    "CartesianFrame",
    "CoordinateMapping",
)

#-----------------------------------------------------------------------------
# General API
#-----------------------------------------------------------------------------

class CoordinateMapping(Model):
    """ A mapping between two coordinate systems. """

    # explicit __init__ to support Init signatures
    def __init__(self, *args, **kwargs) -> None:
        super().__init__(*args, **kwargs)

    x_source = Instance(Range, default=InstanceDefault(DataRange1d), help="""
    The source range of the horizontal dimension of the new coordinate space.
    """)

    y_source = Instance(Range, default=InstanceDefault(DataRange1d), help="""
    The source range of the vertical dimension of the new coordinate space.
    """)

    x_scale = Instance(Scale, default=InstanceDefault(LinearScale), help="""
    What kind of scale to use to convert x-coordinates from the source (data)
    space into x-coordinates in the target (possibly screen) coordinate space.
    """)

    y_scale = Instance(Scale, default=InstanceDefault(LinearScale), help="""
    What kind of scale to use to convert y-coordinates from the source (data)
    space into y-coordinates in the target (possibly screen) coordinate space.
    """)

    x_target = Instance(Range, help="""
    The horizontal range to map x-coordinates in the target coordinate space.
    """)

    y_target = Instance(Range, help="""
    The vertical range to map y-coordinates in the target coordinate space.
    """)

class CartesianFrame(Model):
    """ """

    # explicit __init__ to support Init signatures
    def __init__(self, *args, **kwargs) -> None:
        super().__init__(*args, **kwargs)

    x_range = Instance(Range, default=InstanceDefault(DataRange1d), help="""
    The (default) data range of the horizontal dimension of the plot.
    """)

    y_range = Instance(Range, default=InstanceDefault(DataRange1d), help="""
    The (default) data range of the vertical dimension of the plot.
    """)

    x_scale = Instance(Scale, default=InstanceDefault(LinearScale), help="""
    What kind of scale to use to convert x-coordinates in data space
    into x-coordinates in screen space.
    """)

    y_scale = Instance(Scale, default=InstanceDefault(LinearScale), help="""
    What kind of scale to use to convert y-coordinates in data space
    into y-coordinates in screen space.
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

class Canvas(Model):
    """ """

    # explicit __init__ to support Init signatures
    def __init__(self, *args, **kwargs) -> None:
        super().__init__(*args, **kwargs)

    hidpi = Bool(default=True, help="""
    Whether to use HiDPI mode when available.
    """)

    output_backend = Enum(OutputBackend, default="canvas", help="""
    Specify the output backend for the plot area. Default is HTML5 Canvas.

    .. note::
        When set to ``webgl``, glyphs without a WebGL rendering implementation
        will fall back to rendering onto 2D canvas.
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
