#-----------------------------------------------------------------------------
# Copyright (c) Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------

# Standard library imports
from abc import abstractmethod
from typing import (
    Any,
    Callable,
    ClassVar,
    Literal,
    NotRequired,
    Sequence,
    TypedDict,
    Unpack,
)

# Bokeh imports
from .._types import (
    Alpha,
    Color,
    Date,
    Datetime,
    NonNegative,
    Percent,
)
from ..core.enums import (
    AnchorType as Anchor,
    AutoType as Auto,
    DimensionsType as Dimensions,
    DimensionType as Dimension,
    PanDirectionType as PanDirection,
    RegionSelectionModeType as RegionSelectionMode,
    SelectionModeType as SelectionMode,
    SortDirectionType as SortDirection,
    ToolNameType as ToolName,
    TooltipAttachmentType as TooltipAttachment,
    TooltipFieldFormatterType as TooltipFieldFormatter,
)
from ..core.property_aliases import IconLikeType as IconLike
from ..model.model import Model, ModelInit
from .annotations import BoxAnnotation, PolyAnnotation, Span
from .callbacks import Callback, CustomJS
from .dom import DOMElement
from .glyph import XYGlyph
from .glyphs import (
    HStrip,
    Line,
    LRTBGlyph,
    MultiLine,
    Patches,
    Rect,
    VStrip,
)
from .misc.group_by import GroupBy
from .ranges import Range
from .renderers import DataRenderer, GlyphRenderer
from .ui.menus import Menu, MenuInit
from .ui.ui_element import UIElement, UIElementInit

class Modifiers(TypedDict):
    shift: NotRequired[bool]
    ctrl: NotRequired[bool]
    alt: NotRequired[bool]

class ToolInit(ModelInit, total=False):
    icon: IconLike | None
    description: str | None
    visible: bool
    group: str | bool

class Tool(Model):
    @abstractmethod
    def __init__(self, **kwargs: Unpack[ToolInit]) -> None: ...

    icon: IconLike | None = ...
    description: str | None = ...
    visible: bool = ...
    group: str | bool = ...

    _known_aliases: ClassVar[dict[str, Callable[[], Tool]]]

    @classmethod
    def from_string(cls, name: str) -> Tool: ...
    @classmethod
    def register_alias(cls, name: str, constructor: Callable[[], Tool]) -> None: ...

class ToolProxyInit(ModelInit, total=False):
    tools: list[Tool]
    active: bool
    disabled: bool

class ToolProxy(Model):
    def __init__(self, **kwargs: Unpack[ToolProxyInit]) -> None: ...

    tools: list[Tool] = ...
    active: bool = ...
    disabled: bool = ...

class ActionToolInit(ToolInit, total=False):
    ...

class ActionTool(Tool):
    @abstractmethod
    def __init__(self, **kwargs: Unpack[ActionToolInit]) -> None: ...

class PlotActionToolInit(ActionToolInit, total=False):
    ...

class PlotActionTool(ActionTool):
    @abstractmethod
    def __init__(self, **kwargs: Unpack[PlotActionToolInit]) -> None: ...

class GestureToolInit(ToolInit, total=False):
    ...

class GestureTool(Tool):
    @abstractmethod
    def __init__(self, **kwargs: Unpack[GestureToolInit]) -> None: ...

class DragInit(GestureToolInit, total=False):
    ...

class Drag(GestureTool):
    @abstractmethod
    def __init__(self, **kwargs: Unpack[DragInit]) -> None: ...

class ScrollInit(GestureToolInit, total=False):
    ...

class Scroll(GestureTool):
    @abstractmethod
    def __init__(self, **kwargs: Unpack[ScrollInit]) -> None: ...

class TapInit(GestureToolInit, total=False):
    ...

class Tap(GestureTool):
    @abstractmethod
    def __init__(self, **kwargs: Unpack[TapInit]) -> None: ...

class SelectToolInit(GestureToolInit, total=False):
    renderers: Auto | list[DataRenderer]

class SelectTool(GestureTool):
    @abstractmethod
    def __init__(self, **kwargs: Unpack[SelectToolInit]) -> None: ...

    renderers: Auto | list[DataRenderer] = ...

