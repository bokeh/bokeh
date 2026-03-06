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
    from typing_extensions import NotRequired, Unpack

# Bokeh imports
from .._types import NonNegative
from ..core.enums import (
    AlignType as Align,
    AutoType as Auto,
    DimensionsType as Dimensions,
    FlowModeType as FlowMode,
    LocationType as Location,
    ScrollbarPolicyType as ScrollbarPolicy,
    SizingModeType as SizingMode,
    SizingPolicyType as SizingPolicy,
)
from ..core.has_props import HasProps
from ..core.property_aliases import GridSpacing, TracksSizing
from ..model.model import JSEventCallback, Model, _ModelInit
from .ui.panes import Pane, _PaneInit
from .ui.tooltips import Tooltip
from .ui.ui_element import (
    Menu,
    Node,
    StyleSheet,
    Styles,
    UIElement,
)
from .dom import DOMNode

# class _LayoutDOMInit(_PaneInit, total=False):
#     disabled: bool
#     width: NonNegative[int] | None
#     height: NonNegative[int] | None
#     min_width: NonNegative[int] | None
#     min_height: NonNegative[int] | None
#     max_width: NonNegative[int] | None
#     max_height: NonNegative[int] | None
#     margin: int | tuple[int, int] | tuple[int, int, int, int] | None
#     width_policy: Auto | SizingPolicy
#     height_policy: Auto | SizingPolicy
#     aspect_ratio: None | Auto | float
#     flow_mode: FlowMode
#     sizing_mode: SizingMode | None
#     align: Auto | Align | tuple[Align, Align]
#     resizable: bool | Dimensions

class _LayoutDOMInit(TypedDict, total=False):
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

class LayoutDOM(Pane):
    @abstractmethod
    def __init__(self, **kwargs: Unpack[_LayoutDOMInit]) -> None: ...

    disabled: bool = ...
    width: NonNegative[int] | None = ...
    height: NonNegative[int] | None = ...
    min_width: NonNegative[int] | None = ...
    min_height: NonNegative[int] | None = ...
    max_width: NonNegative[int] | None = ...
    max_height: NonNegative[int] | None = ...
    margin: int | tuple[int, int] | tuple[int, int, int, int] | None = ...
    width_policy: Auto | SizingPolicy = ...
    height_policy: Auto | SizingPolicy = ...
    aspect_ratio: None | Auto | float = ...
    flow_mode: FlowMode = ...
    sizing_mode: SizingMode | None = ...
    align: Auto | Align | tuple[Align, Align] = ...
    resizable: bool | Dimensions = ...

# class _SpacerInit(_LayoutDOMInit, total=False):
#     ...

class _SpacerInit(TypedDict, total=False):
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

class Spacer(LayoutDOM):
    def __init__(self, **kwargs: Unpack[_SpacerInit]) -> None: ...

# class _GridCommonInit(TypedDict, total=False):
#     rows: TracksSizing | None
#     cols: TracksSizing | None
#     spacing: GridSpacing

class _GridCommonInit(TypedDict, total=False):
    rows: TracksSizing | None
    cols: TracksSizing | None
    spacing: GridSpacing

class GridCommon(HasProps):
    @abstractmethod
    def __init__(self, **kwargs: Unpack[_GridCommonInit]) -> None: ...

    rows: TracksSizing | None = ...
    cols: TracksSizing | None = ...
    spacing: GridSpacing = ...

# class _GridBoxInit(_GridCommonInit, _LayoutDOMInit, total=False):
#     children: list[tuple[UIElement, int, int] | tuple[UIElement, int, int, int, int]]

class _GridBoxInit(TypedDict, total=False):
    rows: TracksSizing | None
    cols: TracksSizing | None
    spacing: GridSpacing
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
    children: list[tuple[UIElement, int, int] | tuple[UIElement, int, int, int, int]]

class GridBox(LayoutDOM, GridCommon):
    def __init__(self, **kwargs: Unpack[_GridBoxInit]) -> None: ...

    children: list[tuple[UIElement, int, int] | tuple[UIElement, int, int, int, int]] = ...

class HBoxChild(TypedDict):
    child: UIElement
    col: NotRequired[int]
    span: NotRequired[int]

class VBoxChild(TypedDict):
    child: UIElement
    row: NotRequired[int]
    span: NotRequired[int]

# class _HBoxInit(_LayoutDOMInit, total=False):
#     children: list[HBoxChild] | list[UIElement]
#     cols: TracksSizing | None
#     spacing: NonNegative[int]

class _HBoxInit(TypedDict, total=False):
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
    children: list[HBoxChild] | list[UIElement]
    cols: TracksSizing | None
    spacing: NonNegative[int]

