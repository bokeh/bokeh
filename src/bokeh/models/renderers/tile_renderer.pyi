#-----------------------------------------------------------------------------
# Copyright (c) Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------

# Standard library imports
from typing import Unpack

# Bokeh imports
from ..tiles import TileSource
from .renderer import Renderer, RendererInit

class TileRendererInit(RendererInit, total=False):
    tile_source: TileSource
    alpha: float
    smoothing: bool
    render_parents: bool

class TileRenderer(Renderer):
    def __init__(self, **kwargs: Unpack[TileRendererInit]) -> None: ...

    tile_source: TileSource = ...
    alpha: float = ...
    smoothing: bool = ...
    render_parents: bool = ...
