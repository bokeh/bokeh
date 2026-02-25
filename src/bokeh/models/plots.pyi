#-----------------------------------------------------------------------------
# Copyright (c) Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------

# Standard library imports
from contextlib import contextmanager
from typing import (
    TYPE_CHECKING,
    Any,
    Generator,
    Sequence,
    TypeVar,
    overload,
)

if TYPE_CHECKING:
    from typing_extensions import Unpack

# Bokeh imports
from ..core.enums import (
    LocationType as Location,
    OutputBackendType as OutputBackend,
    PlaceType as Place,
    ResetPolicyType as ResetPolicy,
    WindowAxisType as WindowAxis,
)
from ..core.property_aliases import LRTB
from ..core.property_mixins import (
    ScalarBackgroundFillProps as BackgroundFill,
    ScalarBackgroundHatchProps as BackgroundHatch,
    ScalarBorderFillProps as BorderFill,
    ScalarBorderHatchProps as BorderHatch,
    ScalarBorderLineProps as BorderLine,
    ScalarOutlineLineProps as OutlineLine,
)
from ..model import Model
from .annotations import Legend, Title
from .axes import Axis
from .dom import HTML
from .glyph import Glyph
from .grids import Grid
from .layouts import (
    GridCommon,
    LayoutDOM,
)
from .ranges import Range
from .renderers import GlyphRenderer, Renderer, TileRenderer
from .scales import Scale
from .sources import ColumnarDataSource
from .tiles import TileSource
from .tools import HoverTool, Tool, Toolbar
from .ui.ui_element import StyledElement

if TYPE_CHECKING:
    import xyzservices

GlyphType = TypeVar("GlyphType", bound=Glyph)

from .._types import Alpha
from .._types import Color
from .._types import NonNegative
from .._types import Size
from ..core.enums import AlignType as Align
from ..core.enums import AutoType as Auto
from ..core.enums import DimensionsType as Dimensions
from ..core.enums import FlowModeType as FlowMode
from ..core.enums import LineCapType as LineCap
from ..core.enums import LineJoinType as LineJoin
from ..core.enums import SizingModeType as SizingMode
from ..core.enums import SizingPolicyType as SizingPolicy
from ..core.property.visual import DashPatternType as DashPattern
from ..core.property_aliases import GridSpacing
from ..core.property_aliases import TracksSizing
from ..model.model import JSEventCallback
from .css import StyleSheet
from .css import Styles
from .dom import DOMNode
from .nodes import Node
from .textures import Texture
from .ui.menus import Menu
from .ui.ui_element import UIElement
from typing import TypedDict

class AxisListAttrSplat(list[Axis], Axis):
    pass

class GridListAttrSplat(list[Grid], Grid):
    pass

class LegendListAttrSplat(list[Legend], Legend):
    pass

class HoverListAttrSplat(list[HoverTool], HoverTool):
    pass

class _PlotInit(TypedDict, total=False):
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
    background_fill_color: Color | None
    background_fill_alpha: Alpha
    background_hatch_color: Color | None
    background_hatch_alpha: Alpha
    background_hatch_scale: Size
    background_hatch_pattern: str | None
    background_hatch_weight: Size
    background_hatch_extra: dict[str, Texture]
    border_line_color: Color | None
    border_line_alpha: Alpha
    border_line_width: float
    border_line_join: LineJoin
    border_line_cap: LineCap
    border_line_dash: DashPattern
    border_line_dash_offset: int
    border_fill_color: Color | None
    border_fill_alpha: Alpha
    border_hatch_color: Color | None
    border_hatch_alpha: Alpha
    border_hatch_scale: Size
    border_hatch_pattern: str | None
    border_hatch_weight: Size
    border_hatch_extra: dict[str, Texture]
    outline_line_color: Color | None
    outline_line_alpha: Alpha
    outline_line_width: float
    outline_line_join: LineJoin
    outline_line_cap: LineCap
    outline_line_dash: DashPattern
    outline_line_dash_offset: int
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
    #width: int | None
    #height: int | None

