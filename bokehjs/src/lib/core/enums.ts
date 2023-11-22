import {Enum} from "./kinds"

export type Align = "start" | "center" | "end"
export const Align = Enum("start", "center", "end")

export type HAlign = "left" | "center" | "right"
export const HAlign = Enum("left", "center", "right")

export type VAlign = "top" | "center" | "bottom"
export const VAlign = Enum("top", "center", "bottom")

export type Anchor = `${VAlign}_${HAlign}` | HAlign | VAlign
export const Anchor = Enum(
  "top_left",    "top_center",    "top_right",
  "center_left", "center_center", "center_right",
  "bottom_left", "bottom_center", "bottom_right",
  "top", "left", "center", "right", "bottom",
)

export type AngleUnits = "deg" | "rad" | "grad" | "turn"
export const AngleUnits = Enum("deg", "rad", "grad", "turn")

export type AlternationPolicy = typeof AlternationPolicy["__type__"]
export const AlternationPolicy = Enum("none", "even", "odd", "every")

export type BoxOrigin = "corner" | "center"
export const BoxOrigin = Enum("corner", "center")

export type ButtonType = "default" | "primary" | "success" | "warning" | "danger" | "light"
export const ButtonType = Enum("default", "primary", "success", "warning", "danger", "light")

export type CalendarPosition = "auto" | "above" | "below"
export const CalendarPosition = Enum("auto", "above", "below")

export type Clock = typeof Clock["__type__"]
export const Clock = Enum("12h", "24h")

export type CoordinateUnits = "canvas" | "screen" | "data"
export const CoordinateUnits = Enum("canvas", "screen", "data")

export type ContextWhich = "start" | "center" | "end" | "all"
export const ContextWhich = Enum("start", "center", "end", "all")

export type Dimension = "width" | "height"
export const Dimension = Enum("width", "height")

export type Dimensions = "width" | "height" | "both"
export const Dimensions = Enum("width", "height", "both")

export type Direction = "clock" | "anticlock"
export const Direction = Enum("clock", "anticlock")

export type Distribution = "uniform" | "normal"
export const Distribution = Enum("uniform", "normal")

export type Face = typeof Face["__type__"]
export const Face = Enum("front", "back")

export type FlowMode = typeof FlowMode["__type__"]
export const FlowMode = Enum("block", "inline")

export type FontStyle = "normal" | "italic" | "bold" | "bold italic"
export const FontStyle = Enum("normal", "italic", "bold", "bold italic")

export type HatchPatternType =
  "blank" | "dot" | "ring" | "horizontal_line" | "vertical_line" | "cross" | "horizontal_dash" |
  "vertical_dash" | "spiral" | "right_diagonal_line" | "left_diagonal_line" | "diagonal_cross" |
  "right_diagonal_dash" | "left_diagonal_dash" | "horizontal_wave" | "vertical_wave" | "criss_cross" |
  " " | "." | "o" | "-" | "|" | "+" | '"' | ":" | "@" | "/" | "\\" | "x" | "," | "`" | "v" | ">" | "*"
export const HatchPatternType = Enum(
  "blank", "dot", "ring", "horizontal_line", "vertical_line", "cross", "horizontal_dash",
  "vertical_dash", "spiral", "right_diagonal_line", "left_diagonal_line", "diagonal_cross",
  "right_diagonal_dash", "left_diagonal_dash", "horizontal_wave", "vertical_wave", "criss_cross",
  " ", ".", "o", "-", "|", "+", '"', ":", "@",  "/", "\\", "x", ",", "`", "v", ">", "*",
)

export type HTTPMethod = "POST" | "GET"
export const HTTPMethod = Enum("POST", "GET")

export type HexTileOrientation = "pointytop" | "flattop"
export const HexTileOrientation = Enum("pointytop", "flattop")

export type HoverMode = "mouse" | "hline" | "vline"
export const HoverMode = Enum("mouse", "hline", "vline")

export type ImageOrigin = "bottom_left" | "top_left" | "bottom_right" | "top_right"
export const ImageOrigin = Enum("bottom_left", "top_left", "bottom_right", "top_right")

export type LatLon = "lat" | "lon"
export const LatLon = Enum("lat", "lon")

export type LegendClickPolicy = "none" | "hide" | "mute"
export const LegendClickPolicy = Enum("none", "hide", "mute")

export type LegendLocation = Anchor
export const LegendLocation = Anchor

export type LineCap = "butt" | "round" | "square"
export const LineCap = Enum("butt", "round", "square")

export type LineDash = "solid" | "dashed" | "dotted" | "dotdash" | "dashdot"
export const LineDash = Enum("solid", "dashed", "dotted", "dotdash", "dashdot")

export type LineJoin = "miter" | "round" | "bevel"
export const LineJoin = Enum("miter", "round", "bevel")

export type LinePolicy = "prev" | "next" | "nearest" | "interp" | "none"
export const LinePolicy = Enum("prev", "next", "nearest", "interp", "none")

export type Location = "above" | "below" | "left" | "right"
export const Location = Enum("above", "below", "left", "right")

export type Logo = "normal" | "grey"
export const Logo = Enum("normal", "grey")

export type MapType = typeof MapType["__type__"]
export const MapType = Enum("satellite", "roadmap", "terrain", "hybrid")

export type MarkerType =
  "asterisk" | "circle" | "circle_cross" | "circle_dot" | "circle_x" |
  "circle_y" | "cross" | "dash" | "diamond" | "diamond_cross" | "diamond_dot" |
  "dot" | "hex" | "hex_dot" | "inverted_triangle" | "plus" | "square" |
  "square_cross" | "square_dot" | "square_pin" | "square_x" | "star" | "star_dot" |
  "triangle" | "triangle_dot" | "triangle_pin" | "x" | "y"
