import {expect} from "assertions"

import type {DataOf} from "./_util"
import {create_glyph_view} from "./_util"
import {HStrip} from "@bokehjs/models/glyphs/hstrip"
import type {PointGeometry} from "@bokehjs/core/geometry"

describe("HStrip", () => {

  it("should calculate bounds", async () => {
    const glyph = new HStrip()
    const data = {y0: [0, 5, 5, 10, 50], y1: [1, 7, 8, 15, 80]} satisfies DataOf<HStrip>
    const glyph_view = await create_glyph_view(glyph, data)
    const bounds = glyph_view.bounds()
    expect(bounds).to.be.equal({x0: NaN, x1: NaN, y0: 0, y1: 80})
  })

  it("should calculate log bounds", async () => {
    const glyph = new HStrip()
    const data = {y0: [0, 5, 5, 10, 50], y1: [1, 7, 8, 15, 80]} satisfies DataOf<HStrip>
    const glyph_view = await create_glyph_view(glyph, data)
    const log_bounds = glyph_view.log_bounds()
    expect(log_bounds).to.be.equal({x0: NaN, x1: NaN, y0: 5, y1: 80})
  })

  describe("_hit_point", () => {

    it("should return indices of the HStrip that was hit", async () => {
      const glyph = new HStrip()
      const data = {y0: [0, 5, 5, 10, 50, 60], y1: [1, 7, 8, 15, 80, 70]} satisfies DataOf<HStrip>
      const glyph_view = await create_glyph_view(glyph, data, {axis_type: "linear"})

      const {x_scale, y_scale} = glyph_view.parent.coordinates
      function compute(x: number, y: number) {
        return {sx: x_scale.compute(x), sy: y_scale.compute(y)}
      }

      function y_indices(y: number) {
        const geometry = {type: "point", ...compute(50, y)} satisfies PointGeometry
        return glyph_view.hit_test(geometry)?.indices
      }

      expect(y_indices(0)).to.be.equal([0])
      expect(y_indices(5)).to.be.equal([1, 2])
      expect(y_indices(7)).to.be.equal([1, 2])
      expect(y_indices(8)).to.be.equal([2])
      expect(y_indices(10)).to.be.equal([3])
      expect(y_indices(45)).to.be.equal([])
      expect(y_indices(50)).to.be.equal([4])
      expect(y_indices(55)).to.be.equal([4])
      expect(y_indices(60)).to.be.equal([4, 5])
      expect(y_indices(65)).to.be.equal([4, 5])
      expect(y_indices(70)).to.be.equal([4, 5])
      expect(y_indices(75)).to.be.equal([4])
      expect(y_indices(80)).to.be.equal([4])
      expect(y_indices(85)).to.be.equal([])
    })
  })
})