class HBox(LayoutDOM):
    def __init__(self, **kwargs: Unpack[_HBoxInit]) -> None: ...

    @property
    def children(self) -> list[HBoxChild]: ...
    @children.setter
    def children(self, children: list[HBoxChild] | list[UIElement]) -> None: ...

    cols: TracksSizing | None = ...
    spacing: NonNegative[int] = ...

# class _VBoxInit(_LayoutDOMInit, total=False):
#     children: list[VBoxChild] | list[UIElement]
#     rows: TracksSizing | None
#     spacing: NonNegative[int]

class _VBoxInit(TypedDict, total=False):
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
    children: list[VBoxChild] | list[UIElement]
    rows: TracksSizing | None
    spacing: NonNegative[int]

class VBox(LayoutDOM):
    def __init__(self, **kwargs: Unpack[_VBoxInit]) -> None: ...

    @property
    def children(self) -> list[VBoxChild]: ...
    @children.setter
    def children(self, children: list[VBoxChild] | list[UIElement]) -> None: ...

    rows: TracksSizing | None = ...
    spacing: NonNegative[int] = ...

# class _FlexBoxInit(_LayoutDOMInit, total=False):
#     children: list[UIElement]
#     spacing: NonNegative[int]

class _FlexBoxInit(TypedDict, total=False):
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
    children: list[UIElement]
    spacing: NonNegative[int]

class FlexBox(LayoutDOM):
    @abstractmethod
    def __init__(self, **kwargs: Unpack[_FlexBoxInit]) -> None: ...

    children: list[UIElement] = ...
    spacing: NonNegative[int] = ...

# class _RowInit(_FlexBoxInit, total=False):
#     ...

class _RowInit(TypedDict, total=False):
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
    children: list[UIElement]
    spacing: NonNegative[int]

class Row(FlexBox):
    def __init__(self, **kwargs: Unpack[_RowInit]) -> None: ...

# class _ColumnInit(_FlexBoxInit, total=False):
#     ...

class _ColumnInit(TypedDict, total=False):
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
    children: list[UIElement]
    spacing: NonNegative[int]

class Column(FlexBox):
    def __init__(self, **kwargs: Unpack[_ColumnInit]) -> None: ...

# class _TabPanelInit(_ModelInit, total=False):
#     title: str
#     tooltip: Tooltip | None
#     child: UIElement
#     closable: bool
#     disabled: bool

class _TabPanelInit(TypedDict, total=False):
    name: str | None
    tags: list[Any]
    js_event_callbacks: dict[str, list[JSEventCallback]]
    js_property_callbacks: dict[str, list[JSEventCallback]]
    subscribed_events: set[str]
    syncable: bool
    title: str
    tooltip: Tooltip | None
    child: UIElement
    closable: bool
    disabled: bool

class TabPanel(Model):
    def __init__(self, **kwargs: Unpack[_TabPanelInit]) -> None: ...

    title: str = ...
    tooltip: Tooltip | None = ...
    child: UIElement = ...
    closable: bool = ...
    disabled: bool = ...

# class _TabsInit(_LayoutDOMInit, total=False):
#     tabs: list[TabPanel] | list[tuple[str, UIElement]]
#     tabs_location: Location
#     active: int
#     link_layouts: bool

class _TabsInit(TypedDict, total=False):
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
    tabs: list[TabPanel] | list[tuple[str, UIElement]]
    tabs_location: Location
    active: int
    link_layouts: bool

class Tabs(LayoutDOM):
    def __init__(self, **kwargs: Unpack[_TabsInit]) -> None: ...

    @property
    def tabs(self) -> list[TabPanel]: ...
    @tabs.setter
    def tabs(self, tabs: list[TabPanel] | list[tuple[str, UIElement]]) -> None: ...

    tabs_location: Location = ...
    active: int = ...
    link_layouts: bool = ...

# class _GroupBoxInit(_LayoutDOMInit, total=False):
#     title: str | None
#     child: UIElement
#     checkable: bool

class _GroupBoxInit(TypedDict, total=False):
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
    title: str | None
    child: UIElement
    checkable: bool

class GroupBox(LayoutDOM):
    def __init__(self, **kwargs: Unpack[_GroupBoxInit]) -> None: ...

    title: str | None = ...
    child: UIElement = ...
    checkable: bool = ...

# class _ScrollBoxInit(_LayoutDOMInit, total=False):
#     child: UIElement
#     horizontal_scrollbar: ScrollbarPolicy
#     vertical_scrollbar: ScrollbarPolicy

class _ScrollBoxInit(TypedDict, total=False):
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
    child: UIElement
    horizontal_scrollbar: ScrollbarPolicy
    vertical_scrollbar: ScrollbarPolicy

class ScrollBox(LayoutDOM):
    def __init__(self, **kwargs: Unpack[_ScrollBoxInit]) -> None: ...

    child: UIElement = ...
    horizontal_scrollbar: ScrollbarPolicy = ...
    vertical_scrollbar: ScrollbarPolicy = ...
