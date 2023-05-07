import {expect} from "assertions"

import {create_glyph_view, DataOf} from "./_util"
import {HStrip} from "@bokehjs/models/glyphs/hstrip"
import {Geometry} from "@bokehjs/core/geometry"
import {assert} from "@bokehjs/core/util/assert"

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
      const data = {y0: [0, 5, 5, 10, 50], y1: [1, 7, 8, 15, 80]} satisfies DataOf<HStrip>
      const glyph_view = await create_glyph_view(glyph, data, {axis_type: "linear"})

      const {x_scale, y_scale} = glyph_view.parent.coordinates
      function compute(x: number, y: number) {
        return {sx: x_scale.compute(x), sy: y_scale.compute(y)}
      }

      const geometry0: Geometry = {type: "point", ...compute(50,  0)}
      const geometry1: Geometry = {type: "point", ...compute(50,  5)}
      const geometry2: Geometry = {type: "point", ...compute(50,  7)}
      const geometry3: Geometry = {type: "point", ...compute(50,  8)}
      const geometry4: Geometry = {type: "point", ...compute(50, 10)}
      const geometry5: Geometry = {type: "point", ...compute(50, 50)}
      const geometry6: Geometry = {type: "point", ...compute(50, 90)}

      const result0 = glyph_view.hit_test(geometry0)
      const result1 = glyph_view.hit_test(geometry1)
      const result2 = glyph_view.hit_test(geometry2)
      const result3 = glyph_view.hit_test(geometry3)
      const result4 = glyph_view.hit_test(geometry4)
      const result5 = glyph_view.hit_test(geometry5)
      const result6 = glyph_view.hit_test(geometry6)

      assert(result0 != null)
      assert(result1 != null)
      assert(result2 != null)
      assert(result3 != null)
      assert(result4 != null)
      assert(result5 != null)
      assert(result6 != null)

      expect(result0.indices).to.be.equal([0])
      expect(result1.indices).to.be.equal([1, 2])
      expect(result2.indices).to.be.equal([1, 2])
      expect(result3.indices).to.be.equal([2])
      expect(result4.indices).to.be.equal([3])
      expect(result5.indices).to.be.equal([4])
      expect(result6.indices).to.be.equal([])
    })
  })
})
