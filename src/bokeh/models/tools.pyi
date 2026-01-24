#-----------------------------------------------------------------------------
# Copyright (c) Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------

# Standard library imports
from abc import abstractmethod
from typing import (
    TYPE_CHECKING,
    Any,
    Callable,
    ClassVar,
    Literal,
    Sequence,
    TypedDict,
)

if TYPE_CHECKING:
    from typing_extensions import NotRequired, Unpack

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
from ..model.model import Model, _ModelInit
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
from .ui.menus import Menu, _MenuInit
from .ui.ui_element import UIElement, _UIElementInit

class Modifiers(TypedDict):
    shift: NotRequired[bool]
    ctrl: NotRequired[bool]
    alt: NotRequired[bool]

class _ToolInit(_ModelInit, total=False):
    icon: IconLike | None
    description: str | None
    visible: bool
    group: str | bool

class Tool(Model):
    @abstractmethod
    def __init__(self, **kwargs: Unpack[_ToolInit]) -> None: ...

    icon: IconLike | None = ...
    description: str | None = ...
    visible: bool = ...
    group: str | bool = ...

    _known_aliases: ClassVar[dict[str, Callable[[], Tool]]]

    @classmethod
    def from_string(cls, name: str) -> Tool: ...
    @classmethod
    def register_alias(cls, name: str, constructor: Callable[[], Tool]) -> None: ...

class _ToolProxyInit(_ModelInit, total=False):
    tools: list[Tool]
    active: bool
    disabled: bool

class ToolProxy(Model):
    def __init__(self, **kwargs: Unpack[_ToolProxyInit]) -> None: ...

    tools: list[Tool] = ...
    active: bool = ...
    disabled: bool = ...

class _ActionToolInit(_ToolInit, total=False):
    ...

class ActionTool(Tool):
    @abstractmethod
    def __init__(self, **kwargs: Unpack[_ActionToolInit]) -> None: ...

class _PlotActionToolInit(_ActionToolInit, total=False):
    ...

class PlotActionTool(ActionTool):
    @abstractmethod
    def __init__(self, **kwargs: Unpack[_PlotActionToolInit]) -> None: ...

class _GestureToolInit(_ToolInit, total=False):
    ...

class GestureTool(Tool):
    @abstractmethod
    def __init__(self, **kwargs: Unpack[_GestureToolInit]) -> None: ...

class _DragInit(_GestureToolInit, total=False):
    ...

class Drag(GestureTool):
    @abstractmethod
    def __init__(self, **kwargs: Unpack[_DragInit]) -> None: ...

class _ScrollInit(_GestureToolInit, total=False):
    ...

class Scroll(GestureTool):
    @abstractmethod
    def __init__(self, **kwargs: Unpack[_ScrollInit]) -> None: ...

class _TapInit(_GestureToolInit, total=False):
    ...

class Tap(GestureTool):
    @abstractmethod
    def __init__(self, **kwargs: Unpack[_TapInit]) -> None: ...

class _SelectToolInit(_GestureToolInit, total=False):
    renderers: Auto | list[DataRenderer]

class SelectTool(GestureTool):
    @abstractmethod
    def __init__(self, **kwargs: Unpack[_SelectToolInit]) -> None: ...

    renderers: Auto | list[DataRenderer] = ...

class _RegionSelectToolInit(_SelectToolInit, total=False):
    mode: RegionSelectionMode
    continuous: bool
    select_every_mousemove: bool
    persistent: bool
    greedy: bool

class RegionSelectTool(SelectTool):
    @abstractmethod
    def __init__(self, **kwargs: Unpack[_RegionSelectToolInit]) -> None: ...

    mode: RegionSelectionMode = ...
    continuous: bool = ...
    select_every_mousemove: bool = ...
    persistent: bool = ...
    greedy: bool = ...

class _InspectToolInit(_GestureToolInit, total=False):
    toggleable: bool

class InspectTool(GestureTool):
    @abstractmethod
    def __init__(self, **kwargs: Unpack[_InspectToolInit]) -> None: ...

    toggleable: bool = ...

