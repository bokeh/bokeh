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
from ..._specs import CoordinateSpec
from ..._types import (
    Coordinate,
    CoordinateLike,
    NonNegative,
    Positive,
)
from ...core.enums import (
    CoordinateUnitsType as CoordinateUnits,
    DimensionType as Dimension,
    MovableType as Movable,
    ResizableType as Resizable,
)
from ...core.property_aliases import BorderRadius
from ...core.property_mixins import (
    AlphaSpec,
    DashPatternSpec,
    DashPatternType as DashPattern,
    IntSpec,
    LineCapSpec,
    LineCapType as LineCap,
    LineJoinSpec,
    LineJoinType as LineJoin,
    LineProps,
    ScalarAboveFillProps,
    ScalarAboveHatchProps,
    ScalarBelowFillProps,
    ScalarBelowHatchProps,
    ScalarFillProps,
    ScalarHatchProps,
    ScalarHoverFillProps,
    ScalarHoverHatchProps,
    ScalarHoverLineProps,
    ScalarLineProps,
    Size,
    _LinePropsInit,
    _ScalarAboveFillPropsInit,
    _ScalarAboveHatchPropsInit,
    _ScalarBelowFillPropsInit,
    _ScalarBelowHatchPropsInit,
    _ScalarFillPropsInit,
    _ScalarHatchPropsInit,
    _ScalarHoverFillPropsInit,
    _ScalarHoverHatchPropsInit,
    _ScalarHoverLinePropsInit,
    _ScalarLinePropsInit,
)
from ...model.model import JSEventCallback, Model, _ModelInit
from ..nodes import BoxNodes
from .annotation import (
    Annotation,
    DataAnnotation,
    _AnnotationInit,
    _DataAnnotationInit,
)
from .arrows import ArrowHead
from ...plotting.glyph_api import (Color, CoordinateMapping, Texture)
from ..dom import RendererGroup
from ..glyphs import FloatSpec
from ..renderers.renderer import RenderLevelType as RenderLevel
from ..renderers.tile_renderer import Renderer
from ..tools import Alpha
from ..ui.tooltips import UIElement
from ..ui.ui_element import (Menu, Node, StyleSheet, Styles)
from ..widgets.buttons import DOMNode
from ..widgets.tables import (ColorSpec, DataSource)

# class _AreaVisualsInit(_ScalarLinePropsInit, _ScalarFillPropsInit, _ScalarHatchPropsInit,
class _AreaVisualsInit(TypedDict, total=False):
    line_color: Color | None
    line_alpha: Alpha
    line_width: float
    line_join: LineJoin
    line_cap: LineCap
    line_dash: DashPattern
    line_dash_offset: int
    fill_color: Color | None
    fill_alpha: Alpha
    hatch_color: Color | None
    hatch_alpha: Alpha
    hatch_scale: Size
    hatch_pattern: str | None
    hatch_weight: Size
    hatch_extra: dict[str, Texture]
    hover_line_color: Color | None
    hover_line_alpha: Alpha
    hover_line_width: float
    hover_line_join: LineJoin
    hover_line_cap: LineCap
    hover_line_dash: DashPattern
    hover_line_dash_offset: int
    hover_fill_color: Color | None
    hover_fill_alpha: Alpha
    hover_hatch_color: Color | None
    hover_hatch_alpha: Alpha
    hover_hatch_scale: Size
    hover_hatch_pattern: str | None
    hover_hatch_weight: Size
    hover_hatch_extra: dict[str, Texture]

class AreaVisuals(ScalarLineProps, ScalarFillProps, ScalarHatchProps,
        ScalarHoverLineProps, ScalarHoverFillProps, ScalarHoverHatchProps):
    def __init__(self, **kwargs: Unpack[_AreaVisualsInit]) -> None: ...

# class _BoxInteractionHandlesInit(_ModelInit, total=False):
#     all: AreaVisuals
#     move: AreaVisuals | None
#     resize: AreaVisuals | None
#     sides: AreaVisuals | None
#     corners: AreaVisuals | None
#     left: AreaVisuals | None
#     right: AreaVisuals | None
#     top: AreaVisuals | None
#     bottom: AreaVisuals | None
#     top_left: AreaVisuals | None
#     top_right: AreaVisuals | None
#     bottom_left: AreaVisuals | None
#     bottom_right: AreaVisuals | None

