import {Enum} from "./kinds"
import type {Infer} from "./kinds"

export const Align = Enum("start", "center", "end")
export type Align = Infer<typeof Align>

export const HAlign = Enum("left", "center", "right")
export type HAlign = Infer<typeof HAlign>

export const VAlign = Enum("top", "center", "bottom")
export type VAlign = Infer<typeof VAlign>

export const Anchor = Enum(
  "top_left",    "top_center",    "top_right",
  "center_left", "center_center", "center_right",
  "bottom_left", "bottom_center", "bottom_right",
  "top", "left", "center", "right", "bottom",
)
export type Anchor = Infer<typeof Anchor>

export const AngleReference = Enum("auto", "left", "right", "screen")
export type AngleReference = Infer<typeof AngleReference>

export const AngleUnits = Enum("deg", "rad", "grad", "turn")
export type AngleUnits = Infer<typeof AngleUnits>

export const AlternationPolicy = Enum("none", "even", "odd", "every")
export type AlternationPolicy = Infer<typeof AlternationPolicy>

export const AxisLabelStandoffMode = Enum("tick_labels", "axis")
export type AxisLabelStandoffMode = Infer<typeof AxisLabelStandoffMode>

export const BoxOrigin = Enum("corner", "center")
export type BoxOrigin = Infer<typeof BoxOrigin>

export const ButtonType = Enum("default", "primary", "success", "warning", "danger", "light")
export type ButtonType = Infer<typeof ButtonType>

export const CalendarPosition = Enum("auto", "above", "below")
export type CalendarPosition = Infer<typeof CalendarPosition>

export const CorrectionPolicy = Enum("auto", "always", "never")
export type CorrectionPolicy = typeof CorrectionPolicy["__type__"]

export const Clock = Enum("12h", "24h")
export type Clock = Infer<typeof Clock>

export const CoordinateUnits = Enum("canvas", "screen", "data")
export type CoordinateUnits = Infer<typeof CoordinateUnits>

export const ColorScheme = Enum("auto", "light", "dark")
export type ColorScheme = Infer<typeof ColorScheme>

export const ContextWhich = Enum("start", "center", "end", "all")
export type ContextWhich = Infer<typeof ContextWhich>

export const Dimension = Enum("width", "height")
export type Dimension = Infer<typeof Dimension>

export const Dimensions = Enum("width", "height", "both")
export type Dimensions = Infer<typeof Dimensions>

export const Direction = Enum("clock", "anticlock")
export type Direction = Infer<typeof Direction>

export const Distribution = Enum("uniform", "normal")
export type Distribution = Infer<typeof Distribution>

export const Face = Enum("front", "back")
export type Face = Infer<typeof Face>

export const FlowMode = Enum("block", "inline")
export type FlowMode = Infer<typeof FlowMode>

export const FontStyle = Enum("normal", "italic", "bold", "bold italic")
export type FontStyle = Infer<typeof FontStyle>

export const HatchPatternType = Enum(
  "blank", "dot", "ring", "horizontal_line", "vertical_line", "cross", "horizontal_dash",
  "vertical_dash", "spiral", "right_diagonal_line", "left_diagonal_line", "diagonal_cross",
  "right_diagonal_dash", "left_diagonal_dash", "horizontal_wave", "vertical_wave", "criss_cross",
  " ", ".", "o", "-", "|", "+", '"', ":", "@", "/", "\\", "x", ",", "`", "v", ">", "*",
)
export type HatchPatternType = Infer<typeof HatchPatternType>

export const BuiltinFormatter = Enum("raw", "basic", "numeral", "printf", "datetime")
export type BuiltinFormatter = Infer<typeof BuiltinFormatter>

export const HTTPMethod = Enum("POST", "GET")
export type HTTPMethod = Infer<typeof HTTPMethod>

export const HexTileOrientation = Enum("pointytop", "flattop")
export type HexTileOrientation = Infer<typeof HexTileOrientation>

export const HoverMode = Enum("mouse", "hline", "vline")
export type HoverMode = Infer<typeof HoverMode>

