import {expect} from "#framework/assertions"
import {display, fig} from "#framework/layouts"
import {require_glglyph} from "#framework/webgl"

import {ColumnDataSource} from "@bokehjs/models/sources/column_data_source"
import {GlyphRenderer} from "@bokehjs/models/renderers/glyph_renderer"
import {Wedge} from "@bokehjs/models/glyphs/wedge"
import {AnnularWedge} from "@bokehjs/models/glyphs/annular_wedge"

describe("WebGL wedge glyphs", () => {
  // For an empty wedge (start_angle == end_angle) the shader computes cross_z(a, b) == 0,
  // which used to be drawn as a full disc. The angle itself is arbitrary.
  const a = 2*Math.PI*1200/1380

  for (const glyph_type of ["Wedge", "AnnularWedge"] as const) {
    it(`should not render ${glyph_type} with start_angle == end_angle`, async () => {
      // Wedge 0 is a red half disc around angle 0, the empty wedge 1 (blue) is drawn on top of it.
      const source = ColumnDataSource.create({data: {
        start_angle: [-0.5*Math.PI, a],
        end_angle: [0.5*Math.PI, a],
        color: ["red", "blue"],
      }})
      const attrs = {
        x: 0, y: 0, line_color: null, fill_color: {field: "color"},
        start_angle: {field: "start_angle"}, end_angle: {field: "end_angle"},
      }
      const glyph = glyph_type == "Wedge" ?
        Wedge.create({...attrs, radius: 1}) :
        AnnularWedge.create({...attrs, inner_radius: 0.2, outer_radius: 1})
      const renderer = GlyphRenderer.create({glyph, data_source: source})
      const plot = fig([200, 200], {output_backend: "webgl", x_range: [-1.1, 1.1], y_range: [-1.1, 1.1], renderers: [renderer]})
      plot.xgrid.visible = false
      plot.ygrid.visible = false
      const {view} = await display(plot)
      require_glglyph(view.owner.get_one(renderer).glyph)

      const {ctx, pixel_ratio} = view.canvas_view.primary
      const sx = Math.floor(view.frame.x_scale.compute(0.6)*pixel_ratio)
      const sy = Math.floor(view.frame.y_scale.compute(0)*pixel_ratio)
      expect([...ctx.getImageData(sx, sy, 1, 1).data]).to.be.equal([255, 0, 0, 255])
    })
  }
})
