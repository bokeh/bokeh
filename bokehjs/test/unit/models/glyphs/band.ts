import {expect} from "#framework/assertions"

import {create_glyph_view} from "./_util"
import {BandGlyph} from "@bokehjs/models/glyphs/band"

describe("BandGlyph", () => {
  const data = {lower: [1, 2], upper: [3, 4], base: [5, 6]}

  it("should map lower and upper along y-axis when dimension == 'height'", async () => {
    const glyph = BandGlyph.create({dimension: "height"})
    const view = await create_glyph_view(glyph, data)
    const {x_scale, y_scale} = view.renderer.coordinates

    expect(view.lower_sx).to.be.equal(x_scale.v_compute([5, 6]))
    expect(view.lower_sy).to.be.equal(y_scale.v_compute([1, 2]))
    expect(view.upper_sx).to.be.equal(x_scale.v_compute([5, 6]))
    expect(view.upper_sy).to.be.equal(y_scale.v_compute([3, 4]))
  })

  it("should map lower and upper along x-axis when dimension == 'width'", async () => {
    const glyph = BandGlyph.create({dimension: "width"})
    const view = await create_glyph_view(glyph, data)
    const {x_scale, y_scale} = view.renderer.coordinates

    expect(view.lower_sx).to.be.equal(x_scale.v_compute([1, 2]))
    expect(view.lower_sy).to.be.equal(y_scale.v_compute([5, 6]))
    expect(view.upper_sx).to.be.equal(x_scale.v_compute([3, 4]))
    expect(view.upper_sy).to.be.equal(y_scale.v_compute([5, 6]))
  })

  it("should index the band in data space", async () => {
    const glyph = BandGlyph.create({dimension: "height"})
    const view = await create_glyph_view(glyph, data)
    expect(view.index.bbox).to.be.equal({x0: 5, y0: 1, x1: 6, y1: 4})
  })

  it("should index the band when lower is above upper", async () => {
    const glyph = BandGlyph.create({dimension: "width"})
    const view = await create_glyph_view(glyph, {lower: [3, 4], upper: [1, 2], base: [5, 6]})
    expect(view.index.bbox).to.be.equal({x0: 1, y0: 5, x1: 4, y1: 6})
  })
})
