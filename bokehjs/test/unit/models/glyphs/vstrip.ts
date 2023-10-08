import {expect} from "assertions"

import type {DataOf} from "./_util"
import {create_glyph_view} from "./_util"
import {VStrip} from "@bokehjs/models/glyphs/vstrip"
import type {PointGeometry} from "@bokehjs/core/geometry"

describe("VStrip", () => {

  it("should calculate bounds", async () => {
    const glyph = new VStrip()
    const data = {x0: [0, 5, 5, 10, 50], x1: [1, 7, 8, 15, 80]} satisfies DataOf<VStrip>
    const glyph_view = await create_glyph_view(glyph, data)
    const bounds = glyph_view.bounds()
    expect(bounds).to.be.equal({x0: 0, x1: 80, y0: NaN, y1: NaN})
  })

  it("should calculate log bounds", async () => {
    const glyph = new VStrip()
    const data = {x0: [0, 5, 5, 10, 50], x1: [1, 7, 8, 15, 80]} satisfies DataOf<VStrip>
    const glyph_view = await create_glyph_view(glyph, data)
    const log_bounds = glyph_view.log_bounds()
    expect(log_bounds).to.be.equal({x0: 5, x1: 80, y0: NaN, y1: NaN})
  })

  describe("_hit_point", () => {

    it("should return indices of the VStrip that was hit", async () => {
      const glyph = new VStrip()
      const data = {x0: [0, 5, 5, 10, 50, 60], x1: [1, 7, 8, 15, 80, 70]} satisfies DataOf<VStrip>
      const glyph_view = await create_glyph_view(glyph, data, {axis_type: "linear"})

      const {x_scale, y_scale} = glyph_view.parent.coordinates
      function compute(x: number, y: number) {
        return {sx: x_scale.compute(x), sy: y_scale.compute(y)}
      }

      function x_indices(x: number) {
        const geometry = {type: "point", ...compute(x, 50)} satisfies PointGeometry
        return glyph_view.hit_test(geometry)?.indices
      }

      expect(x_indices(0)).to.be.equal([0])
      expect(x_indices(5)).to.be.equal([1, 2])
      expect(x_indices(7)).to.be.equal([1, 2])
      expect(x_indices(8)).to.be.equal([2])
      expect(x_indices(10)).to.be.equal([3])
      expect(x_indices(45)).to.be.equal([])
      expect(x_indices(50)).to.be.equal([4])
      expect(x_indices(55)).to.be.equal([4])
      expect(x_indices(60)).to.be.equal([4, 5])
      expect(x_indices(65)).to.be.equal([4, 5])
      expect(x_indices(70)).to.be.equal([4, 5])
      expect(x_indices(75)).to.be.equal([4])
      expect(x_indices(80)).to.be.equal([4])
      expect(x_indices(85)).to.be.equal([])
    })
  })
})
