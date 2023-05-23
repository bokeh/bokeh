import {display, fig, row} from "../_util"
import type {OutputBackend} from "@bokehjs/core/enums"
import {ColumnDataSource} from "@bokehjs/models"

describe("Rect glyph", () => {
  it("should support hatch patterns and line joins", async () => {
    const fill_color = "orange"
    const line_color = "blue"
    const line_width = [1, 3, 5, 7]
    const x = [0, 1, 2, 3]
    const width = 0.85
    const height = 0.7

    function make_plot(output_backend: OutputBackend) {
      const p = fig([300, 300], {output_backend, title: output_backend})

      p.rect({x, y: 3, width, height, angle: 0.0, line_join: "round", fill_color,
              hatch_pattern: [".", "o", "-", "|"], line_color, line_alpha: 1.0, line_width})
      p.rect({x, y: 2, width, height, angle: 0.2, line_join: "miter", fill_color,
              hatch_pattern: ["+", '"', ":", "@"], line_color, line_alpha: 0.7, line_width})
      p.rect({x, y: 1, width, height, angle: 0.4, line_join: "bevel", fill_color,
              hatch_pattern: ["/", "\\", "x", ","], line_color, line_alpha: 0.4, line_width})
      p.rect({x, y: 0, width, height, angle: 0.6, line_join: "round", fill_color,
              hatch_pattern: ["`", "v", ">", "*"], line_color, line_alpha: 0, line_width})

      return p
    }

    await display(row([make_plot("canvas"), make_plot("svg"), make_plot("webgl")]))
  })

  it("should support adding new data point to existing glyph", async () => {
    const p = fig([200, 200])
    const source = new ColumnDataSource({data: {x: [1], y: [2]}})
    p.rect({x: {field: "x"}, y: {field: "y"}, width: 0.1, height: 0.1, source})
    const {view} = await display(p)

    source.data = {x: [1, 1.2], y: [1, 1.2]}
    await view.ready
  })
})
