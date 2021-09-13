import {display, fig} from "../_util"

import {Band, ColumnDataSource} from "@bokehjs/models"

describe("Band annotation", () => {

  it("should support basic positioning", async () => {
    const plot = fig([300, 300], {x_range: [0, 10], y_range: [0, 10]})

    const source = new ColumnDataSource({
      data: {
        x1: [1, 3, 5, 7, 9],
        lower1: [1, 2, 1, 2, 1],
        upper1: [2, 3, 2, 3, 2],
        x2: [50, 100, 150, 200, 250],
        lower2: [100, 50, 100, 50, 100],
        upper2: [200, 150, 200, 150, 200],
      },
    })

    const band0 = new Band({
      base: {field: "x1"},
      lower: {field: "lower1"},
      upper: {field: "upper1"},
      line_width: 3, line_color: "red", line_dash: "dashed",
      source,
    })
    const band1 = new Band({
      // TODO: units are only supported on value level, not type level
      base: {field: "x2", units: "screen"} as any,
      lower: {field: "lower2", units: "screen"} as any,
      upper: {field: "upper2", units: "screen"} as any,
      dimension: "width", line_width: 3, fill_color: "blue", line_color: "green",
      source,
    })

    plot.add_layout(band0)
    plot.add_layout(band1)

    await display(plot)
  })
})
