import {display, fig, row} from "../_util"

import {PolyAnnotation} from "@bokehjs/models"
import type {OutputBackend} from "@bokehjs/core/enums"

describe("PolyAnnotation annotation", () => {

  it("should support positioning in data space", async () => {
    function make_plot(output_backend: OutputBackend) {
      const p = fig([200, 200], {
        x_range: [-10, 10], y_range: [-10, 10],
        output_backend, title: output_backend,
      })

      const poly0 = new PolyAnnotation({
        xs: [-8, -8, 3, 3], ys: [2, -4, -4, 2],
        line_color: "red", line_alpha: 0.9, line_width: 4,
        fill_color: "blue", fill_alpha: 0.7,
      })
      p.add_layout(poly0)

      const poly1 = new PolyAnnotation({
        xs: [-2, -2, 7, 7], ys: [8, -1, -1, 8],
        line_color: "red", line_alpha: 0.9, line_width: 2,
        fill_color: "orange", fill_alpha: 0.7,
        hatch_pattern: "@", hatch_scale: 20,
      })
      p.add_layout(poly1)

      return p
    }

    const p0 = make_plot("canvas")
    const p1 = make_plot("svg")

    await display(row([p0, p1]))
  })
})
