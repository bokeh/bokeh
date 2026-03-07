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
    Unpack,
    overload,
)

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
    _ScalarBackgroundFillPropsInit as _BackgroundFillInit,
    _ScalarBackgroundHatchPropsInit as _BackgroundHatchInit,
    _ScalarBorderFillPropsInit as _BorderFillInit,
    _ScalarBorderHatchPropsInit as _BorderHatchInit,
    _ScalarBorderLinePropsInit as _BorderLineInit,
    _ScalarOutlineLinePropsInit as _OutlineLineInit,
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
    _GridCommonInit,
    _LayoutDOMInit,
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

class AxisListAttrSplat(list[Axis], Axis):
    pass

class GridListAttrSplat(list[Grid], Grid):
    pass

class LegendListAttrSplat(list[Legend], Legend):
    pass

class HoverListAttrSplat(list[HoverTool], HoverTool):
    pass

class _PlotInit(_LayoutDOMInit, _BackgroundFillInit, _BackgroundHatchInit, _BorderLineInit, _BorderFillInit, _BorderHatchInit, _OutlineLineInit, total=False):
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
    width: int | None
    height: int | None
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
    def hold(self, *, render: bool) -> Generator: ...

class _GridPlotInit(_GridCommonInit, _LayoutDOMInit, total=False):
    toolbar: Toolbar
    toolbar_location: Location | None
    children: list[tuple[LayoutDOM, int, int] | tuple[LayoutDOM, int, int, int, int]]

class GridPlot(GridCommon, LayoutDOM):
    def __init__(self, **kwargs: Unpack[_PlotInit]) -> None: ...

    toolbar: Toolbar = ...
    toolbar_location: Location | None = ...
    children: list[tuple[LayoutDOM, int, int] | tuple[LayoutDOM, int, int, int, int]] = ...