export const ImageOrigin = Enum("bottom_left", "top_left", "bottom_right", "top_right")
export type ImageOrigin = Infer<typeof ImageOrigin>

export const LatLon = Enum("lat", "lon")
export type LatLon = Infer<typeof LatLon>

export const LegendClickPolicy = Enum("none", "hide", "mute")
export type LegendClickPolicy = Infer<typeof LegendClickPolicy>

export const LegendLocation = Anchor
export type LegendLocation = Anchor

export const LineCap = Enum("butt", "round", "square")
export type LineCap = Infer<typeof LineCap>

export const LineDash = Enum("solid", "dashed", "dotted", "dotdash", "dashdot")
export type LineDash = Infer<typeof LineDash>

export const LineJoin = Enum("miter", "round", "bevel")
export type LineJoin = Infer<typeof LineJoin>

export const LinePolicy = Enum("prev", "next", "nearest", "interp", "none")
export type LinePolicy = Infer<typeof LinePolicy>

export const Location = Enum("above", "below", "left", "right")
export type Location = Infer<typeof Location>

export const Logo = Enum("normal", "grey")
export type Logo = Infer<typeof Logo>

export const MapType = Enum("satellite", "roadmap", "terrain", "hybrid")
export type MapType = Infer<typeof MapType>

export const MarkerType = Enum(
  "asterisk", "circle", "circle_cross", "circle_dot", "circle_x",
  "circle_y", "cross", "dash", "diamond", "diamond_cross", "diamond_dot",
  "dot", "hex", "hex_dot", "inverted_triangle", "plus", "square",
  "square_cross", "square_dot", "square_pin", "square_x", "star", "star_dot",
  "triangle", "triangle_dot", "triangle_pin", "x", "y",
)
export type MarkerType = Infer<typeof MarkerType>

export const MutedPolicy = Enum("show", "ignore")
export type MutedPolicy = Infer<typeof MutedPolicy>

export const Orientation = Enum("vertical", "horizontal")
export type Orientation = Infer<typeof Orientation>

export const OutlineShapeName = Enum("none", "box", "rectangle", "square", "circle", "ellipse", "trapezoid", "parallelogram", "diamond", "triangle")
export type OutlineShapeName = Infer<typeof OutlineShapeName>

export const OutputBackend = Enum("canvas", "svg", "webgl")
export type OutputBackend = Infer<typeof OutputBackend>

export const PaddingUnits = Enum("percent", "absolute")
export type PaddingUnits = Infer<typeof PaddingUnits>

export const PanDirection = Enum(
  "left", "right", "up", "down",
  "west", "east", "north", "south",
)
export type PanDirection = Infer<typeof PanDirection>

export const Place = Enum("above", "below", "left", "right", "center")
export type Place = Infer<typeof Place>

export const PointPolicy = Enum("snap_to_data", "follow_mouse", "none")
export type PointPolicy = Infer<typeof PointPolicy>

export const RadiusDimension = Enum("x", "y", "max", "min")
export type RadiusDimension = Infer<typeof RadiusDimension>

export const RenderLevel = Enum("image", "underlay", "glyph", "guide", "annotation", "overlay")
export type RenderLevel = Infer<typeof RenderLevel>

export const ResetPolicy = Enum("standard", "event_only")
export type ResetPolicy = Infer<typeof ResetPolicy>

export const ResolutionType = Enum("microseconds", "milliseconds", "seconds", "minsec", "minutes", "hourmin", "hours", "days", "months", "years")
export type ResolutionType = Infer<typeof ResolutionType>

export const RoundingFunction = Enum("round", "nearest", "floor", "rounddown", "ceil", "roundup")
export type RoundingFunction = Infer<typeof RoundingFunction>

export const ScrollbarPolicy = Enum("auto", "visible", "hidden")
export type ScrollbarPolicy = Infer<typeof ScrollbarPolicy>

export const RegionSelectionMode = Enum("replace", "append", "intersect", "subtract", "xor")
export type RegionSelectionMode = Infer<typeof RegionSelectionMode>

