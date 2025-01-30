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
from ..glyphs import Glyph
from ..graphics import Decoration, Marking
from ..sources import CDSView, DataSource
from .renderer import DataRenderer

@dataclass
class GlyphRenderer[T: Glyph](DataRenderer):

    data_source: DataSource = ...

    view: CDSView = ...

    glyph: T = ...

    selection_glyph: Auto | T | None = ...

    nonselection_glyph: Auto | T | None = ...

    hover_glyph: T | None = ...

    muted_glyph: Auto | T | None = ...

    muted: bool = ...

    def add_decoration(self, marking: Marking, node: Literal["start", "middle", "end"]) -> Decoration: ...

    def construct_color_bar(self, **kwargs: Any) -> ColorBar: ...
