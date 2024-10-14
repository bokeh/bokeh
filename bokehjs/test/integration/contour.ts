import {display, fig} from "./_util"

import {ContourColorBar, GlyphRenderer, MultiLine, MultiPolygons} from "@bokehjs/models"
import {ContourRenderer} from "@bokehjs/models/renderers/contour_renderer"
import {ColumnDataSource} from "@bokehjs/models/sources/column_data_source"

describe("ContourRenderer", () => {

  it("should support line fill and hatch properties", async () => {
    // Data obtained from calling
    // from_contour(z=[[0, 1, 2], [1, 2, 3]], levels=[-0.5, 1.5, 3.5], ...)

    const levels = [-0.5, 1.5, 3.5]

    const line_source = new ColumnDataSource({data: {
      xs: [[], [0.5, 1, 1.5], []],
      ys: [[], [1, 0.5, 0], []],
      levels,
    }})
    const line_renderer = new GlyphRenderer({
      glyph: new MultiLine({
        line_color: "blue", line_width: 5, line_alpha: 0.8, line_dash: [20, 30],
        line_cap: "round",
      }),
      data_source: line_source,
    })

    const fill_source = new ColumnDataSource({data: {
      xs: [[[[0, 1, 1.5, 1, 0.5, 0, 0]]], [[[0.5, 1, 1.5, 2, 2, 1, 0.5]]]],
      ys: [[[[0, 0, 0, 0.5, 1, 1, 0]]], [[[1, 0.5, 0, 0, 1, 1, 1]]]],
      lower_levels: [-0.5,  1.5],
      upper_levels: [1.5, 3.5],
      fill_color: ["red", "yellow"],
      hatch_pattern: [" ", "/"],
    }})
    const fill_renderer = new GlyphRenderer({
      glyph: new MultiPolygons({
        fill_color: {field: "fill_color"}, fill_alpha: 0.5, line_width: 0,
        hatch_pattern: {field: "hatch_pattern"}, hatch_alpha: 0.7,
      }),
      data_source: fill_source,
    })

    const p = fig([300, 250])
    const contour_renderer = new ContourRenderer({fill_renderer, line_renderer, levels})
    p.add_renderers(contour_renderer)
    const color_bar = new ContourColorBar({fill_renderer, line_renderer, levels})
    p.add_layout(color_bar, "right")

    await display(p)
  })
})