export const MarkerType = Enum(
  "asterisk", "circle", "circle_cross", "circle_dot", "circle_x",
  "circle_y", "cross", "dash", "diamond", "diamond_cross", "diamond_dot",
  "dot", "hex", "hex_dot", "inverted_triangle", "plus", "square",
  "square_cross", "square_dot", "square_pin", "square_x", "star", "star_dot",
  "triangle", "triangle_dot", "triangle_pin", "x", "y",
)

export type MutedPolicy = "show" | "ignore"
export const MutedPolicy = Enum("show", "ignore")

export type Orientation = "vertical" | "horizontal"
export const Orientation = Enum("vertical", "horizontal")

export type OutputBackend = "canvas" | "svg" | "webgl"
export const OutputBackend = Enum("canvas", "svg", "webgl")

export type PaddingUnits = "percent" | "absolute"
export const PaddingUnits = Enum("percent", "absolute")

export type Place = Side | "center"
export const Place = Enum("above", "below", "left", "right", "center")

export type PointPolicy = "snap_to_data" | "follow_mouse" | "none"
export const PointPolicy = Enum("snap_to_data", "follow_mouse", "none")

export type RadiusDimension = "x" | "y" | "max" | "min"
export const RadiusDimension = Enum("x", "y", "max", "min")

export type RenderLevel = "image" | "underlay" | "glyph" | "guide" | "annotation" | "overlay"
export const RenderLevel = Enum("image", "underlay", "glyph", "guide", "annotation", "overlay")

export type ResetPolicy = "standard" | "event_only"
export const ResetPolicy = Enum("standard", "event_only")

export type ResolutionType = "microseconds" | "milliseconds" | "seconds" | "minsec" | "minutes" | "hourmin" | "hours" | "days" | "months" | "years"
export const ResolutionType = Enum("microseconds", "milliseconds", "seconds", "minsec", "minutes", "hourmin", "hours", "days", "months", "years")

export type RoundingFunction = "round" | "nearest" | "floor" | "rounddown" | "ceil" | "roundup"
export const RoundingFunction = Enum("round", "nearest", "floor", "rounddown", "ceil", "roundup")

export type ScrollbarPolicy = typeof ScrollbarPolicy["__type__"]
export const ScrollbarPolicy = Enum("auto", "visible", "hidden")

export type SelectionMode = typeof SelectionMode["__type__"]
export const SelectionMode = Enum("replace", "append", "intersect", "subtract", "xor")

export type Side = "above" | "below" | "left" | "right"
export const Side = Enum("above", "below", "left", "right")

export type SizingMode = "stretch_width" | "stretch_height" | "stretch_both" | "scale_width" | "scale_height" | "scale_both" | "fixed" | "inherit"
export const SizingMode = Enum("stretch_width", "stretch_height", "stretch_both", "scale_width", "scale_height", "scale_both", "fixed", "inherit")

export type Sort = "ascending" | "descending"
export const Sort = Enum("ascending", "descending")

export type SpatialUnits = "screen" | "data"
export const SpatialUnits = Enum("screen", "data")

export type StartEnd = "start" | "end"
export const StartEnd = Enum("start", "end")

export type StepMode = "after" | "before" | "center"
export const StepMode = Enum("after", "before", "center")

export type TapBehavior = "select" | "inspect"
export const TapBehavior = Enum("select", "inspect")

export type TapGesture = typeof TapGesture["__type__"]
export const TapGesture = Enum("tap", "doubletap")

export type TextAlign = "left" | "right" | "center"
export const TextAlign = Enum("left", "right", "center")

export type TextBaseline = "top" | "middle" | "bottom" | "alphabetic" | "hanging" | "ideographic"
export const TextBaseline = Enum("top", "middle", "bottom", "alphabetic", "hanging", "ideographic")

export type TextureRepetition = "repeat" | "repeat_x" | "repeat_y" | "no_repeat"
export const TextureRepetition = Enum("repeat", "repeat_x", "repeat_y", "no_repeat")

export type LabelOrientation = "vertical" | "horizontal" | "parallel" | "normal"
export const LabelOrientation = Enum("vertical", "horizontal", "parallel", "normal")

export type TooltipAttachment = "horizontal" | "vertical" | "left" | "right" | "above" | "below"
export const TooltipAttachment = Enum("horizontal", "vertical", "left", "right", "above", "below")

export type UpdateMode = "replace" | "append"
export const UpdateMode = Enum("replace", "append")

export type VerticalAlign = "top" | "middle" | "bottom"
export const VerticalAlign = Enum("top", "middle", "bottom")

export const ToolIcon = Enum(
  "append_mode",
  "box_edit",
  "box_select",
  "box_zoom",
  "clear_selection",
  "copy",
  "crosshair",
  "freehand_draw",
  "help",
  "hover",
  "intersect_mode",
  "lasso_select",
  "line_edit",
  "pan",
  "point_draw",
  "poly_draw",
  "poly_edit",
  "polygon_select",
  "range",
  "redo",
  "replace_mode",
  "reset",
  "save",
  "subtract_mode",
  "tap_select",
  "undo",
  "wheel_pan",
  "wheel_zoom",
  "xpan",
  "ypan",
  "zoom_in",
  "zoom_out",
)
export type ToolIcon = typeof ToolIcon["__type__"]
