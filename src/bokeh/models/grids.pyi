#-----------------------------------------------------------------------------
# Copyright (c) Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------

# Standard library imports
from typing import Any, Literal, Sequence, TypedDict, TYPE_CHECKING

if TYPE_CHECKING:
    from typing_extensions import Unpack

# Bokeh imports
from ..core.enums import AutoType as Auto
from ..core.property_mixins import (
    ScalarBandFillProps,
    ScalarBandHatchProps,
    ScalarGridLineProps,
    ScalarMinorGridLineProps,
)
from .axes import Axis
from .renderers.renderer import (
    GuideRenderer,
    RenderLevelType as RenderLevel,
    _GuideRendererInit,
)
from .tickers import Ticker
from ..model.model import JSEventCallback
from ..plotting.glyph_api import CoordinateMapping
from .dom import RendererGroup
from .ui.ui_element import (Menu, Node, StyleSheet, Styles)

# class _GridInit(_GuideRendererInit, total=False):
#     dimension: Literal[0, 1]
#     bounds: Auto | tuple[float, float]
#     cross_bounds: Auto | tuple[float, float]
#     axis: Axis | None
#     ticker: Ticker | Sequence[float] | None

class _GridInit(TypedDict, total=False):
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
    dimension: Literal[0, 1]
    bounds: Auto | tuple[float, float]
    cross_bounds: Auto | tuple[float, float]
    axis: Axis | None
    ticker: Ticker | Sequence[float] | None

class Grid(GuideRenderer, ScalarGridLineProps, ScalarMinorGridLineProps, ScalarBandFillProps, ScalarBandHatchProps):
    def __init__(self, **kwargs: Unpack[_GridInit]) -> None: ...

    dimension: Literal[0, 1] = ...
    bounds: Auto | tuple[float, float] = ...
    cross_bounds: Auto | tuple[float, float] = ...
    axis: Axis | None = ...

    @property
    def ticker(self) -> Ticker | None: ...
    @ticker.setter
    def ticker(self, ticker: Ticker | Sequence[float] | None) -> None: ...
