import {display, fig} from "../_util"

import {Whisker, ColumnDataSource/*, OpenHead*/} from "@bokehjs/models"

describe("Whisker glyph", () => {

  it("should support basic positioning", async () => {
    const plot = fig([300, 300], {x_range: [0, 10], y_range: [0, 10]})

    const source = new ColumnDataSource({
      data: {
        x0: [1, 3, 5, 7, 9],
        lower0: [1, 2, 1, 2, 1],
        upper0: [2, 3, 2, 3, 2],
        //x1: [50, 100, 150, 200, 250],
        //lower1: [100, 50, 100, 50, 100],
        //upper1: [200, 150, 200, 150, 200],
      },
    })

    const whisker0 = new Whisker({
      base: {field: "x0"},
      lower: {field: "lower0"},
      upper: {field: "upper0"},
      line_width: 3, line_color: "red", line_dash: "dashed",
    })

    /*
    const whisker1 = new Whisker({
      coordinates: TODO screen
      base: {field: "x1"},
      lower: {field: "lower1"},
      upper: {field: "upper1"},
      upper_head: new OpenHead(),
      dimension: "width",
      line_width: 3, line_color: "green",
    })
    */

    plot.add_glyph(whisker0, source)
    //plot.add_glyph(whisker1, source)

    await display(plot)
  })
})
