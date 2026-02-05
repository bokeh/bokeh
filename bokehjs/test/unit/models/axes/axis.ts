import {expect} from "assertions"
import {fig, display} from "../../_util"
import {PlotActions, xy} from "../../../interactive"

import {LinearAxis} from "@bokehjs/models/axes/linear_axis"
import {BasicTicker} from "@bokehjs/models/tickers/basic_ticker"
import {BasicTickFormatter} from "@bokehjs/models/formatters/basic_tick_formatter"
import {Plot} from "@bokehjs/models/plots/plot"
import {FactorRange} from "@bokehjs/models/ranges/factor_range"
import {Range1d} from "@bokehjs/models/ranges/range1d"
import {CategoricalScale} from "@bokehjs/models/scales/categorical_scale"
import {WheelZoomTool} from "@bokehjs/models/tools/gestures/wheel_zoom_tool"
import {Toolbar} from "@bokehjs/models/tools/toolbar"
import type {TextBox} from "@bokehjs/core/graphics"
import {TeXView, TeX} from "@bokehjs/models/text/math_text"

describe("Axis", () => {

  it("should compute labels with overrides", async () => {
    const plot = new Plot({
      x_range: new Range1d({start: 0, end: 10}),
      y_range: new Range1d({start: 0, end: 10}),
    })
    const ticker = new BasicTicker()
    const formatter = new BasicTickFormatter()
    const axis = new LinearAxis({
      ticker,
      formatter,
      major_label_overrides: new Map([[0, "zero"], [4, "four"], [10, "ten"]]),
    })
    plot.add_layout(axis, "below")
    const {view: plot_view} = await display(plot)
    const axis_view = plot_view.owner.get_one(axis)

    const labels = axis_view.compute_labels([0, 2, 4.0, 6, 8, 10])
    expect(labels.items.map((l) => (l as TextBox).text)).to.be.equal(["zero", "2", "four", "6", "8", "ten"])
  })

  it("should compute labels with math text on overrides", async () => {
    const plot = new Plot({
      x_range: new Range1d({start: 0, end: 10}),
      y_range: new Range1d({start: 0, end: 10}),
    })
    const ticker = new BasicTicker()
    const formatter = new BasicTickFormatter()
    const axis = new LinearAxis({
      ticker,
      formatter,
      major_label_overrides: new Map<number, string | TeX>([[0, "zero"], [4, new TeX({text: "\\pi"})], [10, "$$ten$$"]]),
    })
    plot.add_layout(axis, "below")
    const {view: plot_view} = await display(plot)
    const axis_view = plot_view.owner.get_one(axis)

    const labels = axis_view.compute_labels([0, 2, 4, 6, 8, 10])

    expect(labels.items.map((l) => (l as TextBox).text)).to.be.equal(["zero", "2", "\\pi", "6", "8", "ten"])
    expect(labels.items.filter(l => l instanceof TeXView).length).to.be.equal(2)
  })

  it("should convert mathstrings on axis labels to TeX", async () => {
    const ticker = new BasicTicker()
    const formatter = new BasicTickFormatter()
    const axis = new LinearAxis({
      ticker,
      formatter,
      axis_label: "$$\\sin(x)$$",
    })

    const plot = new Plot({
      x_range: new Range1d({start: 0, end: 10}),
      y_range: new Range1d({start: 0, end: 10}),
    })
    plot.add_layout(axis, "below")

    const {view: plot_view} = await display(plot)
    const axis_view = plot_view.owner.get_one(axis)

    expect(axis_view._axis_label_view).to.be.instanceof(TeXView)
  })

  it("should convert mathstrings with line breaks in between delimiters on axis labels to TeX", async () => {
    const ticker = new BasicTicker()
    const formatter = new BasicTickFormatter()
    const axis = new LinearAxis({
      ticker,
      formatter,
      axis_label: `$$
        \\sin(x)
      $$`,
    })

    const plot = new Plot({
      x_range: new Range1d({start: 0, end: 10}),
      y_range: new Range1d({start: 0, end: 10}),
    })
    plot.add_layout(axis, "below")

    const {view: plot_view} = await display(plot)
    const axis_view = plot_view.owner.get_one(axis)

    expect(axis_view._axis_label_view).to.be.instanceof(TeXView)
  })

  it("loc should return numeric fixed_location", async () => {
    const plot = new Plot({
      x_range: new Range1d({start: 0, end: 10}),
      y_range: new Range1d({start: 0, end: 10}),
    })
    const ticker = new BasicTicker()
    const formatter = new BasicTickFormatter()
    const axis = new LinearAxis({
      ticker,
      formatter,
      fixed_location: 10,
    })
    plot.add_layout(axis, "below")
    const {view: plot_view} = await display(plot)
    const axis_view = plot_view.owner.get_one(axis)
    expect(axis_view.loc).to.be.equal(10)
  })

  it("loc should return synthetic for categorical fixed_location", async () => {
    const plot = new Plot({
      x_range: new FactorRange({factors: ["foo", "bar"]}),
      x_scale: new CategoricalScale(),
      y_range: new Range1d({start: 0, end: 10}),
    })
    const ticker = new BasicTicker()
    const formatter = new BasicTickFormatter()
    const axis = new LinearAxis({
      ticker,
      formatter,
      fixed_location: "foo",
    })
    plot.add_layout(axis, "left")
    const {view: plot_view} = await display(plot)
    const axis_view = plot_view.owner.get_one(axis)
    expect(axis_view.loc).to.be.equal(0.5)
  })

  it("should allow zooming unsing Range1d when no bounds are set", async () => {
    const x_range = new Range1d({start: 0, end: 3})
    const y_range = new Range1d({start: 0, end: 3})

    const wheel_zoom = new WheelZoomTool({maintain_focus: false})
    const p = fig([200, 200], {x_range, y_range, tools: [wheel_zoom], active_scroll: wheel_zoom})
    p.scatter({x: [1, 2, 3], y: [1, 2, 3], size: 20})

    const {view} = await display(p)

    expect(x_range.interval).to.be.equal([0, 3])

    const actions = new PlotActions(view)
    await actions.scroll_down(xy(2, 2), 1)
    await view.ready

    expect(x_range.start).to.be.below(0)
    expect(x_range.end).to.be.above(3)
  })

  it("should respect bounds when zooming unsing Range1d", async () => {
    const x_range = new Range1d({start: 0, end: 3, bounds: [0, 3]})
    const y_range = new Range1d({start: 0, end: 3})

    const wheel_zoom = new WheelZoomTool({maintain_focus: false})
    const p = fig([200, 200], {x_range, y_range, tools: [wheel_zoom], active_scroll: wheel_zoom})
    p.scatter({x: [1, 2, 3], y: [1, 2, 3], size: 20})

    const {view} = await display(p)

    expect(x_range.interval).to.be.equal([0, 3])

    const actions = new PlotActions(view)
    await actions.scroll_down(xy(2, 2), 1)
    await view.ready

    expect(x_range.interval).to.be.equal([0, 3])
  })

  it("should allow zooming unsing FactorRange when no bounds are set", async () => {
    const factors = ["A", "B", "C"]
    const x_range = new FactorRange({factors, start: 0, end: 3})
    const y_range = new Range1d({start: 0, end: 3})

    const wheel_zoom = new WheelZoomTool({maintain_focus: false})
    const p = fig([200, 200], {x_range, y_range, tools: [wheel_zoom], active_scroll: wheel_zoom})
    p.scatter({x: factors, y: [1, 2, 3], size: 20})

    const {view} = await display(p)

    expect(x_range.interval).to.be.equal([0, 3])

    const actions = new PlotActions(view)
    await actions.scroll_down(xy(2, 2), 1)
    await view.ready

    expect(x_range.start).to.be.below(0)
    expect(x_range.end).to.be.above(3)
  })
})

describe("AxisView", () => {

  async function build(axis_attrs: Partial<LinearAxis.Attrs> = {}) {
    const ticker = new BasicTicker()
    const formatter = new BasicTickFormatter()

    const axis = new LinearAxis({
      major_label_standoff: 11,
      major_tick_out: 12,
      ticker,
      formatter,
      ...axis_attrs,
    })

    const plot = new Plot({
      x_range: new Range1d({start: 0, end: 1}),
      y_range: new Range1d({start: 0, end: 1}),
      toolbar: new Toolbar(),
    })
    plot.add_layout(axis, "below")

    const {view: plot_view} = await display(plot)
    const axis_view = plot_view.owner.get_one(axis)

    return {axis, axis_view}
  }

  it("needs_clip should return false when fixed_location is null", async () => {
    const {axis_view} = await build()
    expect(axis_view.needs_clip).to.be.false
  })

  it("needs_clip should return true when fixed_location is not null", async () => {
    const {axis_view} = await build({fixed_location: 10})
    expect(axis_view.needs_clip).to.be.true
  })

  it("_tick_extent should return the major_tick_out property", async () => {
    const {axis, axis_view} = await build()
    expect(axis_view._tick_extent()).to.be.equal(axis.major_tick_out)
  })
})
