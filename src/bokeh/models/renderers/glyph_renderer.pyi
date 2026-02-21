#-----------------------------------------------------------------------------
# Copyright (c) Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------

# Standard library imports
from typing import (
    TYPE_CHECKING,
    Any,
    Generic,
    Literal,
    TypeVar,
)

if TYPE_CHECKING:
    from typing_extensions import Unpack

# Bokeh imports
from ...core.enums import AutoType as Auto
from ..annotations import ColorBar
from ..glyph import Glyph
from ..graphics import Decoration, Marking
from ..sources import CDSView, DataSource
from .renderer import DataRenderer, _DataRendererInit

GlyphType = TypeVar("GlyphType", bound=Glyph)

class _GlyphRendererInit(_DataRendererInit, Generic[GlyphType], total=False):
    data_source: DataSource
    view: CDSView
    glyph: GlyphType
    selection_glyph: Auto | GlyphType | None
    nonselection_glyph: Auto | GlyphType | None
    hover_glyph: GlyphType | None
    muted_glyph: Auto | GlyphType | None
    muted: bool

class GlyphRenderer(DataRenderer, Generic[GlyphType]):
    def __init__(self, **kwargs: Unpack[_GlyphRendererInit[GlyphType]]) -> None: ...

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
