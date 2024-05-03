import {display, fig} from "../_util"

import {HTMLLabel} from "@bokehjs/models"

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
})
