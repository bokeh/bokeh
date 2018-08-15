{expect} = require "chai"
sinon = require 'sinon'

{Solver, Variable} = require("core/layout/solver")
{update_constraints} = require("core/layout/side_panel")

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

describe "PlotCanvas", ->

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

  it "should have axis panels in get_layoutable_children if axes added", sinon.test () ->
    plot = new Plot({x_range: new DataRange1d(), y_range: new DataRange1d(), title: null})
    above_axis = new LinearAxis()
    below_axis = new LinearAxis()
    left_axis = new LinearAxis()
    right_axis = new LinearAxis()
    plot.add_layout(above_axis, 'above')
    plot.add_layout(below_axis, 'below')
    plot.add_layout(left_axis, 'left')
    plot.add_layout(right_axis, 'right')
    @doc.add_root(plot)
    layoutable_children = plot_view.get_layoutable_children()
    expect(above_axis.panel in layoutable_children).to.be.true
    expect(below_axis.panel in layoutable_children).to.be.true
    expect(left_axis.panel  in layoutable_children).to.be.true
    expect(right_axis.panel in layoutable_children).to.be.true

describe "PlotCanvasView pause", ->

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

describe "PlotCanvasView get_canvas_element", ->

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
