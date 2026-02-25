#-----------------------------------------------------------------------------
# Copyright (c) Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------

# Standard library imports
from abc import abstractmethod
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from typing_extensions import Unpack

# Bokeh imports
from ..._specs import NumberSpec
from ...core.enums import CoordinateUnitsType as CoordinateUnits
from ...core.property_mixins import (
    BodyLineProps,
    FillProps,
    HatchProps,
    LineProps,
)
from ..graphics import Marking
from .annotation import DataAnnotation

from ..._specs import AlphaSpec
from ..._specs import ColorSpec
from ..._specs import DashPatternSpec
from ..._specs import FloatSpec
from ..._specs import HatchPatternSpec
from ..._specs import IntSpec
from ..._specs import LineCapSpec
from ..._specs import LineJoinSpec
from ...core.enums import RenderLevelType as RenderLevel
from ...model.model import JSEventCallback
from ..coordinates import CoordinateMapping
from ..css import StyleSheet
from ..css import Styles
from ..dom import DOMNode
from ..nodes import Node
from ..renderers.renderer import Renderer
from ..renderers.renderer import RendererGroup
from ..sources import DataSource
from ..textures import Texture
from ..ui.menus import Menu
from ..ui.ui_element import UIElement
from typing import Any
from typing import Sequence
from typing import TypedDict

class _ArrowHeadInit(TypedDict, total=False):
    name: str | None
    tags: list[Any]
    js_event_callbacks: dict[str, list[JSEventCallback]]
    js_property_callbacks: dict[str, list[JSEventCallback]]
    subscribed_events: set[str]
    syncable: bool
    size: NumberSpec

class ArrowHead(Marking):
    @abstractmethod
    def __init__(self, **kwargs: Unpack[_ArrowHeadInit]) -> None: ...

    size: NumberSpec = ...

class _OpenHeadInit(TypedDict, total=False):
    name: str | None
    tags: list[Any]
    js_event_callbacks: dict[str, list[JSEventCallback]]
    js_property_callbacks: dict[str, list[JSEventCallback]]
    subscribed_events: set[str]
    syncable: bool
    line_color: ColorSpec
    line_alpha: AlphaSpec
    line_width: FloatSpec
    line_join: LineJoinSpec
    line_cap: LineCapSpec
    line_dash: DashPatternSpec
    line_dash_offset: IntSpec
    size: NumberSpec

class OpenHead(ArrowHead, LineProps):
    ...

class _NormalHeadInit(TypedDict, total=False):
    name: str | None
    tags: list[Any]
    js_event_callbacks: dict[str, list[JSEventCallback]]
    js_property_callbacks: dict[str, list[JSEventCallback]]
    subscribed_events: set[str]
    syncable: bool
    line_color: ColorSpec
    line_alpha: AlphaSpec
    line_width: FloatSpec
    line_join: LineJoinSpec
    line_cap: LineCapSpec
    line_dash: DashPatternSpec
    line_dash_offset: IntSpec
    fill_color: ColorSpec
    fill_alpha: AlphaSpec
    hatch_color: ColorSpec
    hatch_alpha: AlphaSpec
    hatch_scale: FloatSpec
    hatch_pattern: HatchPatternSpec
    hatch_weight: FloatSpec
    hatch_extra: dict[str, Texture]
    size: NumberSpec

class NormalHead(ArrowHead, LineProps, FillProps, HatchProps):
    ...

class _TeeHeadInit(TypedDict, total=False):
    name: str | None
    tags: list[Any]
    js_event_callbacks: dict[str, list[JSEventCallback]]
    js_property_callbacks: dict[str, list[JSEventCallback]]
    subscribed_events: set[str]
    syncable: bool
    line_color: ColorSpec
    line_alpha: AlphaSpec
    line_width: FloatSpec
    line_join: LineJoinSpec
    line_cap: LineCapSpec
    line_dash: DashPatternSpec
    line_dash_offset: IntSpec
    size: NumberSpec

class TeeHead(ArrowHead, LineProps):
    ...

class _VeeHeadInit(TypedDict, total=False):
    name: str | None
    tags: list[Any]
    js_event_callbacks: dict[str, list[JSEventCallback]]
    js_property_callbacks: dict[str, list[JSEventCallback]]
    subscribed_events: set[str]
    syncable: bool
    line_color: ColorSpec
    line_alpha: AlphaSpec
    line_width: FloatSpec
    line_join: LineJoinSpec
    line_cap: LineCapSpec
    line_dash: DashPatternSpec
    line_dash_offset: IntSpec
    fill_color: ColorSpec
    fill_alpha: AlphaSpec
    hatch_color: ColorSpec
    hatch_alpha: AlphaSpec
    hatch_scale: FloatSpec
    hatch_pattern: HatchPatternSpec
    hatch_weight: FloatSpec
    hatch_extra: dict[str, Texture]
    size: NumberSpec

class VeeHead(ArrowHead, LineProps, FillProps, HatchProps):
    ...

class _ArrowInit(TypedDict, total=False):
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
    source: DataSource
    body_line_color: ColorSpec
    body_line_alpha: AlphaSpec
    body_line_width: FloatSpec
    body_line_join: LineJoinSpec
    body_line_cap: LineCapSpec
    body_line_dash: DashPatternSpec
    body_line_dash_offset: IntSpec
    x_start: NumberSpec
    y_start: NumberSpec
    start_units: CoordinateUnits
    start: ArrowHead | None
    x_end: NumberSpec
    y_end: NumberSpec
    end_units: CoordinateUnits
    end: ArrowHead | None

class Arrow(DataAnnotation, BodyLineProps):

    x_start: NumberSpec = ...
    y_start: NumberSpec = ...
    start_units: CoordinateUnits = ...
    start: ArrowHead | None = ...
    x_end: NumberSpec = ...
    y_end: NumberSpec = ...
    end_units: CoordinateUnits = ...
    end: ArrowHead | None = ...
