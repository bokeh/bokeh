export type Align = "start" | "center" | "end"
export const Align: Align[] = ["start", "center", "end"]

export type Anchor =
  "top_left"    | "top_center"    | "top_right"    |
  "center_left" | "center"        | "center_right" |
  "bottom_left" | "bottom_center" | "bottom_right"
export const Anchor: Anchor[] = [
  "top_left",    "top_center",    "top_right",
  "center_left", "center",        "center_right",
  "bottom_left", "bottom_center", "bottom_right",
]

export type AngleUnits = "deg" | "rad"
export const AngleUnits: AngleUnits[] = ["deg", "rad"]

export type BoxOrigin = "corner" | "center"
export const BoxOrigin: BoxOrigin[] = ["corner", "center"]

export type ButtonType = "default" | "primary" | "success" | "warning" | "danger"
export const ButtonType: ButtonType[] = ["default", "primary", "success", "warning", "danger"]

export type Dimension = "width" | "height"
export const Dimension: Dimension[] = ["width", "height"]

export type Dimensions = "width" | "height" | "both"
export const Dimensions: Dimensions[] = ["width", "height", "both"]

export type Direction = "clock" | "anticlock"
export const Direction: Direction[] = ["clock", "anticlock"]

export type Distribution = "uniform" | "normal"
export const Distribution: Distribution[] = ["uniform", "normal"]

export type FontStyle = "normal" | "italic" | "bold" | "bold italic"
export const FontStyle: FontStyle[] = ["normal", "italic", "bold", "bold italic"]

export type HatchPatternType =
  'blank' | 'dot' | 'ring' | 'horizontal_line' | 'vertical_line' | 'cross' | 'horizontal_dash' |
  'vertical_dash' | 'spiral' | 'right_diagonal_line' | 'left_diagonal_line' | 'diagonal_cross' |
  'right_diagonal_dash' | 'left_diagonal_dash' | 'horizontal_wave' | 'vertical_wave' | 'criss_cross' |
  ' ' | '.' | 'o' | '-' | '|' | '+' | '"' | ':' | '@' | '/' | '\\' | 'x' | ',' | '`' | 'v' | '>' | '*'
export const HatchPatternType: HatchPatternType[] = [
  'blank', 'dot', 'ring', 'horizontal_line', 'vertical_line', 'cross', 'horizontal_dash',
  'vertical_dash', 'spiral', 'right_diagonal_line', 'left_diagonal_line', 'diagonal_cross',
  'right_diagonal_dash', 'left_diagonal_dash', 'horizontal_wave', 'vertical_wave', 'criss_cross',
  ' ', '.', 'o', '-', '|', '+', '"', ':', '@',  '/', '\\', 'x', ',', '`', 'v', '>', '*',
]

export type HTTPMethod = "POST" | "GET"
export const HTTPMethod: HTTPMethod[] = ["POST", "GET"]

export type HexTileOrientation = "pointytop" | "flattop"
export const HexTileOrientation: HexTileOrientation[] = ["pointytop", "flattop"]

export type HoverMode = "mouse" | "hline" | "vline"
export const HoverMode: HoverMode[] = ["mouse", "hline", "vline"]

export type LatLon = "lat" | "lon"
export const LatLon: LatLon[] = ["lat", "lon"]

export type LegendClickPolicy = "none" | "hide" | "mute"
export const LegendClickPolicy: LegendClickPolicy[] = ["none", "hide", "mute"]

export type LegendLocation = Anchor
export const LegendLocation: LegendLocation[] = Anchor

export type LineCap = "butt" | "round" | "square"
export const LineCap: LineCap[] = ["butt", "round", "square"]

export type LineJoin = "miter" | "round" | "bevel"
export const LineJoin: LineJoin[] = ["miter", "round", "bevel"]

export type LinePolicy = "prev" | "next" | "nearest" | "interp" | "none"
export const LinePolicy: LinePolicy[] = ["prev", "next", "nearest", "interp", "none"]

export type Location = "above" | "below" | "left" | "right"
export const Location: Location[] = ["above", "below", "left", "right"]

export type Logo = "normal" | "grey"
export const Logo: Logo[] = ["normal", "grey"]

export type MarkerType =
  "asterisk" | "circle" | "circle_cross" | "circle_x" | "cross" |
  "dash" | "diamond" | "diamond_cross" | "hex" | "inverted_triangle" |
  "square" | "square_cross" | "square_x" | "triangle" | "x"
