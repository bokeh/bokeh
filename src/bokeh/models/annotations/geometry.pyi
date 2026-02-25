#-----------------------------------------------------------------------------
# Copyright (c) Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------

# Standard library imports
from typing import TYPE_CHECKING, Sequence

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
)
from ...model.model import Model
from ..nodes import BoxNodes
from .annotation import (
    Annotation,
    DataAnnotation,
)
from .arrows import ArrowHead

from ..._specs import AlphaSpec
from ..._specs import ColorSpec
from ..._specs import DashPatternSpec
from ..._specs import FloatSpec
from ..._specs import IntSpec
from ..._specs import LineCapSpec
from ..._specs import LineJoinSpec
from ..._types import Alpha
from ..._types import Color
from ..._types import Size
from ...core.enums import LineCapType as LineCap
from ...core.enums import LineJoinType as LineJoin
from ...core.enums import RenderLevelType as RenderLevel
from ...core.property.visual import DashPatternType as DashPattern
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
from typing import TypedDict

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

class _BoxAnnotationInit(TypedDict, AreaVisuals, total=False): #_AreaVisualsInit, left: Coordinate | None right: Coordinate | None top: Coordinate | None bottom: Coordinate | None left_units: CoordinateUnits right_units: CoordinateUnits top_units: CoordinateUnits bottom_units: CoordinateUnits left_limit: Coordinate | None right_limit: Coordinate | None top_limit: Coordinate | None bottom_limit: Coordinate | None min_width: NonNegative[float] min_height: NonNegative[float] max_width: Positive[float] max_height: Positive[float] border_radius: BorderRadius editable: bool resizable: Resizable movable: Movable symmetric: bool use_handles: bool handles: BoxInteractionHandles | AreaVisuals inverted: bool class BoxAnnotation(Annotation):
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
    inverted: bool = ...

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
    hover_line_dash: DashPattern
    hover_line_dash_offset: int
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
