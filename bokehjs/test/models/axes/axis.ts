import {expect} from "chai"
import * as sinon from 'sinon'

import {Axis} from "models/axes/axis"
import {BasicTicker} from "models/tickers/basic_ticker"
import {BasicTickFormatter} from "models/formatters/basic_tick_formatter"
import {Plot} from "models/plots/plot"
import {FactorRange} from "models/ranges/factor_range"
import {Range1d} from "models/ranges/range1d"
import {SidePanel} from "core/layout/side_panel"
import {CategoricalScale} from "models/scales/categorical_scale"
import {Toolbar} from "models/tools/toolbar"
import {Document} from "document"

describe("Axis", () => {

  it("should compute labels with overrides", function() {
    const doc = new Document()
    const p = new Plot({
      x_range: new Range1d({start: 0, end: 10}),
      y_range: new Range1d({start: 0, end: 10}),
    })
    doc.add_root(p)
    const ticker = new BasicTicker()
    const formatter = new BasicTickFormatter()
    const axis = new Axis({
      ticker,
      formatter,
      plot: p,
      major_label_overrides: {0: "zero", 4: "four", 10: "ten"},
    })
    expect(axis.compute_labels([0,2,4.0,6,8,10])).to.be.deep.equal(["zero", "2", "four", "6", "8", "ten"])
})

  it("loc should return numeric fixed_location", function() {
    const doc = new Document()
    const p = new Plot({
      x_range: new Range1d({start: 0, end: 10}),
      y_range: new Range1d({start: 0, end: 10}),
    })
    doc.add_root(p)
    const ticker = new BasicTicker()
    const formatter = new BasicTickFormatter()
    const axis = new Axis({
      ticker,
      formatter,
      plot: p,
      fixed_location: 10,
    })
    expect(axis.loc).to.equal(10)
  })

  it("loc should return synthetic for categorical fixed_location", function() {
    const doc = new Document()
    const p = new Plot({
      x_range: new FactorRange({factors: ["foo", "bar"]}),
      x_scale: new CategoricalScale(),
      y_range: new Range1d({start: 0, end: 10}),
    })
    doc.add_root(p)
    const ticker = new BasicTicker()
    const formatter = new BasicTickFormatter()
    const axis = new Axis({
      ticker,
      formatter,
      plot: p,
      fixed_location: "foo",
    })
    axis.attach_document(p.document!)
    axis.add_panel('left')
    expect(axis.loc).to.equal(0.5)
  })

  it("should have a SidePanel after add_panel is called", function() {
    const doc = new Document()
    const p = new Plot({
      x_range: new Range1d({start: 0, end: 1}),
      y_range: new Range1d({start: 0, end: 1}),
    })
    doc.add_root(p)
    const ticker = new BasicTicker()
    const formatter = new BasicTickFormatter()
    const axis = new Axis({
      ticker,
      formatter,
      plot: p,
    })
    axis.attach_document(p.document!)
    expect(axis.panel).to.be.undefined
    axis.add_panel('left')
    expect(axis.panel).to.be.an.instanceOf(SidePanel)
  })

  it("should have a SidePanel after plot.add_layout is called", function() {
    const ticker = new BasicTicker()
    const formatter = new BasicTickFormatter()
    const axis = new Axis({ticker, formatter})
    expect(axis.panel).to.be.undefined
    const p = new Plot({
      x_range: new Range1d({start: 0, end: 1}),
      y_range: new Range1d({start: 0, end: 1}),
    })
    p.add_layout(axis, 'left')
    const doc = new Document()
    doc.add_root(p)
    expect(axis.panel).to.be.an.instanceOf(SidePanel)
  })
})

describe("AxisView", () => {

  beforeEach(function() {
    const doc = new Document()
    const ticker = new BasicTicker()
    const formatter = new BasicTickFormatter()
    this.axis = new Axis({
      major_label_standoff: 11,
      major_tick_out: 12,
      ticker,
      formatter,
    })
    const plot = new Plot({
      x_range: new Range1d({start: 0, end: 1}),
      y_range: new Range1d({start: 0, end: 1}),
      toolbar: new Toolbar(),
    })
    const plot_view = new plot.default_view({model: plot, parent: null})
    doc.add_root(plot)
    plot.add_layout(this.axis, 'below')
    const plot_canvas_view = new plot.plot_canvas.default_view({model: plot.plot_canvas, parent: plot_view})
    sinon.stub(plot_canvas_view as any, 'update_constraints')
    this.axis_view = new this.axis.default_view({
      model: this.axis,
      plot_view: plot_canvas_view,
      parent: plot_canvas_view,
    })
  })

  it("needs_clip should return the false when fixed_location null", function() {
    expect(this.axis_view.needs_clip).to.be.equal(false)
  })

  it("needs_clip should return the false when fixed_location null", function() {
    this.axis.fixed_location = 10
    expect(this.axis_view.needs_clip).to.be.equal(true)
  })

  it("_tick_extent should return the major_tick_out property", function() {
    expect(this.axis_view._tick_extent()).to.be.equal(this.axis.major_tick_out)
  })

  it("_axis_label_extent should be greater than axis_label_standoff", function() {
    this.axis.axis_label = 'Left axis label'
    expect(this.axis_view._axis_label_extent()).to.be.above(this.axis.axis_label_standoff)
  })

  it("_axis_label_extent should be greater than the font_size", function() {
    this.axis.axis_label = 'Left axis label'
    expect(this.axis_view._axis_label_extent()).to.be.above(0)
    expect(this.axis_view._axis_label_extent()).to.be.below(10)
  })

  it("_axis_label_extent should be 0 if no axis_label", function() {
    this.axis.axis_label = null
    expect(this.axis_view._axis_label_extent()).to.be.equal(0)

    this.axis.axis_label = ""
    expect(this.axis_view._axis_label_extent()).to.be.equal(0)
  })

  /* XXX
  it "_get_size should return sum of _tick_extent, _axis_label_extent, and _tick_label_extent", sinon.test ->
    this.stub(@axis_view, '_tick_extent', () -> 0.11)
    this.stub(@axis_view, '_axis_label_extent', () -> 0.11)
    this.stub(@axis_view, '_tick_label_extent', () -> 0.11)
    expect(@axis_view._get_size()).to.be.equal 0.33
  */
})
