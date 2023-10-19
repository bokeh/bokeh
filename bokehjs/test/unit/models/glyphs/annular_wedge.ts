import {expect} from "assertions"

import {create_glyph_renderer_view} from "./_util"
import {AnnularWedge} from "@bokehjs/models/glyphs/annular_wedge"
import type {Geometry} from "@bokehjs/core/geometry"

describe("Glyph (using AnnularWedge as a concrete Glyph)", () => {

  describe("GlyphView", () => {
    it("should hit test annular wedges against an index", async () => {
      const data = {
        start_angle: [-0.25*Math.PI, 0.25*Math.PI, 0.75*Math.PI, 1.25*Math.PI],
        end_angle: [0.25*Math.PI, 0.75*Math.PI, 1.25*Math.PI, 1.75*Math.PI],
      }
      const glyph = new AnnularWedge({
        x: {value: 50},
        y: {value: 50},
        inner_radius: {value: 25},
        outer_radius: {value: 50},
        start_angle: {field: "start_angle"},
        end_angle: {field: "end_angle"},
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
        [1],
        [],
        [2],
        [],
        [3],
        [],
        [],
        [0],
        [],
        [1],
        [],
        [2],
        [],
        [3],
      ]

      for (let i = 0; i < geometries.length; i++) {
        const result = glyph_view.hit_test(geometries[i])
        expect(result?.indices).to.be.equal(expected_hits[i])
      }

      // Re-run hit tests with double the Y scale, keeping its center the same.
      // Wedges are drawn as circles in screen space and the radius is defined
      // along the X axis. This should not affect the hit-test result.
      glyph_renderer.yscale.source_range.start -= 100
      glyph_renderer.yscale.source_range.end += 100
      for (let i = 0; i < geometries.length; i++) {
        const result = glyph_view.hit_test(geometries[i])
        expect(result?.indices).to.be.equal(expected_hits[i])
      }
    })

    it("should hit test full circle annular wedges against an index", async () => {
      const data = {
        // Single annular wedge going all the way around
        start_angle: [0],
        end_angle: [2*Math.PI],
      }
      const glyph = new AnnularWedge({
        x: {value: 50},
        y: {value: 50},
        inner_radius: {value: 25},
        outer_radius: {value: 50},
        start_angle: {field: "start_angle"},
        end_angle: {field: "end_angle"},
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
