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
from .._specs import (
    AngleSpec,
    DataSpec,
    DistanceSpec,
    FloatSpec,
    MarkerSpec,
    NullDistanceSpec,
    NumberSpec,
    SizeSpec,
    StringSpec,
)
from .._types import NonNegative
from ..core.enums import (
    DirectionType as Direction,
    HexTileOrientationType as HexTileOrientation,
    ImageOriginType as ImageOrigin,
    OutlineShapeNameType as OutlineShapeName,
    PaletteType as Palette,
    RadiusDimensionType as RadiusDimension,
    StepModeType as StepMode,
    TeXDisplayType as TeXDisplay,
)
from ..core.property_aliases import (
    Anchor,
    BorderRadius,
    Padding,
    TextAnchor,
)
from ..core.property_mixins import (
    BackgroundFillProps,
    BackgroundHatchProps,
    BorderLineProps,
    FillProps,
    HatchProps,
    ImageProps,
    LineProps,
    ScalarFillProps,
    ScalarHatchProps,
    ScalarLineProps,
    TextProps,
)
from .callbacks import CustomJS
from .glyph import (
    ConnectedXYGlyph,
    Glyph,
    RadialGlyph,
    XYGlyph,
)
from .mappers import ColorMapper, StackColorMapper

from .._specs import AlphaSpec
from .._specs import ColorSpec
from .._specs import DashPatternSpec
from .._specs import FontSizeSpec
from .._specs import FontStyleSpec
from .._specs import HatchPatternSpec
from .._specs import IntSpec
from .._specs import LineCapSpec
from .._specs import LineJoinSpec
from .._specs import TextAlignSpec
from .._specs import TextBaselineSpec
from .._types import Alpha
from .._types import Color
from .._types import Size
from ..core.enums import LineCapType as LineCap
from ..core.enums import LineJoinType as LineJoin
from ..core.property.visual import DashPatternType as DashPattern
from ..model.model import JSEventCallback
from .graphics import Decoration
from .textures import Texture
from typing import Any
from typing import TypedDict

class _MarkerInit(TypedDict, total=False):
    name: str | None
    tags: list[Any]
    js_event_callbacks: dict[str, list[JSEventCallback]]
    js_property_callbacks: dict[str, list[JSEventCallback]]
    subscribed_events: set[str]
    syncable: bool
    decorations: list[Decoration]
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
    x: NumberSpec
    y: NumberSpec
    hit_dilation: NonNegative[float]
    size: SizeSpec
    angle: AngleSpec

class Marker(XYGlyph, LineProps, FillProps, HatchProps):
    @abstractmethod
    def __init__(self, **kwargs: Unpack[_MarkerInit]) -> None: ...

    x: NumberSpec = ...
    y: NumberSpec = ...
    hit_dilation: NonNegative[float] = ...
    size: SizeSpec = ...
    angle: AngleSpec = ...

class _LRTBGlyphInit(TypedDict, total=False):
    name: str | None
    tags: list[Any]
    js_event_callbacks: dict[str, list[JSEventCallback]]
    js_property_callbacks: dict[str, list[JSEventCallback]]
    subscribed_events: set[str]
    syncable: bool
    decorations: list[Decoration]
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
    border_radius: BorderRadius

class LRTBGlyph(Glyph, LineProps, FillProps, HatchProps):
    @abstractmethod
    def __init__(self, **kwargs: Unpack[_LRTBGlyphInit]) -> None: ...

    border_radius: BorderRadius = ...

class _AnnularWedgeInit(TypedDict, total=False):
    name: str | None
    tags: list[Any]
    js_event_callbacks: dict[str, list[JSEventCallback]]
    js_property_callbacks: dict[str, list[JSEventCallback]]
    subscribed_events: set[str]
    syncable: bool
    decorations: list[Decoration]
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
    x: NumberSpec
    y: NumberSpec
    inner_radius: DistanceSpec
    outer_radius: DistanceSpec
    start_angle: AngleSpec
    end_angle: AngleSpec
    direction: Direction

class AnnularWedge(XYGlyph, LineProps, FillProps, HatchProps):
    def __init__(self, **kwargs: Unpack[_AnnularWedgeInit]) -> None: ...

    x: NumberSpec = ...
    y: NumberSpec = ...
    inner_radius: DistanceSpec = ...
    outer_radius: DistanceSpec = ...
    start_angle: AngleSpec = ...
    end_angle: AngleSpec = ...
    direction: Direction = ...

class _AnnulusInit(TypedDict, total=False):
    name: str | None
    tags: list[Any]
    js_event_callbacks: dict[str, list[JSEventCallback]]
    js_property_callbacks: dict[str, list[JSEventCallback]]
    subscribed_events: set[str]
    syncable: bool
    decorations: list[Decoration]
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
    x: NumberSpec
    y: NumberSpec
    inner_radius: DistanceSpec
    outer_radius: DistanceSpec

class Annulus(XYGlyph, LineProps, FillProps, HatchProps):
    def __init__(self, **kwargs: Unpack[_AnnulusInit]) -> None: ...

    x: NumberSpec = ...
    y: NumberSpec = ...
    inner_radius: DistanceSpec = ...
    outer_radius: DistanceSpec = ...

