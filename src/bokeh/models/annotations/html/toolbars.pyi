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
from ...tools import Toolbar
from .html_annotation import HTMLAnnotation, _HTMLAnnotationInit
from ....model.model import JSEventCallback
from ...coordinates import CoordinateMapping
from ...dom import (
    DOMNode,
    RendererGroup,
)
from ...renderers.renderer import (
    Renderer,
    RenderLevelType as RenderLevel,
)
from ...ui.tooltips import UIElement
from ...ui.ui_element import (Menu, Node, StyleSheet, Styles)

# class _ToolbarPanelInit(_HTMLAnnotationInit, total=False):
#     toolbar: Toolbar

class _ToolbarPanelInit(TypedDict, total=False):
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
    renderers: list[Renderer]
    elements: list[UIElement | DOMNode]
    toolbar: Toolbar

class ToolbarPanel(HTMLAnnotation):
    def __init__(self, **kwargs: Unpack[_ToolbarPanelInit]) -> None: ...

    toolbar: Toolbar = ...