class _BoxInteractionHandlesInit(TypedDict, total=False):
    name: str | None
    tags: list[Any]
    js_event_callbacks: dict[str, list[JSEventCallback]]
    js_property_callbacks: dict[str, list[JSEventCallback]]
    subscribed_events: set[str]
    syncable: bool
    all: AreaVisuals
    move: AreaVisuals | None
    resize: AreaVisuals | None
    sides: AreaVisuals | None
    corners: AreaVisuals | None
    left: AreaVisuals | None
    right: AreaVisuals | None
    top: AreaVisuals | None
    bottom: AreaVisuals | None
    top_left: AreaVisuals | None
    top_right: AreaVisuals | None
    bottom_left: AreaVisuals | None
    bottom_right: AreaVisuals | None

class BoxInteractionHandles(Model):
    def __init__(self, **kwargs: Unpack[_BoxInteractionHandlesInit]) -> None: ...

    all: AreaVisuals = ...
    move: AreaVisuals | None = ...
    resize: AreaVisuals | None = ...
    sides: AreaVisuals | None = ...
    corners: AreaVisuals | None = ...
    left: AreaVisuals | None = ...
    right: AreaVisuals | None = ...
    top: AreaVisuals | None = ...
    bottom: AreaVisuals | None = ...
    top_left: AreaVisuals | None = ...
    top_right: AreaVisuals | None = ...
    bottom_left: AreaVisuals | None = ...
    bottom_right: AreaVisuals | None = ...

# class _BoxAnnotationInit(_AnnotationInit, total=False): #_AreaVisualsInit,
#     left: Coordinate | None
#     right: Coordinate | None
#     top: Coordinate | None
#     bottom: Coordinate | None
#     left_units: CoordinateUnits
#     right_units: CoordinateUnits
#     top_units: CoordinateUnits
#     bottom_units: CoordinateUnits
#     left_limit: Coordinate | None
#     right_limit: Coordinate | None
#     top_limit: Coordinate | None
#     bottom_limit: Coordinate | None
#     min_width: NonNegative[float]
#     min_height: NonNegative[float]
#     max_width: Positive[float]
#     max_height: Positive[float]
#     border_radius: BorderRadius
#     editable: bool
#     resizable: Resizable
#     movable: Movable
#     symmetric: bool
#     use_handles: bool
#     handles: BoxInteractionHandles | AreaVisuals
#     inverted: bool

class _BoxAnnotationInit(TypedDict, total=False):
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
    left: Coordinate | None
    right: Coordinate | None
    top: Coordinate | None
    bottom: Coordinate | None
    left_units: CoordinateUnits
    right_units: CoordinateUnits
    top_units: CoordinateUnits
    bottom_units: CoordinateUnits
    left_limit: Coordinate | None
    right_limit: Coordinate | None
    top_limit: Coordinate | None
    bottom_limit: Coordinate | None
    min_width: NonNegative[float]
    min_height: NonNegative[float]
    max_width: Positive[float]
    max_height: Positive[float]
    border_radius: BorderRadius
    editable: bool
    resizable: Resizable
    movable: Movable
    symmetric: bool
    use_handles: bool
    handles: BoxInteractionHandles | AreaVisuals
    inverted: bool

