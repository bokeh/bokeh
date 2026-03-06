#-----------------------------------------------------------------------------
# Copyright (c) Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------

# Standard library imports
from typing import (
    Any,
    Generic,
    Literal,
    Sequence,
    TYPE_CHECKING,
    TypeVar,
    TypedDict,
)

if TYPE_CHECKING:
    from typing_extensions import Unpack

# Bokeh imports
from ...core.enums import AutoType as Auto
from ..annotations import ColorBar
from ..glyph import Glyph
from ..graphics import Decoration, Marking
from ..sources import CDSView, DataSource
from .renderer import (
    DataRenderer,
    RenderLevelType as RenderLevel,
    _DataRendererInit,
)
from ...model.model import JSEventCallback
from ..coordinates import CoordinateMapping
from ..dom import RendererGroup
from ..ui.ui_element import (Menu, Node, StyleSheet, Styles)

GlyphType = TypeVar("GlyphType", bound=Glyph)

# class _GlyphRendererInit(_DataRendererInit, Generic[GlyphType], total=False):
#     data_source: DataSource
#     view: CDSView
#     glyph: GlyphType
#     selection_glyph: Auto | GlyphType | None
#     nonselection_glyph: Auto | GlyphType | None
#     hover_glyph: GlyphType | None
#     muted_glyph: Auto | GlyphType | None
#     muted: bool

class _GlyphRendererInit(TypedDict, total=False):
    name: str | None
    tags: list[Any]
    js_event_callbacks: dict[str, list[JSEventCallback]]
    js_property_callbacks: dict[str, list[JSEventCallback]]
    subscribed_events: set[str]
    syncable: bool
    html_attributes: dict[str, str]
    html_id: str | None
    css_classes: Sequence[str]
    css_variables: dict[str, str | Node]
    styles: dict[str, str | None] | Styles
    stylesheets: list[StyleSheet | str | dict[str, dict[str, str | None] | Styles]]
    level: RenderLevel
    visible: bool
    coordinates: CoordinateMapping | None
    x_range_name: str
    y_range_name: str
    group: RendererGroup | None
    propagate_hover: bool
    context_menu: Menu | None
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
