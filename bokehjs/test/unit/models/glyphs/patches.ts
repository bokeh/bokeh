import {expect} from "assertions"

import {create_glyph_view} from "./glyph_utils"
import {Patches} from "@bokehjs/models/glyphs/patches"
import {Geometry} from "@bokehjs/core/geometry"
import {assert} from "@bokehjs/core/util/assert"

describe("Patches", () => {

  describe("PatchesView", () => {
    it("should hit test rects for containment", async () => {
      const data = {xs: [[0, 10, 5], [5, 10, 10, 5]], ys: [[0, 0, 10], [10, 10, 20, 20]]}
      const glyph = new Patches({
        xs: {field: "xs"},
        ys: {field: "ys"},
      })

      const glyph_view = await create_glyph_view(glyph, data, {axis_type: "linear"})

      const geometry1: Geometry = {type: "rect", sx0: -1, sy0: 201, sx1: 21, sy1: 179}
      const geometry2: Geometry = {type: "rect", sx0: 1,  sy0: 200, sx1: 20, sy1: 180}
      const geometry3: Geometry = {type: "rect", sx0: 9,  sy0: 181, sx1: 21, sy1: 159}
      const geometry4: Geometry = {type: "rect", sx0: 10, sy0: 180, sx1: 19, sy1: 165}
      const geometry5: Geometry = {type: "rect", sx0: 5,  sy0: 190, sx1: 15, sy1: 170}
      const geometry6: Geometry = {type: "rect", sx0: -1, sy0: 201, sx1: 21, sy1: 159}

      const result1 = glyph_view.hit_test(geometry1)
      const result2 = glyph_view.hit_test(geometry2)
      const result3 = glyph_view.hit_test(geometry3)
      const result4 = glyph_view.hit_test(geometry4)
      const result5 = glyph_view.hit_test(geometry5)
      const result6 = glyph_view.hit_test(geometry6)

      assert(result1 != null)
      expect(result1.indices).to.be.equal([0])
      assert(result2 != null)
      expect(result2.indices).to.be.equal([])
      assert(result3 != null)
      expect(result3.indices).to.be.equal([1])
      assert(result4 != null)
      expect(result4.indices).to.be.equal([])
      assert(result5 != null)
      expect(result5.indices).to.be.equal([])
      assert(result6 != null)
      expect(result6.indices).to.be.equal([0, 1])
    })
  })
})
