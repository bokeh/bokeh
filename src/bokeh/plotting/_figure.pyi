#-----------------------------------------------------------------------------
# Copyright (c) Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------

# Standard library imports
from typing import (
    TYPE_CHECKING,
    Any,
    Literal,
    Sequence,
    TypeAlias,
    TypedDict,
)

if TYPE_CHECKING:
    from typing_extensions import Unpack

# External imports
import cartopy.crs as ccrs
import numpy as np
import numpy.typing as npt

if TYPE_CHECKING: # to work around ruff(TID253)
    from narwhals.stable.v1.typing import IntoDataFrame, IntoSeries
    from pandas import DataFrame
    from pandas.core.groupby import GroupBy

# Bokeh imports
from .._types import (
    Color,
    Datetime,
    TextLike,
    TimeDelta,
)
from ..core.enums import (
    AutoType as Auto,
    HexTileOrientationType as HexTileOrientation,
    HorizontalLocationType as HorizontalLocation,
    PaletteType as Palette,
    VerticalLocationType as VerticalLocation,
)
from ..models.dom import Template
from ..models.glyphs import (
    HArea,
    HBar,
    HexTile,
    Line,
    MultiLine,
    MultiPolygons,
    VArea,
    VBar,
)
from ..models.graphs import LayoutProvider
from ..models.plots import (
    LRTB,
    OutputBackendType as OutputBackend,
    Plot,
    ResetPolicyType as ResetPolicy,
    Title,
    Toolbar,
    WindowAxisType as WindowAxis,
    _PlotInit,
)
from ..models.ranges import Range
from ..models.renderers import ContourRenderer, GlyphRenderer, GraphRenderer
from ..models.scales import Scale
from ..models.sources import ColumnDataSource
from ..models.tools import (
    DimensionsType as Dimensions,
    Drag,
    GestureTool,
    InspectTool,
    Scroll,
    Tap,
    Tool,
)
from .glyph_api import GlyphAPI, LineArgs, MultiLineArgs, MultiPolygonsArgs, NonNegative
from ..model.model import JSEventCallback
from ..models.layouts import (AlignType as Align, FlowModeType as FlowMode, SizingModeType as SizingMode, SizingPolicyType as SizingPolicy)
from ..models.renderers.renderer import StyledElement
from ..models.renderers.tile_renderer import Renderer
from ..models.ui.floating import LocationType as Location
from ..models.ui.tooltips import UIElement
from ..models.ui.ui_element import (Menu, Node, StyleSheet, Styles)
from ..models.widgets.buttons import DOMNode
from ..models.widgets.inputs import HTML

EagerDataFrame: TypeAlias = IntoDataFrame
EagerSeries: TypeAlias = IntoSeries

# class _BaseFigureInit(_PlotInit, total=False):
#     tools: str | Sequence[str | Tool]
#     x_minor_ticks: Auto | int
#     y_minor_ticks: Auto | int
#     x_axis_location: VerticalLocation | None
#     y_axis_location: HorizontalLocation | None
#     x_axis_label: TextLike | None
#     y_axis_label: TextLike | None
#     active_drag: Auto | str | Drag | None
#     active_inspect: Auto | str | InspectTool | Sequence[InspectTool | None]
#     active_scroll: Auto | str | Scroll | None
#     active_tap: Auto | str | Tap | None
#     active_multi: Auto | str | GestureTool | None
#     tooltips: Template | str | list[tuple[str, str] | None]

