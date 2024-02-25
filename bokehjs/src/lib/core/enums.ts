import {Enum} from "./kinds"

export const Align = Enum("start", "center", "end")
export type Align = typeof Align["__type__"]

export const HAlign = Enum("left", "center", "right")
export type HAlign = typeof HAlign["__type__"]

export const VAlign = Enum("top", "center", "bottom")
export type VAlign = typeof VAlign["__type__"]

export const Anchor = Enum(
  "top_left",    "top_center",    "top_right",
  "center_left", "center_center", "center_right",
  "bottom_left", "bottom_center", "bottom_right",
  "top", "left", "center", "right", "bottom",
)
export type Anchor = typeof Anchor["__type__"]

export const AngleUnits = Enum("deg", "rad", "grad", "turn")
export type AngleUnits = typeof AngleUnits["__type__"]

export const AlternationPolicy = Enum("none", "even", "odd", "every")
export type AlternationPolicy = typeof AlternationPolicy["__type__"]

export const BoxOrigin = Enum("corner", "center")
export type BoxOrigin = typeof BoxOrigin["__type__"]

export const ButtonType = Enum("default", "primary", "success", "warning", "danger", "light")
export type ButtonType = typeof ButtonType["__type__"]

export const CalendarPosition = Enum("auto", "above", "below")
export type CalendarPosition = typeof CalendarPosition["__type__"]

export const Clock = Enum("12h", "24h")
export type Clock = typeof Clock["__type__"]

export const CoordinateUnits = Enum("canvas", "screen", "data")
export type CoordinateUnits = typeof CoordinateUnits["__type__"]

export const ContextWhich = Enum("start", "center", "end", "all")
export type ContextWhich = typeof ContextWhich["__type__"]

export const Dimension = Enum("width", "height")
export type Dimension = typeof Dimension["__type__"]

export const Dimensions = Enum("width", "height", "both")
export type Dimensions = typeof Dimensions["__type__"]

export const Direction = Enum("clock", "anticlock")
export type Direction = typeof Direction["__type__"]

export const Distribution = Enum("uniform", "normal")
export type Distribution = typeof Distribution["__type__"]

export const Face = Enum("front", "back")
export type Face = typeof Face["__type__"]

export const FlowMode = Enum("block", "inline")
export type FlowMode = typeof FlowMode["__type__"]

export const FontStyle = Enum("normal", "italic", "bold", "bold italic")
export type FontStyle = typeof FontStyle["__type__"]

export const HatchPatternType = Enum(
  "blank", "dot", "ring", "horizontal_line", "vertical_line", "cross", "horizontal_dash",
  "vertical_dash", "spiral", "right_diagonal_line", "left_diagonal_line", "diagonal_cross",
  "right_diagonal_dash", "left_diagonal_dash", "horizontal_wave", "vertical_wave", "criss_cross",
  " ", ".", "o", "-", "|", "+", '"', ":", "@", "/", "\\", "x", ",", "`", "v", ">", "*",
)
export type HatchPatternType = typeof HatchPatternType["__type__"]

export const HTTPMethod = Enum("POST", "GET")
export type HTTPMethod = typeof HTTPMethod["__type__"]

export const HexTileOrientation = Enum("pointytop", "flattop")
export type HexTileOrientation = typeof HexTileOrientation["__type__"]

export const HoverMode = Enum("mouse", "hline", "vline")
export type HoverMode = typeof HoverMode["__type__"]

export const ImageOrigin = Enum("bottom_left", "top_left", "bottom_right", "top_right")
export type ImageOrigin = typeof ImageOrigin["__type__"]

export const LatLon = Enum("lat", "lon")
export type LatLon = typeof LatLon["__type__"]

export const LegendClickPolicy = Enum("none", "hide", "mute")
export type LegendClickPolicy = typeof LegendClickPolicy["__type__"]

export const LegendLocation = Anchor
export type LegendLocation = Anchor

export const LineCap = Enum("butt", "round", "square")
export type LineCap = typeof LineCap["__type__"]

export const LineDash = Enum("solid", "dashed", "dotted", "dotdash", "dashdot")
export type LineDash = typeof LineDash["__type__"]

export const LineJoin = Enum("miter", "round", "bevel")
export type LineJoin = typeof LineJoin["__type__"]

export const LinePolicy = Enum("prev", "next", "nearest", "interp", "none")
export type LinePolicy = typeof LinePolicy["__type__"]

export const Location = Enum("above", "below", "left", "right")
export type Location = typeof Location["__type__"]

export const LogoStyle = Enum("normal", "grey")
export type LogoStyle = typeof LogoStyle["__type__"]

export const MapType = Enum("satellite", "roadmap", "terrain", "hybrid")
export type MapType = typeof MapType["__type__"]

export const MarkerType = Enum(
  "asterisk", "circle", "circle_cross", "circle_dot", "circle_x",
  "circle_y", "cross", "dash", "diamond", "diamond_cross", "diamond_dot",
  "dot", "hex", "hex_dot", "inverted_triangle", "plus", "square",
  "square_cross", "square_dot", "square_pin", "square_x", "star", "star_dot",
  "triangle", "triangle_dot", "triangle_pin", "x", "y",
)
export type MarkerType = typeof MarkerType["__type__"]

export const MutedPolicy = Enum("show", "ignore")
export type MutedPolicy = typeof MutedPolicy["__type__"]

