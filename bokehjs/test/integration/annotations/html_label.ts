import {display, fig} from "#framework/layouts"

import {ColumnDataSource, HTMLLabel, Line} from "@bokehjs/models"

describe("HTMLLabel annotation", () => {

  it("should allow overriding properties with CSS stylesheets", async () => {
    const plot = fig([200, 200], {x_range: [0, 10], y_range: [0, 10]})

    const label = new HTMLLabel({
      x: 1,
      y: 1,
      text: "Label",
      text_font_size: "3em",
      padding: 5,
      background_fill_color: "red",
      border_radius: 0,
      stylesheets: [`
      :host {
        padding: 20px;
        background-color: yellow;
        border-radius: 10px;
        border: 1px solid black;
      }
      `],
    })
    plot.add_layout(label)

    await display(plot)
  })

  it("should allow overlaying HTML labels across the canvas framework boundaries", async () => {
    const plot = fig([400, 400])

    const source = new ColumnDataSource({
      data: {x: [1, 2, 3, 4, 5], y: [6, 7, 2, 4, 15]},
    })

    const line = new Line({
      x: {field: "x"},
      y: {field: "y"},
      line_width: 2,
      line_color: "blue",
    })
    plot.add_glyph(line, source)

    const x_label = new HTMLLabel({
      x: 0,
      y: 200,
      text: "Sample Label",
      text_color: "black",
      level: "overlay",
      x_units: "canvas",
      y_units: "canvas",
    })
    plot.add_layout(x_label)

    await display(plot)
  })

})
