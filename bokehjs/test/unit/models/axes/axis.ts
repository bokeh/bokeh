import {expect} from "#framework/assertions"
import {fig, display} from "#framework/layouts"
import {PlotActions, xy} from "#framework/interactive"

import {LinearAxis} from "@bokehjs/models/axes/linear_axis"
import {BasicTicker} from "@bokehjs/models/tickers/basic_ticker"
import {BasicTickFormatter} from "@bokehjs/models/formatters/basic_tick_formatter"
import {ScaledTicker} from "@bokehjs/models/tickers/scaled_ticker"
import {ScaledTickFormatter} from "@bokehjs/models/formatters/scaled_tick_formatter"
import {SITickFormatter} from "@bokehjs/models/formatters/si_tick_formatter"
import {SingleIntervalTicker} from "@bokehjs/models/tickers/single_interval_ticker"
import {Plot} from "@bokehjs/models/plots/plot"
import {FactorRange} from "@bokehjs/models/ranges/factor_range"
import {Range1d} from "@bokehjs/models/ranges/range1d"
import {CategoricalScale} from "@bokehjs/models/scales/categorical_scale"
import {WheelZoomTool} from "@bokehjs/models/tools/gestures/wheel_zoom_tool"
import {Toolbar} from "@bokehjs/models/tools/toolbar"
import type {GraphicsBox} from "@bokehjs/core/graphics"
import {InlineBox, TextBox} from "@bokehjs/core/graphics"
import {MathTextBox, TeXView, TeX} from "@bokehjs/models/text/math_text"

function text_of(box: GraphicsBox): string {
  if (box instanceof TextBox) {
    return box.text
  } else if (box instanceof InlineBox) {
    return box.children.map(text_of).join("")
  } else {
    throw new Error(`unexpected graphics box: ${box}`)
  }
}