class RegionSelectToolInit(SelectToolInit, total=False):
    mode: RegionSelectionMode
    continuous: bool
    select_every_mousemove: bool
    persistent: bool
    greedy: bool

class RegionSelectTool(SelectTool):
    @abstractmethod
    def __init__(self, **kwargs: Unpack[RegionSelectToolInit]) -> None: ...

    mode: RegionSelectionMode = ...
    continuous: bool = ...
    select_every_mousemove: bool = ...
    persistent: bool = ...
    greedy: bool = ...

class InspectToolInit(GestureToolInit, total=False):
    toggleable: bool

class InspectTool(GestureTool):
    @abstractmethod
    def __init__(self, **kwargs: Unpack[InspectToolInit]) -> None: ...

    toggleable: bool = ...

class ToolbarInit(UIElementInit, total=False):
    tools: list[Tool | ToolProxy]
    logo: Literal["normal", "grey"] | None
    autohide: bool
    group: bool
    group_types: list[ToolName]
    active_drag: Auto | Drag | ToolProxy | None
    active_inspect: Auto | InspectTool | ToolProxy | Sequence[InspectTool] | None
    active_scroll: Auto | Scroll | ToolProxy | None
    active_tap: Auto | Tap | ToolProxy | None
    active_multi: Auto | GestureTool | ToolProxy | None

class Toolbar(UIElement):
    def __init__(self, **kwargs: Unpack[ToolbarInit]) -> None: ...

    tools: list[Tool | ToolProxy] = ...
    logo: Literal["normal", "grey"] | None = ...
    autohide: bool = ...
    group: bool = ...
    group_types: list[ToolName] = ...
    active_drag: Auto | Drag | ToolProxy | None = ...
    active_inspect: Auto | InspectTool | ToolProxy | Sequence[InspectTool] | None = ...
    active_scroll: Auto | Scroll | ToolProxy | None = ...
    active_tap: Auto | Tap | ToolProxy | None = ...
    active_multi: Auto | GestureTool | ToolProxy | None = ...

class ToolMenuInit(MenuInit, total=False):
    toolbar: Toolbar

class ToolMenu(Menu):
    def __init__(self, **kwargs: Unpack[ToolMenuInit]) -> None: ...

    toolbar: Toolbar = ...

class PanToolInit(DragInit, total=False):
    dimensions: Dimensions

class PanTool(Drag):
    def __init__(self, **kwargs: Unpack[PanToolInit]) -> None: ...

    dimensions: Dimensions = ...

class ClickPanToolInit(PlotActionToolInit, total=False):
    direction: PanDirection
    factor: Percent

class ClickPanTool(PlotActionTool):
    def __init__(self, **kwargs: Unpack[ClickPanToolInit]) -> None: ...

    direction: PanDirection = ...
    factor: Percent = ...

class RangeToolInit(ToolInit, total=False):
    x_range: Range | None
    y_range: Range | None
    x_interaction: bool
    y_interaction: bool
    overlay: BoxAnnotation
    start_gesture: Literal["pan", "tap", "none"]

class RangeTool(Tool):
    def __init__(self, **kwargs: Unpack[RangeToolInit]) -> None: ...

    x_range: Range | None = ...
    y_range: Range | None = ...
    x_interaction: bool = ...
    y_interaction: bool = ...
    overlay: BoxAnnotation = ...
    start_gesture: Literal["pan", "tap", "none"] = ...

class WheelPanToolInit(ScrollInit, total=False):
    dimension: Dimension
    modifiers: Modifiers | str

class WheelPanTool(Scroll):
    def __init__(self, **kwargs: Unpack[WheelPanToolInit]) -> None: ...

    dimension: Dimension = ...

    @property
    def modifiers(self) -> Modifiers: ...
    @modifiers.setter
    def modifiers(self, modifiers: Modifiers | str) -> None: ...

class WheelZoomToolInit(ScrollInit, total=False):
    dimensions: Dimensions
    renderers: Auto | list[DataRenderer]
    level: NonNegative[int]
    hit_test: bool
    hit_test_mode: Literal["point", "hline", "vline"]
    hit_test_behavior: GroupBy | Literal["only_hit", "group_by_name"] | list[list[DataRenderer]]
    maintain_focus: bool
    zoom_on_axis: bool
    zoom_together: Literal["none", "cross", "all"]
    speed: float
    modifiers: Modifiers | str

