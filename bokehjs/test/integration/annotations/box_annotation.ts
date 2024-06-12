import {display, fig, row} from "../_util"
import type {Point} from "../../interactive"
import {actions, xy} from "../../interactive"

import {BoxAnnotation, Node} from "@bokehjs/models"
import type {OutputBackend} from "@bokehjs/core/enums"
import {paint} from "@bokehjs/core/util/defer"
import type {PlotView} from "@bokehjs/models/plots/plot"
import {gridplot} from "@bokehjs/api/gridplot"
import {entries} from "@bokehjs/core/util/object"

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

  it("should support positioning in node space", async () => {
    const frame_left = (offset?: number) => new Node({target: "frame", symbol: "left", offset})
    const frame_right = (offset?: number) => new Node({target: "frame", symbol: "right", offset})
    const frame_top = (offset?: number) => new Node({target: "frame", symbol: "top", offset})
    const frame_bottom = (offset?: number) => new Node({target: "frame", symbol: "bottom", offset})

    const box0 = new BoxAnnotation({
      left: frame_left(),
      right: frame_right(),
      top: frame_top(),
      bottom: frame_bottom(),
    })

    const box1 = new BoxAnnotation({
      left: frame_left(50),
      right: frame_right(-50),
      top: frame_top(50),
      bottom: frame_bottom(-50),
      fill_color: "blue",
      hatch_color: "red", hatch_pattern: "/",
    })

    const p = fig([200, 200], {
      x_range: [-10, 10],
      y_range: [-10, 10],
      renderers: [box0, box1],
    })

    await display(p)
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

    const p = fig([200, 200], {renderers: [box0, box1, box2, box3]})
    await display(p)
  })

  async function pan(pv: PlotView, xy0: Point, xy1: Point) {
    await actions(pv).pan_along({type: "line", xy0, xy1})
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

  describe("should support interactive limits", () => {
    async function box(symmetric: boolean = false) {
      const box = new BoxAnnotation({
        left: 2, right: 4, top: 4, bottom: 2,
        left_limit: 1, right_limit: 5, top_limit: 5, bottom_limit: 1,
        editable: true,
        symmetric,
        line_color: "blue",
      })

      const box_limits = new BoxAnnotation({
        left: 1, right: 5, top: 5, bottom: 1,
        line_color: "black", line_dash: "dashed",
        fill_color: "transparent",
      })

      const p = fig([200, 200], {renderers: [box, box_limits], x_range: [0, 6], y_range: [0, 6]})
      const {view} = await display(p)
      await paint()
      return view
    }

    it("when moving", async () => {
      const view = await box()
      await pan(view, xy(3, 3), xy(6, 6))
    })

    function test_resizing(symmetric: boolean) {
      it("left edge", async () => {
        const view = await box(symmetric)
        await pan(view, xy(2, 3), xy(0, 3))
      })

      it("right edge", async () => {
        const view = await box(symmetric)
        await pan(view, xy(4, 3), xy(6, 3))
      })

      it("top edge", async () => {
        const view = await box(symmetric)
        await pan(view, xy(3, 4), xy(3, 6))
      })

      it("bottom edge", async () => {
        const view = await box(symmetric)
        await pan(view, xy(3, 2), xy(3, 0))
      })

      it("top-left corner", async () => {
        const view = await box(symmetric)
        await pan(view, xy(2, 4), xy(0, 6))
      })

      it("top-right corner", async () => {
        const view = await box(symmetric)
        await pan(view, xy(4, 4), xy(6, 6))
      })

      it("bottom-right corner", async () => {
        const view = await box(symmetric)
        await pan(view, xy(4, 2), xy(6, 0))
      })

      it("bottom-left corner", async () => {
        const view = await box(symmetric)
        await pan(view, xy(2, 2), xy(0, 0))
      })
    }

    describe("when non-symmetric resizing", () => test_resizing(false))
    describe("when symmetric resizing", () => test_resizing(true))
  })

  describe("should support constraining", () => {
    async function box() {
      const box = new BoxAnnotation({
        left: 2, right: 4, top: 4, bottom: 2,
        min_width: 1,
        max_width: 3,
        min_height: 1,
        max_height: 3,
        editable: true,
        line_color: "blue",
      })

      const p = fig([200, 200], {renderers: [box], x_range: [0, 6], y_range: [0, 6]})
      const {view} = await display(p)
      await paint()
      return view
    }

    it("maximum width when dragging left edge", async () => {
      const view = await box()
      await pan(view, xy(2, 3), xy(0, 3))
    })

    it("minimum width when dragging left edge", async () => {
      const view = await box()
      await pan(view, xy(2, 3), xy(4, 3))
    })

    it("maximum width when dragging right edge", async () => {
      const view = await box()
      await pan(view, xy(4, 3), xy(6, 3))
    })

    it("minimum width when dragging right edge", async () => {
      const view = await box()
      await pan(view, xy(4, 3), xy(2, 3))
    })

    it("maximum height when dragging top edge", async () => {
      const view = await box()
      await pan(view, xy(3, 4), xy(3, 6))
    })

    it("minimum height when dragging top edge", async () => {
      const view = await box()
      await pan(view, xy(3, 4), xy(3, 2))
    })

    it("maximum height when dragging bottom edge", async () => {
      const view = await box()
      await pan(view, xy(3, 2), xy(3, 0))
    })

    it("minimum height when dragging bottom edge", async () => {
      const view = await box()
      await pan(view, xy(3, 2), xy(3, 4))
    })
  })

  it("should support inverted geometry", async () => {
    const box = new BoxAnnotation({
      left: 2, right: 4, top: 4, bottom: 2,
      line_color: "blue",
      border_radius: 10,
      inverted: true,
    })

    const p = fig([200, 200], {renderers: [box], x_range: [0, 6], y_range: [0, 6]})
    await display(p)
  })

  it("should support interaction handles", async () => {
    function plot(attrs: Partial<BoxAnnotation.Attrs>) {
      const box = new BoxAnnotation({
        left: 1, right: 5, top: 5, bottom: 1,
        editable: true,
        line_color: "blue",
        use_handles: true,
        ...attrs,
      })

      return fig([150, 150], {
        title: entries(attrs).map(([k, v]) => `${k}=${v}`).join("\n"),
        renderers: [box],
        x_range: [0, 6], y_range: [0, 6],
      })
    }

    const plots = [[
      plot({movable: "none", resizable: "none"}),
      plot({movable: "both", resizable: "none"}),
      plot({movable: "none", resizable: "all"}),
      plot({movable: "both", resizable: "all"}),
      plot({movable: "none", resizable: "x"}),
    ], [
      plot({movable: "none", resizable: "y"}),
      plot({movable: "none", resizable: "left"}),
      plot({movable: "none", resizable: "right"}),
      plot({movable: "none", resizable: "top"}),
      plot({movable: "none", resizable: "bottom"}),
    ]]

    const gp = gridplot(plots, {toolbar_location: null})
    await display(gp)
  })

  it("should support hover over interaction handles", async () => {
    const box = new BoxAnnotation({
      left: 1, right: 5, top: 5, bottom: 1,
      editable: true,
      use_handles: true,
      movable: "both",
      resizable: "all",
      line_color: "blue",
      hover_fill_color: "green",
    })

    box.handles.all.hover_fill_color = "red"
    box.handles.all.hover_fill_alpha = 0.7

    const p = fig([150, 150], {
      renderers: [box],
      x_range: [0, 6], y_range: [0, 6],
    })

    const {view: pv} = await display(p)
    await actions(pv).hover(xy(3, 3))
    await pv.ready
  })

  it("should support visual overrides in interaction handles", async () => {
    const box = new BoxAnnotation({
      left: 1, right: 5, top: 5, bottom: 1,
      editable: true,
      use_handles: true,
      movable: "both",
      resizable: "all",
      line_color: "blue",
    })

    box.handles.all.fill_color = "red"
    box.handles.all.fill_alpha = 0.7

    box.handles.resize = box.handles.all.clone()
    box.handles.resize.hatch_color = "blue"
    box.handles.resize.hatch_pattern = "@"

    const p = fig([150, 150], {
      renderers: [box],
      x_range: [0, 6], y_range: [0, 6],
    })

    await display(p)
  })
})
