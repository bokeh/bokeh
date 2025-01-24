#-----------------------------------------------------------------------------
# Copyright (c) Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------

# Standard library imports
from dataclasses import dataclass
from typing import Any, Sequence

# Bokeh imports
from ...plotting.contour import ContourData
from ..annotations import ContourColorBar
from ..glyph import Glyph
from .glyph_renderer import GlyphRenderer
from .renderer import DataRenderer

@dataclass
class ContourRenderer(DataRenderer):

    line_renderer: GlyphRenderer[Glyph] = ...

    fill_renderer: GlyphRenderer[Glyph] = ...

    levels: Sequence[float] = ...

    def set_data(self, data: ContourData) -> None: ...

    def construct_color_bar(self, **kwargs: Any) -> ContourColorBar: ...