class WheelZoomTool(Scroll):
    def __init__(self, **kwargs: Unpack[WheelZoomToolInit]) -> None: ...

    dimensions: Dimensions = ...
    renderers: Auto | list[DataRenderer] = ...
    level: NonNegative[int] = ...
    hit_test: bool = ...
    hit_test_mode: Literal["point", "hline", "vline"] = ...

    @property
    def hit_test_behavior(self) -> GroupBy | Literal["only_hit"]: ...
    @hit_test_behavior.setter
    def hit_test_behavior(self, hit_test_behavior: GroupBy | Literal["only_hit", "group_by_name"] | list[list[DataRenderer]]) -> None: ...

    maintain_focus: bool = ...
    zoom_on_axis: bool = ...
    zoom_together: Literal["none", "cross", "all"] = ...
    speed: float = ...

    @property
    def modifiers(self) -> Modifiers: ...
    @modifiers.setter
    def modifiers(self, modifiers: Modifiers | str) -> None: ...

class CustomActionInit(ActionToolInit, total=False):
    active: bool
    disabled: bool
    callback: Callback | None
    active_callback: Callback | Auto | None

class CustomAction(ActionTool):
    def __init__(self, **kwargs: Unpack[CustomActionInit]) -> None: ...

    active: bool = ...
    disabled: bool = ...
    callback: Callback | None = ...
    active_callback: Callback | Auto | None = ...

class SaveToolInit(ActionToolInit, total=False):
    filename: str | None

class SaveTool(ActionTool):
    def __init__(self, **kwargs: Unpack[SaveToolInit]) -> None: ...

    filename: str | None = ...

class CopyToolInit(ActionToolInit, total=False):
    ...

class CopyTool(ActionTool):
    def __init__(self, **kwargs: Unpack[CopyToolInit]) -> None: ...

class ResetToolInit(PlotActionToolInit, total=False):
    ...

class ResetTool(PlotActionTool):
    def __init__(self, **kwargs: Unpack[ResetToolInit]) -> None: ...

class TapToolInit(TapInit, SelectToolInit, total=False):
    mode: SelectionMode
    behavior: Literal["select", "inspect"]
    gesture: Literal["tap", "doubletap"]
    modifiers: Modifiers | str
    callback: Callback | None

class TapTool(Tap, SelectTool):
    def __init__(self, **kwargs: Unpack[TapToolInit]) -> None: ...

    mode: SelectionMode = ...
    behavior: Literal["select", "inspect"] = ...
    gesture: Literal["tap", "doubletap"] = ...
    modifiers: Modifiers | str = ...
    callback: Callback | None = ...

class CrosshairToolInit(InspectToolInit, total=False):
    overlay: Auto | Span | tuple[Span, Span]
    dimensions: Dimensions
    line_color: Color
    line_alpha: Alpha
    line_width: float

class CrosshairTool(InspectTool):
    def __init__(self, **kwargs: Unpack[CrosshairToolInit]) -> None: ...

    overlay: Auto | Span | tuple[Span, Span] = ...
    dimensions: Dimensions = ...
    line_color: Color = ...
    line_alpha: Alpha = ...
    line_width: float = ...

class BoxZoomToolInit(DragInit, total=False):
    dimensions: Dimensions | Auto
    overlay: BoxAnnotation
    match_aspect: bool
    origin: Literal["corner", "center"]

class BoxZoomTool(Drag):
    def __init__(self, **kwargs: Unpack[BoxZoomToolInit]) -> None: ...

    dimensions: Dimensions | Auto = ...
    overlay: BoxAnnotation = ...
    match_aspect: bool = ...
    origin: Literal["corner", "center"] = ...

class ZoomBaseToolInit(PlotActionToolInit, total=False):
    renderers: Auto | list[DataRenderer]
    dimensions: Dimensions
    factor: Percent
    level: NonNegative[int]

class ZoomBaseTool(PlotActionTool):
    @abstractmethod
    def __init__(self, **kwargs: Unpack[ZoomBaseToolInit]) -> None: ...

    renderers: Auto | list[DataRenderer] = ...
    dimensions: Dimensions = ...
    factor: Percent = ...
    level: NonNegative[int] = ...

