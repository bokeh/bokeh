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
from ..tiles import TileSource
from .renderer import (
    RenderLevelType as RenderLevel,
    Renderer,
    _RendererInit,
)
from ...model.model import JSEventCallback
from ...plotting.glyph_api import CoordinateMapping
from ..dom import RendererGroup
from ..ui.ui_element import (Menu, Node, StyleSheet, Styles)

# class _TileRendererInit(_RendererInit, total=False):
#     tile_source: TileSource
#     alpha: float
#     smoothing: bool
#     render_parents: bool

class _TileRendererInit(TypedDict, total=False):
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
    tile_source: TileSource
    alpha: float
    smoothing: bool
    render_parents: bool

class TileRenderer(Renderer):
    def __init__(self, **kwargs: Unpack[_TileRendererInit]) -> None: ...

    tile_source: TileSource = ...
    alpha: float = ...
    smoothing: bool = ...
    render_parents: bool = ...