class _ArcInit(TypedDict, total=False):
    name: str | None
    tags: list[Any]
    js_event_callbacks: dict[str, list[JSEventCallback]]
    js_property_callbacks: dict[str, list[JSEventCallback]]
    subscribed_events: set[str]
    syncable: bool
    decorations: list[Decoration]
    line_color: ColorSpec
    line_alpha: AlphaSpec
    line_width: FloatSpec
    line_join: LineJoinSpec
    line_cap: LineCapSpec
    line_dash: DashPatternSpec
    line_dash_offset: IntSpec
    x: NumberSpec
    y: NumberSpec
    radius: DistanceSpec
    start_angle: AngleSpec
    end_angle: AngleSpec
    direction: Direction

class Arc(XYGlyph, LineProps):
    def __init__(self, **kwargs: Unpack[_ArcInit]) -> None: ...

    x: NumberSpec = ...
    y: NumberSpec = ...
    radius: DistanceSpec = ...
    start_angle: AngleSpec = ...
    end_angle: AngleSpec = ...
    direction: Direction = ...

class _BezierInit(TypedDict, total=False):
    name: str | None
    tags: list[Any]
    js_event_callbacks: dict[str, list[JSEventCallback]]
    js_property_callbacks: dict[str, list[JSEventCallback]]
    subscribed_events: set[str]
    syncable: bool
    decorations: list[Decoration]
    line_color: ColorSpec
    line_alpha: AlphaSpec
    line_width: FloatSpec
    line_join: LineJoinSpec
    line_cap: LineCapSpec
    line_dash: DashPatternSpec
    line_dash_offset: IntSpec
    x0: NumberSpec
    y0: NumberSpec
    x1: NumberSpec
    y1: NumberSpec
    cx0: NumberSpec
    cy0: NumberSpec
    cx1: NumberSpec
    cy1: NumberSpec

class Bezier(Glyph, LineProps):
    def __init__(self, **kwargs: Unpack[_BezierInit]) -> None: ...

    x0: NumberSpec = ...
    y0: NumberSpec = ...
    x1: NumberSpec = ...
    y1: NumberSpec = ...
    cx0: NumberSpec = ...
    cy0: NumberSpec = ...
    cx1: NumberSpec = ...
    cy1: NumberSpec = ...

class _BlockInit(TypedDict, total=False):
    name: str | None
    tags: list[Any]
    js_event_callbacks: dict[str, list[JSEventCallback]]
    js_property_callbacks: dict[str, list[JSEventCallback]]
    subscribed_events: set[str]
    syncable: bool
    decorations: list[Decoration]
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
    border_radius: BorderRadius
    x: NumberSpec
    y: NumberSpec
    width: DistanceSpec
    height: DistanceSpec

class Block(LRTBGlyph):
    def __init__(self, **kwargs: Unpack[_BlockInit]) -> None: ...

    x: NumberSpec = ...
    y: NumberSpec = ...
    width: DistanceSpec = ...
    height: DistanceSpec = ...

class _CircleInit(TypedDict, total=False):
    name: str | None
    tags: list[Any]
    js_event_callbacks: dict[str, list[JSEventCallback]]
    js_property_callbacks: dict[str, list[JSEventCallback]]
    subscribed_events: set[str]
    syncable: bool
    decorations: list[Decoration]
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
    x: NumberSpec
    y: NumberSpec
    radius: DistanceSpec
    radius_dimension: RadiusDimension
    hit_dilation: NonNegative[float]

class Circle(RadialGlyph, LineProps, FillProps, HatchProps):
    def __init__(self, **kwargs: Unpack[_CircleInit]) -> None: ...

    x: NumberSpec = ...
    y: NumberSpec = ...
    radius: DistanceSpec = ...
    radius_dimension: RadiusDimension = ...
    hit_dilation: NonNegative[float] = ...

class _EllipseInit(TypedDict, total=False):
    name: str | None
    tags: list[Any]
    js_event_callbacks: dict[str, list[JSEventCallback]]
    js_property_callbacks: dict[str, list[JSEventCallback]]
    subscribed_events: set[str]
    syncable: bool
    decorations: list[Decoration]
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
    x: NumberSpec
    y: NumberSpec
    width: DistanceSpec
    height: DistanceSpec
    angle: AngleSpec

class Ellipse(XYGlyph, LineProps, FillProps, HatchProps):
    def __init__(self, **kwargs: Unpack[_EllipseInit]) -> None: ...

    x: NumberSpec = ...
    y: NumberSpec = ...
    width: DistanceSpec = ...
    height: DistanceSpec = ...
    angle: AngleSpec = ...

class _HAreaInit(TypedDict, total=False):
    name: str | None
    tags: list[Any]
    js_event_callbacks: dict[str, list[JSEventCallback]]
    js_property_callbacks: dict[str, list[JSEventCallback]]
    subscribed_events: set[str]
    syncable: bool
    decorations: list[Decoration]
    fill_color: Color | None
    fill_alpha: Alpha
    hatch_color: ColorSpec
    hatch_alpha: AlphaSpec
    hatch_scale: FloatSpec
    hatch_pattern: HatchPatternSpec
    hatch_weight: FloatSpec
    hatch_extra: dict[str, Texture]
    x1: NumberSpec
    x2: NumberSpec
    y: NumberSpec

