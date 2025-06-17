#-----------------------------------------------------------------------------
# Copyright (c) Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------

# Standard library imports
from dataclasses import dataclass
from typing import (
    Any,
    Callable,
    ClassVar,
    Literal,
    NotRequired,
    Sequence,
    TypedDict,
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
from ..core.has_props import abstract
from ..core.property_aliases import IconLikeType as IconLike
from ..model import Model
from .annotations import BoxAnnotation, PolyAnnotation, Span
from .callbacks import Callback, CustomJS
from .dom import DOMElement
from .glyphs import (
    HStrip,
    Line,
    LRTBGlyph,
    MultiLine,
    Patches,
    Rect,
    VStrip,
    XYGlyph,
)
from .misc.group_by import GroupBy
from .ranges import Range
from .renderers import DataRenderer, GlyphRenderer
from .ui import Menu, UIElement

class Modifiers(TypedDict):
    shift: NotRequired[bool]
    ctrl: NotRequired[bool]
    alt: NotRequired[bool]

@abstract
@dataclass(init=False)
class Tool(Model):

    icon: IconLike | None = ...

    description: str | None = ...

    visible: bool = ...

    group: str | bool = ...

    _known_aliases: ClassVar[dict[str, Callable[[], Tool]]]

    @classmethod
    def from_string(cls, name: str) -> Tool: ...

    @classmethod
    def register_alias(cls, name: str, constructor: Callable[[], Tool]) -> None: ...

@dataclass
class ToolProxy(Model):

    tools: list[Tool] = ...

    active: bool = ...

    disabled: bool = ...

@abstract
@dataclass(init=False)
class ActionTool(Tool):
    ...

@abstract
@dataclass(init=False)
class PlotActionTool(ActionTool):
    ...

@abstract
@dataclass(init=False)
class GestureTool(Tool):
    ...

@abstract
@dataclass(init=False)
class Drag(GestureTool):
    ...

@abstract
@dataclass(init=False)
class Scroll(GestureTool):
    ...

@abstract
@dataclass(init=False)
class Tap(GestureTool):
    ...

@abstract
@dataclass(init=False)
class SelectTool(GestureTool):

    renderers: Auto | list[DataRenderer] = ...

@abstract
@dataclass(init=False)
class RegionSelectTool(SelectTool):

    mode: RegionSelectionMode = ...

    continuous: bool = ...

    select_every_mousemove: bool = ...

    persistent: bool = ...

    greedy: bool = ...

@abstract
@dataclass(init=False)
class InspectTool(GestureTool):

    toggleable: bool = ...

@dataclass
class Toolbar(UIElement):

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

@dataclass
class ToolMenu(Menu):

    toolbar: Toolbar = ...

@dataclass
class PanTool(Drag):

    dimensions: Dimensions = ...

@dataclass
class ClickPanTool(PlotActionTool):

    direction: PanDirection = ...

    factor: Percent = ...

@dataclass
class RangeTool(Tool):

    x_range: Range | None = ...

    y_range: Range | None = ...

    x_interaction: bool = ...

    y_interaction: bool = ...

    overlay: BoxAnnotation = ...

    start_gesture: Literal["pan", "tap", "none"] = ...

@dataclass
class WheelPanTool(Scroll):

    dimension: Dimension = ...

    modifiers: Modifiers | str = ...

@dataclass
class WheelZoomTool(Scroll):

    dimensions: Dimensions = ...

    renderers: Auto | list[DataRenderer] = ...

    level: NonNegative[int] = ...

    hit_test: bool = ...

    hit_test_mode: Literal["point", "hline", "vline"] = ...

    hit_test_behavior: GroupBy | Literal["only_hit", "group_by_name"] | list[list[DataRenderer]] = ...

    maintain_focus: bool = ...

    zoom_on_axis: bool = ...

    zoom_together: Literal["none", "cross", "all"] = ...

    speed: float = ...

    modifiers: Modifiers | str = ...

@dataclass
class CustomAction(ActionTool):

    active: bool = ...

    disabled: bool = ...

    callback: Callback | None = ...

    active_callback: Callback | Auto | None = ...

@dataclass
class SaveTool(ActionTool):

    filename: str | None = ...

@dataclass
class CopyTool(ActionTool):
    ...

@dataclass
class ResetTool(PlotActionTool):
    ...

@dataclass
class TapTool(Tap, SelectTool):

    mode: SelectionMode = ...

    behavior: Literal["select", "inspect"] = ...

    gesture: Literal["tap", "doubletap"] = ...

    modifiers: Modifiers | str = ...

    callback: Callback | None = ...

@dataclass
class CrosshairTool(InspectTool):

    overlay: Auto | Span | tuple[Span, Span] = ...

    dimensions: Dimensions = ...

    line_color: Color = ...

    line_alpha: Alpha = ...

    line_width: float = ...

@dataclass
class BoxZoomTool(Drag):

    dimensions: Dimensions | Auto = ...

    overlay: BoxAnnotation = ...

    match_aspect: bool = ...

    origin: Literal["corner", "center"] = ...

@abstract
@dataclass(init=False)
class ZoomBaseTool(PlotActionTool):

    renderers: Auto | list[DataRenderer] = ...

    dimensions: Dimensions = ...

    factor: Percent = ...

    level: NonNegative[int] = ...

@dataclass
class ZoomInTool(ZoomBaseTool):
    ...

@dataclass
class ZoomOutTool(ZoomBaseTool):

    maintain_focus: bool = ...

@dataclass
class BoxSelectTool(Drag, RegionSelectTool):

    dimensions: Dimensions = ...

    overlay: BoxAnnotation = ...

    origin: Literal["corner", "center"] = ...

@dataclass
class LassoSelectTool(Drag, RegionSelectTool):

    overlay: PolyAnnotation = ...

@dataclass
class PolySelectTool(Tap, RegionSelectTool):

    overlay: PolyAnnotation = ...

@dataclass
class CustomJSHover(Model):

    args: dict[str, Any] = ...

    code: str = ...

@dataclass
class HoverTool(InspectTool):

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

@dataclass
class HelpTool(ActionTool):

    redirect: str = ...

@dataclass
class ExamineTool(ActionTool):
    ...

@dataclass
class FullscreenTool(ActionTool):
    ...

@dataclass
class UndoTool(PlotActionTool):
    ...

@dataclass
class RedoTool(PlotActionTool):
    ...

@abstract
@dataclass(init=False)
class EditTool(GestureTool):

    default_overrides: dict[str, Any] = ...

    empty_value: bool | int | float | Date | Datetime | Color | str = ...

@abstract
@dataclass(init=False)
class PolyTool(EditTool):

    vertex_renderer: GlyphRenderer[XYGlyph] | None = ...

@dataclass
class BoxEditTool(EditTool, Drag, Tap):

    renderers: list[GlyphRenderer[LRTBGlyph | Rect | HStrip | VStrip]] = ...

    dimensions: Dimensions = ...

    num_objects: int = ...

@dataclass
class PointDrawTool(EditTool, Drag, Tap):

    renderers: list[GlyphRenderer[XYGlyph]] = ...

    add: bool = ...

    drag: bool = ...

    num_objects: int = ...

@dataclass
class PolyDrawTool(PolyTool, Drag, Tap):

    renderers: list[GlyphRenderer[MultiLine | Patches]] = ...

    drag: bool = ...

    num_objects: int = ...

@dataclass
class FreehandDrawTool(EditTool, Drag, Tap):

    renderers: list[GlyphRenderer[MultiLine | Patches]] = ...

    num_objects: int = ...

@dataclass
class PolyEditTool(PolyTool, Drag, Tap):

    renderers: list[GlyphRenderer[MultiLine | Patches]] = ...

@dataclass
class LineEditTool(EditTool, Drag, Tap):

    renderers: list[GlyphRenderer[Line]] = ...

    intersection_renderer: GlyphRenderer[Line] = ...

    dimensions: Dimensions = ...
