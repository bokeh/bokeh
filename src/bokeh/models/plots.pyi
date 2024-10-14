from dataclasses import dataclass
from typing import NotRequired, TypedDict

from ..core.enums import (
    LocationType as Location,
    OutputBackendType as OutputBackend,
    ResetPolicyType as ResetPolicy,
)
from .layouts import GridCommon, LayoutDOM

type Readonly[T] = T

@dataclass
class Range:
    ...
@dataclass
class Scale:
    ...
@dataclass
class Renderer:
    ...
@dataclass
class Title:
    ...
@dataclass
class Toolbar:
    ...
@dataclass
class HTML:
    ...

class LRTB[T](TypedDict):
    left: NotRequired[T]
    right: NotRequired[T]
    top: NotRequired[T]
    bottom: NotRequired[T]

@dataclass
class Plot(LayoutDOM):
    ...

    x_range: Range = ...

    y_range: Range = ...

    x_scale: Scale = ...

    y_scale: Scale = ...

    extra_x_ranges: dict[str, Range] = ...

    extra_y_ranges: dict[str, Range] = ...

    extra_x_scales: dict[str, Scale] = ...

    extra_y_scales: dict[str, Scale] = ...

    hidpi: bool = ...

    title: Title | None = ...

    title_location: Location | None = ...

    #outline_props: Include(ScalarLineProps, prefix="outline")

    renderers: list[Renderer] = ...

    toolbar: Toolbar = ...

    toolbar_location: Location | None = ...

    toolbar_sticky: bool = ...

    toolbar_inner: bool = ...

    left: list[Renderer] = ...

    right: list[Renderer] = ...

    above: list[Renderer] = ...

    below: list[Renderer] = ...

    center: list[Renderer] = ...

    width: int | None = ...

    height: int | None = ...

    frame_width: int | None = ...

    frame_height: int | None = ...

    frame_align: bool | LRTB[bool] = ...

    inner_width: Readonly[int] = ...

    inner_height: Readonly[int] = ...

    outer_width: Readonly[int] = ...

    outer_height: Readonly[int] = ...

    #background_props: Include(ScalarFillProps, prefix="background")

    #border_props: Include(ScalarFillProps, prefix="border")

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

    #def select(self, *args, **kwargs):

    #def row(self, row, gridplot):

    #def column(self, col, gridplot):

    #@property
    #def xaxis(self):

    #@property
    #def yaxis(self):

    #@property
    #def axis(self):

    #@property
    #def legend(self):

    #@property
    #def hover(self):

    #def _grid(self, dimension: Literal[0, 1]):

    #@property
    #def xgrid(self):

    #@property
    #def ygrid(self):

    #@property
    #def grid(self):

    #@property
    #def tools(self) -> list[Tool]:

    #@tools.setter
    #def tools(self, tools: list[Tool]):

    #def add_layout(self, obj: Renderer, place: PlaceType = "center") -> None:

    #def add_tools(self, *tools: Tool | str) -> None:

    #def remove_tools(self, *tools: Tool) -> None:

    #@overload
    #def add_glyph(self, glyph: Glyph, **kwargs: Any) -> GlyphRenderer: ...
    #@overload
    #def add_glyph(self, source: ColumnarDataSource, glyph: Glyph, **kwargs: Any) -> GlyphRenderer: ...

    #def add_glyph(self, source_or_glyph: Glyph | ColumnarDataSource, glyph: Glyph | None = None, **kwargs: Any) -> GlyphRenderer:

    #def add_tile(self, tile_source: TileSource | xyzservices.TileProvider | str, retina: bool = False, **kwargs: Any) -> TileRenderer:

    #@contextmanager
    #def hold(self, *, render: bool) -> Generator[None, None, None]:

@dataclass
class GridPlot(LayoutDOM, GridCommon):

    toolbar: Toolbar = ...

    toolbar_location: Location | None = ...

    children: list[tuple[LayoutDOM, int, int] | tuple[LayoutDOM, int, int, int, int]] = ...
