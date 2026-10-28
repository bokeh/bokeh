#-----------------------------------------------------------------------------
# Copyright (c) Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------

from typing import Unpack

from ..glyph import XYGlyph
from ..glyphs import (
    Bezier,
    MultiLine,
    Patches,
    Segment,
)
from ..graphs import GraphHitTestPolicy, LayoutProvider
from .glyph_renderer import GlyphRenderer
from .renderer import DataRenderer, _DataRendererInit

class _GraphRendererInit(_DataRendererInit, total=False):
    layout_provider: LayoutProvider
    node_renderer: GlyphRenderer[XYGlyph]
    edge_renderer: GlyphRenderer[MultiLine | Patches | Segment | Bezier]
    selection_policy: GraphHitTestPolicy
    inspection_policy: GraphHitTestPolicy

class GraphRenderer(DataRenderer):
    def __init__(self, **kwargs: Unpack[_GraphRendererInit]) -> None: ...

    layout_provider: LayoutProvider = ...
    node_renderer: GlyphRenderer[XYGlyph] = ...
    edge_renderer: GlyphRenderer[MultiLine | Patches | Segment | Bezier] = ...
    selection_policy: GraphHitTestPolicy = ...
    inspection_policy: GraphHitTestPolicy = ...
