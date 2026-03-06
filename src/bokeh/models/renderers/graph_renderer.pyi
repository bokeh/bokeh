#-----------------------------------------------------------------------------
# Copyright (c) Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------

# Standard library imports
from typing import Any, Sequence, TypedDict, TYPE_CHECKING

if TYPE_CHECKING:
    from typing_extensions import Unpack

# Bokeh imports
from ..glyph import XYGlyph
from ..glyphs import MultiLine, Patches
from ..graphs import GraphHitTestPolicy, LayoutProvider
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

# class _GraphRendererInit(_DataRendererInit, total=False):
#     layout_provider: LayoutProvider
#     node_renderer: GlyphRenderer[XYGlyph]
#     edge_renderer: GlyphRenderer[MultiLine | Patches]
#     selection_policy: GraphHitTestPolicy
#     inspection_policy: GraphHitTestPolicy

class _GraphRendererInit(TypedDict, total=False):
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
    layout_provider: LayoutProvider
    node_renderer: GlyphRenderer[XYGlyph]
    edge_renderer: GlyphRenderer[MultiLine | Patches]
    selection_policy: GraphHitTestPolicy
    inspection_policy: GraphHitTestPolicy

class GraphRenderer(DataRenderer):
    def __init__(self, **kwargs: Unpack[_GraphRendererInit]) -> None: ...

    layout_provider: LayoutProvider = ...
    node_renderer: GlyphRenderer[XYGlyph] = ...
    edge_renderer: GlyphRenderer[MultiLine | Patches] = ...
    selection_policy: GraphHitTestPolicy = ...
    inspection_policy: GraphHitTestPolicy = ...
