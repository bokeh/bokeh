{expect} = require "chai"
utils = require "../../utils"
sinon = require 'sinon'

Axis = utils.require("models/axes/axis").Model
BasicTicker = utils.require("models/tickers/basic_ticker").Model
BasicTickFormatter = utils.require("models/formatters/basic_tick_formatter").Model
Plot = utils.require("models/plots/plot").Model
PlotCanvas = utils.require("models/plots/plot_canvas").Model
PlotView = utils.require("models/plots/plot").View
Range1d = utils.require("models/ranges/range1d").Model
SidePanel = utils.require("core/layout/side_panel").Model
Toolbar = utils.require("models/tools/toolbar").Model
{Document} = utils.require "document"

describe "Axis.Model", ->

  it "should have a SidePanel after add_panel is called", ->
    doc = new Document()
    p = new Plot({
      x_range: new Range1d({start: 0, end: 1})
      y_range: new Range1d({start: 0, end: 1})
    })
    doc.add_root(p)
    ticker = new BasicTicker()
    formatter = new BasicTickFormatter()
    axis = new Axis({
      ticker: ticker
      formatter: formatter
      plot: p
    })
    axis.attach_document(p.document)
    expect(axis.panel).to.be.undefined
    axis.add_panel('left')
    expect(axis.panel).to.be.an.instanceOf(SidePanel)

  it "should have a SidePanel after plot.add_layout is called", ->
    ticker = new BasicTicker()
    formatter = new BasicTickFormatter()
    axis = new Axis({
      ticker: ticker
      formatter: formatter
    })
    expect(axis.panel).to.be.undefined
    p = new Plot({
      x_range: new Range1d({start: 0, end: 1})
      y_range: new Range1d({start: 0, end: 1})
    })
    p.add_layout(axis, 'left')
    doc = new Document()
    doc.add_root(p)
    expect(axis.panel).to.be.an.instanceOf(SidePanel)

describe "Axis.View", ->

  afterEach ->
    utils.unstub_canvas()
    utils.unstub_solver()

  beforeEach ->
    utils.stub_canvas()
    solver_stubs = utils.stub_solver()

    doc = new Document()
    ticker = new BasicTicker()
    formatter = new BasicTickFormatter()
    @axis = new Axis({
      major_label_standoff: 11
      major_tick_out: 12
      ticker: ticker
      formatter: formatter
    })
    plot = new Plot({
      x_range: new Range1d({start: 0, end: 1})
      y_range: new Range1d({start: 0, end: 1})
      toolbar: new Toolbar()
    })
    plot.add_layout(@axis, 'below')
    doc.add_root(plot)
    plot_canvas_view = new plot.plot_canvas.default_view({ 'model': plot.plot_canvas })
    sinon.stub(plot_canvas_view, 'update_constraints')
    @axis_view = new @axis.default_view({
      model: @axis
      plot_model: plot.plot_canvas
      plot_view: plot_canvas_view
    })

  it "_tick_extent should return the major_tick_out property", ->
    expect(@axis_view._tick_extent()).to.be.equal @axis.major_tick_out

  it "_tick_label_extent should be greater than major_label_standoff", ->
    expect(@axis_view._tick_label_extent()).to.be.above @axis.major_label_standoff

  it "_axis_label_extent should be greater than axis_label_standoff", ->
    @axis.set('axis_label', 'Left axis label')
    expect(@axis_view._axis_label_extent()).to.be.above @axis.axis_label_standoff

  it "_axis_label_extent should be greater than the font_size", ->
    @axis.set('axis_label', 'Left axis label')
    expect(@axis_view._axis_label_extent()).to.be.above 0
    expect(@axis_view._axis_label_extent()).to.be.below 10

  it "_axis_label_extent should be 0 if no axis_label", ->
    expect(@axis_view._axis_label_extent()).to.be.equal 0

  it "_get_size should return sum of _tick_extent, _axis_label_extent, and _tick_label_extent", ->
    sinon.stub(@axis_view, '_tick_extent', () -> 0.11)
    sinon.stub(@axis_view, '_axis_label_extent', () -> 0.11)
    sinon.stub(@axis_view, '_tick_label_extent', () -> 0.11)
    expect(@axis_view._get_size()).to.be.equal 0.33
