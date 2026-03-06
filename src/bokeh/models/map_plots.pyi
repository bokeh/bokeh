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
from .._types import JSON, Bytes
from ..core.enums import MapTypeType as MapType
from ..model.model import JSEventCallback, Model, _ModelInit
from .plots import (
    LRTB,
    OutputBackendType as OutputBackend,
    Plot,
    ResetPolicyType as ResetPolicy,
    Title,
    Toolbar,
    WindowAxisType as WindowAxis,
    _PlotInit,
)
from ..plotting._figure import (AutoType as Auto, Range, Scale)
from ..plotting.glyph_api import NonNegative
from .layouts import (AlignType as Align, FlowModeType as FlowMode, SizingModeType as SizingMode, SizingPolicyType as SizingPolicy)
from .renderers.renderer import StyledElement
from .renderers.tile_renderer import Renderer
from .tools import DimensionsType as Dimensions
from .ui.floating import LocationType as Location
from .ui.tooltips import UIElement
from .ui.ui_element import (Menu, Node, StyleSheet, Styles)
from .widgets.buttons import DOMNode
from .widgets.inputs import HTML

# class _MapOptionsInit(_ModelInit, total=False):
#     lat: float
#     lng: float
#     zoom: int

class _MapOptionsInit(TypedDict, total=False):
    name: str | None
    tags: list[Any]
    js_event_callbacks: dict[str, list[JSEventCallback]]
    js_property_callbacks: dict[str, list[JSEventCallback]]
    subscribed_events: set[str]
    syncable: bool
    lat: float
    lng: float
    zoom: int

class MapOptions(Model):
    @abstractmethod
    def __init__(self, **kwargs: Unpack[_MapOptionsInit]) -> None: ...

    lat: float = ...
    lng: float = ...
    zoom: int = ...

# class _MapPlotInit(_PlotInit, total=False):
#     ...

class _MapPlotInit(TypedDict, total=False):
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

class MapPlot(Plot):
    @abstractmethod
    def __init__(self, **kwargs: Unpack[_MapPlotInit]) -> None: ...

# class _GMapOptionsInit(_MapOptionsInit, total=False):
#     map_type: MapType
#     scale_control: bool
#     styles: JSON | None
#     tilt: int

class _GMapOptionsInit(TypedDict, total=False):
    name: str | None
    tags: list[Any]
    js_event_callbacks: dict[str, list[JSEventCallback]]
    js_property_callbacks: dict[str, list[JSEventCallback]]
    subscribed_events: set[str]
    syncable: bool
    lat: float
    lng: float
    zoom: int
    map_type: MapType
    scale_control: bool
    styles: JSON | None
    tilt: int

class GMapOptions(MapOptions):
    def __init__(self, **kwargs: Unpack[_GMapOptionsInit]) -> None: ...

    map_type: MapType = ...
    scale_control: bool = ...
    styles: JSON | None = ...
    tilt: int = ...

# class _GMapPlotInit(_MapPlotInit, total=False):
#     map_options: GMapOptions
#     api_key: Bytes | str
#     api_version: str

class _GMapPlotInit(TypedDict, total=False):
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
    map_options: GMapOptions
    api_key: Bytes | str
    api_version: str

class GMapPlot(MapPlot):
    def __init__(self, **kwargs: Unpack[_GMapPlotInit]) -> None: ...

    map_options: GMapOptions = ...

    @property
    def api_key(self) -> Bytes: ...
    @api_key.setter
    def api_key(self, api_key: Bytes | str) -> None: ...

    api_version: str = ...
