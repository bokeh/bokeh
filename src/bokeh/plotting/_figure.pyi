#-----------------------------------------------------------------------------
# Copyright (c) Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------

# Standard library imports
from dataclasses import InitVar, dataclass
from typing import (
    TYPE_CHECKING,
    Any,
    Literal,
    Sequence,
    TypeAlias,
)

# External imports
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
    VArea,
    VBar,
)
from ..models.graphs import LayoutProvider
from ..models.plots import Plot
from ..models.ranges import Range
from ..models.renderers import ContourRenderer, GlyphRenderer, GraphRenderer
from ..models.scales import Scale
from ..models.sources import ColumnDataSource
from ..models.tools import (
    Drag,
    GestureTool,
    InspectTool,
    Scroll,
    Tap,
    Tool,
)
from .glyph_api import GlyphAPI

EagerDataFrame: TypeAlias = IntoDataFrame
EagerSeries: TypeAlias = IntoSeries

@dataclass(init=False)
class BaseFigureOptions:

    tools: InitVar[str | Sequence[str | Tool]] = ...

    x_minor_ticks: InitVar[Auto | int] = ...

    y_minor_ticks: InitVar[Auto | int] = ...

    x_axis_location: InitVar[VerticalLocation | None] = ...

    y_axis_location: InitVar[HorizontalLocation | None] = ...

    x_axis_label: InitVar[TextLike | None] = ...

    y_axis_label: InitVar[TextLike | None] = ...

    active_drag: InitVar[Auto | str | Drag | None] = ...

    active_inspect: InitVar[Auto | str | InspectTool | Sequence[InspectTool] | None] = ...

    active_scroll: InitVar[Auto | str | Scroll | None] = ...

    active_tap: InitVar[Auto | str | Tap | None] = ...

    active_multi: InitVar[Auto | str | GestureTool | None] = ...

    tooltips: InitVar[Template | str | list[tuple[str, str]] | None] = ...

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

@dataclass(init=False)
class FigureOptions(BaseFigureOptions):

    x_range: InitVar[RangeLike] = ...

    y_range: InitVar[RangeLike] = ...

    x_axis_type: InitVar[AxisType] = ...

    y_axis_type: InitVar[AxisType] = ...

@dataclass
class figure(Plot, GlyphAPI, FigureOptions):

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

def markers() -> None: ...