class HArea(Glyph, ScalarFillProps, HatchProps):
    def __init__(self, **kwargs: Unpack[_HAreaInit]) -> None: ...

    x1: NumberSpec = ...
    x2: NumberSpec = ...
    y: NumberSpec = ...

class _HAreaStepInit(TypedDict, total=False):
    name: str | None
    tags: list[Any]
    js_event_callbacks: dict[str, list[JSEventCallback]]
    js_property_callbacks: dict[str, list[JSEventCallback]]
    subscribed_events: set[str]
    syncable: bool
    decorations: list[Decoration]
    fill_color: Color | None
    fill_alpha: Alpha
    hatch_color: ColorSpec
    hatch_alpha: AlphaSpec
    hatch_scale: FloatSpec
    hatch_pattern: HatchPatternSpec
    hatch_weight: FloatSpec
    hatch_extra: dict[str, Texture]
    x1: NumberSpec
    x2: NumberSpec
    y: NumberSpec
    step_mode: StepMode

class HAreaStep(Glyph, ScalarFillProps, HatchProps):
    def __init__(self, **kwargs: Unpack[_HAreaStepInit]) -> None: ...

    x1: NumberSpec = ...
    x2: NumberSpec = ...
    y: NumberSpec = ...
    step_mode: StepMode = ...

class _HBarInit(TypedDict, total=False):
    name: str | None
    tags: list[Any]
    js_event_callbacks: dict[str, list[JSEventCallback]]
    js_property_callbacks: dict[str, list[JSEventCallback]]
    subscribed_events: set[str]
    syncable: bool
    decorations: list[Decoration]
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
    border_radius: BorderRadius
    y: NumberSpec
    height: DistanceSpec
    left: NumberSpec
    right: NumberSpec

class HBar(LRTBGlyph):
    def __init__(self, **kwargs: Unpack[_HBarInit]) -> None: ...

    y: NumberSpec = ...
    height: DistanceSpec = ...
    left: NumberSpec = ...
    right: NumberSpec = ...

class _HSpanInit(TypedDict, total=False):
    name: str | None
    tags: list[Any]
    js_event_callbacks: dict[str, list[JSEventCallback]]
    js_property_callbacks: dict[str, list[JSEventCallback]]
    subscribed_events: set[str]
    syncable: bool
    decorations: list[Decoration]
    line_color: ColorSpec
    line_alpha: AlphaSpec
    line_width: FloatSpec
    line_join: LineJoinSpec
    line_cap: LineCapSpec
    line_dash: DashPatternSpec
    line_dash_offset: IntSpec
    y: NumberSpec

class HSpan(Glyph, LineProps):
    def __init__(self, **kwargs: Unpack[_HSpanInit]) -> None: ...

    y: NumberSpec = ...

class _HStripInit(TypedDict, total=False):
    name: str | None
    tags: list[Any]
    js_event_callbacks: dict[str, list[JSEventCallback]]
    js_property_callbacks: dict[str, list[JSEventCallback]]
    subscribed_events: set[str]
    syncable: bool
    decorations: list[Decoration]
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
    y0: NumberSpec
    y1: NumberSpec

class HStrip(Glyph, LineProps, FillProps, HatchProps):
    def __init__(self, **kwargs: Unpack[_HStripInit]) -> None: ...

    y0: NumberSpec = ...
    y1: NumberSpec = ...

class _HexTileInit(TypedDict, total=False):
    name: str | None
    tags: list[Any]
    js_event_callbacks: dict[str, list[JSEventCallback]]
    js_property_callbacks: dict[str, list[JSEventCallback]]
    subscribed_events: set[str]
    syncable: bool
    decorations: list[Decoration]
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
    size: float
    aspect_scale: float
    r: NumberSpec
    q: NumberSpec
    scale: NumberSpec
    orientation: HexTileOrientation

class HexTile(Glyph, LineProps, FillProps, HatchProps):
    def __init__(self, **kwargs: Unpack[_HexTileInit]) -> None: ...

    size: float = ...
    aspect_scale: float = ...
    r: NumberSpec = ...
    q: NumberSpec = ...
    scale: NumberSpec = ...
    orientation: HexTileOrientation = ...

class _ImageBaseInit(TypedDict, total=False):
    name: str | None
    tags: list[Any]
    js_event_callbacks: dict[str, list[JSEventCallback]]
    js_property_callbacks: dict[str, list[JSEventCallback]]
    subscribed_events: set[str]
    syncable: bool
    decorations: list[Decoration]
    global_alpha: AlphaSpec
    x: NumberSpec
    y: NumberSpec
    dw: DistanceSpec
    dh: DistanceSpec
    dilate: bool
    origin: ImageOrigin
    anchor: Anchor

class ImageBase(XYGlyph, ImageProps):
    @abstractmethod
    def __init__(self, **kwargs: Unpack[_ImageBaseInit]) -> None: ...

    x: NumberSpec = ...
    y: NumberSpec = ...
    dw: DistanceSpec = ...
    dh: DistanceSpec = ...
    dilate: bool = ...
    origin: ImageOrigin = ...
    anchor: Anchor = ...