export const Orientation = Enum("vertical", "horizontal")
export type Orientation = typeof Orientation["__type__"]

export const OutputBackend = Enum("canvas", "svg", "webgl")
export type OutputBackend = typeof OutputBackend["__type__"]

export const PaddingUnits = Enum("percent", "absolute")
export type PaddingUnits = typeof PaddingUnits["__type__"]

export const Place = Enum("above", "below", "left", "right", "center")
export type Place = typeof Place["__type__"]

export const PointPolicy = Enum("snap_to_data", "follow_mouse", "none")
export type PointPolicy = typeof PointPolicy["__type__"]

export const RadiusDimension = Enum("x", "y", "max", "min")
export type RadiusDimension = typeof RadiusDimension["__type__"]

export const RenderLevel = Enum("image", "underlay", "glyph", "guide", "annotation", "overlay")
export type RenderLevel = typeof RenderLevel["__type__"]

export const ResetPolicy = Enum("standard", "event_only")
export type ResetPolicy = typeof ResetPolicy["__type__"]

export const ResolutionType = Enum("microseconds", "milliseconds", "seconds", "minsec", "minutes", "hourmin", "hours", "days", "months", "years")
export type ResolutionType = typeof ResolutionType["__type__"]

export const RoundingFunction = Enum("round", "nearest", "floor", "rounddown", "ceil", "roundup")
export type RoundingFunction = typeof RoundingFunction["__type__"]

export const ScrollbarPolicy = Enum("auto", "visible", "hidden")
export type ScrollbarPolicy = typeof ScrollbarPolicy["__type__"]

export const SelectionMode = Enum("replace", "append", "intersect", "subtract", "xor")
export type SelectionMode = typeof SelectionMode["__type__"]

export const Side = Enum("above", "below", "left", "right")
export type Side = typeof Side["__type__"]

export const SizingMode = Enum("stretch_width", "stretch_height", "stretch_both", "scale_width", "scale_height", "scale_both", "fixed", "inherit")
export type SizingMode = typeof SizingMode["__type__"]

export const Sort = Enum("ascending", "descending")
export type Sort = typeof Sort["__type__"]

export const SpatialUnits = Enum("screen", "data")
export type SpatialUnits = typeof SpatialUnits["__type__"]

export const StartEnd = Enum("start", "end")
export type StartEnd = typeof StartEnd["__type__"]

export const StepMode = Enum("after", "before", "center")
export type StepMode = typeof StepMode["__type__"]

export const TapBehavior = Enum("select", "inspect")
export type TapBehavior = typeof TapBehavior["__type__"]

export const TapGesture = Enum("tap", "doubletap")
export type TapGesture = typeof TapGesture["__type__"]

export const TextAlign = Enum("left", "right", "center")
export type TextAlign = typeof TextAlign["__type__"]

export const TextBaseline = Enum("top", "middle", "bottom", "alphabetic", "hanging", "ideographic")
export type TextBaseline = typeof TextBaseline["__type__"]

export const TextureRepetition = Enum("repeat", "repeat_x", "repeat_y", "no_repeat")
export type TextureRepetition = typeof TextureRepetition["__type__"]

export const LabelOrientation = Enum("vertical", "horizontal", "parallel", "normal")
export type LabelOrientation = typeof LabelOrientation["__type__"]

export const TooltipAttachment = Enum("horizontal", "vertical", "left", "right", "above", "below")
export type TooltipAttachment = typeof TooltipAttachment["__type__"]

export const UpdateMode = Enum("replace", "append")
export type UpdateMode = typeof UpdateMode["__type__"]

export const VerticalAlign = Enum("top", "middle", "bottom")
export type VerticalAlign = typeof VerticalAlign["__type__"]

// Keep this in sync with bokehjs/src/less/icons.less
export const ToolIcon = Enum(
  "append_mode",
  "arrow_down_to_bar",
  "arrow_up_from_bar",
  "auto_box_zoom",
  "bold",
  "box_edit",
  "box_select",
  "box_zoom",
  "caret_down",
  "caret_left",
  "caret_right",
  "caret_up",
  "check",
  "chevron_down",
  "chevron_left",
  "chevron_right",
  "chevron_up",
  "clear_selection",
  "copy",
  "crosshair",
  "delete",
  "freehand_draw",
  "fullscreen",
  "help",
  "hover",
  "intersect_mode",
  "invert_selection",
  "italic",
  "lasso_select",
  "line_edit",
  "maximize",
  "minimize",
  "pan",
  "pin",
  "point_draw",
  "pointer",
  "poly_draw",
  "poly_edit",
  "polygon_select",
  "range",
  "redo",
  "replace_mode",
  "reset",
  "save",
  "see_off",
  "see_on",
  "settings",
  "square",
  "square_check",
  "subtract_mode",
  "tap_select",
  "text_align_center",
  "text_align_left",
  "text_align_right",
  "undo",
  "unknown",
  "unpin",
  "wheel_pan",
  "wheel_zoom",
  "x_box_select",
  "x_box_zoom",
  "x_grip",
  "x_pan",
  "xor_mode",
  "y_box_select",
  "y_box_zoom",
  "y_grip",
  "y_pan",
  "zoom_in",
  "zoom_out",
)
export type ToolIcon = typeof ToolIcon["__type__"]
