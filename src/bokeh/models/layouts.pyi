#-----------------------------------------------------------------------------
# Copyright (c) Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------

# Standard library imports
from abc import abstractmethod
from typing import NotRequired, TypedDict, Unpack

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
from ..model.model import Model, ModelInit
from .ui import (
    Pane,
    PaneInit,
    Tooltip,
    UIElement,
)

class LayoutDOMInit(PaneInit, total=False):
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
    def __init__(self, **kwargs: Unpack[LayoutDOMInit]) -> None: ...

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

class SpacerInit(LayoutDOMInit, total=False):
    ...

class Spacer(LayoutDOM):
    def __init__(self, **kwargs: Unpack[SpacerInit]) -> None: ...

class GridCommonInit(LayoutDOMInit, total=False):
    rows: TracksSizing | None
    cols: TracksSizing | None
    spacing: GridSpacing

class GridCommon(HasProps):
    @abstractmethod
    def __init__(self, **kwargs: Unpack[GridCommonInit]) -> None: ...

    rows: TracksSizing | None = ...
    cols: TracksSizing | None = ...
    spacing: GridSpacing = ...

class GridBoxInit(GridCommonInit, LayoutDOMInit, total=False):
    children: list[tuple[UIElement, int, int] | tuple[UIElement, int, int, int, int]]

class GridBox(LayoutDOM, GridCommon):
    def __init__(self, **kwargs: Unpack[GridBoxInit]) -> None: ...

    children: list[tuple[UIElement, int, int] | tuple[UIElement, int, int, int, int]] = ...

class HBoxChild(TypedDict):
    child: UIElement
    col: NotRequired[int]
    span: NotRequired[int]

class VBoxChild(TypedDict):
    child: UIElement
    row: NotRequired[int]
    span: NotRequired[int]

class HBoxInit(LayoutDOMInit, total=False):
    children: list[HBoxChild] | list[UIElement]
    cols: TracksSizing | None
    spacing: NonNegative[int]

class HBox(LayoutDOM):
    def __init__(self, **kwargs: Unpack[HBoxInit]) -> None: ...

    @property
    def children(self) -> list[HBoxChild]: ...
    @children.setter
    def children(self, children: list[HBoxChild] | list[UIElement]) -> None: ...

    cols: TracksSizing | None = ...
    spacing: NonNegative[int] = ...

class VBoxInit(LayoutDOMInit, total=False):
    children: list[VBoxChild] | list[UIElement]
    rows: TracksSizing | None
    spacing: NonNegative[int]

class VBox(LayoutDOM):
    def __init__(self, **kwargs: Unpack[VBoxInit]) -> None: ...

    @property
    def children(self) -> list[VBoxChild]: ...
    @children.setter
    def children(self, children: list[VBoxChild] | list[UIElement]) -> None: ...

    rows: TracksSizing | None = ...
    spacing: NonNegative[int] = ...

class FlexBoxInit(LayoutDOMInit, total=False):
    children: list[UIElement]
    spacing: NonNegative[int]

class FlexBox(LayoutDOM):
    @abstractmethod
    def __init__(self, **kwargs: Unpack[FlexBoxInit]) -> None: ...

    children: list[UIElement] = ...
    spacing: NonNegative[int] = ...

class RowInit(FlexBoxInit, total=False):
    ...

class Row(FlexBox):
    def __init__(self, **kwargs: Unpack[RowInit]) -> None: ...

class ColumnInit(FlexBoxInit, total=False):
    ...

class Column(FlexBox):
    def __init__(self, **kwargs: Unpack[ColumnInit]) -> None: ...

class TabPanelInit(ModelInit, total=False):
    title: str
    tooltip: Tooltip | None
    child: UIElement
    closable: bool
    disabled: bool

class TabPanel(Model):
    def __init__(self, **kwargs: Unpack[TabPanelInit]) -> None: ...

    title: str = ...
    tooltip: Tooltip | None = ...
    child: UIElement = ...
    closable: bool = ...
    disabled: bool = ...

class TabsInit(LayoutDOMInit, total=False):
    tabs: list[TabPanel] | list[tuple[str, UIElement]]
    tabs_location: Location
    active: int

class Tabs(LayoutDOM):
    def __init__(self, **kwargs: Unpack[TabsInit]) -> None: ...

    @property
    def tabs(self) -> list[TabPanel]: ...
    @tabs.setter
    def tabs(self, tabs: list[TabPanel] | list[tuple[str, UIElement]]) -> None: ...

    tabs_location: Location = ...
    active: int = ...

class GroupBoxInit(LayoutDOMInit, total=False):
    title: str | None
    child: UIElement
    checkable: bool

class GroupBox(LayoutDOM):
    def __init__(self, **kwargs: Unpack[GroupBoxInit]) -> None: ...

    title: str | None = ...
    child: UIElement = ...
    checkable: bool = ...

class ScrollBoxInit(LayoutDOMInit, total=False):
    child: UIElement
    horizontal_scrollbar: ScrollbarPolicy
    vertical_scrollbar: ScrollbarPolicy

class ScrollBox(LayoutDOM):
    def __init__(self, **kwargs: Unpack[ScrollBoxInit]) -> None: ...

    child: UIElement = ...
    horizontal_scrollbar: ScrollbarPolicy = ...
    vertical_scrollbar: ScrollbarPolicy = ...