class Plot(LayoutDOM, BackgroundFill, BackgroundHatch, BorderLine, BorderFill, BorderHatch, OutlineLine):
    def __init__(self, **kwargs: Unpack[_PlotInit]) -> None: ...

    x_range: Range = ...
    y_range: Range = ...
    x_scale: Scale = ...
    y_scale: Scale = ...
    extra_x_ranges: dict[str, Range] = ...
    extra_y_ranges: dict[str, Range] = ...
    extra_x_scales: dict[str, Scale] = ...
    extra_y_scales: dict[str, Scale] = ...
    window_axis: WindowAxis = ...
    hidpi: bool = ...

    @property
    def title(self) -> Title | None: ...
    @title.setter
    def title(self, title: Title | str | None) -> None: ...

    title_location: Location | None = ...
    renderers: list[Renderer] = ...
    toolbar: Toolbar = ...
    toolbar_location: Location | None = ...
    toolbar_sticky: bool = ...
    toolbar_inner: bool = ...
    left: list[Renderer | StyledElement] = ...
    right: list[Renderer | StyledElement] = ...
    above: list[Renderer | StyledElement] = ...
    below: list[Renderer | StyledElement] = ...
    center: list[Renderer | StyledElement] = ...
    width: int | None = ...
    height: int | None = ...
    frame_width: int | None = ...
    frame_height: int | None = ...
    frame_align: bool | LRTB[bool] = ...
    min_border_top: int | None = ...
    min_border_bottom: int | None = ...
    min_border_left: int | None = ...
    min_border_right: int | None = ...
    min_border: int | None = ...
    lod_factor: int = ...
    lod_threshold: int | None = ...
    lod_interval: int = ...
    lod_timeout: int = ...
    output_backend: OutputBackend = ...
    match_aspect: bool = ...
    aspect_scale: float = ...
    reset_policy: ResetPolicy = ...
    hold_render: bool = ...
    attribution: list[HTML | str] = ...

    @property
    def inner_width(self) -> int: ...
    @property
    def inner_height(self) -> int: ...
    @property
    def outer_width(self) -> int: ...
    @property
    def outer_height(self) -> int: ...

    def select(self, *args: Any, **kwargs: Any) -> Sequence[Model]: ...

    def row(self, row: int, gridplot: GridPlot) -> bool: ...

    def column(self, col: int, gridplot: GridPlot) -> bool: ...

    @property
    def xaxis(self) -> AxisListAttrSplat: ...

    @property
    def yaxis(self) -> AxisListAttrSplat: ...

    @property
    def axis(self) -> AxisListAttrSplat: ...

    @property
    def legend(self) -> LegendListAttrSplat: ...

    @property
    def hover(self) -> HoverListAttrSplat: ...

    @property
    def xgrid(self) -> GridListAttrSplat: ...

    @property
    def ygrid(self) -> GridListAttrSplat: ...

    @property
    def grid(self) -> GridListAttrSplat: ...

    @property
    def tools(self) -> list[Tool]: ...

    @tools.setter
    def tools(self, tools: list[Tool]) -> None: ...

    def add_layout(self, obj: Renderer | StyledElement, place: Place = "center") -> None: ...

    def add_tools(self, *tools: Tool | str) -> None: ...

    def remove_tools(self, *tools: Tool) -> None: ...

    @overload
    def add_glyph(self, glyph: GlyphType, **kwargs: Any) -> GlyphRenderer[GlyphType]: ...
    @overload
    def add_glyph(self, source: ColumnarDataSource, glyph: GlyphType, **kwargs: Any) -> GlyphRenderer[GlyphType]: ...

    def add_tile(self, tile_source: TileSource | xyzservices.TileProvider | str, retina: bool = False, **kwargs: Any) -> TileRenderer: ...

    @contextmanager
    def hold(self, *, render: bool) -> Generator[None, None, None]: ...

class _GridPlotInit(TypedDict, total=False):
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
    toolbar: Toolbar
    toolbar_location: Location | None
    children: list[tuple[LayoutDOM, int, int] | tuple[LayoutDOM, int, int, int, int]]

class GridPlot(GridCommon, LayoutDOM):
    def __init__(self, **kwargs: Unpack[_PlotInit]) -> None: ...

    toolbar: Toolbar = ...
    toolbar_location: Location | None = ...
    children: list[tuple[LayoutDOM, int, int] | tuple[LayoutDOM, int, int, int, int]] = ...