class ZoomInToolInit(ZoomBaseToolInit, total=False):
    ...

class ZoomInTool(ZoomBaseTool):
    def __init__(self, **kwargs: Unpack[ZoomInToolInit]) -> None: ...

class ZoomOutToolInit(ZoomBaseToolInit, total=False):
    maintain_focus: bool

class ZoomOutTool(ZoomBaseTool):
    def __init__(self, **kwargs: Unpack[ZoomOutToolInit]) -> None: ...

    maintain_focus: bool = ...

class BoxSelectToolInit(DragInit, RegionSelectToolInit, total=False):
    dimensions: Dimensions
    overlay: BoxAnnotation
    origin: Literal["corner", "center"]

class BoxSelectTool(Drag, RegionSelectTool):
    def __init__(self, **kwargs: Unpack[BoxSelectToolInit]) -> None: ...

    dimensions: Dimensions = ...
    overlay: BoxAnnotation = ...
    origin: Literal["corner", "center"] = ...

class LassoSelectToolInit(DragInit, RegionSelectToolInit, total=False):
    overlay: PolyAnnotation

class LassoSelectTool(Drag, RegionSelectTool):
    def __init__(self, **kwargs: Unpack[LassoSelectToolInit]) -> None: ...

    overlay: PolyAnnotation = ...

class PolySelectToolInit(TapInit, RegionSelectToolInit, total=False):
    overlay: PolyAnnotation

class PolySelectTool(Tap, RegionSelectTool):
    def __init__(self, **kwargs: Unpack[PolySelectToolInit]) -> None: ...

    overlay: PolyAnnotation = ...

class CustomJSHoverInit(ModelInit, total=False):
    args: dict[str, Any]
    code: str

class CustomJSHover(Model):
    def __init__(self, **kwargs: Unpack[CustomJSHoverInit]) -> None: ...

    args: dict[str, Any] = ...
    code: str = ...

class HoverToolInit(InspectToolInit, total=False):
    renderers: Auto | list[DataRenderer]
    callback: Callback | None
    tooltips: None | DOMElement | str | list[tuple[str, str]] | dict[str, str]
    formatters: dict[str, TooltipFieldFormatter | CustomJSHover]
    filters: dict[str, CustomJS | list[CustomJS]]
    sort_by: str | list[str | tuple[str, SortDirection | Literal[1, -1]]] | None
    limit: int | None
    mode: Literal["mouse", "hline", "vline"]
    muted_policy: Literal["show", "ignore"]
    point_policy: Literal["snap_to_data", "follow_mouse", "none"]
    line_policy: Literal["prev", "next", "nearest", "interp", "none"]
    anchor: Anchor
    attachment: TooltipAttachment
    show_arrow: bool

class HoverTool(InspectTool):
    def __init__(self, **kwargs: Unpack[HoverToolInit]) -> None: ...

    renderers: Auto | list[DataRenderer] = ...
    callback: Callback | None = ...
    tooltips: None | DOMElement | str | list[tuple[str, str]] | dict[str, str] = ...
    formatters: dict[str, TooltipFieldFormatter | CustomJSHover] = ...
    filters: dict[str, CustomJS | list[CustomJS]] = ...
    sort_by: str | list[str | tuple[str, SortDirection | Literal[1, -1]]] | None = ...
    limit: int | None = ...
    mode: Literal["mouse", "hline", "vline"] = ...
    muted_policy: Literal["show", "ignore"] = ...
    point_policy: Literal["snap_to_data", "follow_mouse", "none"] = ...
    line_policy: Literal["prev", "next", "nearest", "interp", "none"] = ...
    anchor: Anchor = ...
    attachment: TooltipAttachment = ...
    show_arrow: bool = ...

class HelpToolInit(ActionToolInit, total=False):
    redirect: str

class HelpTool(ActionTool):
    def __init__(self, **kwargs: Unpack[HelpToolInit]) -> None: ...

    redirect: str = ...

class ExamineToolInit(ActionToolInit, total=False):
    ...

class ExamineTool(ActionTool):
    def __init__(self, **kwargs: Unpack[ExamineToolInit]) -> None: ...

class FullscreenToolInit(ActionToolInit, total=False):
    ...

