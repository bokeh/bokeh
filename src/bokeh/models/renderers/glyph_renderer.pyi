#-----------------------------------------------------------------------------
# Copyright (c) Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------

# Standard library imports
from dataclasses import dataclass
from typing import Any, Literal

# Bokeh imports
from ...core.enums import AutoType as Auto
from ..annotations import ColorBar
from ..glyph import Glyph
from ..graphics import Decoration, Marking
from ..sources import CDSView, DataSource
from .renderer import DataRenderer

@dataclass
class GlyphRenderer[GlyphType: Glyph](DataRenderer):

    data_source: DataSource = ...

    view: CDSView = ...

    glyph: GlyphType = ...

    selection_glyph: Auto | GlyphType | None = ...

    nonselection_glyph: Auto | GlyphType | None = ...

    hover_glyph: GlyphType | None = ...

    muted_glyph: Auto | GlyphType | None = ...

    muted: bool = ...

    def add_decoration(self, marking: Marking, node: Literal["start", "middle", "end"]) -> Decoration: ...

    def construct_color_bar(self, **kwargs: Any) -> ColorBar: ...
