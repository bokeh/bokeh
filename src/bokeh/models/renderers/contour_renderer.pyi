#-----------------------------------------------------------------------------
# Copyright (c) Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------

# Standard library imports
from typing import TYPE_CHECKING, Any, Sequence, TypedDict

if TYPE_CHECKING:
    from typing_extensions import Unpack

# Bokeh imports
from ...plotting.contour import ContourData
from ..annotations import ContourColorBar
from ..glyph import Glyph
from .glyph_renderer import GlyphRenderer
from .renderer import (
    DataRenderer,
    RenderLevelType as RenderLevel,
    _DataRendererInit,
)
from ...model.model import JSEventCallback
from ..coordinates import CoordinateMapping
from ..dom import RendererGroup
from ..ui.ui_element import (Menu, Node, StyleSheet, Styles)

# class _ContourRendererInit(_DataRendererInit, total=False):
#     line_renderer: GlyphRenderer[Glyph]
#     fill_renderer: GlyphRenderer[Glyph]
#     levels: Sequence[float]

class _ContourRendererInit(TypedDict, total=False):
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
    line_renderer: GlyphRenderer[Glyph]
    fill_renderer: GlyphRenderer[Glyph]
    levels: Sequence[float]

class ContourRenderer(DataRenderer):
    def __init__(self, **kwargs: Unpack[_ContourRendererInit]) -> None: ...

    line_renderer: GlyphRenderer[Glyph] = ...
    fill_renderer: GlyphRenderer[Glyph] = ...
    levels: Sequence[float] = ...

    def set_data(self, data: ContourData) -> None: ...

    def construct_color_bar(self, **kwargs: Any) -> ContourColorBar: ...
