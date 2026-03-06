#-----------------------------------------------------------------------------
# Copyright (c) Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------

# Standard library imports
from abc import abstractmethod
from typing import Any, Literal, Sequence, TypedDict, TYPE_CHECKING

if TYPE_CHECKING:
    from typing_extensions import Unpack

# Bokeh imports
from ...core.enums import (
    AutoType as Auto,
    DimensionsType as Dimensions,
    OrientationType as Orientation,
)
from .widget import Widget, _WidgetInit
from ...model.model import JSEventCallback
from ..._types import NonNegative
from ..layouts import (AlignType as Align, FlowModeType as FlowMode, SizingModeType as SizingMode, SizingPolicyType as SizingPolicy)
from ..ui.tooltips import UIElement
from ..ui.ui_element import (Menu, Node, StyleSheet, Styles)
from .buttons import DOMNode

# class _IndicatorInit(_WidgetInit, total=False):
#     ...

class _IndicatorInit(TypedDict, total=False):
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

class Indicator(Widget):
    @abstractmethod
    def __init__(self, **kwargs: Unpack[_IndicatorInit]) -> None: ...

# class _ProgressInit(_IndicatorInit, total=False):
#     mode: Literal["determinate", "indeterminate"]
#     value: int
#     min: int
#     max: int
#     reversed: bool
#     orientation: Orientation
#     label: str | None
#     label_location: Literal["none", "inline"]
#     description: str | None

class _ProgressInit(TypedDict, total=False):
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
    mode: Literal["determinate", "indeterminate"]
    value: int
    min: int
    max: int
    reversed: bool
    orientation: Orientation
    label: str | None
    label_location: Literal["none", "inline"]
    description: str | None

class Progress(Indicator):
    def __init__(self, **kwargs: Unpack[_ProgressInit]) -> None: ...

    mode: Literal["determinate", "indeterminate"] = ...
    value: int = ...
    min: int = ...
    max: int = ...
    reversed: bool = ...
    orientation: Orientation = ...
    label: str | None = ...
    label_location: Literal["none", "inline"] = ...
    description: str | None = ...
