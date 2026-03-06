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
from ...core.enums import (
    AnchorType as Anchor,
    AutoType as Auto,
    TooltipAttachmentType as TooltipAttachment,
)
from ..dom import DOMNode
from ..nodes import Coordinate
from ..selectors import Selector
from .ui_element import (
    Menu,
    Node,
    StyleSheet,
    Styles,
    UIElement,
    _UIElementInit,
)
from ...model.model import JSEventCallback

# class _TooltipInit(_UIElementInit, total=False):
#     position: Anchor | tuple[float, float] | Coordinate | None
#     target: UIElement | Selector | Auto
#     content: str | DOMNode | UIElement
#     attachment: TooltipAttachment | Auto
#     show_arrow: bool
#     closable: bool
#     interactive: bool

class _TooltipInit(TypedDict, total=False):
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
    position: Anchor | tuple[float, float] | Coordinate | None
    target: UIElement | Selector | Auto
    content: str | DOMNode | UIElement
    attachment: TooltipAttachment | Auto
    show_arrow: bool
    closable: bool
    interactive: bool

class Tooltip(UIElement):
    def __init__(self, **kwargs: Unpack[_TooltipInit]) -> None: ...

    position: Anchor | tuple[float, float] | Coordinate | None = ...
    target: UIElement | Selector | Auto = ...
    content: str | DOMNode | UIElement = ...
    attachment: TooltipAttachment | Auto = ...
    show_arrow: bool = ...
    closable: bool = ...
    interactive: bool = ...
