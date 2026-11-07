import {expect, expect_not_null} from "#framework/assertions"

import {create_glyph_view} from "./_util"
import {OpenHead, TeeHead, ArrowHeadView} from "@bokehjs/models/annotations/arrow_head"
import {WhiskerGlyph} from "@bokehjs/models/glyphs/whisker"

describe("WhiskerGlyph", () => {
  const data = {lower: [1, 2], upper: [3, 4], base: [5, 6]}

  it("should map lower and upper along y-axis when dimension == 'height'", async () => {
    const glyph = WhiskerGlyph.create({dimension: "height"})
    const view = await create_glyph_view(glyph, data)
    const {x_scale, y_scale} = view.renderer.coordinates

    expect(view.lower_sx).to.be.equal(x_scale.v_compute([5, 6]))
    expect(view.lower_sy).to.be.equal(y_scale.v_compute([1, 2]))
    expect(view.upper_sx).to.be.equal(x_scale.v_compute([5, 6]))
    expect(view.upper_sy).to.be.equal(y_scale.v_compute([3, 4]))
  })

  it("should map lower and upper along x-axis when dimension == 'width'", async () => {
    const glyph = WhiskerGlyph.create({dimension: "width"})
    const view = await create_glyph_view(glyph, data)
    const {x_scale, y_scale} = view.renderer.coordinates

    expect(view.lower_sx).to.be.equal(x_scale.v_compute([1, 2]))
    expect(view.lower_sy).to.be.equal(y_scale.v_compute([5, 6]))
    expect(view.upper_sx).to.be.equal(x_scale.v_compute([3, 4]))
    expect(view.upper_sy).to.be.equal(y_scale.v_compute([5, 6]))
  })

  it("should index whiskers in data space", async () => {
    const glyph = WhiskerGlyph.create({dimension: "height"})
    const view = await create_glyph_view(glyph, data)
    expect(view.index.bbox).to.be.equal({x0: 5, y0: 1, x1: 6, y1: 4})
  })

  it("should build views for lower and upper heads", async () => {
    const glyph = WhiskerGlyph.create({lower_head: null})
    const view = await create_glyph_view(glyph, data)

    const heads = view._children_views().filter((child) => child instanceof ArrowHeadView)
    expect(heads.length).to.be.equal(1)
    expect(heads[0].model).to.be.instanceof(TeeHead)
    expect(heads[0].parent).to.be.equal(view)
  })

  it("should rebuild head views when heads change", async () => {
    const glyph = WhiskerGlyph.create()
    const view = await create_glyph_view(glyph, data)

    const upper_head = OpenHead.create()
    glyph.setv({lower_head: null, upper_head})
    await view.ready

    const heads = view._children_views().filter((child) => child instanceof ArrowHeadView)
    expect(heads.length).to.be.equal(1)
    const [head] = heads
    expect_not_null(head)
    expect(head.model).to.be.equal(upper_head)
  })
})
