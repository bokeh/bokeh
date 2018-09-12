import {expect} from "chai"

import * as enums from "core/enums"

describe("enums module", () => {
  it("should have AngleUnits", () => {
    expect(enums.AngleUnits).to.be.deep.equal(["deg", "rad"])
  })

  it("should have Direction", () => {
    expect(enums.Direction).to.be.deep.equal(["clock", "anticlock"])
  })

  it("should have FontStyle", () => {
    expect(enums.FontStyle).to.be.deep.equal(["normal", "italic", "bold", "bold italic"])
  })

  it("should have LineCap", () => {
    expect(enums.LineCap).to.be.deep.equal(["butt", "round", "square"])
  })

  it("should have LineJoin", () => {
    expect(enums.LineJoin).to.be.deep.equal(["miter", "round", "bevel"])
  })

  it("should have Location", () => {
    expect(enums.Location).to.be.deep.equal(["above", "below", "left", "right"])
  })

  it("should have OutputBackend", () => {
    expect(enums.OutputBackend).to.be.deep.equal(["canvas", "svg", "webgl"])
  })

  it("should have RenderMode", () => {
    expect(enums.RenderMode).to.be.deep.equal(["canvas", "css"])
  })

  it("should have RenderLevel", () => {
    expect(enums.RenderLevel).to.be.deep.equal(["image", "underlay", "glyph", "annotation", "overlay"])
  })

  it("should have Side", () => {
    expect(enums.Side).to.be.deep.equal(["above", "below", "left", "right"])
  })

  it("should have SpatialUnits", () => {
    expect(enums.SpatialUnits).to.be.deep.equal(["screen", "data"])
  })

  it("should have StartEnd", () => {
    expect(enums.StartEnd).to.be.deep.equal(["start", "end"])
  })

  it("should have TextAlign", () => {
    expect(enums.TextAlign).to.be.deep.equal(["left", "right", "center"])
  })

  it("should have TextBaseline", () => {
    expect(enums.TextBaseline).to.be.deep.equal(["top", "middle", "bottom", "alphabetic", "hanging", "ideographic"])
  })

  it("should have SizingMode", () => {
    expect(enums.SizingMode).to.be.deep.equal(["stretch_both", "scale_width", "scale_height", "scale_both", "fixed"])
  })
})
