import {expect} from "#framework/assertions"
import {create_glyph_view} from "./_util"
import {Circle} from "@bokehjs/models/glyphs/circle"

describe("Circle rectangle hits", () => {
  it("should select by centers, including boundaries, rather than radius overlap", async () => {
    const view = await create_glyph_view(Circle.create({radius: 10}), {x: [40, 50, 60], y: [50, 50, 50]})
    const sx0 = view.sx[0], sx1 = view.sx[1], sy = view.sy[0]
    expect(view.hit_test({type: "rect", sx0, sx1, sy0: sy - 1, sy1: sy + 1})?.indices).to.be.equal(new Int32Array([0, 1]))
  })

  it("should accept selection corners in either order", async () => {
    const view = await create_glyph_view(Circle.create({radius: 10}), {x: [40, 50, 60], y: [50, 50, 50]})
    const sx0 = view.sx[0], sx1 = view.sx[1], sy = view.sy[0]
    expect(view.hit_test({type: "rect", sx0: sx1, sx1: sx0, sy0: sy + 1, sy1: sy - 1})?.indices).to.be.equal(new Int32Array([0, 1]))
  })
})
