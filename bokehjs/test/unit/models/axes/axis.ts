import {expect} from "assertions"
import {display} from "../../_util"

import {Axis} from "@bokehjs/models/axes/axis"
import {BasicTicker} from "@bokehjs/models/tickers/basic_ticker"
import {BasicTickFormatter} from "@bokehjs/models/formatters/basic_tick_formatter"
import {Plot} from "@bokehjs/models/plots/plot"
import {FactorRange} from "@bokehjs/models/ranges/factor_range"
import {Range1d} from "@bokehjs/models/ranges/range1d"
import {CategoricalScale} from "@bokehjs/models/scales/categorical_scale"
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
    const axis = new Axis({
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
    const axis = new Axis({
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
    const axis = new Axis({
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
    const axis = new Axis({
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
    const axis = new Axis({
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
    const axis = new Axis({
      ticker,
      formatter,
      fixed_location: "foo",
    })
    plot.add_layout(axis, "left")
    const {view: plot_view} = await display(plot)
    const axis_view = plot_view.owner.get_one(axis)
    expect(axis_view.loc).to.be.equal(0.5)
  })
})

describe("AxisView", () => {

  async function build(axis_attrs: Partial<Axis.Attrs> = {}) {
    const ticker = new BasicTicker()
    const formatter = new BasicTickFormatter()

    const axis = new Axis({
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