class _ToolbarInit(_UIElementInit, total=False):
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
    def __init__(self, **kwargs: Unpack[_ToolbarInit]) -> None: ...

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

class _ToolMenuInit(_MenuInit, total=False):
    toolbar: Toolbar

class ToolMenu(Menu):
    def __init__(self, **kwargs: Unpack[_ToolMenuInit]) -> None: ...

    toolbar: Toolbar = ...

class _PanToolInit(_DragInit, total=False):
    dimensions: Dimensions

class PanTool(Drag):
    def __init__(self, **kwargs: Unpack[_PanToolInit]) -> None: ...

    dimensions: Dimensions = ...

class _ClickPanToolInit(_PlotActionToolInit, total=False):
    direction: PanDirection
    factor: Percent

class ClickPanTool(PlotActionTool):
    def __init__(self, **kwargs: Unpack[_ClickPanToolInit]) -> None: ...

    direction: PanDirection = ...
    factor: Percent = ...

class _RangeToolInit(_ToolInit, total=False):
    x_range: Range | None
    y_range: Range | None
    x_interaction: bool
    y_interaction: bool
    overlay: BoxAnnotation
    start_gesture: Literal["pan", "tap", "none"]

class RangeTool(Tool):
    def __init__(self, **kwargs: Unpack[_RangeToolInit]) -> None: ...

    x_range: Range | None = ...
    y_range: Range | None = ...
    x_interaction: bool = ...
    y_interaction: bool = ...
    overlay: BoxAnnotation = ...
    start_gesture: Literal["pan", "tap", "none"] = ...

class _WheelPanToolInit(_ScrollInit, total=False):
    dimension: Dimension
    modifiers: Modifiers | str

class WheelPanTool(Scroll):
    def __init__(self, **kwargs: Unpack[_WheelPanToolInit]) -> None: ...

    dimension: Dimension = ...

    @property
    def modifiers(self) -> Modifiers: ...
    @modifiers.setter
    def modifiers(self, modifiers: Modifiers | str) -> None: ...

class _WheelZoomToolInit(_ScrollInit, total=False):
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
    def __init__(self, **kwargs: Unpack[_WheelZoomToolInit]) -> None: ...

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

class _CustomActionInit(_ActionToolInit, total=False):
    active: bool
    disabled: bool
    callback: Callback | None
    active_callback: Callback | Auto | None

class CustomAction(ActionTool):
    def __init__(self, **kwargs: Unpack[_CustomActionInit]) -> None: ...

    active: bool = ...
    disabled: bool = ...
    callback: Callback | None = ...
    active_callback: Callback | Auto | None = ...

class _SaveToolInit(_ActionToolInit, total=False):
    filename: str | None

class SaveTool(ActionTool):
    def __init__(self, **kwargs: Unpack[_SaveToolInit]) -> None: ...

    filename: str | None = ...

class _CopyToolInit(_ActionToolInit, total=False):
    ...

class CopyTool(ActionTool):
    def __init__(self, **kwargs: Unpack[_CopyToolInit]) -> None: ...

class _ResetToolInit(_PlotActionToolInit, total=False):
    ...

class ResetTool(PlotActionTool):
    def __init__(self, **kwargs: Unpack[_ResetToolInit]) -> None: ...

class _TapToolInit(_TapInit, _SelectToolInit, total=False):
    mode: SelectionMode
    behavior: Literal["select", "inspect"]
    gesture: Literal["tap", "doubletap"]
    modifiers: Modifiers | str
    callback: Callback | None

class TapTool(Tap, SelectTool):
    def __init__(self, **kwargs: Unpack[_TapToolInit]) -> None: ...

    mode: SelectionMode = ...
    behavior: Literal["select", "inspect"] = ...
    gesture: Literal["tap", "doubletap"] = ...
    modifiers: Modifiers | str = ...
    callback: Callback | None = ...

class _CrosshairToolInit(_InspectToolInit, total=False):
    overlay: Auto | Span | tuple[Span, Span]
    dimensions: Dimensions
    line_color: Color
    line_alpha: Alpha
    line_width: float

