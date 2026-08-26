#-----------------------------------------------------------------------------
# Copyright (c) Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------

# Standard library imports
from typing import Any, Literal, Unpack

# Bokeh imports
from ..._specs import DataSpec, NumberSpec
from ...core.enums import AutoType as Auto
from ..annotations import ColorBar
from ..glyph import Glyph
from ..graphics import Marking, PathDecoration, PathMarkings
from ..sources import CDSView, IndexedDataSource
from .renderer import DataRenderer, _DataRendererInit

class _GlyphRendererInit[GlyphType: Glyph](_DataRendererInit, total=False):
    data_source: IndexedDataSource
    view: CDSView
    glyph: GlyphType
    selection_glyph: Auto | GlyphType | None
    nonselection_glyph: Auto | GlyphType | None
    hover_glyph: GlyphType | None
    muted_glyph: Auto | GlyphType | None
    muted: bool

class GlyphRenderer[GlyphType: Glyph](DataRenderer):
    def __init__(self, **kwargs: Unpack[_GlyphRendererInit[GlyphType]]) -> None: ...

    data_source: IndexedDataSource = ...
    view: CDSView = ...
    glyph: GlyphType = ...
    selection_glyph: Auto | GlyphType | None = ...
    nonselection_glyph: Auto | GlyphType | None = ...
    hover_glyph: GlyphType | None = ...
    muted_glyph: Auto | GlyphType | None = ...
    muted: bool = ...

    def add_path_decoration(self, marking: Marking, *, node: Literal["start", "middle", "end"],
        inset: NumberSpec = ..., selection_marking: Auto | Marking | None = ...,
        nonselection_marking: Auto | Marking | None = ..., hover_marking: Auto | Marking | None = ...,
        muted_marking: Auto | Marking | None = ...) -> PathDecoration: ...

    def add_path_markings(self, marking: Marking, *, positions: DataSpec[list[float]] | None = ...,
        selection_marking: Auto | Marking | None = ..., nonselection_marking: Auto | Marking | None = ...,
        hover_marking: Auto | Marking | None = ..., muted_marking: Auto | Marking | None = ...) -> PathMarkings: ...

    def construct_color_bar(self, **kwargs: Any) -> ColorBar: ...