class FullscreenTool(ActionTool):
    def __init__(self, **kwargs: Unpack[FullscreenToolInit]) -> None: ...

class UndoToolInit(PlotActionToolInit, total=False):
    ...

class UndoTool(PlotActionTool):
    def __init__(self, **kwargs: Unpack[UndoToolInit]) -> None: ...

class RedoToolInit(PlotActionToolInit, total=False):
    ...

class RedoTool(PlotActionTool):
    def __init__(self, **kwargs: Unpack[RedoToolInit]) -> None: ...

class EditToolInit(GestureToolInit, total=False):
    default_overrides: dict[str, Any]
    empty_value: bool | int | float | Date | Datetime | Color | str

class EditTool(GestureTool):
    @abstractmethod
    def __init__(self, **kwargs: Unpack[EditToolInit]) -> None: ...

    default_overrides: dict[str, Any] = ...
    empty_value: bool | int | float | Date | Datetime | Color | str = ...

class PolyToolInit(EditToolInit, total=False):
    vertex_renderer: GlyphRenderer[XYGlyph] | None

class PolyTool(EditTool):
    @abstractmethod
    def __init__(self, **kwargs: Unpack[PolyToolInit]) -> None: ...

    vertex_renderer: GlyphRenderer[XYGlyph] | None = ...

class BoxEditToolInit(EditToolInit, DragInit, TapInit, total=False):
    renderers: list[GlyphRenderer[LRTBGlyph | Rect | HStrip | VStrip]]
    dimensions: Dimensions
    num_objects: int

class BoxEditTool(EditTool, Drag, Tap):
    def __init__(self, **kwargs: Unpack[BoxEditToolInit]) -> None: ...

    renderers: list[GlyphRenderer[LRTBGlyph | Rect | HStrip | VStrip]] = ...
    dimensions: Dimensions = ...
    num_objects: int = ...

class PointDrawToolInit(EditToolInit, DragInit, TapInit, total=False):
    renderers: list[GlyphRenderer[XYGlyph]]
    add: bool
    drag: bool
    num_objects: int

class PointDrawTool(EditTool, Drag, Tap):
    def __init__(self, **kwargs: Unpack[PointDrawToolInit]) -> None: ...

    renderers: list[GlyphRenderer[XYGlyph]] = ...
    add: bool = ...
    drag: bool = ...
    num_objects: int = ...

class PolyDrawToolInit(PolyToolInit, DragInit, TapInit, total=False):
    renderers: list[GlyphRenderer[MultiLine | Patches]]
    drag: bool
    num_objects: int

class PolyDrawTool(PolyTool, Drag, Tap):
    def __init__(self, **kwargs: Unpack[PolyDrawToolInit]) -> None: ...

    renderers: list[GlyphRenderer[MultiLine | Patches]] = ...
    drag: bool = ...
    num_objects: int = ...

class FreehandDrawToolInit(EditToolInit, DragInit, TapInit, total=False):
    renderers: list[GlyphRenderer[MultiLine | Patches]]
    num_objects: int

class FreehandDrawTool(EditTool, Drag, Tap):
    def __init__(self, **kwargs: Unpack[FreehandDrawToolInit]) -> None: ...

    renderers: list[GlyphRenderer[MultiLine | Patches]] = ...
    num_objects: int = ...

class PolyEditToolInit(PolyToolInit, DragInit, TapInit, total=False):
    renderers: list[GlyphRenderer[MultiLine | Patches]]

class PolyEditTool(PolyTool, Drag, Tap):
    def __init__(self, **kwargs: Unpack[PolyEditToolInit]) -> None: ...

    renderers: list[GlyphRenderer[MultiLine | Patches]] = ...

class LineEditToolInit(EditToolInit, DragInit, TapInit, total=False):
    renderers: list[GlyphRenderer[Line]]
    intersection_renderer: GlyphRenderer[Line]
    dimensions: Dimensions

class LineEditTool(EditTool, Drag, Tap):
    def __init__(self, **kwargs: Unpack[LineEditToolInit]) -> None: ...

    renderers: list[GlyphRenderer[Line]] = ...
    intersection_renderer: GlyphRenderer[Line] = ...
    dimensions: Dimensions = ...
