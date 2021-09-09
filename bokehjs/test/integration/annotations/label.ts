import {display, fig} from "../_util"

import {RenderMode} from "@bokehjs/core/enums"
import {Label} from "@bokehjs/models"

describe("Label annotation", () => {

  function plot(render_mode: RenderMode) {
    const plot = fig([600, 600], {x_range: [0, 10], y_range: [0, 10]})

    const label0 = new Label({
      x: 1, y: 6,
      x_offset: 0, y_offset: 0,
      angle: 15, angle_units: "deg",
      text: "Angled label",
      text_font_size: "36px", text_color: "red", text_alpha: 0.9, text_baseline: "bottom", text_align: "left",
      background_fill_color: "green", background_fill_alpha: 0.2,
      border_line_color: "blue", border_line_width: 2, border_line_dash: [8, 4],
      render_mode,
    })

    const label1 = new Label({
      x: 1, y: 6,
      x_offset: 25, y_offset: -50,
      angle: 15, angle_units: "deg",
      text: "Angled label with an offset",
      text_font_size: "36px", text_color: "red", text_alpha: 0.9, text_baseline: "bottom", text_align: "left",
      background_fill_color: "green", background_fill_alpha: 0.2,
      border_line_color: "blue", border_line_width: 2, border_line_dash: [8, 4],
      render_mode,
    })

    const label2 = new Label({
      x: 4, y: 2,
      text: "H-label",
      text_font_size: "26px", text_baseline: "top", text_align: "right",
      border_line_color: "blue", border_line_width: 1, border_line_dash: [10, 2, 8, 2, 4, 2],
      render_mode,
    })

    const label3 = new Label({
      x: 4, y: 1,
      text: "H-label",
      text_font_size: "26px", text_baseline: "top", text_align: "left",
      border_line_color: "blue", border_line_width: 1, border_line_dash: [10, 2, 8, 2, 4, 2],
      render_mode,
    })

    const label4 = new Label({
      x: 8, y: 4,
      angle: 0.25, angle_units: "turn",
      text: "V-label",
      text_font_size: "26px", text_baseline: "top", text_align: "right",
      border_line_color: "blue", border_line_width: 1, border_line_dash: [10, 2, 8, 2, 4, 2],
      render_mode,
    })

    const label5 = new Label({
      x: 9, y: 4,
      angle: 0.25, angle_units: "turn",
      text: "V-label",
      text_font_size: "26px", text_baseline: "top", text_align: "left",
      border_line_color: "blue", border_line_width: 1, border_line_dash: [10, 2, 8, 2, 4, 2],
      render_mode,
    })

    const label6 = new Label({
      x: 4, y: 4,
      angle: -15, angle_units: "deg",
      text: "A long label\nspread across\nmultiple lines of text",
      text_font_size: "16px", text_baseline: "top", text_align: "left",
      background_fill_color: "orange",
      border_line_color: "blue", border_line_width: 1, border_line_dash: [10, 2, 8, 2, 4, 2],
      render_mode,
    })

    const label_above_0 = new Label({
      x: 0, y: 0,
      x_units: "screen", y_units: "screen",
      text: "First label above",
      text_font_size: "30px", text_color: "firebrick", text_alpha: 0.9,
      background_fill_color: "aquamarine",
      border_line_color: "green", border_line_width: 1, border_line_dash: [8, 4],
      render_mode,
    })

    const label_above_1 = new Label({
      x: 0, y: 0,
      x_units: "screen", y_units: "screen",
      text: "Second label above",
      text_font_size: "30px", text_color: "firebrick", text_alpha: 0.9,
      background_fill_color: "lightgreen",
      border_line_color: "green", border_line_width: 1, border_line_dash: [8, 4],
      render_mode,
    })

    const label_below_0 = new Label({
      x: 0, y: 0,
      x_units: "screen", y_units: "screen",
      text: "First label below",
      text_font_size: "30px", text_color: "firebrick", text_alpha: 0.9,
      background_fill_color: "aquamarine",
      border_line_color: "green", border_line_width: 1, border_line_dash: [8, 4],
      render_mode,
    })

    const label_below_1 = new Label({
      x: 0, y: 0,
      x_units: "screen", y_units: "screen",
      text: "Second label below",
      text_font_size: "30px", text_color: "firebrick", text_alpha: 0.9,
      background_fill_color: "lightgreen",
      border_line_color: "green", border_line_width: 1, border_line_dash: [8, 4],
      render_mode,
    })

    const label_left_0 = new Label({
      x: 0, y: 0,
      x_units: "screen", y_units: "screen",
      angle: 90, angle_units: "deg",
      text: "First label on the left",
      text_font_size: "30px", text_color: "firebrick", text_alpha: 0.9, text_baseline: "top",
      background_fill_color: "aquamarine",
      border_line_color: "green", border_line_width: 1, border_line_dash: [8, 4],
      render_mode,
    })

    const label_left_1 = new Label({
      x: 0, y: 0,
      x_units: "screen", y_units: "screen",
      angle: 90, angle_units: "deg",
      text: "Second label on the left",
      text_font_size: "30px", text_color: "firebrick", text_alpha: 0.9, text_baseline: "top",
      background_fill_color: "lightgreen",
      border_line_color: "green", border_line_width: 1, border_line_dash: [8, 4],
      render_mode,
    })

    const label_right_0 = new Label({
      x: 0, y: 0,
      x_units: "screen", y_units: "screen",
      angle: 90, angle_units: "deg",
      text: "First label on the right",
      text_font_size: "30px", text_color: "firebrick", text_alpha: 0.9, text_baseline: "top",
      background_fill_color: "aquamarine",
      border_line_color: "green", border_line_width: 1, border_line_dash: [8, 4],
      render_mode,
    })

    const label_right_1 = new Label({
      x: 0, y: 0,
      x_units: "screen", y_units: "screen",
      angle: 90, angle_units: "deg",
      text: "Second label on the right",
      text_font_size: "30px", text_color: "firebrick", text_alpha: 0.9, text_baseline: "top",
      background_fill_color: "lightgreen",
      border_line_color: "green", border_line_width: 1, border_line_dash: [8, 4],
      render_mode,
    })

    plot.add_layout(label0)
    plot.add_layout(label1)
    plot.add_layout(label2)
    plot.add_layout(label3)
    plot.add_layout(label4)
    plot.add_layout(label5)
    plot.add_layout(label6)
    plot.add_layout(label_above_0, "above")
    plot.add_layout(label_above_1, "above")
    plot.add_layout(label_below_0, "below")
    plot.add_layout(label_below_1, "below")
    plot.add_layout(label_left_0, "left")
    plot.add_layout(label_left_1, "left")
    plot.add_layout(label_right_0, "right")
    plot.add_layout(label_right_1, "right")

    return plot
  }

  it("should support basic positioning using canvas rendering", async () => {
    await display(plot("canvas"))
  })

  it("should support basic positioning using CSS rendering", async () => {
    await display(plot("css"))
  })
})
