import {display, fig, row} from "../_util"

import {BoxAnnotation} from "@bokehjs/models"
import {OutputBackend} from "@bokehjs/core/enums"

describe("BoxAnnotation annotation", () => {

  it("should support positioning in data space", async () => {
    function make_plot(output_backend: OutputBackend) {
      const p = fig([200, 200], {
        x_range: [-10, 10], y_range: [-10, 10],
        output_backend, title: output_backend,
      })

      const box0 = new BoxAnnotation({
        left: -8, right: 3, top: 2, bottom: -4,
        line_color: "red", line_alpha: 0.9, line_width: 4,
        fill_color: "blue", fill_alpha: 0.7,
      })
      p.add_layout(box0)

      const box1 = new BoxAnnotation({
        left: -2, right: 7, top: 8, bottom: -1,
        line_color: "red", line_alpha: 0.9, line_width: 2,
        fill_color: "orange", fill_alpha: 0.7,
        hatch_pattern: "@", hatch_scale: 20,
      })
      p.add_layout(box1)

      return p
    }

    const p0 = make_plot("canvas")
    const p1 = make_plot("svg")

    await display(row([p0, p1]))
  })

  it("should support rounded corners (border_radius property)", async () => {
    const box0 = new BoxAnnotation({
      line_color: "red",
      line_width: 2,
      fill_color: null,
      left: 10,
      top: 20,
      right: 10 + 150,
      bottom: 20 + 100,
      border_radius: 0,
    })

    const box1 = new BoxAnnotation({
      line_color: "blue",
      line_width: 2,
      fill_color: null,
      left: box0.left,
      top: box0.top,
      right: box0.right,
      bottom: box0.bottom,
      border_radius: 20,
    })

    const box2 = new BoxAnnotation({
      line_color: "green",
      line_width: 2,
      fill_color: null,
      left: box0.right! + 10,
      top: box0.top,
      right: box0.right! + 10 + 150,
      bottom: box0.bottom,
      border_radius: {top_left: 0, top_right: 60, bottom_right: 0, bottom_left: 20},
    })

    const box3 = new BoxAnnotation({
      line_color: "orange",
      line_width: 2,
      fill_color: null,
      hatch_color: "orange",
      hatch_alpha: 0.5,
      hatch_pattern: "/",
      left: box0.left,
      top: box0.bottom! + 20,
      right: box0.right,
      bottom: box0.bottom! + 20 + 100,
      border_radius: {top_left: 10, top_right: 40, bottom_right: 10, bottom_left: 10},
    })

    const p = fig([200, 200], {x_range: [0, 350], y_range: [0, 250]})
    p.add_layout(box0, "center")
    p.add_layout(box1, "center")
    p.add_layout(box2, "center")
    p.add_layout(box3, "center")

    await display(p)
  })
})