class _BaseFigureInit(TypedDict, total=False):
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
    x_range: Range
    y_range: Range
    x_scale: Scale
    y_scale: Scale
    extra_x_ranges: dict[str, Range]
    extra_y_ranges: dict[str, Range]
    extra_x_scales: dict[str, Scale]
    extra_y_scales: dict[str, Scale]
    window_axis: WindowAxis
    hidpi: bool
    title: Title | str | None
    title_location: Location | None
    renderers: list[Renderer]
    toolbar: Toolbar
    toolbar_location: Location | None
    toolbar_sticky: bool
    toolbar_inner: bool
    left: list[Renderer | StyledElement]
    right: list[Renderer | StyledElement]
    above: list[Renderer | StyledElement]
    below: list[Renderer | StyledElement]
    center: list[Renderer | StyledElement]
    frame_width: int | None
    frame_height: int | None
    frame_align: bool | LRTB[bool]
    min_border_top: int | None
    min_border_bottom: int | None
    min_border_left: int | None
    min_border_right: int | None
    min_border: int | None
    lod_factor: int
    lod_threshold: int | None
    lod_interval: int
    lod_timeout: int
    output_backend: OutputBackend
    match_aspect: bool
    aspect_scale: float
    reset_policy: ResetPolicy
    hold_render: bool
    attribution: list[HTML | str]
    tools: str | Sequence[str | Tool]
    x_minor_ticks: Auto | int
    y_minor_ticks: Auto | int
    x_axis_location: VerticalLocation | None
    y_axis_location: HorizontalLocation | None
    x_axis_label: TextLike | None
    y_axis_label: TextLike | None
    active_drag: Auto | str | Drag | None
    active_inspect: Auto | str | InspectTool | Sequence[InspectTool | None]
    active_scroll: Auto | str | Scroll | None
    active_tap: Auto | str | Tap | None
    active_multi: Auto | str | GestureTool | None
    tooltips: Template | str | list[tuple[str, str] | None]

RangeLike: TypeAlias = (
    Range |
    tuple[float, float] |
    tuple[Datetime, Datetime] |
    tuple[TimeDelta, TimeDelta] |
    Sequence[str] |
    EagerSeries |
    GroupBy[Any]
)

AxisType: TypeAlias = Auto | Literal["linear", "log", "datetime", "timedelta", "mercator"] | None

DEFAULT_TOOLS: str

# class _FigureInit(_BaseFigureInit, total=False):
#     x_range: RangeLike
#     y_range: RangeLike
#     x_axis_type: AxisType
#     y_axis_type: AxisType

class _FigureInit(TypedDict, total=False):
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
    x_range: Range
    y_range: Range
    x_scale: Scale
    y_scale: Scale
    extra_x_ranges: dict[str, Range]
    extra_y_ranges: dict[str, Range]
    extra_x_scales: dict[str, Scale]
    extra_y_scales: dict[str, Scale]
    window_axis: WindowAxis
    hidpi: bool
    title: Title | str | None
    title_location: Location | None
    renderers: list[Renderer]
    toolbar: Toolbar
    toolbar_location: Location | None
    toolbar_sticky: bool
    toolbar_inner: bool
    left: list[Renderer | StyledElement]
    right: list[Renderer | StyledElement]
    above: list[Renderer | StyledElement]
    below: list[Renderer | StyledElement]
    center: list[Renderer | StyledElement]
    frame_width: int | None
    frame_height: int | None
    frame_align: bool | LRTB[bool]
    min_border_top: int | None
    min_border_bottom: int | None
    min_border_left: int | None
    min_border_right: int | None
    min_border: int | None
    lod_factor: int
    lod_threshold: int | None
    lod_interval: int
    lod_timeout: int
    output_backend: OutputBackend
    match_aspect: bool
    aspect_scale: float
    reset_policy: ResetPolicy
    hold_render: bool
    attribution: list[HTML | str]
    tools: str | Sequence[str | Tool]
    x_minor_ticks: Auto | int
    y_minor_ticks: Auto | int
    x_axis_location: VerticalLocation | None
    y_axis_location: HorizontalLocation | None
    x_axis_label: TextLike | None
    y_axis_label: TextLike | None
    active_drag: Auto | str | Drag | None
    active_inspect: Auto | str | InspectTool | Sequence[InspectTool | None]
    active_scroll: Auto | str | Scroll | None
    active_tap: Auto | str | Tap | None
    active_multi: Auto | str | GestureTool | None
    tooltips: Template | str | list[tuple[str, str] | None]
    x_axis_type: AxisType
    y_axis_type: AxisType

# TODO This is incorrect, because *FigureOptions are models in _figure.py.
BaseFigureOptions: TypeAlias = _BaseFigureInit
FigureOptions: TypeAlias = _FigureInit

