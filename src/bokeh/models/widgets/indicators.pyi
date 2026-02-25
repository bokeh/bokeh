#-----------------------------------------------------------------------------
# Copyright (c) Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------

# Standard library imports
from abc import abstractmethod
from typing import TYPE_CHECKING, Literal

if TYPE_CHECKING:
    from typing_extensions import Unpack

# Bokeh imports
from ...core.enums import OrientationType as Orientation
from .widget import Widget

from ..._types import NonNegative
from ...core.enums import AlignType as Align
from ...core.enums import AutoType as Auto
from ...core.enums import DimensionsType as Dimensions
from ...core.enums import FlowModeType as FlowMode
from ...core.enums import SizingModeType as SizingMode
from ...core.enums import SizingPolicyType as SizingPolicy
from ...model.model import JSEventCallback
from ..css import StyleSheet
from ..css import Styles
from ..dom import DOMNode
from ..nodes import Node
from ..ui.menus import Menu
from ..ui.ui_element import UIElement
from typing import Any
from typing import Sequence
from typing import TypedDict

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
