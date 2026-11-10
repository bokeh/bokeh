#-----------------------------------------------------------------------------
# Copyright (c) Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------

from typing import Any, Literal, Unpack

from ..._specs import AngleSpec, DataSpec, NumberSpec
from ...core.enums import AutoType as Auto
from ..annotations import ColorBar
from ..glyph import Glyph
from ..graphics import Marking, PathMarking, PathMarkings
from ..sources import CDSView, DataSource
from .renderer import DataRenderer, _DataRendererInit

class _GlyphRendererInit[GlyphType: Glyph](_DataRendererInit, total=False):
    data_source: DataSource
    view: CDSView
    glyph: GlyphType
    selection_glyph: Auto | GlyphType | None
    nonselection_glyph: Auto | GlyphType | None
    hover_glyph: GlyphType | None
    muted_glyph: Auto | GlyphType | None
    muted: bool

class GlyphRenderer[GlyphType: Glyph](DataRenderer):
    def __init__(self, **kwargs: Unpack[_GlyphRendererInit[GlyphType]]) -> None: ...

    data_source: DataSource = ...
    view: CDSView = ...
    glyph: GlyphType = ...
    selection_glyph: Auto | GlyphType | None = ...
    nonselection_glyph: Auto | GlyphType | None = ...
    hover_glyph: GlyphType | None = ...
    muted_glyph: Auto | GlyphType | None = ...
    muted: bool = ...

    def add_path_decoration(self, marking: Marking, *, node: Literal["start", "middle", "end"],
        inset: NumberSpec = ..., angle: AngleSpec = ..., angle_reference: Literal["auto", "left", "right", "screen"] = ...,
        selection_marking: Auto | Marking | None = ...,
        nonselection_marking: Auto | Marking | None = ..., hover_marking: Auto | Marking | None = ...,
        muted_marking: Auto | Marking | None = ...) -> PathMarking: ...

    def add_path_markings(self, marking: Marking, *, positions: DataSpec[list[float]] | None = ...,
        angle: AngleSpec = ..., angle_reference: Literal["auto", "left", "right", "screen"] = ...,
        selection_marking: Auto | Marking | None = ..., nonselection_marking: Auto | Marking | None = ...,
        hover_marking: Auto | Marking | None = ..., muted_marking: Auto | Marking | None = ...) -> PathMarkings: ...

    def construct_color_bar(self, **kwargs: Any) -> ColorBar: ...
