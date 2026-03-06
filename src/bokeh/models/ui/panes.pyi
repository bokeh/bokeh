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
from ..dom import DOMNode
from .ui_element import (
    Menu,
    Node,
    StyleSheet,
    Styles,
    UIElement,
    _UIElementInit,
)
from ...model.model import JSEventCallback
from ...plotting._figure import AutoType as Auto

# class _PaneInit(_UIElementInit, total=False):
#     elements: list[UIElement | DOMNode]

class _PaneInit(TypedDict, total=False):
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
    visible: bool
    context_menu: Menu | Auto | None
    elements: list[UIElement | DOMNode]

class Pane(UIElement):
    def __init__(self, **kwargs: Unpack[_PaneInit]) -> None: ...

    elements: list[UIElement | DOMNode] = ...
