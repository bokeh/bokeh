import {expect} from "chai"

import {Axis, AxisView} from "models/axes/axis"
import {BasicTicker} from "models/tickers/basic_ticker"
import {BasicTickFormatter} from "models/formatters/basic_tick_formatter"
import {Plot, PlotView} from "models/plots/plot"
import {FactorRange} from "models/ranges/factor_range"
import {Range1d} from "models/ranges/range1d"
import {SidePanel} from "core/layout/side_panel"
import {CategoricalScale} from "models/scales/categorical_scale"
import {Toolbar} from "models/tools/toolbar"

describe("Axis", () => {

  it("should compute labels with overrides", () => {
    const plot = new Plot({
      x_range: new Range1d({start: 0, end: 10}),
      y_range: new Range1d({start: 0, end: 10}),
    })
    const ticker = new BasicTicker()
    const formatter = new BasicTickFormatter()
    const axis = new Axis({
      ticker,
      formatter,
      plot,
      major_label_overrides: {0: "zero", 4: "four", 10: "ten"},
    })
    expect(axis.compute_labels([0,2,4.0,6,8,10])).to.be.deep.equal(["zero", "2", "four", "6", "8", "ten"])
})

  it("loc should return numeric fixed_location", () => {
    const plot = new Plot({
      x_range: new Range1d({start: 0, end: 10}),
      y_range: new Range1d({start: 0, end: 10}),
    })
    const ticker = new BasicTicker()
    const formatter = new BasicTickFormatter()
    const axis = new Axis({
      ticker,
      formatter,
      plot,
      fixed_location: 10,
    })
    expect(axis.loc).to.equal(10)
  })

  it("loc should return synthetic for categorical fixed_location", () => {
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
      plot,
      fixed_location: "foo",
    })
    axis.add_panel('left')
    expect(axis.loc).to.equal(0.5)
  })

  it("should have a SidePanel after add_panel is called", () => {
    const plot = new Plot({
      x_range: new Range1d({start: 0, end: 1}),
      y_range: new Range1d({start: 0, end: 1}),
    })
    const ticker = new BasicTicker()
    const formatter = new BasicTickFormatter()
    const axis = new Axis({
      ticker,
      formatter,
      plot,
    })
    expect(axis.panel).to.be.undefined
    axis.add_panel('left')
    expect(axis.panel).to.be.an.instanceOf(SidePanel)
  })

  it("should have a SidePanel after plot.add_layout is called", () => {
    const ticker = new BasicTicker()
    const formatter = new BasicTickFormatter()
    const axis = new Axis({ticker, formatter})
    expect(axis.panel).to.be.undefined
    const plot = new Plot({
      x_range: new Range1d({start: 0, end: 1}),
      y_range: new Range1d({start: 0, end: 1}),
    })
    plot.add_layout(axis, 'left')
    expect(axis.panel).to.be.an.instanceOf(SidePanel)
  })
})

describe("AxisView", () => {

  function build(axis_attrs: Partial<Axis.Attrs> = {}) {
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

    const plot_view = new plot.default_view({model: plot, parent: null}) as PlotView
    const plot_canvas_view = plot_view.plot_canvas_view

    const axis_view = new axis.default_view({
      model: axis,
      plot_view: plot_canvas_view,
      parent: plot_canvas_view,
    }) as AxisView

    return {axis, axis_view}
  }

  it("needs_clip should return the false when fixed_location null", () => {
    const {axis_view} = build()
    expect(axis_view.needs_clip).to.be.equal(false)
  })

  it("needs_clip should return the false when fixed_location null", () => {
    const {axis_view} = build({fixed_location: 10})
    expect(axis_view.needs_clip).to.be.equal(true)
  })

  it("_tick_extent should return the major_tick_out property", () => {
    const {axis, axis_view} = build()
    expect(axis_view._tick_extent()).to.be.equal(axis.major_tick_out)
  })

  it("_axis_label_extent should be greater than axis_label_standoff", () => {
    const {axis, axis_view} = build({axis_label: 'Left axis label'})
    expect(axis_view._axis_label_extent()).to.be.above(axis.axis_label_standoff)
  })

  it("_axis_label_extent should be greater than the font_size", () => {
    const {axis_view} = build({axis_label: 'Left axis label'})
    expect(axis_view._axis_label_extent()).to.be.above(0)
    expect(axis_view._axis_label_extent()).to.be.below(10)
  })

  it("_axis_label_extent should be 0 if axis_label is null", () => {
    const {axis_view} = build({axis_label: null})
    expect(axis_view._axis_label_extent()).to.be.equal(0)
  })

  it("_axis_label_extent should be 0 if axis_label is empty", () => {
    const {axis_view} = build({axis_label: ""})
    expect(axis_view._axis_label_extent()).to.be.equal(0)
  })
})