class _ImageInit(TypedDict, total=False):
    name: str | None
    tags: list[Any]
    js_event_callbacks: dict[str, list[JSEventCallback]]
    js_property_callbacks: dict[str, list[JSEventCallback]]
    subscribed_events: set[str]
    syncable: bool
    decorations: list[Decoration]
    global_alpha: AlphaSpec
    x: NumberSpec
    y: NumberSpec
    dw: DistanceSpec
    dh: DistanceSpec
    dilate: bool
    origin: ImageOrigin
    anchor: Anchor
    image: NumberSpec
    color_mapper: ColorMapper | Palette

class Image(ImageBase):
    def __init__(self, **kwargs: Unpack[_ImageInit]) -> None: ...

    image: NumberSpec = ...

    @property
    def color_mapper(self) -> ColorMapper: ...
    @color_mapper.setter
    def color_mapper(self, color_mapper: ColorMapper | Palette) -> None: ...

class _ImageRGBAInit(TypedDict, total=False):
    name: str | None
    tags: list[Any]
    js_event_callbacks: dict[str, list[JSEventCallback]]
    js_property_callbacks: dict[str, list[JSEventCallback]]
    subscribed_events: set[str]
    syncable: bool
    decorations: list[Decoration]
    global_alpha: AlphaSpec
    x: NumberSpec
    y: NumberSpec
    dw: DistanceSpec
    dh: DistanceSpec
    dilate: bool
    origin: ImageOrigin
    anchor: Anchor
    image: NumberSpec

class ImageRGBA(ImageBase):
    def __init__(self, **kwargs: Unpack[_ImageRGBAInit]) -> None: ...

    image: NumberSpec = ...

class _ImageStackInit(TypedDict, total=False):
    name: str | None
    tags: list[Any]
    js_event_callbacks: dict[str, list[JSEventCallback]]
    js_property_callbacks: dict[str, list[JSEventCallback]]
    subscribed_events: set[str]
    syncable: bool
    decorations: list[Decoration]
    global_alpha: AlphaSpec
    x: NumberSpec
    y: NumberSpec
    dw: DistanceSpec
    dh: DistanceSpec
    dilate: bool
    origin: ImageOrigin
    anchor: Anchor
    image: NumberSpec
    color_mapper: StackColorMapper

class ImageStack(ImageBase):
    def __init__(self, **kwargs: Unpack[_ImageStackInit]) -> None: ...

    image: NumberSpec = ...
    color_mapper: StackColorMapper = ...

class _ImageURLInit(TypedDict, total=False):
    name: str | None
    tags: list[Any]
    js_event_callbacks: dict[str, list[JSEventCallback]]
    js_property_callbacks: dict[str, list[JSEventCallback]]
    subscribed_events: set[str]
    syncable: bool
    decorations: list[Decoration]
    url: StringSpec
    x: NumberSpec
    y: NumberSpec
    w: NullDistanceSpec
    h: NullDistanceSpec
    angle: AngleSpec
    global_alpha: NumberSpec
    dilate: bool
    anchor: Anchor
    retry_attempts: int
    retry_timeout: int

class ImageURL(XYGlyph):
    def __init__(self, **kwargs: Unpack[_ImageURLInit]) -> None: ...

    url: StringSpec = ...
    x: NumberSpec = ...
    y: NumberSpec = ...
    w: NullDistanceSpec = ...
    h: NullDistanceSpec = ...
    angle: AngleSpec = ...
    global_alpha: NumberSpec = ...
    dilate: bool = ...
    anchor: Anchor = ...
    retry_attempts: int = ...
    retry_timeout: int = ...

class _LineInit(TypedDict, total=False):
    name: str | None
    tags: list[Any]
    js_event_callbacks: dict[str, list[JSEventCallback]]
    js_property_callbacks: dict[str, list[JSEventCallback]]
    subscribed_events: set[str]
    syncable: bool
    decorations: list[Decoration]
    line_color: Color | None
    line_alpha: Alpha
    line_width: float
    line_join: LineJoin
    line_cap: LineCap
    line_dash: DashPattern
    line_dash_offset: int
    x: NumberSpec
    y: NumberSpec

class Line(ConnectedXYGlyph, ScalarLineProps):
    def __init__(self, **kwargs: Unpack[_LineInit]) -> None: ...

    x: NumberSpec = ...
    y: NumberSpec = ...

class _MultiLineInit(TypedDict, total=False):
    name: str | None
    tags: list[Any]
    js_event_callbacks: dict[str, list[JSEventCallback]]
    js_property_callbacks: dict[str, list[JSEventCallback]]
    subscribed_events: set[str]
    syncable: bool
    decorations: list[Decoration]
    line_color: ColorSpec
    line_alpha: AlphaSpec
    line_width: FloatSpec
    line_join: LineJoinSpec
    line_cap: LineCapSpec
    line_dash: DashPatternSpec
    line_dash_offset: IntSpec
    xs: NumberSpec
    ys: NumberSpec

class MultiLine(Glyph, LineProps):
    def __init__(self, **kwargs: Unpack[_MultiLineInit]) -> None: ...

    xs: NumberSpec = ...
    ys: NumberSpec = ...

class _MultiPolygonsInit(TypedDict, total=False):
    name: str | None
    tags: list[Any]
    js_event_callbacks: dict[str, list[JSEventCallback]]
    js_property_callbacks: dict[str, list[JSEventCallback]]
    subscribed_events: set[str]
    syncable: bool
    decorations: list[Decoration]
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
    xs: NumberSpec
    ys: NumberSpec

