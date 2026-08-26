#-----------------------------------------------------------------------------
# Copyright (c) Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------

# Standard library imports
from typing import Literal, Unpack

from ..glyph import XYGlyph
from ..glyphs import (
    Bezier,
    MultiLine,
    Patches,
    Segment,
)
from ..graphs import LayoutProvider
from ..sources import GraphDataSource
from .glyph_renderer import GlyphRenderer
from .renderer import DataRenderer, _DataRendererInit

class _GraphRendererInit(_DataRendererInit, total=False):
    data_source: GraphDataSource
    layout_provider: LayoutProvider
    node_renderer: GlyphRenderer[XYGlyph]
    edge_renderer: GlyphRenderer[MultiLine | Patches | Segment | Bezier]
    selection_target: Literal["nodes", "edges"]
    inspection_target: Literal["nodes", "edges"]

class GraphRenderer(DataRenderer):
    def __init__(self, **kwargs: Unpack[_GraphRendererInit]) -> None: ...

    data_source: GraphDataSource = ...
    layout_provider: LayoutProvider = ...
    node_renderer: GlyphRenderer[XYGlyph] = ...
    edge_renderer: GlyphRenderer[MultiLine | Patches | Segment | Bezier] = ...
    selection_target: Literal["nodes", "edges"] = ...
    inspection_target: Literal["nodes", "edges"] = ...
