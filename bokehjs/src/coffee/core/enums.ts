export type AngleUnits = "deg" | "rad"
export const AngleUnits: AngleUnits[] = ["deg", "rad"]

export type Dimension = "width" | "height"
export const Dimension: Dimension[] = ["width", "height"]

export type Dimensions = "width" | "height" | "both"
export const Dimensions: Dimensions[] = ["width", "height", "both"]

export type Direction = "clock" | "anticlock"
export const Direction: Direction[] = ["clock", "anticlock"]

export type FontStyle = "normal" | "italic" | "bold"
export const FontStyle: FontStyle[] = ["normal", "italic", "bold"]

export type LatLon = "lat" | "lon"
export const LatLon: LatLon[] = ["lat", "lon"]

export type LineCap = "butt" | "round" | "square"
export const LineCap: LineCap[] = ["butt", "round", "square"]

export type LineJoin = "miter" | "round" | "bevel"
export const LineJoin: LineJoin[] = ["miter", "round", "bevel"]

export type Location = "above" | "below" | "left" | "right"
export const Location: Location[] = ["above", "below", "left", "right"]

export type LegendLocation =
  "top_left"    | "top_center"    | "top_right"    |
  "center_left" | "center"        | "center_right" |
  "bottom_left" | "bottom_center" | "bottom_right"
export const LegendLocation: LegendLocation[] = [
  "top_left",    "top_center",    "top_right",
  "center_left", "center",        "center_right",
  "bottom_left", "bottom_center", "bottom_right",
]

export type Orientation = "vertical" | "horizontal"
export const Orientation: Orientation[] = ["vertical", "horizontal"]

export type OutputBackend = "canvas" | "svg" | "webgl"
export const OutputBackend: OutputBackend[] = ["canvas", "svg", "webgl"]

export type RenderLevel = "image" | "underlay" | "glyph" | "annotation" | "overlay"
export const RenderLevel: RenderLevel[] = ["image", "underlay", "glyph", "annotation", "overlay"]

export type RenderMode = "canvas" | "css"
export const RenderMode: RenderMode[] = ["canvas", "css"]

export type Side = "above" | "below" | "left" | "right"
export const Side: Side[] = ["above", "below", "left", "right"]

export type SpatialUnits = "screen" | "data"
export const SpatialUnits: SpatialUnits[] = ["screen", "data"]

export type StartEnd = "start" | "end"
export const StartEnd: StartEnd[] = ["start", "end"]

export type VerticalAlign = "top" | "middle" | "bottom"
export const VerticalAlign: VerticalAlign[] = ["top", "middle", "bottom"]

export type TextAlign = "left" | "right" | "center"
export const TextAlign: TextAlign[] = ["left", "right", "center"]

export type TextBaseline = "top" | "middle" | "bottom" | "alphabetic" | "hanging" | "ideographic"
export const TextBaseline: TextBaseline[] = ["top", "middle", "bottom", "alphabetic", "hanging", "ideographic"]

export type DistributionTypes = "uniform" | "normal"
export const DistributionTypes: DistributionTypes[] = ["uniform", "normal"]

export type StepModes = "after" | "before" | "center"
export const StepModes: StepModes[] = ["after", "before", "center"]

export type SizingMode = "stretch_both" | "scale_width" | "scale_height" | "scale_both" | "fixed"
export const SizingMode: SizingMode[] = ["stretch_both", "scale_width", "scale_height", "scale_both", "fixed"]

export type PaddingUnits = "percent" | "absolute"
export const PaddingUnits: PaddingUnits[] = ["percent", "absolute"]