class MultiPolygons(Glyph, LineProps, FillProps, HatchProps):
    def __init__(self, **kwargs: Unpack[_MultiPolygonsInit]) -> None: ...

    xs: NumberSpec = ...
    ys: NumberSpec = ...

class _NgonInit(TypedDict, total=False):
    name: str | None
    tags: list[Any]
    js_event_callbacks: dict[str, list[JSEventCallback]]
    js_property_callbacks: dict[str, list[JSEventCallback]]
    subscribed_events: set[str]
    syncable: bool
    decorations: list[Decoration]
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
    x: NumberSpec
    y: NumberSpec
    radius: DistanceSpec
    angle: AngleSpec
    n: NumberSpec
    radius_dimension: RadiusDimension

class Ngon(RadialGlyph, LineProps, FillProps, HatchProps):
    def __init__(self, **kwargs: Unpack[_NgonInit]) -> None: ...

    x: NumberSpec = ...
    y: NumberSpec = ...
    radius: DistanceSpec = ...
    angle: AngleSpec = ...
    n: NumberSpec = ...
    radius_dimension: RadiusDimension = ...

class _PatchInit(TypedDict, total=False):
    name: str | None
    tags: list[Any]
    js_event_callbacks: dict[str, list[JSEventCallback]]
    js_property_callbacks: dict[str, list[JSEventCallback]]
    subscribed_events: set[str]
    syncable: bool
    decorations: list[Decoration]
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
    x: NumberSpec
    y: NumberSpec

class Patch(ConnectedXYGlyph, ScalarLineProps, ScalarFillProps, ScalarHatchProps):
    def __init__(self, **kwargs: Unpack[_PatchInit]) -> None: ...

    x: NumberSpec = ...
    y: NumberSpec = ...

class _PatchesInit(TypedDict, total=False):
    name: str | None
    tags: list[Any]
    js_event_callbacks: dict[str, list[JSEventCallback]]
    js_property_callbacks: dict[str, list[JSEventCallback]]
    subscribed_events: set[str]
    syncable: bool
    decorations: list[Decoration]
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
    xs: NumberSpec
    ys: NumberSpec

class Patches(Glyph, LineProps, FillProps, HatchProps):
    def __init__(self, **kwargs: Unpack[_PatchesInit]) -> None: ...

    xs: NumberSpec = ...
    ys: NumberSpec = ...

class _QuadInit(TypedDict, total=False):
    name: str | None
    tags: list[Any]
    js_event_callbacks: dict[str, list[JSEventCallback]]
    js_property_callbacks: dict[str, list[JSEventCallback]]
    subscribed_events: set[str]
    syncable: bool
    decorations: list[Decoration]
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
    border_radius: BorderRadius
    left: NumberSpec
    right: NumberSpec
    bottom: NumberSpec
    top: NumberSpec

class Quad(LRTBGlyph):
    def __init__(self, **kwargs: Unpack[_QuadInit]) -> None: ...

    left: NumberSpec = ...
    right: NumberSpec = ...
    bottom: NumberSpec = ...
    top: NumberSpec = ...

class _QuadraticInit(TypedDict, total=False):
    name: str | None
    tags: list[Any]
    js_event_callbacks: dict[str, list[JSEventCallback]]
    js_property_callbacks: dict[str, list[JSEventCallback]]
    subscribed_events: set[str]
    syncable: bool
    decorations: list[Decoration]
    line_color: ColorSpec
    line_alpha: AlphaSpec
    line_width: FloatSpec
    line_join: LineJoinSpec
    line_cap: LineCapSpec
    line_dash: DashPatternSpec
    line_dash_offset: IntSpec
    x0: NumberSpec
    y0: NumberSpec
    x1: NumberSpec
    y1: NumberSpec
    cx: NumberSpec
    cy: NumberSpec

class Quadratic(Glyph, LineProps):
    def __init__(self, **kwargs: Unpack[_QuadraticInit]) -> None: ...

    x0: NumberSpec = ...
    y0: NumberSpec = ...
    x1: NumberSpec = ...
    y1: NumberSpec = ...
    cx: NumberSpec = ...
    cy: NumberSpec = ...

class _RayInit(TypedDict, total=False):
    name: str | None
    tags: list[Any]
    js_event_callbacks: dict[str, list[JSEventCallback]]
    js_property_callbacks: dict[str, list[JSEventCallback]]
    subscribed_events: set[str]
    syncable: bool
    decorations: list[Decoration]
    line_color: ColorSpec
    line_alpha: AlphaSpec
    line_width: FloatSpec
    line_join: LineJoinSpec
    line_cap: LineCapSpec
    line_dash: DashPatternSpec
    line_dash_offset: IntSpec
    x: NumberSpec
    y: NumberSpec
    angle: AngleSpec
    length: DistanceSpec

class Ray(XYGlyph, LineProps):
    def __init__(self, **kwargs: Unpack[_RayInit]) -> None: ...

    x: NumberSpec = ...
    y: NumberSpec = ...
    angle: AngleSpec = ...
    length: DistanceSpec = ...

class _RectInit(TypedDict, total=False):
    name: str | None
    tags: list[Any]
    js_event_callbacks: dict[str, list[JSEventCallback]]
    js_property_callbacks: dict[str, list[JSEventCallback]]
    subscribed_events: set[str]
    syncable: bool
    decorations: list[Decoration]
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
    x: NumberSpec
    y: NumberSpec
    width: DistanceSpec
    height: DistanceSpec
    angle: AngleSpec
    border_radius: BorderRadius
    dilate: bool

