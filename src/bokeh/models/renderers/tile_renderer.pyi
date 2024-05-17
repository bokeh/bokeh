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
