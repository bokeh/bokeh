#-----------------------------------------------------------------------------
# Copyright (c) Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------

from typing import Any, Literal, Protocol, Sequence, TypedDict, Unpack, overload

from ..._specs import AngleSpec, FieldDict, FloatArray, IntArray, NumberSpec
from ...core.enums import AngleReferenceType as AngleReference, AutoType as Auto
from ...core.property.vectorization import Field
from ..annotations import ArrowHead, ColorBar
from ..glyph import Glyph, SupportsPathMarking
from ..graphics import Marking, PathPlacement
from ..sources import CDSView, DataSource
from .renderer import DataRenderer, _DataRendererInit

# A read-only host allows receivers with supported glyph subclasses and unions.
class _RendererOf[Host](Protocol):
    @property
    def glyph(self) -> Host: ...

type _PathRenderer = _RendererOf[SupportsPathMarking]
type _FractionalPlacement = float | Sequence[float] | FloatArray | IntArray | Field | FieldDict[list[float]]

type _Endpoint = Literal["start", "end"]
type _Placement = _Endpoint | Literal["middle"] | _FractionalPlacement

class _PathMarkingOptions(TypedDict, total=False):
    angle: AngleSpec
    angle_reference: AngleReference
    selection_marking: Auto | Marking | None
    nonselection_marking: Auto | Marking | None
    hover_marking: Auto | Marking | None
    muted_marking: Auto | Marking | None

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

    @overload
    def add_path_marking(self: _PathRenderer, marking: Marking, *,
        at: _Endpoint, inset: NumberSpec, **options: Unpack[_PathMarkingOptions]) -> PathPlacement: ...

    @overload
    def add_path_marking(self: _PathRenderer, marking: Marking, *,
        at: _Placement, **options: Unpack[_PathMarkingOptions]) -> PathPlacement: ...

    def add_arrowheads(self: _PathRenderer, *, at: Literal["start", "middle", "end"] | _FractionalPlacement = ...,
        head: ArrowHead | Auto = ...,
        angle: AngleSpec = ..., angle_reference: AngleReference = ...) -> PathPlacement: ...

    def construct_color_bar(self, **kwargs: Any) -> ColorBar: ...
