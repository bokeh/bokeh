import {expect} from "assertions"

import {create_glyph_view} from "./_util"
import {MultiPolygons} from "@bokehjs/models/glyphs/multi_polygons"
import type {HitTestGeometry} from "@bokehjs/core/geometry"
import {DataRange1d} from "@bokehjs/models"
import type {Arrayable} from "@bokehjs/core/types"
import {unzip} from "@bokehjs/core/util/array"

type Point = [number, number]

describe("MultiPolygons", () => {

  describe("MultiPolygonsView", () => {

    it("should rect hit testing", async () => {
      const data = {
        xs: [[[[1, 5, 3]]], [[[3, 5, 5, 3]]], [[[2, 3, 2, 1]]]],
        ys: [[[[1, 1, 3]]], [[[3, 3, 5, 5]]], [[[3, 4, 5, 4]]]],
      }
      const glyph = new MultiPolygons({
        xs: {field: "xs"},
        ys: {field: "ys"},
      })

      const glyph_view = await create_glyph_view(glyph, data, {
        axis_type: "linear",
        x_range: new DataRange1d(),
        y_range: new DataRange1d(),
      })
      const {xscale, yscale} = glyph_view.parent

      function rect([x0, y0]: Point, [x1, y1]: Point, greedy: boolean): HitTestGeometry {
        const [sx0, sx1] = xscale.r_compute(x0, x1)
        const [sy0, sy1] = yscale.r_compute(y0, y1)
        return {type: "rect", sx0, sy0, sx1, sy1, greedy}
      }

      const geometry0 = rect([0, 0], [-1, 1], false)
      const geometry1 = rect([0, 0], [-1, 1], true)

      const result0 = glyph_view.hit_test(geometry0)
      expect(result0?.indices).to.be.equal([])

      const result1 = glyph_view.hit_test(geometry1)
      expect(result1?.indices).to.be.equal([])

      const geometry2 = rect([0, 0], [6, 6], false)
      const geometry3 = rect([0, 0], [6, 6], true)

      const result2 = glyph_view.hit_test(geometry2)
      expect(result2?.indices).to.be.equal([0, 1, 2])

      const result3 = glyph_view.hit_test(geometry3)
      expect(result3?.indices).to.be.equal([0, 1, 2])

      const geometry4 = rect([0, 0], [6, 4], false)
      const geometry5 = rect([0, 0], [6, 4], true)

      const result4 = glyph_view.hit_test(geometry4)
      expect(result4?.indices).to.be.equal([0])

      const result5 = glyph_view.hit_test(geometry5)
      expect(result5?.indices).to.be.equal([0, 1, 2])
    })

    it("should poly hit testing", async () => {
      const data = {
        xs: [[[[1, 5, 3]]], [[[3, 5, 5, 3]]], [[[2, 3, 2, 1]]]],
        ys: [[[[1, 1, 3]]], [[[3, 3, 5, 5]]], [[[3, 4, 5, 4]]]],
      }
      const glyph = new MultiPolygons({
        xs: {field: "xs"},
        ys: {field: "ys"},
      })

      const glyph_view = await create_glyph_view(glyph, data, {
        axis_type: "linear",
        x_range: new DataRange1d(),
        y_range: new DataRange1d(),
      })
      const {xscale, yscale} = glyph_view.parent

      function compute(points: Point[]): {sx: Arrayable<number>, sy: Arrayable<number>} {
        const [x=[], y=[]] = unzip(points)
        return {
          sx: xscale.v_compute(x),
          sy: yscale.v_compute(y),
        }
      }

      function poly(points: Point[], greedy: boolean): HitTestGeometry {
        return {type: "poly", ...compute(points), greedy}
      }

      const geometry0 = poly([], false)
      const geometry1 = poly([], true)

      const result0 = glyph_view.hit_test(geometry0)
      expect(result0?.indices).to.be.equal([])

      const result1 = glyph_view.hit_test(geometry1)
      expect(result1?.indices).to.be.equal([])

      const geometry2 = poly([[0, 0], [6, 0], [6, 6], [0, 6], [0, 0]], false)
      const geometry3 = poly([[0, 0], [6, 0], [6, 6], [0, 6], [0, 0]], true)

      const result2 = glyph_view.hit_test(geometry2)
      expect(result2?.indices).to.be.equal([0, 1, 2])

      const result3 = glyph_view.hit_test(geometry3)
      expect(result3?.indices).to.be.equal([0, 1, 2])

      const geometry4 = poly([[0, 0], [6, 0], [6, 4], [0, 4], [0, 0]], false)
      const geometry5 = poly([[0, 0], [6, 0], [6, 4], [0, 4], [0, 0]], true)

      const result4 = glyph_view.hit_test(geometry4)
      expect(result4?.indices).to.be.equal([0])

      const result5 = glyph_view.hit_test(geometry5)
      expect(result5?.indices).to.be.equal([0, 1, 2])
    })
  })
})
