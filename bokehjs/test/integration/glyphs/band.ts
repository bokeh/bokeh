import {display, fig} from "#framework/layouts"

import {ColumnDataSource} from "@bokehjs/models"

describe("Band glyph", () => {

  it("should support basic positioning", async () => {
    const p = fig([300, 300], {x_range: [0, 10], y_range: [0, 10]})

    const source = ColumnDataSource.create({
      data: {
        x1: [1, 3, 5, 7, 9],
        lower1: [1, 2, 1, 2, 1],
        upper1: [2, 3, 2, 3, 2],
        y2: [5, 6, 7, 8, 9],
        lower2: [3, 1.5, 3, 1.5, 3],
        upper2: [6.5, 5, 6.5, 5, 6.5],
      },
    })

    p.band({
      base: {field: "x1"},
      lower: {field: "lower1"},
      upper: {field: "upper1"},
      line_width: 3, line_color: "red", line_dash: "dashed",
      source,
    })

    p.band({
      base: {field: "y2"},
      lower: {field: "lower2"},
      upper: {field: "upper2"},
      dimension: "width", line_width: 3, fill_color: "blue", line_color: "green",
      source,
    })

    await display(p)
  })
})