export const SelectionMode = Enum(...RegionSelectionMode, "toggle")
export type SelectionMode = Infer<typeof SelectionMode>

export const Side = Enum("above", "below", "left", "right")
export type Side = Infer<typeof Side>

export const SizingMode = Enum("stretch_width", "stretch_height", "stretch_both", "scale_width", "scale_height", "scale_both", "fixed", "inherit")
export type SizingMode = Infer<typeof SizingMode>

export const SliderAppearance = Enum("normal", "stealth")
export type SliderAppearance = Infer<typeof SliderAppearance>

export const Sort = Enum("ascending", "descending")
export type Sort = Infer<typeof Sort>

export const SpatialUnits = Enum("screen", "data")
export type SpatialUnits = Infer<typeof SpatialUnits>

export const StartEnd = Enum("start", "end")
export type StartEnd = Infer<typeof StartEnd>

export const StepMode = Enum("after", "before", "center")
export type StepMode = Infer<typeof StepMode>

export const TapBehavior = Enum("select", "inspect")
export type TapBehavior = Infer<typeof TapBehavior>

export const TapGesture = Enum("tap", "doubletap")
export type TapGesture = Infer<typeof TapGesture>

export const TextAlign = Enum("left", "right", "center")
export type TextAlign = Infer<typeof TextAlign>

export const TextBaseline = Enum("top", "middle", "bottom", "alphabetic", "hanging", "ideographic")
export type TextBaseline = Infer<typeof TextBaseline>

export const TextureRepetition = Enum("repeat", "repeat_x", "repeat_y", "no_repeat")
export type TextureRepetition = Infer<typeof TextureRepetition>

export const TimedeltaResolutionType = Enum("nanoseconds", "microseconds", "milliseconds", "seconds", "minsec", "minutes", "hourmin", "hours", "days")
export type TimedeltaResolutionType = Infer<typeof TimedeltaResolutionType>

export const LabelOrientation = Enum("vertical", "horizontal", "parallel", "normal")
export type LabelOrientation = Infer<typeof LabelOrientation>

export const TooltipAttachment = Enum("horizontal", "vertical", "left", "right", "above", "below")
export type TooltipAttachment = Infer<typeof TooltipAttachment>

export const UpdateMode = Enum("replace", "append")
export type UpdateMode = Infer<typeof UpdateMode>

export const VerticalAlign = Enum("top", "middle", "bottom")
export type VerticalAlign = Infer<typeof VerticalAlign>

export const WindowAxis = Enum("none", "x", "y")
export type WindowAxis = Infer<typeof WindowAxis>

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
  "dark_theme",
  "delete",
  "freehand_draw",
  "fullscreen",
  "help",
  "hover",
  "intersect_mode",
  "invert_selection",
  "italic",
  "lasso_select",
  "light_theme",
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
  "system_theme",
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
export type ToolIcon = Infer<typeof ToolIcon>

export const ToolName = Enum(
  "auto_box_zoom",
  "box_select",
  "box_zoom",
  "click",
  "copy",
  "crosshair",
  "doubletap",
  "examine",
  "freehand_draw",
  "fullscreen",
  "help",
  "hover",
  "lasso_select",
  "pan",
  "pan_down",
  "pan_east",
  "pan_left",
  "pan_north",
  "pan_right",
  "pan_south",
  "pan_up",
  "pan_west",
  "poly_select",
  "redo",
  "reset",
  "save",
  "tap",
  "undo",
  "wheel_zoom",
  "xbox_select",
  "xbox_zoom",
  "xcrosshair",
  "xpan",
  "xwheel_pan",
  "xwheel_zoom",
  "xzoom_in",
  "xzoom_out",
  "ybox_select",
  "ybox_zoom",
  "ycrosshair",
  "ypan",
  "ywheel_pan",
  "ywheel_zoom",
  "yzoom_in",
  "yzoom_out",
  "zoom_in",
  "zoom_out",
)
export type ToolName = Infer<typeof ToolName>
