import {display, fig, row} from "#framework/layouts"
import {NormalHead, OpenHead, TeeHead, VeeHead} from "@bokehjs/models"
import type {OutputBackend} from "@bokehjs/core/enums"

describe("Arrowhead angle overrides", () => {
  for (const Head of [NormalHead, OpenHead, TeeHead, VeeHead]) {
    it(`should keep a fixed screen orientation for ${Head.name}`, async () => {
      function plot(angle: number | null, output_backend: OutputBackend) {
        const p = fig([220, 220], {
          x_range: [-1, 5], y_range: [-1, 6], output_backend,
          title: angle == null ? "Automatic" : `Fixed angle: ${output_backend}`,
        })
        const head = Head.create({size: 20})
        const renderer = p.segment({
          x0: [0, 0, 0], y0: [1, 3, 5],
          x1: [4, 4, 4], y1: [1, 4, 3],
          line_color: "navy", line_width: 2, level: "annotation",
        })
        for (const node of ["start", "end"] as const) {
          renderer.add_path_marking(head, {at: node, angle: angle ?? 0, angle_reference: angle == null ? "auto" : "screen"})
        }
        return p
      }

      await display(row([plot(null, "canvas"), plot(0, "canvas"), plot(0, "svg")]))
    })
  }

  for (const output_backend of ["canvas", "svg"] as const) {
    it(`should orient zero-length tee caps in ${output_backend}`, async () => {
      const p = fig([300, 220], {
        x_range: [0, 3], y_range: [0, 3], output_backend,
      })
      for (const [x, angle] of [[1, 0], [2, -Math.PI/2]]) {
        const renderer = p.segment({x0: x, y0: 1.5, x1: x, y1: 1.5, line_alpha: 0, level: "annotation"})
        renderer.add_path_marking(TeeHead.create({size: 30, line_width: 3}), {at: "end", angle, angle_reference: "screen"})
      }
      await display(p)
    })
  }
})
