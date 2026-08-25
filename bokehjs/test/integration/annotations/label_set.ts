import {display, fig} from "#framework/layouts"

import {LabelSet, HTMLLabelSet} from "@bokehjs/models/annotations"
import {ColumnDataSource} from "@bokehjs/models/sources"
import type {Constructor} from "@bokehjs/core/class"

describe("LabelSet annotation", () => {

  function plot<T extends LabelSet | HTMLLabelSet>(LabelSetCls: Constructor<T>) {
    const plot = fig([300, 300], {x_range: [0, 10], y_range: [0, 10]})

    const source = new ColumnDataSource({
      data: {
        text: ["First label", "Second label\nspanning two lines", "Third label\nspanning\nthree lines", null, "Not shown"],
        x1: [1, 3, 7, 9, NaN],
        y1: [7, 5, 3, 1, NaN],
        x2: [30, 70, 150, 200, NaN],
      },
    })

    const label_set0 = new LabelSetCls({
      x: {field: "x1"}, y: {field: "y1"},
      x_offset: -10, y_offset: 25,
      angle: 15, angle_units: "deg",
      text: {field: "text"},
      source,
      text_font_size: "24px", text_color: "red", text_alpha: 0.9, text_baseline: "bottom", text_align: "left",
      background_fill_color: "green", background_fill_alpha: 0.8,
      border_line_color: "blue",
    })

    const label_set1 = new LabelSetCls({
      x: {field: "x2"}, y: 1,
      x_units: "screen", y_units: "data",
      x_offset: 0, y_offset: -5,
      angle: 0.25, angle_units: "turn",
      text: {field: "text"},
      source,
      text_font_size: "18px", text_color: "black", text_alpha: 0.9, text_baseline: "top", text_align: "left",
      background_fill_color: "orange", background_fill_alpha: 0.8,
      border_line_color: "red", border_line_width: 3,
    })

    plot.add_layout(label_set0)
    plot.add_layout(label_set1)

    return plot
  }

  it("should support basic positioning using canvas rendering", async () => {
    await display(plot(LabelSet))
  })

  it("should support basic positioning using CSS rendering", async () => {
    await display(plot(HTMLLabelSet))
  })
})
