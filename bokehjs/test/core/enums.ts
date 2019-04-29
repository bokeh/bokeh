import {expect} from "chai"

import * as enums from "@bokehjs/core/enums"

describe("enums module", () => {

  it("should have Anchor", () => {
    expect(enums.Anchor).to.be.deep.equal([
      "top_left",    "top_center",    "top_right",
      "center_left", "center",        "center_right",
      "bottom_left", "bottom_center", "bottom_right",
    ])
  })

  it("should have AngleUnits", () => {
    expect(enums.AngleUnits).to.be.deep.equal(["deg", "rad"])
  })

  it("should have BoxOrigin", () => {
    expect(enums.BoxOrigin).to.be.deep.equal(["corner", "center"])
  })

  it("should have ButtonType", () => {
    expect(enums.ButtonType).to.be.deep.equal(["default", "primary", "success", "warning", "danger"])
  })

  it("should have Dimension", () => {
    expect(enums.Dimension).to.be.deep.equal(["width", "height"])
  })

  it("should have Dimensions", () => {
    expect(enums.Dimensions).to.be.deep.equal(["width", "height", "both"])
  })

  it("should have Direction", () => {
    expect(enums.Direction).to.be.deep.equal(["clock", "anticlock"])
  })

  it("should have Distribution", () => {
    expect(enums.Distribution).to.be.deep.equal(["uniform", "normal"])
  })

  it("should have FontStyle", () => {
    expect(enums.FontStyle).to.be.deep.equal(["normal", "italic", "bold", "bold italic"])
  })

  it("should have HatchPatternType", () => {
    expect(enums.HatchPatternType).to.be.deep.equal([
      'blank', 'dot', 'ring', 'horizontal_line', 'vertical_line', 'cross', 'horizontal_dash',
      'vertical_dash', 'spiral' , 'right_diagonal_line', 'left_diagonal_line', 'diagonal_cross',
      'right_diagonal_dash', 'left_diagonal_dash', 'horizontal_wave', 'vertical_wave', 'criss_cross',
      ' ', '.', 'o', '-', '|', '+', '"', ':', '@', '/', '\\', 'x', ',', '`', 'v', '>', '*',
    ])
  })

  it("should have HTTPMethod", () => {
    expect(enums.HTTPMethod).to.be.deep.equal(["POST", "GET"])
  })

  it("should have HexTileOrientation", () => {
    expect(enums.HexTileOrientation).to.be.deep.equal(["pointytop", "flattop"])
  })

  it("should have HoverMode", () => {
    expect(enums.HoverMode).to.be.deep.equal(["mouse", "hline", "vline"])
  })

  it("should have LatLon", () => {
    expect(enums.LatLon).to.be.deep.equal(["lat", "lon"])
  })

  it("should have LegendClickPolicy", () => {
    expect(enums.LegendClickPolicy).to.be.deep.equal(["none", "hide", "mute"])
  })

  it("should have LegendLocation", () => {
    expect(enums.LegendLocation).to.be.deep.equal([
      "top_left",    "top_center",    "top_right",
      "center_left", "center",        "center_right",
      "bottom_left", "bottom_center", "bottom_right",
    ])
  })

  it("should have LineCap", () => {
    expect(enums.LineCap).to.be.deep.equal(["butt", "round", "square"])
  })

  it("should have LineJoin", () => {
    expect(enums.LineJoin).to.be.deep.equal(["miter", "round", "bevel"])
  })

  it("should have LinePolicy", () => {
    expect(enums.LinePolicy).to.be.deep.equal(["prev", "next", "nearest", "interp", "none"])
  })

  it("should have Location", () => {
    expect(enums.Location).to.be.deep.equal(["above", "below", "left", "right"])
  })

  it("should have Logo", () => {
    expect(enums.Logo).to.be.deep.equal(["normal", "grey"])
  })

  it("should have MarkerType", () => {
    expect(enums.MarkerType).to.be.deep.equal([
      "asterisk", "circle", "circle_cross", "circle_x", "cross",
      "dash", "diamond", "diamond_cross", "hex", "inverted_triangle",
      "square", "square_cross", "square_x", "triangle", "x",
    ])
  })

  it("should have Orientation", () => {
    expect(enums.Orientation).to.be.deep.equal(["vertical", "horizontal"])
  })

  it("should have OutputBackend", () => {
    expect(enums.OutputBackend).to.be.deep.equal(["canvas", "svg", "webgl"])
  })

  it("should have PaddingUnits", () => {
    expect(enums.PaddingUnits).to.be.deep.equal(["percent", "absolute"])
  })

  it("should have Place", () => {
    expect(enums.Place).to.be.deep.equal(["above", "below", "left", "right", "center"])
  })

  it("should have PointPolicy", () => {
    expect(enums.PointPolicy).to.be.deep.equal(["snap_to_data", "follow_mouse", "none"])
  })

  it("should have RadiusDimension", () => {
    expect(enums.RadiusDimension).to.be.deep.equal(["x", "y", "max", "min"])
  })

  it("should have RenderLevel", () => {
    expect(enums.RenderLevel).to.be.deep.equal(["image", "underlay", "glyph", "annotation", "overlay"])
  })

  it("should have RenderMode", () => {
    expect(enums.RenderMode).to.be.deep.equal(["canvas", "css"])
  })

  it("should have ResetPolicy", () => {
    expect(enums.ResetPolicy).to.be.deep.equal(["standard", "event_only"])
  })

  it("should have RoundingFunction", () => {
    expect(enums.RoundingFunction).to.be.deep.equal(["round", "nearest", "floor", "rounddown", "ceil", "roundup"])
  })

  it("should have Side", () => {
    expect(enums.Side).to.be.deep.equal(["above", "below", "left", "right"])
  })

  it("should have SizingMode", () => {
    expect(enums.SizingMode).to.be.deep.equal(["stretch_width", "stretch_height", "stretch_both", "scale_width", "scale_height", "scale_both", "fixed"])
  })

  it("should have SliedrCallbackPolicy", () => {
    expect(enums.SliderCallbackPolicy).to.be.deep.equal(["continuous", "throttle", "mouseup"])
  })

  it("should have Sort", () => {
    expect(enums.Sort).to.be.deep.equal(["ascending", "descending"])
  })

  it("should have SpatialUnits", () => {
    expect(enums.SpatialUnits).to.be.deep.equal(["screen", "data"])
  })

  it("should have StartEnd", () => {
    expect(enums.StartEnd).to.be.deep.equal(["start", "end"])
  })

  it("should have StepMode", () => {
    expect(enums.StepMode).to.be.deep.equal(["after", "before", "center"])
  })

  it("should have TapBehavior", () => {
    expect(enums.TapBehavior).to.be.deep.equal(["select", "inspect"])
  })

  it("should have TextAlign", () => {
    expect(enums.TextAlign).to.be.deep.equal(["left", "right", "center"])
  })

  it("should have TextBaseline", () => {
    expect(enums.TextBaseline).to.be.deep.equal(["top", "middle", "bottom", "alphabetic", "hanging", "ideographic"])
  })

  it("should have TextureRepetition", () => {
    expect(enums.TextureRepetition).to.be.deep.equal(["repeat", "repeat_x", "repeat_y", "no_repeat"])
  })

  it("should have TickLabelOrientation", () => {
    expect(enums.TickLabelOrientation).to.be.deep.equal(["vertical", "horizontal", "parallel", "normal"])
  })

  it("should have TooltipAttachment", () => {
    expect(enums.TooltipAttachment).to.be.deep.equal(["horizontal", "vertical", "left", "right", "above", "below"])
  })

  it("should have UpdateMode", () => {
    expect(enums.UpdateMode).to.be.deep.equal(["replace", "append"])
  })

  it("should have VerticalAlign", () => {
    expect(enums.VerticalAlign).to.be.deep.equal(["top", "middle", "bottom"])
  })
})