class figure(Plot, GlyphAPI):
    def __init__(self, **kwargs: Unpack[_FigureInit]) -> None: ...

    def subplot(self,
        *,
        x_source: Range | None = ...,
        y_source: Range | None = ...,
        x_scale: Scale | None = ...,
        y_scale: Scale | None = ...,
        x_target: Range,
        y_target: Range,
    ) -> GlyphAPI: ...

    def hexbin(self,
        x: npt.NDArray[np.floating],
        y: npt.NDArray[np.floating],
        size: float,
        orientation: HexTileOrientation = "pointytop",
        palette: Palette = "Viridis256",
        line_color: Color | None = None,
        fill_color: Color | None = None,
        aspect_scale: float = 1,
        **kwargs: Any, # TODO Unpack[HexTileArgs]
    ) -> tuple[GlyphRenderer[HexTile], DataFrame]: ...

    def harea_stack(self, stackers: Sequence[str], **kwargs: Any) -> list[GlyphRenderer[HArea]]: ...

    def varea_stack(self, stackers: Sequence[str], **kwargs: Any) -> list[GlyphRenderer[VArea]]: ...

    def hbar_stack(self, stackers: Sequence[str], **kwargs: Any) -> list[GlyphRenderer[HBar]]: ...

    def vbar_stack(self, stackers: Sequence[str], **kwargs: Any) -> list[GlyphRenderer[VBar]]: ...

    def hline_stack(self, stackers: Sequence[str], **kwargs: Any) -> list[GlyphRenderer[Line]]: ...

    def vline_stack(self, stackers: Sequence[str], **kwargs: Any) -> list[GlyphRenderer[Line]]: ...

    def graph(self, node_source: ColumnDataSource, edge_source: ColumnDataSource, layout_provider: LayoutProvider, **kwargs: Any) -> GraphRenderer: ...

    def contour(self,
        x: npt.ArrayLike | None = None,
        y: npt.ArrayLike | None = None,
        z: npt.ArrayLike | np.ma.MaskedArray[Any, Any] | None = None,
        levels: npt.ArrayLike | None = None,
        **visuals: Any,
    ) -> ContourRenderer: ...

    def borders(
        self,
        projection: ccrs.Projection,
        scale:str,
        **line_kwargs: Unpack[MultiLineArgs],
    ) -> GlyphRenderer[MultiLine]: ...

    def coastlines(
        self,
        projection: ccrs.Projection,
        scale:str,
        **line_kwargs: Unpack[MultiLineArgs],
    ) -> GlyphRenderer[MultiLine]: ...

    def land(
        self,
        projection: ccrs.Projection,
        scale:str,
        **poly_kwargs: Unpack[MultiPolygonsArgs],
    ) -> GlyphRenderer[MultiPolygons]: ...

    def lakes(
        self,
        projection: ccrs.Projection,
        scale:str,
        **poly_kwargs: Unpack[MultiPolygonsArgs],
    ) -> GlyphRenderer[MultiPolygons]: ...

    def ocean(
        self,
        projection: ccrs.Projection,
        scale:str,
        **poly_kwargs: Unpack[MultiPolygonsArgs],
    ) -> GlyphRenderer[MultiPolygons]: ...

    def rivers(
        self,
        projection: ccrs.Projection,
        scale:str,
        **line_kwargs: Unpack[MultiLineArgs],
    ) -> GlyphRenderer[MultiLine]: ...

    def projection_boundary(
        self,
        projection: ccrs.Projection,
        **line_kwargs: Unpack[LineArgs],
    ) -> GlyphRenderer[Line]: ...

    def provinces(
        self,
        projection: ccrs.Projection,
        scale:str,
        **line_kwargs: Unpack[MultiLineArgs],
    ) -> GlyphRenderer[MultiLine]: ...

    def states(
        self,
        projection: ccrs.Projection,
        scale:str,
        **poly_kwargs: Unpack[MultiPolygonsArgs],
    ) -> GlyphRenderer[MultiPolygons]: ...


def markers() -> None: ...
