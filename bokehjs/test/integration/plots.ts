import {display, fig, row} from "./_util"

import {figure} from "@bokehjs/api/plotting"
import {Location} from "@bokehjs/core/enums"
import {Range1d, LinearScale, LinearAxis, ColumnDataSource} from "@bokehjs/models"

describe("Plot", () => {
  const f = (location: Location | null, title?: string) => {
    const p = fig([200, 200], {tools: "pan,reset", title, toolbar_location: location, title_location: location})
    p.circle([0, 5, 10], [0, 5, 10], {size: 10})
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
    await display(f("above", "Plot Title"))
  })

  it("should allow toolbar placement below with title", async () => {
    await display(f("below", "Plot Title"))
  })

  it("should allow toolbar placement left with title", async () => {
    await display(f("left", "Plot Title"))
  })

  it("should allow toolbar placement right with title", async () => {
    await display(f("right", "Plot Title"))
  })

  it("should allow fixed x fixed plot", async () => {
    const p = figure({width_policy: "fixed", width: 200, height_policy: "fixed", height: 200})
    p.circle([0, 5, 10], [0, 5, 10], {size: 10})
    await display(p, [300, 300])
  })

  it("should allow max x fixed plot", async () => {
    const p = figure({width_policy: "max", height_policy: "fixed", height: 200})
    p.circle([0, 5, 10], [0, 5, 10], {size: 10})
    await display(p, [300, 300])
  })

  it("should allow fixed x max plot", async () => {
    const p = figure({width_policy: "fixed", width: 200, height_policy: "max"})
    p.circle([0, 5, 10], [0, 5, 10], {size: 10})
    await display(p, [300, 300])
  })

  it("should allow max x max plot", async () => {
    const p = figure({width_policy: "max", height_policy: "max"})
    p.circle([0, 5, 10], [0, 5, 10], {size: 10})
    await display(p, [300, 300])
  })

  it("should allow max x fixed plot, aspect 0.8", async () => {
    const p = figure({width_policy: "max", height_policy: "fixed", height: 200, aspect_ratio: 0.8})
    p.circle([0, 5, 10], [0, 5, 10], {size: 10})
    await display(p, [300, 300])
  })

  it("should allow fixed x max plot, aspect 0.8", async () => {
    const p = figure({width_policy: "fixed", width: 200, height_policy: "max", aspect_ratio: 0.8})
    p.circle([0, 5, 10], [0, 5, 10], {size: 10})
    await display(p, [300, 300])
  })

  it("should allow max x max plot, aspect 0.8", async () => {
    const p = figure({width_policy: "max", height_policy: "max", aspect_ratio: 0.8})
    p.circle([0, 5, 10], [0, 5, 10], {size: 10})
    await display(p, [300, 300])
  })

  it("should allow max x fixed plot, aspect 1.0", async () => {
    const p = figure({width_policy: "max", height_policy: "fixed", height: 200, aspect_ratio: 1.0})
    p.circle([0, 5, 10], [0, 5, 10], {size: 10})
    await display(p, [300, 300])
  })

  it("should allow fixed x max plot, aspect 1.0", async () => {
    const p = figure({width_policy: "fixed", width: 200, height_policy: "max", aspect_ratio: 1.0})
    p.circle([0, 5, 10], [0, 5, 10], {size: 10})
    await display(p, [300, 300])
  })

  it("should allow max x max plot, aspect 1.0", async () => {
    const p = figure({width_policy: "max", height_policy: "max", aspect_ratio: 1.0})
    p.circle([0, 5, 10], [0, 5, 10], {size: 10})
    await display(p, [300, 300])
  })

  it("should allow max x fixed plot, aspect 1.25", async () => {
    const p = figure({width_policy: "max", height_policy: "fixed", height: 200, aspect_ratio: 1.25})
    p.circle([0, 5, 10], [0, 5, 10], {size: 10})
    await display(p, [300, 300])
  })

  it("should allow fixed x max plot, aspect 1.25", async () => {
    const p = figure({width_policy: "fixed", width: 200, height_policy: "max", aspect_ratio: 1.25})
    p.circle([0, 5, 10], [0, 5, 10], {size: 10})
    await display(p, [300, 300])
  })

  it("should allow max x max plot, aspect 1.25", async () => {
    const p = figure({width_policy: "max", height_policy: "max", aspect_ratio: 1.25})
    p.circle([0, 5, 10], [0, 5, 10], {size: 10})
    await display(p, [300, 300])
  })

  it("should allow fixed frame 300px x 300px", async () => {
    const fig = figure({frame_width: 300, frame_height: 300})
    fig.circle([0, 5, 10], [0, 5, 10], {size: 10})
    await display(fig, [500, 500])
  })

  it("should allow fixed frame 200px x 200px in a layout", async () => {
    const fig0 = figure({frame_width: 200, frame_height: 200})
    fig0.circle([0, 5, 10], [0, 5, 10], {size: 10})
    const fig1 = figure({frame_width: 200, frame_height: 200})
    fig1.circle([0, 5, 10], [0, 5, 10], {size: 10})
    const layout = row([fig0, fig1])
    await display(layout, [600, 300])
  })

  it("should allow fixed frame 200px x 200px in a layout with a title", async () => {
    const fig0 = figure({frame_width: 200, frame_height: 200, title: "A title"})
    fig0.circle([0, 5, 10], [0, 5, 10], {size: 10})
    const fig1 = figure({frame_width: 200, frame_height: 200})
    fig1.circle([0, 5, 10], [0, 5, 10], {size: 10})
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
      p.circle([1, 2, 3], [1, 4, 9], {size: 10})
      p.circle([], [], {size: 10})
      await display(p)
    })

    it("should allow display on log axis", async () => {
      const p = figure({width: 200, height: 200, toolbar_location: null, title: null, y_axis_type: "log", output_backend: "webgl"})
      p.circle([1, 2, 3], [1, 40, 900], {size: 10})
      await display(p)
    })
  })

  it("should allow to resize itself when width changes", async () => {
    const plot = fig([200, 200])
    plot.circle([1, 2, 3], [1, 4, 9], {size: 10})
    const {view} = await display(plot, [450, 250])
    plot.width = 400
    await view.ready
  })

  it("should allow to fully repaint canvas after viewport resize", async () => {
    const plot = fig([200, 200], {sizing_mode: "stretch_both"})
    plot.circle([1, 2, 3], [1, 4, 9], {size: 10})
    const {view, el} = await display(plot, [200, 200])
    el.style.width = "300px"
    el.style.height = "300px"
    view.resize_layout() // TODO: ResizeObserver
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
      f.circle(t, v, {size: 5, line_width: 2, source, color: "blue"})

      f.line({x: t, y: v, line_width: 2, source, y_range_name: "linear", color: "red"})
      f.circle({x: t, y: v, size: 5, line_width: 2, source, y_range_name: "linear", color: "red"})

      await display(f)
    })
  })
})
