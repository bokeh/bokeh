import {expect} from "assertions"

import * as enums from "@bokehjs/core/enums"

describe("enums module", () => {

  it("should have Align", () => {
    expect([...enums.Align]).to.be.equal(["start", "center", "end"])
  })

  it("should have HAlign", () => {
    expect([...enums.HAlign]).to.be.equal(["left", "center", "right"])
  })

  it("should have VAlign", () => {
    expect([...enums.VAlign]).to.be.equal(["top", "center", "bottom"])
  })

  it("should have AlternationPolicy", () => {
    expect([...enums.AlternationPolicy]).to.be.equal(["none", "even", "odd", "every"])
  })

  it("should have Anchor", () => {
    expect([...enums.Anchor]).to.be.equal([
      "top_left",    "top_center",    "top_right",
      "center_left", "center_center", "center_right",
      "bottom_left", "bottom_center", "bottom_right",
      "top", "left", "center", "right", "bottom",
    ])
  })

  it("should have AngleUnits", () => {
    expect([...enums.AngleUnits]).to.be.equal(["deg", "rad", "grad", "turn"])
  })

  it("should have BoxOrigin", () => {
    expect([...enums.BoxOrigin]).to.be.equal(["corner", "center"])
  })

  it("should have ButtonType", () => {
    expect([...enums.ButtonType]).to.be.equal(["default", "primary", "success", "warning", "danger", "light"])
  })

  it("should have CalendarPosition", () => {
    expect([...enums.CalendarPosition]).to.be.equal(["auto", "above", "below"])
  })

  it("should have Clock", () => {
    expect([...enums.Clock]).to.be.equal(["12h", "24h"])
  })

  it("should have ContextWhich", () => {
    expect([...enums.ContextWhich]).to.be.equal(["start", "center", "end", "all"])
  })

  it("should have Dimension", () => {
    expect([...enums.Dimension]).to.be.equal(["width", "height"])
  })

  it("should have Dimensions", () => {
    expect([...enums.Dimensions]).to.be.equal(["width", "height", "both"])
  })

  it("should have Direction", () => {
    expect([...enums.Direction]).to.be.equal(["clock", "anticlock"])
  })

  it("should have Distribution", () => {
    expect([...enums.Distribution]).to.be.equal(["uniform", "normal"])
  })

  it("should have FontStyle", () => {
    expect([...enums.FontStyle]).to.be.equal(["normal", "italic", "bold", "bold italic"])
  })

  it("should have HatchPatternType", () => {
    expect([...enums.HatchPatternType]).to.be.equal([
      "blank", "dot", "ring", "horizontal_line", "vertical_line", "cross", "horizontal_dash",
      "vertical_dash", "spiral", "right_diagonal_line", "left_diagonal_line", "diagonal_cross",
      "right_diagonal_dash", "left_diagonal_dash", "horizontal_wave", "vertical_wave", "criss_cross",
      " ", ".", "o", "-", "|", "+", '"', ":", "@", "/", "\\", "x", ",", "`", "v", ">", "*",
    ])
  })

  it("should have HTTPMethod", () => {
    expect([...enums.HTTPMethod]).to.be.equal(["POST", "GET"])
  })

  it("should have HexTileOrientation", () => {
    expect([...enums.HexTileOrientation]).to.be.equal(["pointytop", "flattop"])
  })

  it("should have HoverMode", () => {
    expect([...enums.HoverMode]).to.be.equal(["mouse", "hline", "vline"])
  })

  it("should have ImageOrigin", () => {
    expect([...enums.ImageOrigin]).to.be.equal(["bottom_left", "top_left", "bottom_right", "top_right"])
  })

  it("should have LatLon", () => {
    expect([...enums.LatLon]).to.be.equal(["lat", "lon"])
  })

  it("should have LegendClickPolicy", () => {
    expect([...enums.LegendClickPolicy]).to.be.equal(["none", "hide", "mute"])
  })

  it("should have LegendLocation", () => {
    expect([...enums.LegendLocation]).to.be.equal([
      "top_left",    "top_center",    "top_right",
      "center_left", "center_center", "center_right",
      "bottom_left", "bottom_center", "bottom_right",
      "top", "left", "center", "right", "bottom",
    ])
  })

  it("should have LineCap", () => {
    expect([...enums.LineCap]).to.be.equal(["butt", "round", "square"])
  })

  it("should have LineDash", () => {
    expect([...enums.LineDash]).to.be.equal(["solid", "dashed", "dotted", "dotdash", "dashdot"])
  })

  it("should have LineJoin", () => {
    expect([...enums.LineJoin]).to.be.equal(["miter", "round", "bevel"])
  })

  it("should have LinePolicy", () => {
    expect([...enums.LinePolicy]).to.be.equal(["prev", "next", "nearest", "interp", "none"])
  })

  it("should have Location", () => {
    expect([...enums.Location]).to.be.equal(["above", "below", "left", "right"])
  })

  it("should have Logo", () => {
    expect([...enums.Logo]).to.be.equal(["normal", "grey"])
  })

  it("should have MarkerType", () => {
    expect([...enums.MarkerType]).to.be.equal([
      "asterisk", "circle", "circle_cross", "circle_dot", "circle_x", "circle_y",
      "cross", "dash", "diamond", "diamond_cross", "diamond_dot", "dot", "hex",
      "hex_dot", "inverted_triangle", "plus", "square", "square_cross", "square_dot",
      "square_pin", "square_x", "star", "star_dot", "triangle", "triangle_dot",
      "triangle_pin", "x", "y",
    ])
  })

  it("should have MutedPolicy", () => {
    expect([...enums.MutedPolicy]).to.be.equal(["show", "ignore"])
  })

  it("should have Orientation", () => {
    expect([...enums.Orientation]).to.be.equal(["vertical", "horizontal"])
  })

  it("should have OutputBackend", () => {
    expect([...enums.OutputBackend]).to.be.equal(["canvas", "svg", "webgl"])
  })

  it("should have PaddingUnits", () => {
    expect([...enums.PaddingUnits]).to.be.equal(["percent", "absolute"])
  })

  it("should have Place", () => {
    expect([...enums.Place]).to.be.equal(["above", "below", "left", "right", "center"])
  })

  it("should have PointPolicy", () => {
    expect([...enums.PointPolicy]).to.be.equal(["snap_to_data", "follow_mouse", "none"])
  })

  it("should have RadiusDimension", () => {
    expect([...enums.RadiusDimension]).to.be.equal(["x", "y", "max", "min"])
  })

  it("should have RenderLevel", () => {
    expect([...enums.RenderLevel]).to.be.equal(["image", "underlay", "glyph", "guide", "annotation", "overlay"])
  })

  it("should have ResetPolicy", () => {
    expect([...enums.ResetPolicy]).to.be.equal(["standard", "event_only"])
  })

  it("should have RoundingFunction", () => {
    expect([...enums.RoundingFunction]).to.be.equal(["round", "nearest", "floor", "rounddown", "ceil", "roundup"])
  })

  it("should have SelectionMode", () => {
    expect([...enums.SelectionMode]).to.be.equal(["replace", "append", "intersect", "subtract", "xor"])
  })

  it("should have Side", () => {
    expect([...enums.Side]).to.be.equal(["above", "below", "left", "right"])
  })

  it("should have SizingMode", () => {
    expect([...enums.SizingMode]).to.be.equal(["stretch_width", "stretch_height", "stretch_both", "scale_width", "scale_height", "scale_both", "fixed", "inherit"])
  })

  it("should have Sort", () => {
    expect([...enums.Sort]).to.be.equal(["ascending", "descending"])
  })

  it("should have SpatialUnits", () => {
    expect([...enums.SpatialUnits]).to.be.equal(["screen", "data"])
  })

  it("should have StartEnd", () => {
    expect([...enums.StartEnd]).to.be.equal(["start", "end"])
  })

  it("should have StepMode", () => {
    expect([...enums.StepMode]).to.be.equal(["after", "before", "center"])
  })

  it("should have TapBehavior", () => {
    expect([...enums.TapBehavior]).to.be.equal(["select", "inspect"])
  })

  it("should have TapGesture", () => {
    expect([...enums.TapGesture]).to.be.equal(["tap", "doubletap"])
  })

  it("should have TextAlign", () => {
    expect([...enums.TextAlign]).to.be.equal(["left", "right", "center"])
  })

  it("should have TextBaseline", () => {
    expect([...enums.TextBaseline]).to.be.equal(["top", "middle", "bottom", "alphabetic", "hanging", "ideographic"])
  })

  it("should have TextureRepetition", () => {
    expect([...enums.TextureRepetition]).to.be.equal(["repeat", "repeat_x", "repeat_y", "no_repeat"])
  })

  it("should have LabelOrientation", () => {
    expect([...enums.LabelOrientation]).to.be.equal(["vertical", "horizontal", "parallel", "normal"])
  })

  it("should have TooltipAttachment", () => {
    expect([...enums.TooltipAttachment]).to.be.equal(["horizontal", "vertical", "left", "right", "above", "below"])
  })

  it("should have UpdateMode", () => {
    expect([...enums.UpdateMode]).to.be.equal(["replace", "append"])
  })

  it("should have VerticalAlign", () => {
    expect([...enums.VerticalAlign]).to.be.equal(["top", "middle", "bottom"])
  })

  it("should have ToolIcon", () => {
    expect([...enums.ToolIcon]).to.be.equal([
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
    ])
  })
})
