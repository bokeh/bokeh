import {expect} from "assertions"

import {Axis, AxisView} from "@bokehjs/models/axes/axis"
import {BasicTicker} from "@bokehjs/models/tickers/basic_ticker"
import {BasicTickFormatter} from "@bokehjs/models/formatters/basic_tick_formatter"
import {Plot} from "@bokehjs/models/plots/plot"
import {FactorRange} from "@bokehjs/models/ranges/factor_range"
import {Range1d} from "@bokehjs/models/ranges/range1d"
import {CategoricalScale} from "@bokehjs/models/scales/categorical_scale"
import {Toolbar} from "@bokehjs/models/tools/toolbar"
import {build_view} from "@bokehjs/core/build_views"

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
      major_label_overrides: {0: "zero", 4: "four", 10: "ten"},
    })
    plot.add_layout(axis, "below")
    const plot_view = (await build_view(plot)).build()
    const axis_view = plot_view.renderer_views.get(axis)! as AxisView

    expect(axis_view.compute_labels([0, 2, 4.0, 6, 8, 10])).to.be.equal(["zero", "2", "four", "6", "8", "ten"])
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
    const plot_view = (await build_view(plot)).build()
    const axis_view = plot_view.renderer_views.get(axis)! as AxisView
    expect(axis_view.loc).to.be.equal(10)
  })

  it("should return zero offsets when fixed_location is numeric", async () => {
    const plot = new Plot({
      x_range: new Range1d({start: 0, end: 10}),
      y_range: new Range1d({start: 0, end: 10}),
    })
    const ticker = new BasicTicker()
    const formatter = new BasicTickFormatter()
    const axis = new Axis({
      ticker,
      formatter,
      fixed_location: 5,
    })
    plot.add_layout(axis, "left")
    const plot_view = (await build_view(plot)).build()
    const axis_view = plot_view.renderer_views.get(axis)! as AxisView
    expect(axis_view.offsets).to.be.equal([0, 0])
  })

  it("should return zero offsets when fixed_location is categorical", async () => {
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
    const plot_view = (await build_view(plot)).build()
    const axis_view = plot_view.renderer_views.get(axis)! as AxisView
    expect(axis_view.offsets).to.be.equal([0, 0])
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
    const plot_view = (await build_view(plot)).build()
    const axis_view = plot_view.renderer_views.get(axis)! as AxisView
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
    plot.add_layout(axis, 'below')

    const plot_view = (await build_view(plot)).build()
    const axis_view = plot_view.renderer_views.get(axis)! as AxisView

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

  it("_axis_label_extent should be greater than axis_label_standoff", async () => {
    const {axis, axis_view} = await build({axis_label: 'Left axis label'})
    expect(axis_view._axis_label_extent()).to.be.above(axis.axis_label_standoff)
  })

  it("_axis_label_extent should be greater than the font_size", async () => {
    const {axis_view} = await build({axis_label: 'Left axis label'})
    expect(axis_view._axis_label_extent()).to.be.above(13.3333)
  })

  it("_axis_label_extent should be 0 if axis_label is null", async () => {
    const {axis_view} = await build({axis_label: null})
    expect(axis_view._axis_label_extent()).to.be.equal(0)
  })

  it("_axis_label_extent should be 0 if axis_label is empty", async () => {
    const {axis_view} = await build({axis_label: ""})
    expect(axis_view._axis_label_extent()).to.be.equal(0)
  })
})
