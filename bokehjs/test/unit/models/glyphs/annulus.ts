import {expect} from "assertions"

import {create_glyph_renderer_view} from "./_util"
import {Annulus} from "@bokehjs/models/glyphs/annulus"
import type {Geometry} from "@bokehjs/core/geometry"

describe("Glyph (using Annulus as a concrete Glyph)", () => {

  describe("GlyphView", () => {

    it("should calculate bounds based on data", async () => {
      const data = {
        x: [1, 10, 5, 30],
        y: [10, 60, 30, 80],
        r: [1, 2, 3, 4],
      }
      const glyph = new Annulus({
        x: {field: "x"},
        y: {field: "y"},
        inner_radius: {value: 2},
        outer_radius: {field: "r"},
      })

      const glyph_renderer = await create_glyph_renderer_view(glyph, data, {axis_type: "linear"})
      const glyph_view = glyph_renderer.glyph
      const bounds = glyph_view.bounds()

      expect(bounds).to.be.equal({x0: 0, y0: 9, x1: 34, y1: 84})
    })

    it("should hit test against an index", async () => {
      const data = {}
      const glyph = new Annulus({
        x: {value: 50},
        y: {value: 50},
        inner_radius: {value: 25},
        outer_radius: {value: 50},
      })

      const glyph_renderer = await create_glyph_renderer_view(glyph, data, {axis_type: "linear"})
      const glyph_view = glyph_renderer.glyph

      const geometries: Geometry[] = [
        // Points just inside and outside the outer circle
        {type: "point", sx: 100 +  90, sy: 100},        // Right, inside
        {type: "point", sx: 100 + 110, sy: 100},        // Right, outside
        {type: "point", sx: 100,       sy: 100 -  90},  // Top, inside
        {type: "point", sx: 100,       sy: 100 - 110},  // Top, outside
        {type: "point", sx: 100 -  90, sy: 100},        // Left, inside
        {type: "point", sx: 100 - 110, sy: 100},        // Left, outside
        {type: "point", sx: 100,       sy: 100 +  90},  // Bottom, inside
        {type: "point", sx: 100,       sy: 100 + 110},  // Bottom, outside
        // Points just inside and outside the inner circle
        {type: "point", sx: 100 + 40, sy: 100},       // Right, inside
        {type: "point", sx: 100 + 60, sy: 100},       // Right, outside
        {type: "point", sx: 100,      sy: 100 - 40},  // Top, inside
        {type: "point", sx: 100,      sy: 100 - 60},  // Top, outside
        {type: "point", sx: 100 - 40, sy: 100},       // Left, inside
        {type: "point", sx: 100 - 60, sy: 100},       // Left, outside
        {type: "point", sx: 100,      sy: 100 + 40},  // Bottom, inside
        {type: "point", sx: 100,      sy: 100 + 60},  // Bottom, outside
      ]

      const expected_hits = [
        [0],
        [],
        [0],
        [],
        [0],
        [],
        [0],
        [],
        [],
        [0],
        [],
        [0],
        [],
        [0],
        [],
        [0],
      ]

      for (let i = 0; i < geometries.length; i++) {
        const result = glyph_view.hit_test(geometries[i])
        expect(result?.indices).to.be.equal(expected_hits[i])
      }
    })
  })
})