class BoxAnnotation(Annotation, AreaVisuals):
    def __init__(self, **kwargs: Unpack[_BoxAnnotationInit]) -> None: ...

    @property
    def left(self) -> Coordinate: ...
    @left.setter
    def left(self, left: Coordinate | None) -> None: ...

    @property
    def right(self) -> Coordinate: ...
    @right.setter
    def right(self, right: Coordinate | None) -> None: ...

    @property
    def top(self) -> Coordinate: ...
    @top.setter
    def top(self, top: Coordinate | None) -> None: ...

    @property
    def bottom(self) -> Coordinate: ...
    @bottom.setter
    def bottom(self, bottom: Coordinate | None) -> None: ...

    left_units: CoordinateUnits = ...
    right_units: CoordinateUnits = ...
    top_units: CoordinateUnits = ...
    bottom_units: CoordinateUnits = ...
    left_limit: Coordinate | None = ...
    right_limit: Coordinate | None = ...
    top_limit: Coordinate | None = ...
    bottom_limit: Coordinate | None = ...
    min_width: NonNegative[float] = ...
    min_height: NonNegative[float] = ...
    max_width: Positive[float] = ...
    max_height: Positive[float] = ...
    border_radius: BorderRadius = ...
    editable: bool = ...
    resizable: Resizable = ...
    movable: Movable = ...
    symmetric: bool = ...
    use_handles: bool = ...

    @property
    def handles(self) -> BoxInteractionHandles: ...
    @handles.setter
    def handles(self, handles: BoxInteractionHandles | AreaVisuals) -> None: ...

    inverted: bool = ...

    @property
    def nodes(self) -> BoxNodes: ...

# class _BandInit(_DataAnnotationInit, _ScalarLinePropsInit, _ScalarFillPropsInit, _ScalarHatchPropsInit, total=False):
#     lower: CoordinateSpec
#     upper: CoordinateSpec
#     base: CoordinateSpec
#     dimension: Dimension

class _BandInit(TypedDict, total=False):
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
    line_color: Color | None
    line_alpha: Alpha
    line_width: float
    line_join: LineJoin
    line_cap: LineCap
    line_dash: DashPattern
    line_dash_offset: int
    fill_color: Color | None
    fill_alpha: Alpha
    hatch_color: Color | None
    hatch_alpha: Alpha
    hatch_scale: Size
    hatch_pattern: str | None
    hatch_weight: Size
    hatch_extra: dict[str, Texture]
    lower: CoordinateSpec
    upper: CoordinateSpec
    base: CoordinateSpec
    dimension: Dimension

class Band(DataAnnotation, ScalarLineProps, ScalarFillProps, ScalarHatchProps):
    def __init__(self, **kwargs: Unpack[_BandInit]) -> None: ...

    lower: CoordinateSpec = ...
    upper: CoordinateSpec = ...
    base: CoordinateSpec = ...
    dimension: Dimension = ...

# class _PolyAnnotationInit(_AnnotationInit, _ScalarLinePropsInit, _ScalarFillPropsInit, _ScalarHatchPropsInit,
#         _ScalarHoverLinePropsInit, _ScalarHoverFillPropsInit, _ScalarHoverHatchPropsInit, total=False):
#     xs: Sequence[CoordinateLike]
#     xs_units: CoordinateUnits
#     ys: Sequence[CoordinateLike]
#     ys_units: CoordinateUnits
#     editable: bool

class _PolyAnnotationInit(TypedDict, total=False):
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
    line_color: Color | None
    line_alpha: Alpha
    line_width: float
    line_join: LineJoin
    line_cap: LineCap
    line_dash: DashPattern
    line_dash_offset: int
    fill_color: Color | None
    fill_alpha: Alpha
    hatch_color: Color | None
    hatch_alpha: Alpha
    hatch_scale: Size
    hatch_pattern: str | None
    hatch_weight: Size
    hatch_extra: dict[str, Texture]
    hover_line_color: Color | None
    hover_line_alpha: Alpha
    hover_line_width: float
    hover_line_join: LineJoin
    hover_line_cap: LineCap
    hover_line_dash: DashPattern
    hover_line_dash_offset: int
    hover_fill_color: Color | None
    hover_fill_alpha: Alpha
    hover_hatch_color: Color | None
    hover_hatch_alpha: Alpha
    hover_hatch_scale: Size
    hover_hatch_pattern: str | None
    hover_hatch_weight: Size
    hover_hatch_extra: dict[str, Texture]
    xs: Sequence[CoordinateLike]
    xs_units: CoordinateUnits
    ys: Sequence[CoordinateLike]
    ys_units: CoordinateUnits
    editable: bool