class Rect(XYGlyph, LineProps, FillProps, HatchProps):
    def __init__(self, **kwargs: Unpack[_RectInit]) -> None: ...

    x: NumberSpec = ...
    y: NumberSpec = ...
    width: DistanceSpec = ...
    height: DistanceSpec = ...
    angle: AngleSpec = ...
    border_radius: BorderRadius = ...
    dilate: bool = ...

class _ScatterInit(TypedDict, total=False):
    name: str | None
    tags: list[Any]
    js_event_callbacks: dict[str, list[JSEventCallback]]
    js_property_callbacks: dict[str, list[JSEventCallback]]
    subscribed_events: set[str]
    syncable: bool
    decorations: list[Decoration]
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
    x: NumberSpec
    y: NumberSpec
    hit_dilation: NonNegative[float]
    size: SizeSpec
    angle: AngleSpec
    marker: MarkerSpec
    defs: dict[str, CustomJS]

class Scatter(Marker):
    def __init__(self, **kwargs: Unpack[_ScatterInit]) -> None: ...

    marker: MarkerSpec = ...
    defs: dict[str, CustomJS] = ...

class _SegmentInit(TypedDict, total=False):
    name: str | None
    tags: list[Any]
    js_event_callbacks: dict[str, list[JSEventCallback]]
    js_property_callbacks: dict[str, list[JSEventCallback]]
    subscribed_events: set[str]
    syncable: bool
    decorations: list[Decoration]
    line_color: ColorSpec
    line_alpha: AlphaSpec
    line_width: FloatSpec
    line_join: LineJoinSpec
    line_cap: LineCapSpec
    line_dash: DashPatternSpec
    line_dash_offset: IntSpec
    x0: NumberSpec
    y0: NumberSpec
    x1: NumberSpec
    y1: NumberSpec

class Segment(Glyph, LineProps):
    def __init__(self, **kwargs: Unpack[_SegmentInit]) -> None: ...

    x0: NumberSpec = ...
    y0: NumberSpec = ...
    x1: NumberSpec = ...
    y1: NumberSpec = ...

class _StepInit(TypedDict, total=False):
    name: str | None
    tags: list[Any]
    js_event_callbacks: dict[str, list[JSEventCallback]]
    js_property_callbacks: dict[str, list[JSEventCallback]]
    subscribed_events: set[str]
    syncable: bool
    decorations: list[Decoration]
    line_color: Color | None
    line_alpha: Alpha
    line_width: float
    line_join: LineJoin
    line_cap: LineCap
    line_dash: DashPattern
    line_dash_offset: int
    x: NumberSpec
    y: NumberSpec
    mode: StepMode
    pad_before: NonNegative[float]
    pad_after: NonNegative[float]

class Step(XYGlyph, ScalarLineProps):
    def __init__(self, **kwargs: Unpack[_StepInit]) -> None: ...

    x: NumberSpec = ...
    y: NumberSpec = ...
    mode: StepMode = ...
    pad_before: NonNegative[float] = ...
    pad_after: NonNegative[float] = ...

class _TextInit(TypedDict, total=False):
    name: str | None
    tags: list[Any]
    js_event_callbacks: dict[str, list[JSEventCallback]]
    js_property_callbacks: dict[str, list[JSEventCallback]]
    subscribed_events: set[str]
    syncable: bool
    decorations: list[Decoration]
    text_color: ColorSpec
    text_outline_color: ColorSpec
    text_outline_width: FloatSpec
    text_alpha: AlphaSpec
    text_font: StringSpec
    text_font_size: FontSizeSpec
    text_font_style: FontStyleSpec
    text_align: TextAlignSpec
    text_baseline: TextBaselineSpec
    text_line_height: NumberSpec
    background_fill_color: ColorSpec
    background_fill_alpha: AlphaSpec
    background_hatch_color: ColorSpec
    background_hatch_alpha: AlphaSpec
    background_hatch_scale: FloatSpec
    background_hatch_pattern: HatchPatternSpec
    background_hatch_weight: FloatSpec
    background_hatch_extra: dict[str, Texture]
    border_line_color: ColorSpec
    border_line_alpha: AlphaSpec
    border_line_width: FloatSpec
    border_line_join: LineJoinSpec
    border_line_cap: LineCapSpec
    border_line_dash: DashPatternSpec
    border_line_dash_offset: IntSpec
    x: NumberSpec
    y: NumberSpec
    text: StringSpec
    angle: AngleSpec
    x_offset: FloatSpec
    y_offset: FloatSpec
    anchor: DataSpec[TextAnchor]
    padding: Padding
    border_radius: BorderRadius
    outline_shape: DataSpec[OutlineShapeName]

class Text(XYGlyph, TextProps, BackgroundFillProps, BackgroundHatchProps, BorderLineProps):
    def __init__(self, **kwargs: Unpack[_TextInit]) -> None: ...

    x: NumberSpec = ...
    y: NumberSpec = ...
    text: StringSpec = ...
    angle: AngleSpec = ...
    x_offset: FloatSpec = ...
    y_offset: FloatSpec = ...
    anchor: DataSpec[TextAnchor] = ...
    padding: Padding = ...
    border_radius: BorderRadius = ...
    outline_shape: DataSpec[OutlineShapeName] = ...

