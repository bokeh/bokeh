import {
  cross_display, fig, base, grid_range, grid_positions,
  sweep_line_dash, sweep_line_cap, sweep_line_join, sweep_line_width,
  sweep_hatch_pattern,
  sweep_fill_alpha, sweep_line_alpha, sweep_hatch_alpha,
  line_dashes, line_caps, line_joins, line_widths, hatch_patterns, alphas,
} from "./_util"
import type {GlyphFn} from "./_util"

import type {RadiusDimension} from "@bokehjs/core/enums"
import {Random} from "@bokehjs/core/util/random"

const circle: GlyphFn = (p, x, y, props) => {
  p.circle({x, y, radius: 0.3, ...props})
}

describe("Cross-backend comparison", () => {
  const random = new Random(1)
  const N = 10
  const x = random.floats(N)
  const y = random.floats(N)

  describe("Circle", () => {
    it.cross()("basic circle", async () => {
      await cross_display((backend) => {
        const p = fig([200, 200], {output_backend: backend, ...base})
        p.circle({
          x, y,
          radius: 0.04,
          fill_color: "orange",
          line_color: "navy",
          alpha: 0.5,
        })
        return p
      })
    })

    it.cross()("with all radius values", async () => {
      const radii = [0.1, 0.2, 0.4, 0.6, 0.8]
      const range = grid_range(radii.length)
      const pos = grid_positions(radii.length)
      await cross_display((backend) => {
        const p = fig([300, 300], {x_range: range, y_range: range, output_backend: backend, ...base})
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
            output_backend: backend, ...base,
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
      const range = grid_range(line_widths.length)
      await cross_display((backend) => {
        const p = fig([300, 300], {x_range: range, y_range: range, output_backend: backend, ...base})
        sweep_line_width(p, circle)
        return p
      })
    })

    it.cross()("with all line_dash values", async () => {
      const range = grid_range(line_dashes.length)
      await cross_display((backend) => {
        const p = fig([300, 300], {x_range: range, y_range: range, output_backend: backend, ...base})
        sweep_line_dash(p, circle)
        return p
      })
    })

    it.cross()("with all line_cap values", async () => {
      const range = grid_range(line_caps.length)
      await cross_display((backend) => {
        const p = fig([300, 300], {x_range: range, y_range: range, output_backend: backend, ...base})
        sweep_line_cap(p, circle)
        return p
      })
    })

    it.cross()("with all line_join values", async () => {
      const range = grid_range(line_joins.length)
      await cross_display((backend) => {
        const p = fig([300, 300], {x_range: range, y_range: range, output_backend: backend, ...base})
        sweep_line_join(p, circle)
        return p
      })
    })

    it.cross()("with all line_alpha values", async () => {
      const range = grid_range(alphas.length)
      await cross_display((backend) => {
        const p = fig([300, 300], {x_range: range, y_range: range, output_backend: backend, ...base})
        sweep_line_alpha(p, circle)
        return p
      })
    })

    it.cross()("with all fill_alpha values", async () => {
      const range = grid_range(alphas.length)
      await cross_display((backend) => {
        const p = fig([300, 300], {x_range: range, y_range: range, output_backend: backend, ...base})
        sweep_fill_alpha(p, circle)
        return p
      })
    })

    it.cross()("with all hatch_pattern values", async () => {
      const range = grid_range(hatch_patterns.length)
      await cross_display((backend) => {
        const p = fig([400, 400], {x_range: range, y_range: range, output_backend: backend, ...base})
        sweep_hatch_pattern(p, circle)
        return p
      })
    })

    it.cross()("with all hatch_alpha values", async () => {
      const range = grid_range(alphas.length)
      await cross_display((backend) => {
        const p = fig([300, 300], {x_range: range, y_range: range, output_backend: backend, ...base})
        sweep_hatch_alpha(p, circle)
        return p
      })
    })
  })
})