export const MarkerType: MarkerType[] = [
  "asterisk", "circle", "circle_cross", "circle_x", "cross",
  "dash", "diamond", "diamond_cross", "hex", "inverted_triangle",
  "square", "square_cross", "square_x", "triangle", "x",
]

export type Orientation = "vertical" | "horizontal"
export const Orientation: Orientation[] = ["vertical", "horizontal"]

export type OutputBackend = "canvas" | "svg" | "webgl"
export const OutputBackend: OutputBackend[] = ["canvas", "svg", "webgl"]

export type PaddingUnits = "percent" | "absolute"
export const PaddingUnits: PaddingUnits[] = ["percent", "absolute"]

export type Place = Side | "center"
export const Place: Place[] = ["above", "below", "left", "right", "center"]

export type PointPolicy = "snap_to_data" | "follow_mouse" | "none"
export const PointPolicy: PointPolicy[] = ["snap_to_data", "follow_mouse", "none"]

export type RadiusDimension = "x" | "y" | "max" | "min"
export const RadiusDimension: RadiusDimension[] = ["x", "y", "max", "min"]

export type RenderLevel = "image" | "underlay" | "glyph" | "annotation" | "overlay"
export const RenderLevel: RenderLevel[] = ["image", "underlay", "glyph", "annotation", "overlay"]

export type RenderMode = "canvas" | "css"
export const RenderMode: RenderMode[] = ["canvas", "css"]

export type ResetPolicy = "standard" | "event_only"
export const ResetPolicy: ResetPolicy[] = ["standard", "event_only"]

export type RoundingFunction = "round" | "nearest" | "floor" | "rounddown" | "ceil" | "roundup"
export const RoundingFunction: RoundingFunction[] = ["round", "nearest", "floor", "rounddown", "ceil", "roundup"]

export type Side = "above" | "below" | "left" | "right"
export const Side: Side[] = ["above", "below", "left", "right"]

export type SizingMode = "stretch_width" | "stretch_height" | "stretch_both" | "scale_width" | "scale_height" | "scale_both" | "fixed"
export const SizingMode: SizingMode[] = ["stretch_width", "stretch_height", "stretch_both", "scale_width", "scale_height", "scale_both", "fixed"]

export type SliderCallbackPolicy = "continuous" | "throttle" | "mouseup"
export const SliderCallbackPolicy: SliderCallbackPolicy[] = ["continuous", "throttle", "mouseup"]

export type Sort = "ascending" | "descending"
export const Sort: Sort[] = ["ascending", "descending"]

export type SpatialUnits = "screen" | "data"
export const SpatialUnits: SpatialUnits[] = ["screen", "data"]

export type StartEnd = "start" | "end"
export const StartEnd: StartEnd[] = ["start", "end"]

export type StepMode = "after" | "before" | "center"
export const StepMode: StepMode[] = ["after", "before", "center"]

export type TapBehavior = "select" | "inspect"
export const TapBehavior: TapBehavior[] = ["select", "inspect"]

export type TextAlign = "left" | "right" | "center"
export const TextAlign: TextAlign[] = ["left", "right", "center"]

export type TextBaseline = "top" | "middle" | "bottom" | "alphabetic" | "hanging" | "ideographic"
export const TextBaseline: TextBaseline[] = ["top", "middle", "bottom", "alphabetic", "hanging", "ideographic"]

export type TextureRepetition = "repeat" | "repeat_x" | "repeat_y" | "no_repeat"
export const TextureRepetition: TextureRepetition[] = ["repeat", "repeat_x", "repeat_y", "no_repeat"]

export type TickLabelOrientation = "vertical" | "horizontal" | "parallel" | "normal"
export const TickLabelOrientation: TickLabelOrientation[] = ["vertical", "horizontal", "parallel", "normal"]

export type TooltipAttachment = "horizontal" | "vertical" | "left" | "right" | "above" | "below"
export const TooltipAttachment: TooltipAttachment[] = ["horizontal", "vertical", "left", "right", "above", "below"]

export type UpdateMode = "replace" | "append"
export const UpdateMode: UpdateMode[] = ["replace", "append"]

export type VerticalAlign = "top" | "middle" | "bottom"
export const VerticalAlign: VerticalAlign[] = ["top", "middle", "bottom"]
