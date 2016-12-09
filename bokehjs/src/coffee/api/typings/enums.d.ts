declare namespace Bokeh {
  export type Auto = "auto";

  export type LineJoin = "miter" | "round" | "bevel";
  export type LineDash = "solid" | "dashed" | "dotted" | "dotdash" | "dashdot";
  export type LineCap = "butt" | "round" | "square";
  export type FontStyle = "normal" | "italic" | "bold";
  export type TextAlign = "left" | "right" | "center";
  export type TextBaseline = "top" | "middle" | "bottom" | "alphabetic" | "hanging";
  export type Direction = "clock" | "anticlock";
  export type Units = "screen" | "data";
  export type SpatialUnits = Units;
  export type AngleUnits = "deg" | "rad";
  export type DatetimeUnits = "microseconds" | "milliseconds" | "seconds" | "minsec" | "minutes" | "hourmin" | "hours" | "days" | "months" | "years";
  export type Dimension = "width" | "height";
  export type Dimensions = "width" | "height" | "both";
  export type Orientation = "horizontal" | "vertical";
  export type Anchor =
    "top_left"    | "top_center"    | "top_right"    |
    "center_left" | "center"        | "center_right" |
    "bottom_left" | "bottom_center" | "bottom_right";
  export type LegendLocation = Anchor;
  export type Location = "above" | "below" | "left" | "right";
  export type DashPattern = "solid" | "dashed" | "dotted" | "dotdash" | "dashdot";
  export type ButtonType = "default" | "primary" | "success" | "warning" | "danger" | "link";
  export type MapType = "satellite" | "roadmap" | "terrain" | "hybrid";
  export type DateFormat = "ATOM" | "W3C" | "RFC-3339" | "ISO-8601" | "COOKIE" | "RFC-822" | "RFC-850" | "RFC-1036" | "RFC-1123" | "RFC-2822" | "RSS" | "TICKS" | "TIMESTAMP";
  export type RoundingFunction = "round" | "nearest" | "floor" | "rounddown" | "ceil" | "roundup";
  export type NumeralLanguage = "be-nl" | "chs" | "cs" | "da-dk" | "de-ch" | "de" | "en" | "en-gb" | "es-ES" | "es" | "et" | "fi" | "fr-CA" | "fr-ch" | "fr" | "hu" | "it" | "ja" | "nl-nl" | "pl" | "pt-br" | "pt-pt" | "ru" | "ru-UA" | "sk" | "th" | "tr" | "uk-UA";
  export type RenderLevel = "image" | "underlay" | "glyph" | "annotation" | "overlay";
  export type RenderMode = "canvas" | "css";
  export type Aggregation = "sum" | "mean" | "count" | "nunique" | "median" | "min" | "max";
  export type StartEnd = "start" | "end";
  export type SliderCallbackPolicy = "continuous" | "throttle" | "mouseup";
  export type SizingMode = "stretch_both" | "scale_width" | "scale_height" | "scale_both" | "fixed";

  export type Logo = "normal" | "grey";
  export type HoverMode = "mouse" | "hline" | "vline";
  export type PointPolicy = "snap_to_data" | "follow_mouse" | "none";
  export type LinePolicy = "prev" | "next" | "nearest" | "interp" | "none";
  export type HTTPMethod = "POST" | "GET";
  export type Place = "left" | "right" | "above" | "below" | "center";
}
