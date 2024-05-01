import * as sinon from "sinon"

import {expect} from "../unit/assertions"
import {display, fig, row} from "./_util"
import {mouse_click} from "../interactive"

import {figure} from "@bokehjs/api/plotting"
import type {Location} from "@bokehjs/core/enums"
import {Range1d, LinearScale, LinearAxis, ColumnDataSource, Pane} from "@bokehjs/models"
import {Text} from "@bokehjs/models/dom"

describe("Plot", () => {
  const f = (location: Location | null, options: {title?: string, inner?: boolean} = {}) => {
    const {title, inner} = options
    const p = fig([200, 200], {
      tools: "pan,reset",
      title,
      toolbar_inner: inner,
      toolbar_location: location,
      title_location: location,
    })
    p.scatter([0, 5, 10], [0, 5, 10], {size: 10})
    return p
  }

  it("should allow no toolbar and no title", async () => {
    await display(f(null))
  })

  it("should allow toolbar placement above without title", async () => {
    await display(f("above"))
  })

  it("should allow toolbar placement below without title", async () => {
    await display(f("below"))
  })

  it("should allow toolbar placement left without title", async () => {
    await display(f("left"))
  })

  it("should allow toolbar placement right without title", async () => {
    await display(f("right"))
  })

  it("should allow toolbar placement above with title", async () => {
    await display(f("above", {title: "Plot Title"}))
  })

  it("should allow toolbar placement below with title", async () => {
    await display(f("below", {title: "Plot Title"}))
  })

  it("should allow toolbar placement left with title", async () => {
    await display(f("left", {title: "Plot Title"}))
  })

  it("should allow toolbar placement right with title", async () => {
    await display(f("right", {title: "Plot Title"}))
  })

  it("should allow toolbar placement above inside the frame", async () => {
    await display(f("above", {inner: true}))
  })

  it("should allow toolbar placement below inside the frame", async () => {
    await display(f("below", {inner: true}))
  })

  it("should allow toolbar placement left inside the frame", async () => {
    await display(f("left", {inner: true}))
  })

  it("should allow toolbar placement right inside the frame", async () => {
    await display(f("right", {inner: true}))
  })

  describe("should support toolbar's overflow menu", () => {
    const f = (toolbar_location: Location | null) => {
      const p = fig([200, 200], {tools: "pan,box_zoom,undo,redo,reset,crosshair,help", toolbar_location})
      p.scatter([0, 5, 10], [0, 5, 10], {size: 10})
      return p
    }

    it("with toolbar located above a plot", async () => {
      const {view} = await display(f("above"))
      const {overflow_el} = view.owner.get_one(view.model.toolbar)
      await mouse_click(overflow_el)
    })

    it("with toolbar located below a plot", async () => {
      const {view} = await display(f("below"))
      const {overflow_el} = view.owner.get_one(view.model.toolbar)
      await mouse_click(overflow_el)
    })

    it("with toolbar located left of a plot", async () => {
      const {view} = await display(f("left"))
      const {overflow_el} = view.owner.get_one(view.model.toolbar)
      await mouse_click(overflow_el)
    })

    it("with toolbar located right of a plot", async () => {
      const {view} = await display(f("right"))
      const {overflow_el} = view.owner.get_one(view.model.toolbar)
      await mouse_click(overflow_el)
    })
  })

  it("should support match_aspect", async () => {
    function plot(match_aspect: boolean) {
      const p = figure({
        sizing_mode: "fixed",
        width: 300,
        height: 300,
        match_aspect,
        title: `match_aspect == ${match_aspect}`,
      })
      p.rect({x: 0, y: 0, width: 300, height: 300, line_color: "black"})
      p.circle({x: 0, y: 0, radius: 150, radius_units: "data", line_color: "black", fill_color: "grey"})
      return p
    }

    const pane = new Pane({
      styles: {display: "flex", flex_direction: "row"},
      elements: [plot(true), plot(false)],
    })
    await display(pane, [650, 350])
  })

  it("should allow fixed x fixed plot", async () => {
    const p = figure({width_policy: "fixed", width: 200, height_policy: "fixed", height: 200})
    p.scatter([0, 5, 10], [0, 5, 10], {size: 10})
    await display(p, [300, 300])
  })

  it("should allow max x fixed plot", async () => {
    const p = figure({width_policy: "max", height_policy: "fixed", height: 200})
    p.scatter([0, 5, 10], [0, 5, 10], {size: 10})
    await display(p, [300, 300])
  })

  it("should allow fixed x max plot", async () => {
    const p = figure({width_policy: "fixed", width: 200, height_policy: "max"})
    p.scatter([0, 5, 10], [0, 5, 10], {size: 10})
    await display(p, [300, 300])
  })

  it("should allow max x max plot", async () => {
    const p = figure({width_policy: "max", height_policy: "max"})
    p.scatter([0, 5, 10], [0, 5, 10], {size: 10})
    await display(p, [300, 300])
  })

  it("should allow max x fixed plot, aspect 0.8", async () => {
    const p = figure({width_policy: "max", height_policy: "fixed", height: 200, aspect_ratio: 0.8})
    p.scatter([0, 5, 10], [0, 5, 10], {size: 10})
    await display(p, [300, 300])
  })

  it("should allow fixed x max plot, aspect 0.8", async () => {
    const p = figure({width_policy: "fixed", width: 200, height_policy: "max", aspect_ratio: 0.8})
    p.scatter([0, 5, 10], [0, 5, 10], {size: 10})
    await display(p, [300, 300])
  })

  it("should allow max x max plot, aspect 0.8", async () => {
    const p = figure({width_policy: "max", height_policy: "max", aspect_ratio: 0.8})
    p.scatter([0, 5, 10], [0, 5, 10], {size: 10})
    await display(p, [300, 300])
  })

  it("should allow max x fixed plot, aspect 1.0", async () => {
    const p = figure({width_policy: "max", height_policy: "fixed", height: 200, aspect_ratio: 1.0})
    p.scatter([0, 5, 10], [0, 5, 10], {size: 10})
    await display(p, [300, 300])
  })

  it("should allow fixed x max plot, aspect 1.0", async () => {
    const p = figure({width_policy: "fixed", width: 200, height_policy: "max", aspect_ratio: 1.0})
    p.scatter([0, 5, 10], [0, 5, 10], {size: 10})
    await display(p, [300, 300])
  })

  it("should allow max x max plot, aspect 1.0", async () => {
    const p = figure({width_policy: "max", height_policy: "max", aspect_ratio: 1.0})
    p.scatter([0, 5, 10], [0, 5, 10], {size: 10})
    await display(p, [300, 300])
  })

  it("should allow max x fixed plot, aspect 1.25", async () => {
    const p = figure({width_policy: "max", height_policy: "fixed", height: 200, aspect_ratio: 1.25})
    p.scatter([0, 5, 10], [0, 5, 10], {size: 10})
    await display(p, [300, 300])
  })

  it("should allow fixed x max plot, aspect 1.25", async () => {
    const p = figure({width_policy: "fixed", width: 200, height_policy: "max", aspect_ratio: 1.25})
    p.scatter([0, 5, 10], [0, 5, 10], {size: 10})
    await display(p, [300, 300])
  })

  it("should allow max x max plot, aspect 1.25", async () => {
    const p = figure({width_policy: "max", height_policy: "max", aspect_ratio: 1.25})
    p.scatter([0, 5, 10], [0, 5, 10], {size: 10})
    await display(p, [300, 300])
  })

  it("should allow fixed frame 300px x 300px", async () => {
    const fig = figure({frame_width: 300, frame_height: 300})
    fig.scatter([0, 5, 10], [0, 5, 10], {size: 10})
    await display(fig, [500, 500])
  })

  it("should allow fixed frame 200px x 200px in a layout", async () => {
    const fig0 = figure({frame_width: 200, frame_height: 200})
    fig0.scatter([0, 5, 10], [0, 5, 10], {size: 10})
    const fig1 = figure({frame_width: 200, frame_height: 200})
    fig1.scatter([0, 5, 10], [0, 5, 10], {size: 10})
    const layout = row([fig0, fig1])
    await display(layout, [600, 300])
  })

  it("should allow fixed frame 200px x 200px in a layout with a title", async () => {
    const fig0 = figure({frame_width: 200, frame_height: 200, title: "A title"})
    fig0.scatter([0, 5, 10], [0, 5, 10], {size: 10})
    const fig1 = figure({frame_width: 200, frame_height: 200})
    fig1.scatter([0, 5, 10], [0, 5, 10], {size: 10})
    const layout = row([fig0, fig1])
    await display(layout, [600, 300])
  })

  describe("with webgl backend", () => {
    function webgl_figure() {
      return figure({width: 200, height: 200, toolbar_location: null, title: null, output_backend: "webgl"})
    }

    it("should allow empty line glyphs", async () => {
      const p = webgl_figure()
      p.line([1, 2, 3], [1, 4, 9], {line_width: 3})
      p.line([], [], {line_width: 3})
      await display(p)
    })

    it("should allow empty circle glyphs", async () => {
      const p = webgl_figure()
      p.scatter([1, 2, 3], [1, 4, 9], {size: 10})
      p.scatter([], [], {size: 10})
      await display(p)
    })

    it("should allow display on log axis", async () => {
      const p = figure({width: 200, height: 200, toolbar_location: null, title: null, y_axis_type: "log", output_backend: "webgl"})
      p.scatter([1, 2, 3], [1, 40, 900], {size: 10})
      await display(p)
    })
  })

  it("should support 'block' flow mode", async () => {
    const plot = fig([50, 30], {
      flow_mode: "block",
      styles: {vertical_align: "middle"},
      x_axis_type: null, y_axis_type: null,
    })
    plot.vbar({x: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9], top: [10, 3, 7, 2, 6, 9, 8, 1, 2, 7]})

    const pane = new Pane({
      elements: [
        new Text({content: "This plot should"}),
        plot,
        new Text({content: "create its own block."}),
      ],
    })
    await display(pane, [300, 100])
  })

  it("should support 'inline' flow mode", async () => {
    const plot = fig([50, 30], {
      flow_mode: "inline",
      styles: {vertical_align: "middle"},
      x_axis_type: null, y_axis_type: null,
    })
    plot.vbar({x: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9], top: [10, 3, 7, 2, 6, 9, 8, 1, 2, 7]})

    const pane = new Pane({
      elements: [
        new Text({content: "This plot should"}),
        plot,
        new Text({content: "be displayed inline."}),
      ],
    })
    await display(pane, [300, 100])
  })

  it("should allow to resize itself when width changes", async () => {
    const plot = fig([200, 200])
    plot.scatter([1, 2, 3], [1, 4, 9], {size: 10})
    const {view} = await display(plot, [450, 250])
    plot.width = 400
    await view.ready
  })

  describe("in issue #7217", () => {
    it("should support axes with different scales", async () => {
      // TODO:
      // const t = Symbol("t")
      // const v = Symbol("v")

      const source = new ColumnDataSource({
        data: {
          t: [0,  1,   2,    3,     4],
          v: [1, 10, 100, 1000, 10000],
        },
      })

      const f = fig([400, 200], {y_axis_type: "log"})

      f.yaxis.axis_label = "Log"
      f.yaxis.axis_label_text_color = "blue"

      f.extra_y_ranges = {linear: new Range1d({start: -1000, end: 20000})}
      f.extra_y_scales = {linear: new LinearScale()}

      const ax = new LinearAxis({y_range_name: "linear", axis_label: "Linear", axis_label_text_color: "red"})
      f.add_layout(ax, "left")

      const t = {field: "t"}
      const v = {field: "v"}

      f.line(t, v, {line_width: 2, source, color: "blue"})
      f.scatter(t, v, {size: 5, line_width: 2, source, color: "blue"})

      f.line({x: t, y: v, line_width: 2, source, y_range_name: "linear", color: "red"})
      f.scatter({x: t, y: v, size: 5, line_width: 2, source, y_range_name: "linear", color: "red"})

      await display(f)
    })
  })

  describe("in issue #12171", () => {
    it("should support hold_render property", async () => {
      const p = fig([200, 200])

      p.scatter([1, 2, 3], [1, 2, 3], {color: "red"})
      const {view} = await display(p)

      const spy = sinon.spy(view as any, "_actual_paint") // XXX: protected

      p.hold_render = true
      p.scatter([1, 2, 3], [2, 3, 4], {color: "blue"})
      p.scatter([1, 2, 3], [3, 4, 5], {color: "green"})
      await view.ready

      expect(spy.callCount).to.be.equal(0)

      p.hold_render = false
      await view.ready

      // Two _actual_paint() calls because of how layout is integrated into
      // the painting pipeline. This doesn't mean that renderers are actually
      // painted twice, because paint invalidation logic prevents this. It's
      // still quite confusing and requires a redesign.
      expect(spy.callCount).to.be.equal(2)
    })
  })
})
