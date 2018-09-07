{expect} = require "chai"
sinon = require 'sinon'

{Document} = require("document")

{Axis} = require("models/axes/axis")
{AxisView} = require("models/axes/axis")
{BasicTicker} = require("models/tickers/basic_ticker")
{BasicTickFormatter} = require("models/formatters/basic_tick_formatter")
{CanvasView} = require("models/canvas/canvas")
{DataRange1d} = require("models/ranges/data_range1d")
{LayoutCanvas} = require("core/layout/layout_canvas")
{LinearAxis} = require("models/axes/linear_axis")
{Plot} = require("models/plots/plot")
{Range1d} = require("models/ranges/range1d")
{Toolbar} = require("models/tools/toolbar")

describe "PlotView pause", ->

  beforeEach ->
    @doc = new Document()
    @plot = new Plot({
      x_range: new Range1d({start: 0, end: 1})
      y_range: new Range1d({start: 0, end: 1})
      toolbar: new Toolbar()
      title: null
    })
    @plot_view = new @plot.default_view({model: @plot, parent: null})
    @doc.add_root(@plot)

  it "should start unpaused", ->
    expect(@plot_view.is_paused).to.be.false

  it "should toggle on/off in pairs", ->
    expect(@plot_view.is_paused).to.be.false
    @plot_view.pause()
    expect(@plot_view.is_paused).to.be.true
    @plot_view.unpause()
    expect(@plot_view.is_paused).to.be.false

  it "should toggle off only on last unpause with nested pairs", ->
    expect(@plot_view.is_paused).to.be.false
    @plot_view.pause()
    expect(@plot_view.is_paused).to.be.true
    @plot_view.pause()
    expect(@plot_view.is_paused).to.be.true
    @plot_view.unpause()
    expect(@plot_view.is_paused).to.be.true
    @plot_view.unpause()
    expect(@plot_view.is_paused).to.be.false

describe "PlotView get_canvas_element", ->

  beforeEach ->
    doc = new Document()
    plot = new Plot({
      x_range: new Range1d({start: 0, end: 1})
      y_range: new Range1d({start: 0, end: 1})
      toolbar: new Toolbar()
    })
    doc.add_root(plot)
    @plot_view = new plot.default_view({model: plot, parent: null})
    @plot_view.do_layout()

  it "should exist because get_canvas_element depends on it", sinon.test () ->
    expect(@plot_view.canvas_view.ctx).to.exist

  it "should exist to grab the canvas DOM element using canvas_view.ctx", sinon.test () ->
    expect(@plot_view.canvas_view.get_canvas_element).to.exist