class PolyAnnotation(Annotation, ScalarLineProps, ScalarFillProps, ScalarHatchProps,
        ScalarHoverLineProps, ScalarHoverFillProps, ScalarHoverHatchProps):
    def __init__(self, **kwargs: Unpack[_PolyAnnotationInit]) -> None: ...

    xs: Sequence[CoordinateLike] = ...
    xs_units: CoordinateUnits = ...
    ys: Sequence[CoordinateLike] = ...
    ys_units: CoordinateUnits = ...
    editable: bool = ...

# class _SlopeInit(_AnnotationInit, _ScalarLinePropsInit, _ScalarAboveFillPropsInit,
#         _ScalarAboveHatchPropsInit, _ScalarBelowFillPropsInit, _ScalarBelowHatchPropsInit, total=False):
#     gradient: float | None
#     y_intercept: float | None

class _SlopeInit(TypedDict, total=False):
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
    line_color: Color | None
    line_alpha: Alpha
    line_width: float
    line_join: LineJoin
    line_cap: LineCap
    line_dash: DashPattern
    line_dash_offset: int
    above_fill_color: Color | None
    above_fill_alpha: Alpha
    above_hatch_color: Color | None
    above_hatch_alpha: Alpha
    above_hatch_scale: Size
    above_hatch_pattern: str | None
    above_hatch_weight: Size
    above_hatch_extra: dict[str, Texture]
    below_fill_color: Color | None
    below_fill_alpha: Alpha
    below_hatch_color: Color | None
    below_hatch_alpha: Alpha
    below_hatch_scale: Size
    below_hatch_pattern: str | None
    below_hatch_weight: Size
    below_hatch_extra: dict[str, Texture]
    gradient: float | None
    y_intercept: float | None

class Slope(Annotation, ScalarLineProps, ScalarAboveFillProps, ScalarAboveHatchProps, ScalarBelowFillProps, ScalarBelowHatchProps):
    def __init__(self, **kwargs: Unpack[_SlopeInit]) -> None: ...

    gradient: float | None = ...
    y_intercept: float | None = ...

# class _SpanInit(_AnnotationInit, _ScalarLinePropsInit, _ScalarHoverLinePropsInit, total=False):
#     location: CoordinateLike | None
#     location_units: CoordinateUnits
#     dimension: Dimension
#     editable: bool

class _SpanInit(TypedDict, total=False):
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
    line_color: Color | None
    line_alpha: Alpha
    line_width: float
    line_join: LineJoin
    line_cap: LineCap
    line_dash: DashPattern
    line_dash_offset: int
    hover_line_color: Color | None
    hover_line_alpha: Alpha
    hover_line_width: float
    hover_line_join: LineJoin
    hover_line_cap: LineCap
    location: CoordinateLike | None
    location_units: CoordinateUnits
    dimension: Dimension
    editable: bool
class Span(Annotation, ScalarLineProps, ScalarHoverLineProps):
    def __init__(self, **kwargs: Unpack[_SpanInit]) -> None: ...

    location: CoordinateLike | None = ...
    location_units: CoordinateUnits = ...
    dimension: Dimension = ...
    editable: bool = ...

# class _WhiskerInit(_DataAnnotationInit, _LinePropsInit, total=False):
#     lower: CoordinateSpec
#     lower_head: ArrowHead | None
#     upper: CoordinateSpec
#     upper_head: ArrowHead | None
#     base: CoordinateSpec
#     dimension: Dimension

class _WhiskerInit(TypedDict, total=False):
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
    line_color: ColorSpec
    line_alpha: AlphaSpec
    line_width: FloatSpec
    line_join: LineJoinSpec
    line_cap: LineCapSpec
    line_dash: DashPatternSpec
    line_dash_offset: IntSpec
    lower: CoordinateSpec
    lower_head: ArrowHead | None
    upper: CoordinateSpec
    upper_head: ArrowHead | None
    base: CoordinateSpec
    dimension: Dimension

class Whisker(DataAnnotation, LineProps):
    def __init__(self, **kwargs: Unpack[_WhiskerInit]) -> None: ...

    lower: CoordinateSpec = ...
    lower_head: ArrowHead | None = ...
    upper: CoordinateSpec = ...
    upper_head: ArrowHead | None = ...
    base: CoordinateSpec = ...
    dimension: Dimension = ...