class CrosshairTool(InspectTool):
    def __init__(self, **kwargs: Unpack[_CrosshairToolInit]) -> None: ...

    overlay: Auto | Span | tuple[Span, Span] = ...
    dimensions: Dimensions = ...
    line_color: Color = ...
    line_alpha: Alpha = ...
    line_width: float = ...

class _BoxZoomToolInit(_DragInit, total=False):
    dimensions: Dimensions | Auto
    overlay: BoxAnnotation
    match_aspect: bool
    origin: Literal["corner", "center"]

class BoxZoomTool(Drag):
    def __init__(self, **kwargs: Unpack[_BoxZoomToolInit]) -> None: ...

    dimensions: Dimensions | Auto = ...
    overlay: BoxAnnotation = ...
    match_aspect: bool = ...
    origin: Literal["corner", "center"] = ...

class _ZoomBaseToolInit(_PlotActionToolInit, total=False):
    renderers: Auto | list[DataRenderer]
    dimensions: Dimensions
    factor: Percent
    level: NonNegative[int]

class ZoomBaseTool(PlotActionTool):
    @abstractmethod
    def __init__(self, **kwargs: Unpack[_ZoomBaseToolInit]) -> None: ...

    renderers: Auto | list[DataRenderer] = ...
    dimensions: Dimensions = ...
    factor: Percent = ...
    level: NonNegative[int] = ...

class _ZoomInToolInit(_ZoomBaseToolInit, total=False):
    ...

class ZoomInTool(ZoomBaseTool):
    def __init__(self, **kwargs: Unpack[_ZoomInToolInit]) -> None: ...

class _ZoomOutToolInit(_ZoomBaseToolInit, total=False):
    maintain_focus: bool

class ZoomOutTool(ZoomBaseTool):
    def __init__(self, **kwargs: Unpack[_ZoomOutToolInit]) -> None: ...

    maintain_focus: bool = ...

class _BoxSelectToolInit(_DragInit, _RegionSelectToolInit, total=False):
    dimensions: Dimensions
    overlay: BoxAnnotation
    origin: Literal["corner", "center"]

class BoxSelectTool(Drag, RegionSelectTool):
    def __init__(self, **kwargs: Unpack[_BoxSelectToolInit]) -> None: ...

    dimensions: Dimensions = ...
    overlay: BoxAnnotation = ...
    origin: Literal["corner", "center"] = ...

class _LassoSelectToolInit(_DragInit, _RegionSelectToolInit, total=False):
    overlay: PolyAnnotation

class LassoSelectTool(Drag, RegionSelectTool):
    def __init__(self, **kwargs: Unpack[_LassoSelectToolInit]) -> None: ...

    overlay: PolyAnnotation = ...

class _PolySelectToolInit(_TapInit, _RegionSelectToolInit, total=False):
    overlay: PolyAnnotation

class PolySelectTool(Tap, RegionSelectTool):
    def __init__(self, **kwargs: Unpack[_PolySelectToolInit]) -> None: ...

    overlay: PolyAnnotation = ...

class _CustomJSHoverInit(_ModelInit, total=False):
    args: dict[str, Any]
    code: str

class CustomJSHover(Model):
    def __init__(self, **kwargs: Unpack[_CustomJSHoverInit]) -> None: ...

    args: dict[str, Any] = ...
    code: str = ...

class _HoverToolInit(_InspectToolInit, total=False):
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
    def __init__(self, **kwargs: Unpack[_HoverToolInit]) -> None: ...

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

class _HelpToolInit(_ActionToolInit, total=False):
    redirect: str

class HelpTool(ActionTool):
    def __init__(self, **kwargs: Unpack[_HelpToolInit]) -> None: ...

    redirect: str = ...

class _ExamineToolInit(_ActionToolInit, total=False):
    ...

class ExamineTool(ActionTool):
    def __init__(self, **kwargs: Unpack[_ExamineToolInit]) -> None: ...

class _FullscreenToolInit(_ActionToolInit, total=False):
    ...

class FullscreenTool(ActionTool):
    def __init__(self, **kwargs: Unpack[_FullscreenToolInit]) -> None: ...

class _UndoToolInit(_PlotActionToolInit, total=False):
    ...

