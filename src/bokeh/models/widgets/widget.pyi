#-----------------------------------------------------------------------------
# Copyright (c) Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------

# Standard library imports
from abc import abstractmethod
from typing import Any, Sequence, TypedDict, TYPE_CHECKING

if TYPE_CHECKING:
    from typing_extensions import Unpack

# Bokeh imports
from ..layouts import (
    AlignType as Align,
    FlowModeType as FlowMode,
    LayoutDOM,
    SizingModeType as SizingMode,
    SizingPolicyType as SizingPolicy,
    _LayoutDOMInit,
)
from ...model.model import JSEventCallback
from ...core.enums import (
    AutoType as Auto,
    DimensionsType as Dimensions,
)
from ..._types import NonNegative
from ..ui.tooltips import UIElement
from ..ui.ui_element import (Menu, Node, StyleSheet, Styles)
from .buttons import DOMNode

# class _WidgetInit(_LayoutDOMInit, total=False):
#     ...

class _WidgetInit(TypedDict, total=False):
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
    disabled: bool
    width: NonNegative[int] | None
    height: NonNegative[int] | None
    min_width: NonNegative[int] | None
    min_height: NonNegative[int] | None
    max_width: NonNegative[int] | None
    max_height: NonNegative[int] | None
    margin: int | tuple[int, int] | tuple[int, int, int, int] | None
    width_policy: Auto | SizingPolicy
    height_policy: Auto | SizingPolicy
    aspect_ratio: None | Auto | float
    flow_mode: FlowMode
    sizing_mode: SizingMode | None
    align: Auto | Align | tuple[Align, Align]
    resizable: bool | Dimensions

class Widget(LayoutDOM):
    @abstractmethod
    def __init__(self, **kwargs: Unpack[_WidgetInit]) -> None: ...