class _MathTextGlyphInit(TypedDict, total=False):
    name: str | None
    tags: list[Any]
    js_event_callbacks: dict[str, list[JSEventCallback]]
    js_property_callbacks: dict[str, list[JSEventCallback]]
    subscribed_events: set[str]
    syncable: bool
    decorations: list[Decoration]
    text_color: ColorSpec
    text_outline_color: ColorSpec
    text_outline_width: FloatSpec
    text_alpha: AlphaSpec
    text_font: StringSpec
    text_font_size: FontSizeSpec
    text_font_style: FontStyleSpec
    text_align: TextAlignSpec
    text_baseline: TextBaselineSpec
    text_line_height: NumberSpec
    background_fill_color: ColorSpec
    background_fill_alpha: AlphaSpec
    background_hatch_color: ColorSpec
    background_hatch_alpha: AlphaSpec
    background_hatch_scale: FloatSpec
    background_hatch_pattern: HatchPatternSpec
    background_hatch_weight: FloatSpec
    background_hatch_extra: dict[str, Texture]
    border_line_color: ColorSpec
    border_line_alpha: AlphaSpec
    border_line_width: FloatSpec
    border_line_join: LineJoinSpec
    border_line_cap: LineCapSpec
    border_line_dash: DashPatternSpec
    border_line_dash_offset: IntSpec
    x: NumberSpec
    y: NumberSpec
    text: StringSpec
    angle: AngleSpec
    x_offset: FloatSpec
    y_offset: FloatSpec
    anchor: DataSpec[TextAnchor]
    padding: Padding
    border_radius: BorderRadius
    outline_shape: DataSpec[OutlineShapeName]

class MathTextGlyph(Text):
    @abstractmethod
    def __init__(self, **kwargs: Unpack[_MathTextGlyphInit]) -> None: ...

class _MathMLGlyphInit(TypedDict, total=False):
    name: str | None
    tags: list[Any]
    js_event_callbacks: dict[str, list[JSEventCallback]]
    js_property_callbacks: dict[str, list[JSEventCallback]]
    subscribed_events: set[str]
    syncable: bool
    decorations: list[Decoration]
    text_color: ColorSpec
    text_outline_color: ColorSpec
    text_outline_width: FloatSpec
    text_alpha: AlphaSpec
    text_font: StringSpec
    text_font_size: FontSizeSpec
    text_font_style: FontStyleSpec
    text_align: TextAlignSpec
    text_baseline: TextBaselineSpec
    text_line_height: NumberSpec
    background_fill_color: ColorSpec
    background_fill_alpha: AlphaSpec
    background_hatch_color: ColorSpec
    background_hatch_alpha: AlphaSpec
    background_hatch_scale: FloatSpec
    background_hatch_pattern: HatchPatternSpec
    background_hatch_weight: FloatSpec
    background_hatch_extra: dict[str, Texture]
    border_line_color: ColorSpec
    border_line_alpha: AlphaSpec
    border_line_width: FloatSpec
    border_line_join: LineJoinSpec
    border_line_cap: LineCapSpec
    border_line_dash: DashPatternSpec
    border_line_dash_offset: IntSpec
    x: NumberSpec
    y: NumberSpec
    text: StringSpec
    angle: AngleSpec
    x_offset: FloatSpec
    y_offset: FloatSpec
    anchor: DataSpec[TextAnchor]
    padding: Padding
    border_radius: BorderRadius
    outline_shape: DataSpec[OutlineShapeName]

class MathMLGlyph(MathTextGlyph):
    def __init__(self, **kwargs: Unpack[_MathMLGlyphInit]) -> None: ...

class _TeXGlyphInit(TypedDict, total=False):
    name: str | None
    tags: list[Any]
    js_event_callbacks: dict[str, list[JSEventCallback]]
    js_property_callbacks: dict[str, list[JSEventCallback]]
    subscribed_events: set[str]
    syncable: bool
    decorations: list[Decoration]
    text_color: ColorSpec
    text_outline_color: ColorSpec
    text_outline_width: FloatSpec
    text_alpha: AlphaSpec
    text_font: StringSpec
    text_font_size: FontSizeSpec
    text_font_style: FontStyleSpec
    text_align: TextAlignSpec
    text_baseline: TextBaselineSpec
    text_line_height: NumberSpec
    background_fill_color: ColorSpec
    background_fill_alpha: AlphaSpec
    background_hatch_color: ColorSpec
    background_hatch_alpha: AlphaSpec
    background_hatch_scale: FloatSpec
    background_hatch_pattern: HatchPatternSpec
    background_hatch_weight: FloatSpec
    background_hatch_extra: dict[str, Texture]
    border_line_color: ColorSpec
    border_line_alpha: AlphaSpec
    border_line_width: FloatSpec
    border_line_join: LineJoinSpec
    border_line_cap: LineCapSpec
    border_line_dash: DashPatternSpec
    border_line_dash_offset: IntSpec
    x: NumberSpec
    y: NumberSpec
    text: StringSpec
    angle: AngleSpec
    x_offset: FloatSpec
    y_offset: FloatSpec
    anchor: DataSpec[TextAnchor]
    padding: Padding
    border_radius: BorderRadius
    outline_shape: DataSpec[OutlineShapeName]
    macros: dict[str, str | tuple[str, int]]
    display: TeXDisplay

