#-----------------------------------------------------------------------------
# Copyright (c) Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------

# Standard library imports
from dataclasses import dataclass

# Bokeh imports
from ..tiles import TileSource
from .renderer import Renderer

@dataclass
class TileRenderer(Renderer):

    tile_source: TileSource = ...

    alpha: float = ...

    smoothing: bool = ...

    render_parents: bool = ...
