import {display, fig, row} from "../_util"
import type {Point} from "../../interactive"
import {PlotActions, xy} from "../../interactive"

import {BoxAnnotation} from "@bokehjs/models"
import type {OutputBackend} from "@bokehjs/core/enums"
import {paint} from "@bokehjs/core/util/defer"
import type {PlotView} from "@bokehjs/models/plots/plot"

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

  async function pan(view: PlotView, xy0: Point, xy1: Point) {
    const actions = new PlotActions(view)
    await actions.pan_along({type: "line", xy0, xy1})
    await paint()
  }

  it("should support moving by dragging", async () => {
    const box = new BoxAnnotation({
      left: 2, right: 4, top: 4, bottom: 2,
      editable: true,
      line_color: "blue",
    })

    const p = fig([200, 200], {renderers: [box], x_range: [0, 6], y_range: [0, 6]})
    const {view} = await display(p)
    await paint()

    await pan(view, xy(3, 3), xy(4, 4))
  })

  function test_resizing(symmetric: boolean) {
    async function box() {
      const box = new BoxAnnotation({
        left: 2, right: 4, top: 4, bottom: 2,
        editable: true,
        symmetric,
        line_color: "blue",
      })

      const p = fig([200, 200], {renderers: [box], x_range: [0, 6], y_range: [0, 6]})
      const {view} = await display(p)
      await paint()
      return view
    }

    it("left edge", async () => {
      const view = await box()
      await pan(view, xy(2, 3), xy(1, 3))
    })

    it("right edge", async () => {
      const view = await box()
      await pan(view, xy(4, 3), xy(5, 3))
    })

    it("top edge", async () => {
      const view = await box()
      await pan(view, xy(3, 4), xy(3, 5))
    })

    it("bottom edge", async () => {
      const view = await box()
      await pan(view, xy(3, 2), xy(3, 1))
    })

    it("top-left corner", async () => {
      const view = await box()
      await pan(view, xy(2, 4), xy(1, 5))
    })

    it("top-right corner", async () => {
      const view = await box()
      await pan(view, xy(4, 4), xy(5, 5))
    })

    it("bottom-right corner", async () => {
      const view = await box()
      await pan(view, xy(4, 2), xy(5, 1))
    })

    it("bottom-left corner", async () => {
      const view = await box()
      await pan(view, xy(2, 2), xy(1, 1))
    })
  }

  describe("should support non-symmetric resizing by dragging", () => test_resizing(false))
  describe("should support symmetric resizing by dragging", () => test_resizing(true))
})