class TeXGlyph(MathTextGlyph):
    def __init__(self, **kwargs: Unpack[_TeXGlyphInit]) -> None: ...

    macros: dict[str, str | tuple[str, int]] = ...
    display: TeXDisplay = ...

class _VAreaInit(TypedDict, total=False):
    name: str | None
    tags: list[Any]
    js_event_callbacks: dict[str, list[JSEventCallback]]
    js_property_callbacks: dict[str, list[JSEventCallback]]
    subscribed_events: set[str]
    syncable: bool
    decorations: list[Decoration]
    fill_color: Color | None
    fill_alpha: Alpha
    hatch_color: ColorSpec
    hatch_alpha: AlphaSpec
    hatch_scale: FloatSpec
    hatch_pattern: HatchPatternSpec
    hatch_weight: FloatSpec
    hatch_extra: dict[str, Texture]
    x: NumberSpec
    y1: NumberSpec
    y2: NumberSpec

class VArea(Glyph, ScalarFillProps, HatchProps):
    def __init__(self, **kwargs: Unpack[_VAreaInit]) -> None: ...

    x: NumberSpec = ...
    y1: NumberSpec = ...
    y2: NumberSpec = ...

class _VAreaStepInit(TypedDict, total=False):
    name: str | None
    tags: list[Any]
    js_event_callbacks: dict[str, list[JSEventCallback]]
    js_property_callbacks: dict[str, list[JSEventCallback]]
    subscribed_events: set[str]
    syncable: bool
    decorations: list[Decoration]
    fill_color: Color | None
    fill_alpha: Alpha
    hatch_color: ColorSpec
    hatch_alpha: AlphaSpec
    hatch_scale: FloatSpec
    hatch_pattern: HatchPatternSpec
    hatch_weight: FloatSpec
    hatch_extra: dict[str, Texture]
    x: NumberSpec
    y1: NumberSpec
    y2: NumberSpec
    step_mode: StepMode

class VAreaStep(Glyph, ScalarFillProps, HatchProps):
    def __init__(self, **kwargs: Unpack[_VAreaStepInit]) -> None: ...

    x: NumberSpec = ...
    y1: NumberSpec = ...
    y2: NumberSpec = ...
    step_mode: StepMode = ...

class _VBarInit(TypedDict, total=False):
    name: str | None
    tags: list[Any]
    js_event_callbacks: dict[str, list[JSEventCallback]]
    js_property_callbacks: dict[str, list[JSEventCallback]]
    subscribed_events: set[str]
    syncable: bool
    decorations: list[Decoration]
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
    border_radius: BorderRadius
    x: NumberSpec
    width: DistanceSpec
    bottom: NumberSpec
    top: NumberSpec

class VBar(LRTBGlyph):
    def __init__(self, **kwargs: Unpack[_VBarInit]) -> None: ...

    x: NumberSpec = ...
    width: DistanceSpec = ...
    bottom: NumberSpec = ...
    top: NumberSpec = ...

class _VSpanInit(TypedDict, total=False):
    name: str | None
    tags: list[Any]
    js_event_callbacks: dict[str, list[JSEventCallback]]
    js_property_callbacks: dict[str, list[JSEventCallback]]
    subscribed_events: set[str]
    syncable: bool
    decorations: list[Decoration]
    line_color: ColorSpec
    line_alpha: AlphaSpec
    line_width: FloatSpec
    line_join: LineJoinSpec
    line_cap: LineCapSpec
    line_dash: DashPatternSpec
    line_dash_offset: IntSpec
    x: NumberSpec

class VSpan(Glyph, LineProps):
    def __init__(self, **kwargs: Unpack[_VSpanInit]) -> None: ...

    x: NumberSpec = ...

class _VStripInit(TypedDict, total=False):
    name: str | None
    tags: list[Any]
    js_event_callbacks: dict[str, list[JSEventCallback]]
    js_property_callbacks: dict[str, list[JSEventCallback]]
    subscribed_events: set[str]
    syncable: bool
    decorations: list[Decoration]
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
    x0: NumberSpec
    x1: NumberSpec

class VStrip(Glyph, LineProps, FillProps, HatchProps):
    def __init__(self, **kwargs: Unpack[_VStripInit]) -> None: ...

    x0: NumberSpec = ...
    x1: NumberSpec = ...

class _WedgeInit(TypedDict, total=False):
    name: str | None
    tags: list[Any]
    js_event_callbacks: dict[str, list[JSEventCallback]]
    js_property_callbacks: dict[str, list[JSEventCallback]]
    subscribed_events: set[str]
    syncable: bool
    decorations: list[Decoration]
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
    x: NumberSpec
    y: NumberSpec
    radius: DistanceSpec
    start_angle: AngleSpec
    end_angle: AngleSpec
    direction: Direction

class Wedge(XYGlyph, LineProps, FillProps, HatchProps):
    def __init__(self, **kwargs: Unpack[_WedgeInit]) -> None: ...

    x: NumberSpec = ...
    y: NumberSpec = ...
    radius: DistanceSpec = ...
    start_angle: AngleSpec = ...
    end_angle: AngleSpec = ...
    direction: Direction = ...