class UndoTool(PlotActionTool):
    def __init__(self, **kwargs: Unpack[_UndoToolInit]) -> None: ...

class _RedoToolInit(_PlotActionToolInit, total=False):
    ...

class RedoTool(PlotActionTool):
    def __init__(self, **kwargs: Unpack[_RedoToolInit]) -> None: ...

class _EditToolInit(_GestureToolInit, total=False):
    default_overrides: dict[str, Any]
    empty_value: bool | int | float | Date | Datetime | Color | str

class EditTool(GestureTool):
    @abstractmethod
    def __init__(self, **kwargs: Unpack[_EditToolInit]) -> None: ...

    default_overrides: dict[str, Any] = ...
    empty_value: bool | int | float | Date | Datetime | Color | str = ...

class _PolyToolInit(_EditToolInit, total=False):
    vertex_renderer: GlyphRenderer[XYGlyph] | None

class PolyTool(EditTool):
    @abstractmethod
    def __init__(self, **kwargs: Unpack[_PolyToolInit]) -> None: ...

    vertex_renderer: GlyphRenderer[XYGlyph] | None = ...

class _BoxEditToolInit(_EditToolInit, _DragInit, _TapInit, total=False):
    renderers: list[GlyphRenderer[LRTBGlyph | Rect | HStrip | VStrip]]
    dimensions: Dimensions
    num_objects: int

class BoxEditTool(EditTool, Drag, Tap):
    def __init__(self, **kwargs: Unpack[_BoxEditToolInit]) -> None: ...

    renderers: list[GlyphRenderer[LRTBGlyph | Rect | HStrip | VStrip]] = ...
    dimensions: Dimensions = ...
    num_objects: int = ...

class _PointDrawToolInit(_EditToolInit, _DragInit, _TapInit, total=False):
    renderers: list[GlyphRenderer[XYGlyph]]
    add: bool
    drag: bool
    num_objects: int

class PointDrawTool(EditTool, Drag, Tap):
    def __init__(self, **kwargs: Unpack[_PointDrawToolInit]) -> None: ...

    renderers: list[GlyphRenderer[XYGlyph]] = ...
    add: bool = ...
    drag: bool = ...
    num_objects: int = ...

class _PolyDrawToolInit(_PolyToolInit, _DragInit, _TapInit, total=False):
    renderers: list[GlyphRenderer[MultiLine | Patches]]
    drag: bool
    num_objects: int

class PolyDrawTool(PolyTool, Drag, Tap):
    def __init__(self, **kwargs: Unpack[_PolyDrawToolInit]) -> None: ...

    renderers: list[GlyphRenderer[MultiLine | Patches]] = ...
    drag: bool = ...
    num_objects: int = ...

class _FreehandDrawToolInit(_EditToolInit, _DragInit, _TapInit, total=False):
    renderers: list[GlyphRenderer[MultiLine | Patches]]
    num_objects: int

class FreehandDrawTool(EditTool, Drag, Tap):
    def __init__(self, **kwargs: Unpack[_FreehandDrawToolInit]) -> None: ...

    renderers: list[GlyphRenderer[MultiLine | Patches]] = ...
    num_objects: int = ...

class _PolyEditToolInit(_PolyToolInit, _DragInit, _TapInit, total=False):
    renderers: list[GlyphRenderer[MultiLine | Patches]]

class PolyEditTool(PolyTool, Drag, Tap):
    def __init__(self, **kwargs: Unpack[_PolyEditToolInit]) -> None: ...

    renderers: list[GlyphRenderer[MultiLine | Patches]] = ...

class _LineEditToolInit(_EditToolInit, _DragInit, _TapInit, total=False):
    renderers: list[GlyphRenderer[Line]]
    intersection_renderer: GlyphRenderer[Line]
    dimensions: Dimensions

class LineEditTool(EditTool, Drag, Tap):
    def __init__(self, **kwargs: Unpack[_LineEditToolInit]) -> None: ...

    renderers: list[GlyphRenderer[Line]] = ...
    intersection_renderer: GlyphRenderer[Line] = ...
    dimensions: Dimensions = ...
