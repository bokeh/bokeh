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
from ..._specs import NumberSpec
from ...core.enums import CoordinateUnitsType as CoordinateUnits
from ...core.property_mixins import (
    AlphaSpec,
    BodyLineProps,
    DashPatternSpec,
    FillProps,
    HatchPatternSpec,
    HatchProps,
    IntSpec,
    LineCapSpec,
    LineJoinSpec,
    LineProps,
    _BodyLinePropsInit,
    _FillPropsInit,
    _HatchPropsInit,
    _LinePropsInit,
)
from ..graphics import Marking, _MarkingInit
from .annotation import DataAnnotation, _DataAnnotationInit
from ...model.model import JSEventCallback
from ...plotting.glyph_api import (CoordinateMapping, Texture)
from ..dom import RendererGroup
from ..glyphs import FloatSpec
from ..renderers.renderer import RenderLevelType as RenderLevel
from ..renderers.tile_renderer import Renderer
from ..ui.tooltips import UIElement
from ..ui.ui_element import (Menu, Node, StyleSheet, Styles)
from ..widgets.buttons import DOMNode
from ..widgets.tables import (ColorSpec, DataSource)

# class _ArrowHeadInit(_MarkingInit, total=False):
#     size: NumberSpec

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

# class _OpenHeadInit(_ArrowHeadInit, _LinePropsInit, total=False):
#     ...

class _OpenHeadInit(TypedDict, total=False):
    name: str | None
    tags: list[Any]
    js_event_callbacks: dict[str, list[JSEventCallback]]
    js_property_callbacks: dict[str, list[JSEventCallback]]
    subscribed_events: set[str]
    syncable: bool
    size: NumberSpec
    line_color: ColorSpec
    line_alpha: AlphaSpec
    line_width: FloatSpec
    line_join: LineJoinSpec
    line_cap: LineCapSpec
    line_dash: DashPatternSpec
    line_dash_offset: IntSpec

class OpenHead(ArrowHead, LineProps):
    ...

# class _NormalHeadInit(_ArrowHeadInit, _LinePropsInit, _FillPropsInit, _HatchPropsInit, total=False):
#     ...

class _NormalHeadInit(TypedDict, total=False):
    name: str | None
    tags: list[Any]
    js_event_callbacks: dict[str, list[JSEventCallback]]
    js_property_callbacks: dict[str, list[JSEventCallback]]
    subscribed_events: set[str]
    syncable: bool
    size: NumberSpec
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

class NormalHead(ArrowHead, LineProps, FillProps, HatchProps):
    ...

# class _TeeHeadInit(_ArrowHeadInit, _LinePropsInit, total=False):
#     ...

class _TeeHeadInit(TypedDict, total=False):
    name: str | None
    tags: list[Any]
    js_event_callbacks: dict[str, list[JSEventCallback]]
    js_property_callbacks: dict[str, list[JSEventCallback]]
    subscribed_events: set[str]
    syncable: bool
    size: NumberSpec
    line_color: ColorSpec
    line_alpha: AlphaSpec
    line_width: FloatSpec
    line_join: LineJoinSpec
    line_cap: LineCapSpec
    line_dash: DashPatternSpec
    line_dash_offset: IntSpec

class TeeHead(ArrowHead, LineProps):
    ...

# class _VeeHeadInit(_ArrowHeadInit, _LinePropsInit, _FillPropsInit, _HatchPropsInit, total=False):
#     ...

class _VeeHeadInit(TypedDict, total=False):
    name: str | None
    tags: list[Any]
    js_event_callbacks: dict[str, list[JSEventCallback]]
    js_property_callbacks: dict[str, list[JSEventCallback]]
    subscribed_events: set[str]
    syncable: bool
    size: NumberSpec
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

class VeeHead(ArrowHead, LineProps, FillProps, HatchProps):
    ...

# class _ArrowInit(_DataAnnotationInit, _BodyLinePropsInit, total=False):
#     x_start: NumberSpec
#     y_start: NumberSpec
#     start_units: CoordinateUnits
#     start: ArrowHead | None
#     x_end: NumberSpec
#     y_end: NumberSpec
#     end_units: CoordinateUnits
#     end: ArrowHead | None

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
