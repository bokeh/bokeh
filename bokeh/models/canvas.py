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
    Auto,
    Bool,
    Dict,
    Either,
    Enum,
    Instance,
    InstanceDefault,
    Int,
    List,
    String,
)
from ..model import Model
from .ranges import DataRange1d, Range
from .renderers import Renderer
from .scales import LinearScale, Scale

#-----------------------------------------------------------------------------
# Globals and constants
#-----------------------------------------------------------------------------

__all__ = (
    "Canvas",
    "CartesianFrame",
    "Layer",
)

#-----------------------------------------------------------------------------
# General API
#-----------------------------------------------------------------------------

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

class Layer(Model):
    """ """

    # explicit __init__ to support Init signatures
    def __init__(self, *args, **kwargs) -> None:
        super().__init__(*args, **kwargs)

    renderers = List(Instance(Renderer), default=[], help="""
    Collection of objects to paint onto this canvas layer.
    """)

    z_index = Either(Auto, Int, default="auto", help="""
    Allows to override the default order of layers.

    This doesn't affect z-ordering of individual renderers within a layer.
    """)

class Canvas(Model):
    """ """

    # explicit __init__ to support Init signatures
    def __init__(self, *args, **kwargs) -> None:
        super().__init__(*args, **kwargs)

    renderers = List(Instance(Renderer), default=[], help="""
    Collection of objects to paint onto this canvas.
    """)

    layers = List(Instance(Layer), default=[], help="""
    Collection of customized canvas layers.

    Each leayer is a separate HTML5 canvas and introduces an new stacking
    context for renderers. All layers, including the implicit ones, are
    composed together in the approriate order to form the final rendering.
    """)

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
