#-----------------------------------------------------------------------------
# Copyright (c) Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------

# Standard library imports
from dataclasses import dataclass
from typing import (
    Any,
    Generic,
    Literal,
    TypeVar,
)

# Bokeh imports
from ...core.enums import AutoType as Auto
from ..annotations import ColorBar
from ..glyphs import Glyph
from ..graphics import Decoration, Marking
from ..sources import CDSView, DataSource
from .renderer import DataRenderer

GlyphType = TypeVar("GlyphType", bound=Glyph)

@dataclass
class GlyphRenderer(DataRenderer, Generic[GlyphType]):

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