describe("Axis", () => {

  it("should select one SI prefix from the visible major ticks after range changes", async () => {
    const x_range = Range1d.create({start: 0, end: 800})
    const plot = Plot.create({
      x_range,
      y_range: Range1d.create({start: 0, end: 1}),
    })
    const formatter = SITickFormatter.create({unit: "Hz"})
    const axis = LinearAxis.create({
      ticker: SingleIntervalTicker.create({interval: 200}),
      formatter,
    })
    plot.add_layout(axis, "below")
    const {view: plot_view} = await display(plot)
    const axis_view = plot_view.owner.get_one(axis)
    const labels = () => {
      const ticks = axis_view.tick_coords.major[axis_view.dimension]
      return axis_view.compute_labels(ticks).items.map(text_of)
    }

    expect(labels().every((label) => label.endsWith(" Hz"))).to.be.true

    x_range.end = 1200
    expect(labels().every((label) => label.endsWith(" kHz"))).to.be.true

    formatter.prefix = "k"
    x_range.end = 800
    expect(labels().every((label) => label.endsWith(" kHz"))).to.be.true
  })

  it("should provide its ticker to a ScaledTickFormatter", async () => {
    const plot = Plot.create({
      x_range: Range1d.create({start: -Math.PI, end: Math.PI}),
      y_range: Range1d.create({start: 0, end: 1}),
    })
    const ticker = ScaledTicker.create({scale: Math.PI})
    const formatter = ScaledTickFormatter.create({
      suffix: "π",
      unit_style: "symbolic",
      use_fractions: true,
    })
    const axis = LinearAxis.create({ticker, formatter})
    plot.add_layout(axis, "below")
    const {view: plot_view} = await display(plot)
    const axis_view = plot_view.owner.get_one(axis)

    expect(formatter.ticker).to.be.null
    expect(formatter.doFormat([-Math.PI, 0, Math.PI/2, Math.PI], axis_view)).to.be.equal(["−π", "0", "π/2", "π"])
    const labels = axis_view.compute_labels([-Math.PI, 0, Math.PI/2, Math.PI])
    expect(labels.items.map(text_of)).to.be.equal(["−π", "0", "π/2", "π"])
  })

  it("should render text-like units from a ScaledTickFormatter", async () => {
    const plot = Plot.create({
      x_range: Range1d.create({start: -Math.PI, end: Math.PI}),
      y_range: Range1d.create({start: 0, end: 1}),
    })
    const ticker = ScaledTicker.create({scale: Math.PI})
    const formatter = ScaledTickFormatter.create({
      suffix: "$$\\pi$$",
      unit_style: "symbolic",
      use_fractions: true,
      fraction_style: "stacked",
    })
    const axis = LinearAxis.create({ticker, formatter})
    plot.add_layout(axis, "below")
    const {view: plot_view} = await display(plot)
    const axis_view = plot_view.owner.get_one(axis)

    const ticks = [-2*Math.PI, -Math.PI, 0, Math.PI/2, Math.PI, 2*Math.PI]
    axis_view.compute_labels(ticks)
    await axis_view.ready
    const labels = axis_view.compute_labels(ticks)
    expect(labels.items.every((label) => label instanceof MathTextBox)).to.be.true
    const texts = labels.items.map((label) => (label as MathTextBox).view.model.text)
    expect(texts).to.be.equal(["-\\text{2}\\pi", "-\\pi", "\\text{0}", "\\frac{\\pi}{2}", "\\pi", "\\text{2}\\pi"])
  })

  it("should render TeX base labels and inline fractions", async () => {
    const plot = Plot.create({
      x_range: Range1d.create({start: -1, end: 1}),
      y_range: Range1d.create({start: 0, end: 1}),
    })
    const ticker = ScaledTicker.create({scale: 1})
    const formatter = ScaledTickFormatter.create({
      base_label: "$$\\overline{x}$$",
      suffix: "$$\\sigma$$",
      unit_style: "symbolic",
      use_fractions: true,
      fraction_style: "inline",
      max_denominator: 2,
    })
    const axis = LinearAxis.create({ticker, formatter})
    plot.add_layout(axis, "below")
    const {view: plot_view} = await display(plot)
    const axis_view = plot_view.owner.get_one(axis)

    const ticks = [-1, -0.5, 0, 0.5, 1]
    axis_view.compute_labels(ticks)
    await axis_view.ready
    const labels = axis_view.compute_labels(ticks)
    expect(labels.items.every((label) => label instanceof MathTextBox)).to.be.true
    const texts = labels.items.map((label) => (label as MathTextBox).view.model.text)
    expect(texts).to.be.equal([
      "\\overline{x}-\\sigma",
      "\\overline{x}-\\sigma/2",
      "\\overline{x}",
      "\\overline{x}+\\sigma/2",
      "\\overline{x}+\\sigma",
    ])
  })

  it("should render a shared TeX ScaledTickFormatter on two axes", async () => {
    const plot = Plot.create({
      x_range: Range1d.create({start: -Math.PI, end: Math.PI}),
      y_range: Range1d.create({start: -Math.PI, end: Math.PI}),
    })
    const formatter = ScaledTickFormatter.create({
      suffix: "$$\\pi$$",
      unit_style: "symbolic",
      use_fractions: true,
    })
    const x_axis = LinearAxis.create({ticker: ScaledTicker.create({scale: Math.PI}), formatter})
    const y_axis = LinearAxis.create({ticker: ScaledTicker.create({scale: Math.PI/2}), formatter})
    plot.add_layout(x_axis, "below")
    plot.add_layout(y_axis, "left")
    const {view: plot_view} = await display(plot)
    const x_axis_view = plot_view.owner.get_one(x_axis)
    const y_axis_view = plot_view.owner.get_one(y_axis)

    const ticks = [-Math.PI, 0, Math.PI/2, Math.PI]
    x_axis_view.compute_labels(ticks)
    y_axis_view.compute_labels(ticks)
    await Promise.all([x_axis_view.ready, y_axis_view.ready])

    const x_labels = x_axis_view.compute_labels(ticks)
    const y_labels = y_axis_view.compute_labels(ticks)
    x_axis_view.plot_view.request_paint()
    await x_axis_view.plot_view.ready
    expect(x_labels.items.every((label) => label instanceof MathTextBox)).to.be.true
    expect(y_labels.items.every((label) => label instanceof MathTextBox)).to.be.true
    const x_texts = x_labels.items.map((label) => (label as MathTextBox).view.model.text)
    const y_texts = y_labels.items.map((label) => (label as MathTextBox).view.model.text)
    expect(x_texts).to.be.equal(["-\\pi", "\\text{0}", "\\pi/2", "\\pi"])
    expect(y_texts).to.be.equal(["-\\text{2}\\pi", "\\text{0}", "\\pi", "\\text{2}\\pi"])
    expect(x_axis_view._formatter_text_views_pending.size).to.be.equal(0)
    expect(y_axis_view._formatter_text_views_pending.size).to.be.equal(0)
    expect(x_axis_view.has_finished()).to.be.true
    expect(y_axis_view.has_finished()).to.be.true
  })

  it("should render unscaled labels when a ScaledTickFormatter has no ScaledTicker", async () => {
    const plot = Plot.create({
      x_range: Range1d.create({start: 0, end: 1}),
      y_range: Range1d.create({start: 0, end: 1}),
    })
    const axis = LinearAxis.create({formatter: ScaledTickFormatter.create({suffix: "u"})})
    plot.add_layout(axis, "below")
    const {view: plot_view} = await display(plot)
    const axis_view = plot_view.owner.get_one(axis)

    const labels = axis_view.compute_labels([0, 1])
    expect(labels.items.map(text_of)).to.be.equal(["0u", "1u"])
  })

  it("should compute labels with overrides", async () => {
    const plot = Plot.create({
      x_range: Range1d.create({start: 0, end: 10}),
      y_range: Range1d.create({start: 0, end: 10}),
    })
    const ticker = BasicTicker.create()
    const formatter = BasicTickFormatter.create()
    const axis = LinearAxis.create({
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
    const plot = Plot.create({
      x_range: Range1d.create({start: 0, end: 10}),
      y_range: Range1d.create({start: 0, end: 10}),
    })
    const ticker = BasicTicker.create()
    const formatter = BasicTickFormatter.create()
    const axis = LinearAxis.create({
      ticker,
      formatter,
      major_label_overrides: new Map<number, string | TeX>([[0, "zero"], [4, TeX.create({text: "\\pi"})], [10, "$$ten$$"]]),
    })
    plot.add_layout(axis, "below")
    const {view: plot_view} = await display(plot)
    const axis_view = plot_view.owner.get_one(axis)

    const labels = axis_view.compute_labels([0, 2, 4, 6, 8, 10])

    expect(labels.items.map((l) => (l as TextBox).text)).to.be.equal(["zero", "2", "\\pi", "6", "8", "ten"])
    expect(labels.items.filter(l => l instanceof TeXView).length).to.be.equal(2)
  })

  it("should convert mathstrings on axis labels to TeX", async () => {
    const ticker = BasicTicker.create()
    const formatter = BasicTickFormatter.create()
    const axis = LinearAxis.create({
      ticker,
      formatter,
      axis_label: "$$\\sin(x)$$",
    })

    const plot = Plot.create({
      x_range: Range1d.create({start: 0, end: 10}),
      y_range: Range1d.create({start: 0, end: 10}),
    })
    plot.add_layout(axis, "below")

    const {view: plot_view} = await display(plot)
    const axis_view = plot_view.owner.get_one(axis)

    expect(axis_view._axis_label_view).to.be.instanceof(TeXView)
  })

  it("should convert mathstrings with line breaks in between delimiters on axis labels to TeX", async () => {
    const ticker = BasicTicker.create()
    const formatter = BasicTickFormatter.create()
    const axis = LinearAxis.create({
      ticker,
      formatter,
      axis_label: `$$
        \\sin(x)
      $$`,
    })

    const plot = Plot.create({
      x_range: Range1d.create({start: 0, end: 10}),
      y_range: Range1d.create({start: 0, end: 10}),
    })
    plot.add_layout(axis, "below")

    const {view: plot_view} = await display(plot)
    const axis_view = plot_view.owner.get_one(axis)

    expect(axis_view._axis_label_view).to.be.instanceof(TeXView)
  })

  it("loc should return numeric fixed_location", async () => {
    const plot = Plot.create({
      x_range: Range1d.create({start: 0, end: 10}),
      y_range: Range1d.create({start: 0, end: 10}),
    })
    const ticker = BasicTicker.create()
    const formatter = BasicTickFormatter.create()
    const axis = LinearAxis.create({
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
    const plot = Plot.create({
      x_range: FactorRange.create({factors: ["foo", "bar"]}),
      x_scale: CategoricalScale.create(),
      y_range: Range1d.create({start: 0, end: 10}),
    })
    const ticker = BasicTicker.create()
    const formatter = BasicTickFormatter.create()
    const axis = LinearAxis.create({
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
    const x_range = Range1d.create({start: 0, end: 3})
    const y_range = Range1d.create({start: 0, end: 3})

    const wheel_zoom = WheelZoomTool.create({maintain_focus: false})
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
    const x_range = Range1d.create({start: 0, end: 3, bounds: [0, 3]})
    const y_range = Range1d.create({start: 0, end: 3})

    const wheel_zoom = WheelZoomTool.create({maintain_focus: false})
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
    const x_range = FactorRange.create({factors, start: 0, end: 3})
    const y_range = Range1d.create({start: 0, end: 3})

    const wheel_zoom = WheelZoomTool.create({maintain_focus: false})
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
    const ticker = BasicTicker.create()
    const formatter = BasicTickFormatter.create()

    const axis = LinearAxis.create({
      major_label_standoff: 11,
      major_tick_out: 12,
      ticker,
      formatter,
      ...axis_attrs,
    })

    const plot = Plot.create({
      x_range: Range1d.create({start: 0, end: 1}),
      y_range: Range1d.create({start: 0, end: 1}),
      toolbar: Toolbar.create(),
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
