import {expect} from "#framework/assertions"

import {create_glyph_view} from "./_util"
import {Patch} from "@bokehjs/models/glyphs/patch"
import type {HitTestGeometry} from "@bokehjs/core/geometry"
import {DataRange1d} from "@bokehjs/models"

describe("Patch", () => {

  describe("PatchView", () => {

    it("should point hit testing with a hole", async () => {
      // Outer boundary (square): 0,0 -> 10,0 -> 10,10 -> 0,10
      // Hole (inner square): 3,3 -> 3,7 -> 7,7 -> 7,3
      const data = {
        x: [0, 10, 10, 0, NaN, 3, 3, 7, 7],
        y: [0, 0, 10, 10, NaN, 3, 7, 7, 3],
      }
      const glyph = new Patch({
        x: {field: "x"},
        y: {field: "y"},
      })

      const glyph_view = await create_glyph_view(glyph, data, {
        axis_type: "linear",
        x_range: new DataRange1d(),
        y_range: new DataRange1d(),
      })
      const {xscale, yscale} = glyph_view.parent

      function point(x: number, y: number): HitTestGeometry {
        return {type: "point", sx: xscale.compute(x), sy: yscale.compute(y)}
      }

      // Point inside outer boundary but outside hole -> hit
      const result0 = glyph_view.hit_test(point(1, 1))
      expect(result0?.is_empty()).to.be.false

      // Point inside hole -> no hit
      const result1 = glyph_view.hit_test(point(5, 5))
      expect(result1?.is_empty()).to.be.true

      // Point outside outer boundary -> no hit
      const result2 = glyph_view.hit_test(point(15, 15))
      expect(result2?.is_empty()).to.be.true
    })

    it("should point hit testing with multiple holes", async () => {
      // Outer square: 0,0 -> 20,0 -> 20,20 -> 0,20
      // First hole: 3,3 -> 3,7 -> 7,7 -> 7,3
      // Second hole: 13,13 -> 13,17 -> 17,17 -> 17,13
      const data = {
        x: [0, 20, 20, 0, NaN, 3, 3, 7, 7, NaN, 13, 13, 17, 17],
        y: [0, 0, 20, 20, NaN, 3, 7, 7, 3, NaN, 13, 17, 17, 13],
      }
      const glyph = new Patch({
        x: {field: "x"},
        y: {field: "y"},
      })

      const glyph_view = await create_glyph_view(glyph, data, {
        axis_type: "linear",
        x_range: new DataRange1d(),
        y_range: new DataRange1d(),
      })
      const {xscale, yscale} = glyph_view.parent

      function point(x: number, y: number): HitTestGeometry {
        return {type: "point", sx: xscale.compute(x), sy: yscale.compute(y)}
      }

      // Point in filled region (outside both holes) -> hit
      const result0 = glyph_view.hit_test(point(10, 10))
      expect(result0?.is_empty()).to.be.false

      // Point inside first hole -> no hit
      const result1 = glyph_view.hit_test(point(5, 5))
      expect(result1?.is_empty()).to.be.true

      // Point inside second hole -> no hit
      const result2 = glyph_view.hit_test(point(15, 15))
      expect(result2?.is_empty()).to.be.true
    })

    it("should point hit testing with disjoint polygons", async () => {
      // Two disjoint squares:
      // Square 1: 0,0 -> 5,0 -> 5,5 -> 0,5
      // Square 2: 10,0 -> 15,0 -> 15,5 -> 10,5
      const data = {
        x: [0, 5, 5, 0, NaN, 10, 15, 15, 10],
        y: [0, 0, 5, 5, NaN, 0, 0, 5, 5],
      }
      const glyph = new Patch({
        x: {field: "x"},
        y: {field: "y"},
      })

      const glyph_view = await create_glyph_view(glyph, data, {
        axis_type: "linear",
        x_range: new DataRange1d(),
        y_range: new DataRange1d(),
      })
      const {xscale, yscale} = glyph_view.parent

      function point(x: number, y: number): HitTestGeometry {
        return {type: "point", sx: xscale.compute(x), sy: yscale.compute(y)}
      }

      // Point inside first square -> hit
      const result0 = glyph_view.hit_test(point(2, 2))
      expect(result0?.is_empty()).to.be.false

      // Point inside second square -> hit
      const result1 = glyph_view.hit_test(point(12, 2))
      expect(result1?.is_empty()).to.be.false

      // Point between squares -> no hit
      const result2 = glyph_view.hit_test(point(7, 2))
      expect(result2?.is_empty()).to.be.true

      // Point outside both -> no hit
      const result3 = glyph_view.hit_test(point(20, 20))
      expect(result3?.is_empty()).to.be.true
    })
  })
})
