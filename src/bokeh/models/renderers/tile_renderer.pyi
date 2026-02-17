#-----------------------------------------------------------------------------
# Copyright (c) Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------

# Standard library imports
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from typing_extensions import Unpack

# Bokeh imports
from ..tiles import TileSource
from .renderer import Renderer, _RendererInit

class _TileRendererInit(_RendererInit, total=False):
    tile_source: TileSource
    alpha: float
    smoothing: bool
    render_parents: bool

class TileRenderer(Renderer):
    def __init__(self, **kwargs: Unpack[_TileRendererInit]) -> None: ...

    tile_source: TileSource = ...
    alpha: float = ...
    smoothing: bool = ...
    render_parents: bool = ...
