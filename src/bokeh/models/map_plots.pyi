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
from .._types import JSON, Bytes
from ..core.enums import MapTypeType as MapType
from ..model.model import Model
from .plots import Plot

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
from ..core.enums import LocationType as Location
from ..core.enums import OutputBackendType as OutputBackend
from ..core.enums import ResetPolicyType as ResetPolicy
from ..core.enums import SizingModeType as SizingMode
from ..core.enums import SizingPolicyType as SizingPolicy
from ..core.enums import WindowAxisType as WindowAxis
from ..core.property.visual import DashPatternType as DashPattern
from ..core.property_aliases import LRTB
from ..model.model import JSEventCallback
from .annotations import Title
from .css import StyleSheet
from .css import Styles
from .dom import DOMNode
from .dom import HTML
from .nodes import Node
from .ranges import Range
from .renderers import Renderer
from .scales import Scale
from .textures import Texture
from .tools import Toolbar
from .ui.menus import Menu
from .ui.ui_element import StyledElement
from .ui.ui_element import UIElement
from typing import Any
from typing import Sequence
from typing import TypedDict

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

class MapPlot(Plot):
    @abstractmethod
    def __init__(self, **kwargs: Unpack[_MapPlotInit]) -> None: ...

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
