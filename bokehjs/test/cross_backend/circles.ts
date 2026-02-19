import {fig} from "../framework"
import {
  cross_display, grid_ranges, grid_positions,
  sweep_line_dash, sweep_line_cap, sweep_line_join, sweep_line_width,
  sweep_hatch_pattern,
  sweep_fill_alpha, sweep_line_alpha, sweep_hatch_alpha,
} from "./_util"
import type {GlyphFn, CoordsFn} from "./_util"

import type {RadiusDimension} from "@bokehjs/core/enums"

const circle: GlyphFn = (p, props) => p.circle(props)

const circle_coords: CoordsFn = (num_glyphs) => {
  const pos = grid_positions(num_glyphs)
  return {
    x: pos.map((pt) => pt.x),
    y: pos.map((pt) => pt.y),
    radius: 0.3,
  }
}

describe("Cross-backend comparison", () => {
  describe("Circle", () => {
    it.cross()("basic circle", async () => {
      const coords = circle_coords(10)
      await cross_display((backend) => {
        const p = fig([200, 200], {output_backend: backend})
        p.circle({
          ...coords,
          fill_color: "orange",
          line_color: "navy",
          alpha: 0.5,
        })
        return p
      })
    })

    it.cross()("with all radius values", async () => {
      const radii = [0.1, 0.2, 0.4, 0.6, 0.8]
      const pos = grid_positions(radii.length)
      await cross_display((backend) => {
        const p = fig([300, 300], {...grid_ranges(radii.length), output_backend: backend})
        p.circle({
          x: pos.map((pt) => pt.x),
          y: pos.map((pt) => pt.y),
          radius: radii,
          fill_color: "orange",
          fill_alpha: 0.6,
          line_color: "navy",
        })
        return p
      })
    })

    for (const dim of ["x", "y", "max", "min"] as RadiusDimension[]) {
      it.cross()(`with radius_dimension ${dim}`, async () => {
        // Non-square aspect ratio so radius_dimension actually matters
        await cross_display((backend) => {
          const p = fig([300, 200], {
            x_range: [0, 6], y_range: [0, 3],
            output_backend: backend,
          })
          p.circle({
            x: [1, 3, 5], y: [1.5, 1.5, 1.5],
            radius: 0.5,
            radius_dimension: dim,
            fill_color: "orange",
            fill_alpha: 0.6,
            line_color: "navy",
          })
          return p
        })
      })
    }

    it.cross()("with all line_width values", async () => {
      await cross_display((backend) => sweep_line_width(backend, circle, circle_coords))
    })

    it.cross()("with all line_dash values", async () => {
      await cross_display((backend) => sweep_line_dash(backend, circle, circle_coords))
    })

    it.cross()("with all line_cap values", async () => {
      await cross_display((backend) => sweep_line_cap(backend, circle, circle_coords))
    })

    it.cross()("with all line_join values", async () => {
      await cross_display((backend) => sweep_line_join(backend, circle, circle_coords))
    })

    it.cross()("with all line_alpha values", async () => {
      await cross_display((backend) => sweep_line_alpha(backend, circle, circle_coords))
    })

    it.cross()("with all fill_alpha values", async () => {
      await cross_display((backend) => sweep_fill_alpha(backend, circle, circle_coords))
    })

    it.cross()("with all hatch_pattern values", async () => {
      await cross_display((backend) => sweep_hatch_pattern(backend, circle, circle_coords))
    })

    it.cross()("with all hatch_alpha values", async () => {
      await cross_display((backend) => sweep_hatch_alpha(backend, circle, circle_coords))
    })
  })
})
