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
from ...core.enums import LocationType as Location
from ...core.property_aliases import CSSLength
from .panes import Pane, _PaneInit
from ...model.model import JSEventCallback
from ...plotting._figure import AutoType as Auto
from ..widgets.buttons import DOMNode
from .tooltips import UIElement
from .ui_element import (Menu, Node, StyleSheet, Styles)

# class _DrawerInit(_PaneInit, total=False):
#     location: Location
#     open: bool
#     size: float | CSSLength
#     resizable: bool

class _DrawerInit(TypedDict, total=False):
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
    location: Location
    open: bool
    size: float | CSSLength
    resizable: bool

class Drawer(Pane):
    def __init__(self, **kwargs: Unpack[_DrawerInit]) -> None: ...

    location: Location = ...
    open: bool = ...
    size: float | CSSLength = ...
    resizable: bool = ...
