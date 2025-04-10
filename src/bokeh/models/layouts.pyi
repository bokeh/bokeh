#-----------------------------------------------------------------------------
# Copyright (c) Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------

# Standard library imports
from dataclasses import dataclass
from typing import NotRequired, TypedDict

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
from ..core.has_props import HasProps, abstract
from ..core.property_aliases import GridSpacing, TracksSizing
from ..model import Model
from .ui import Pane, Tooltip, UIElement

@abstract
@dataclass(init=False)
class LayoutDOM(Pane):

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

@dataclass
class Spacer(LayoutDOM):
    ...

@abstract
@dataclass(init=False)
class GridCommon(HasProps):

    rows: TracksSizing | None = ...

    cols: TracksSizing | None = ...

    spacing: GridSpacing = ...

@dataclass
class GridBox(LayoutDOM, GridCommon):

    children: list[tuple[UIElement, int, int] | tuple[UIElement, int, int, int, int]] = ...

class HBoxChild(TypedDict):
    child: UIElement
    col: NotRequired[int]
    span: NotRequired[int]

class VBoxChild(TypedDict):
    child: UIElement
    row: NotRequired[int]
    span: NotRequired[int]

@dataclass
class HBox(LayoutDOM):

    children: list[HBoxChild] | list[UIElement] = ...

    cols: TracksSizing | None = ...

    spacing: NonNegative[int] = ...

@dataclass
class VBox(LayoutDOM):

    children: list[VBoxChild] | list[UIElement] = ...

    rows: TracksSizing | None = ...

    spacing: NonNegative[int] = ...

@abstract
@dataclass(init=False)
class FlexBox(LayoutDOM):

    children: list[UIElement] = ...

    spacing: NonNegative[int] = ...

@dataclass
class Row(FlexBox):
    ...

@dataclass
class Column(FlexBox):
    ...

@dataclass
class TabPanel(Model):

    title: str = ...

    tooltip: Tooltip | None = ...

    child: UIElement = ...

    closable: bool = ...

    disabled: bool = ...

@dataclass
class Tabs(LayoutDOM):

    tabs: list[TabPanel] | list[tuple[str, UIElement]] = ...

    tabs_location: Location = ...

    active: int = ...

@dataclass
class GroupBox(LayoutDOM):

    title: str | None = ...

    child: UIElement = ...

    checkable: bool = ...

@dataclass
class ScrollBox(LayoutDOM):

    child: UIElement = ...

    horizontal_scrollbar: ScrollbarPolicy = ...

    vertical_scrollbar: ScrollbarPolicy = ...
