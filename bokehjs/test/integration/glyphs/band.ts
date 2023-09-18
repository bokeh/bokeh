import {display, fig} from "../_util"

import {Band, ColumnDataSource, GlyphRenderer} from "@bokehjs/models"

describe("Band glyph", () => {

  it("should support basic positioning", async () => {
    const data_source = new ColumnDataSource({
      data: {
        x0: [1, 3, 5, 7, 9],
        lower0: [1, 2, 1, 2, 1],
        upper0: [2, 3, 2, 3, 2],
        //x1: [50, 100, 150, 200, 250],
        //lower1: [100, 50, 100, 50, 100],
        //upper1: [200, 150, 200, 150, 200],
      },
    })

    const band0 = new Band({
      base: {field: "x0"},
      lower: {field: "lower0"},
      upper: {field: "upper0"},
      line_color: "black", line_width: 3, line_dash: "dashed",
      fill_color: "yellow", fill_alpha: 0.3,
      hatch_color: "red", hatch_pattern: "/",
    })

    /*
    const band1 = new Band({
      coordinates: TODO screen
      base: {field: "x1"},
      lower: {field: "lower1"},
      upper: {field: "upper1"},
      dimension: "width", line_width: 3, fill_color: "blue", line_color: "green",
    })
    */

    const band0_renderer = new GlyphRenderer({data_source, glyph: band0})
    //const band1_renderer = new GlyphRenderer({data_source, glyph: band1})

    const plot = fig([300, 300], {renderers: [band0_renderer/*, band1_renderer*/]})
    await display(plot)
  })
})
