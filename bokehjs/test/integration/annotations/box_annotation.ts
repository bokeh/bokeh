import {display, fig, row} from "../_util"
import {PlotActions} from "../../interactive"

import {BoxAnnotation} from "@bokehjs/models"
import type {OutputBackend} from "@bokehjs/core/enums"
import {paint} from "@bokehjs/core/util/defer"

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
    const [l, t, w, h] = [20, 20, 150, 100]

    const box0 = new BoxAnnotation({
      line_color: "red",
      line_width: 2,
      fill_color: null,
      left: 0,
      top: 0,
      right: w,
      bottom: h,
      border_radius: 0,
    })

    const box1 = new BoxAnnotation({
      line_color: "blue",
      line_width: 2,
      fill_color: null,
      left: 0,
      top: 0,
      right: w,
      bottom: h,
      border_radius: 20,
    })

    const box2 = new BoxAnnotation({
      line_color: "green",
      line_width: 2,
      fill_color: "green",
      fill_alpha: 0.3,
      left: w + l,
      top: 0,
      right: w + l + w,
      bottom: h,
      border_radius: {top_left: 0, top_right: 60, bottom_right: 0, bottom_left: 20},
    })

    const box3 = new BoxAnnotation({
      line_color: "orange",
      line_width: 2,
      fill_color: null,
      hatch_color: "orange",
      hatch_alpha: 0.3,
      hatch_pattern: "/",
      left: 0,
      top: h + t,
      right: w,
      bottom: h + t + h,
      border_radius: {top_left: 10, top_right: 40, bottom_right: 10, bottom_left: 10},
    })

    const p = fig([200, 200])
    p.renderers = [box0, box1, box2, box3]

    await display(p)
  })

  it("should support moving by dragging", async () => {
    const box = new BoxAnnotation({
      left: 1, right: 3, top: 3, bottom: 1,
      editable: true,
      line_color: "blue",
    })

    const p = fig([200, 200], {renderers: [box], x_range: [0, 6], y_range: [0, 6]})
    const {view} = await display(p)
    await paint()

    const actions = new PlotActions(view)
    await actions.pan_along({type: "line", xy0: {x: 2, y: 2}, xy1: {x: 4, y: 4}})
    await paint()
  })

  describe("should support resizing by dragging", () => {
    async function box() {
      const box = new BoxAnnotation({
        left: 2, right: 4, top: 4, bottom: 2,
        editable: true,
        line_color: "blue",
      })

      const p = fig([200, 200], {renderers: [box], x_range: [0, 6], y_range: [0, 6]})
      const {view} = await display(p)
      await paint()
      return view
    }

    it("left edge", async () => {
      const view = await box()
      const actions = new PlotActions(view)
      await actions.pan_along({type: "line", xy0: {x: 2, y: 3}, xy1: {x: 1, y: 3}})
      await paint()
    })

    it("right edge", async () => {
      const view = await box()
      const actions = new PlotActions(view)
      await actions.pan_along({type: "line", xy0: {x: 4, y: 3}, xy1: {x: 5, y: 3}})
      await paint()
    })

    it("top edge", async () => {
      const view = await box()
      const actions = new PlotActions(view)
      await actions.pan_along({type: "line", xy0: {x: 3, y: 4}, xy1: {x: 3, y: 5}})
      await paint()
    })

    it("bottom edge", async () => {
      const view = await box()
      const actions = new PlotActions(view)
      await actions.pan_along({type: "line", xy0: {x: 3, y: 2}, xy1: {x: 3, y: 1}})
      await paint()
    })

    it("top-left corner", async () => {
      const view = await box()
      const actions = new PlotActions(view)
      await actions.pan_along({type: "line", xy0: {x: 2, y: 4}, xy1: {x: 1, y: 5}})
      await paint()
    })

    it("top-right corner", async () => {
      const view = await box()
      const actions = new PlotActions(view)
      await actions.pan_along({type: "line", xy0: {x: 4, y: 4}, xy1: {x: 5, y: 5}})
      await paint()
    })

    it("bottom-right corner", async () => {
      const view = await box()
      const actions = new PlotActions(view)
      await actions.pan_along({type: "line", xy0: {x: 4, y: 2}, xy1: {x: 5, y: 1}})
      await paint()
    })

    it("bottom-left corner", async () => {
      const view = await box()
      const actions = new PlotActions(view)
      await actions.pan_along({type: "line", xy0: {x: 2, y: 2}, xy1: {x: 1, y: 1}})
      await paint()
    })
  })
})
