import {display, fig} from "#framework/layouts"

import {ColumnDataSource, FactorRange, Row} from "@bokehjs/models"

describe("Whisker glyph", () => {
  it("should render both orientations with different cap sizes and inherited line visuals", async () => {
    const plot = fig([340, 280], {x_range: [0, 10], y_range: [0, 10]})

    plot.whisker([2, 4, 6, 8], [1, 2, 1, 2], [4, 5, 3, 5], {
      cap_size: 12, line_color: "#b91c1c", line_width: 3,
    })

    const source = ColumnDataSource.create({
      data: {base: [6, 7.5, 9], lower: [1, 2, 1], upper: [8, 9, 7], cap_size: [16, 24, 32]},
    })
    plot.whisker({
      source, dimension: "width", cap_size: {field: "cap_size"},
      line_color: "#047857", line_width: 4, line_alpha: 0.65, line_dash: "dashed",
    })

    await display(plot)
  })

  it("should render perpendicular caps on zero-length whiskers", async () => {
    const plot = fig([300, 240], {x_range: [0, 10], y_range: [0, 10]})

    plot.whisker([2, 4], [3, 7], [3, 7], {
      cap_size: 24, line_color: "#b91c1c", line_width: 4,
    })
    plot.whisker([3, 7], [6, 8], [6, 8], {
      dimension: "width", cap_size: 32, line_color: "#047857", line_width: 3,
    })

    await display(plot)
  })

  it("should render whiskers with hierarchical categorical ranges on either axis", async () => {
    const factors: [string, string, string][] = [["A", "01", "AA"], ["A", "01", "AB"], ["B", "02", "BA"]]
    const source = ColumnDataSource.create({data: {
      base: factors, lower: [1, 2, 1], upper: [4, 5, 3], point: [2, 4, 2],
    }})
    const vertical = fig([270, 220], {x_range: FactorRange.create({factors}), y_range: [0, 6]})
    vertical.whisker({source})
    vertical.scatter({source, x: {field: "base"}, y: {field: "point"}})

    const horizontal = fig([270, 220], {x_range: [0, 6], y_range: FactorRange.create({factors})})
    horizontal.whisker({source, dimension: "width"})
    horizontal.scatter({source, x: {field: "point"}, y: {field: "base"}})

    await display(Row.create({children: [vertical, horizontal]}))
  })
})
