import {expect} from "assertions"

import type {DataOf} from "./_util"
import {create_glyph_view} from "./_util"
import {VSpan} from "@bokehjs/models/glyphs/vspan"
import type {Geometry} from "@bokehjs/core/geometry"

describe("VSpan", () => {

  it("should calculate bounds", async () => {
    const glyph = new VSpan()
    const data = {x: [0, 1, 2, 3]} satisfies DataOf<VSpan>
    const glyph_view = await create_glyph_view(glyph, data)
    const bounds = glyph_view.bounds()
    expect(bounds).to.be.equal({x0: 0, x1: 3, y0: NaN, y1: NaN})
  })

  it("should calculate log bounds", async () => {
    const glyph = new VSpan()
    const data = {x: [0, 1, 2, 3]} satisfies DataOf<VSpan>
    const glyph_view = await create_glyph_view(glyph, data)
    const log_bounds = glyph_view.log_bounds()
    expect(log_bounds).to.be.equal({x0: 1, x1: 3, y0: NaN, y1: NaN})
  })

  describe("_hit_point", () => {

    it("should return indices of the VSpan that was hit", async () => {
      const glyph = new VSpan()
      const data = {x: [0, 10, 50, 90]} satisfies DataOf<VSpan>
      const glyph_view = await create_glyph_view(glyph, data, {axis_type: "linear"})

      const {x_scale, y_scale} = glyph_view.parent.coordinates
      function compute(x: number, y: number) {
        return {sx: x_scale.compute(x), sy: y_scale.compute(y)}
      }

      const geometry0: Geometry = {type: "point", ...compute(0,  50)}
      const geometry1: Geometry = {type: "point", ...compute(10, 50)}
      const geometry2: Geometry = {type: "point", ...compute(50, 50)}
      const geometry3: Geometry = {type: "point", ...compute(90, 50)}
      const geometry4: Geometry = {type: "point", ...compute(95, 50)}

      const result0 = glyph_view.hit_test(geometry0)
      const result1 = glyph_view.hit_test(geometry1)
      const result2 = glyph_view.hit_test(geometry2)
      const result3 = glyph_view.hit_test(geometry3)
      const result4 = glyph_view.hit_test(geometry4)

      expect(result0?.indices).to.be.equal([0])
      expect(result1?.indices).to.be.equal([1])
      expect(result2?.indices).to.be.equal([2])
      expect(result3?.indices).to.be.equal([3])
      expect(result4?.indices).to.be.equal([])
    })
  })
})
