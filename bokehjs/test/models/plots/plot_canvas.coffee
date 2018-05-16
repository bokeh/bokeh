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
    @plot_canvas = @plot.plot_canvas

  it "should set the sizing_mode to box by default", sinon.test () ->
    expect(@plot_canvas.sizing_mode).to.be.equal 'stretch_both'

  it "should have a four LayoutCanvases", sinon.test () ->
    expect(@plot_canvas.above_panel).to.be.an.instanceOf(LayoutCanvas)
    expect(@plot_canvas.below_panel).to.be.an.instanceOf(LayoutCanvas)
    expect(@plot_canvas.left_panel).to.be.an.instanceOf(LayoutCanvas)
    expect(@plot_canvas.right_panel).to.be.an.instanceOf(LayoutCanvas)

  it "should have panels, frame, and canvas returned in get_layoutable_children", sinon.test () ->
    layoutable_children = @plot_canvas.get_layoutable_children()
    expect(@plot_canvas.above_panel in layoutable_children).to.be.true
    expect(@plot_canvas.below_panel in layoutable_children).to.be.true
    expect(@plot_canvas.left_panel  in layoutable_children).to.be.true
    expect(@plot_canvas.right_panel in layoutable_children).to.be.true
    expect(@plot_canvas.frame       in layoutable_children).to.be.true
    expect(@plot_canvas.canvas      in layoutable_children).to.be.true

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
    plot_canvas = plot.plot_canvas
    layoutable_children = plot_canvas.get_layoutable_children()
    expect(above_axis.panel in layoutable_children).to.be.true
    expect(below_axis.panel in layoutable_children).to.be.true
    expect(left_axis.panel  in layoutable_children).to.be.true
    expect(right_axis.panel in layoutable_children).to.be.true

  it "should call get_editables on layoutable children", sinon.test () ->
    plot = new Plot({x_range: new DataRange1d(), y_range: new DataRange1d(), title: null})
    @doc.add_root(plot)
    plot_canvas = plot.plot_canvas
    children = plot_canvas.get_layoutable_children()
    for child in children
      child.get_editables = this.spy()
      expect(child.get_editables.callCount).to.be.equal 0
    plot_canvas.get_all_editables()
    for child in children
      expect(child.get_editables.callCount).to.be.equal 1

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
    @plot_canvas = @plot.plot_canvas
    @plot_canvas.attach_document(@doc)
    @plot_canvas_view = @plot_view.plot_canvas_view

  it "should start unpaused", ->
    expect(@plot_canvas_view.is_paused).to.be.false

  it "should toggle on/off in pairs", ->
    expect(@plot_canvas_view.is_paused).to.be.false
    @plot_canvas_view.pause()
    expect(@plot_canvas_view.is_paused).to.be.true
    @plot_canvas_view.unpause()
    expect(@plot_canvas_view.is_paused).to.be.false

  it "should toggle off only on last unpause with nested pairs", ->
    expect(@plot_canvas_view.is_paused).to.be.false
    @plot_canvas_view.pause()
    expect(@plot_canvas_view.is_paused).to.be.true
    @plot_canvas_view.pause()
    expect(@plot_canvas_view.is_paused).to.be.true
    @plot_canvas_view.unpause()
    expect(@plot_canvas_view.is_paused).to.be.true
    @plot_canvas_view.unpause()
    expect(@plot_canvas_view.is_paused).to.be.false

describe "PlotCanvas constraints", ->

  beforeEach ->
    doc = new Document()
    plot = new Plot({
      x_range: new Range1d({start: 0, end: 1})
      y_range: new Range1d({start: 0, end: 1})
      toolbar: new Toolbar()
      title: null
    })
    doc.add_root(plot)
    @plot_canvas = plot.plot_canvas

  it "should call _get_side_constraints, _get_constant_constraints", sinon.test () ->
    @plot_canvas._get_side_constraints = this.spy()
    @plot_canvas._get_constant_constraints = this.spy()
    expect(@plot_canvas._get_side_constraints.callCount).to.be.equal 0
    expect(@plot_canvas._get_constant_constraints.callCount).to.be.equal 0
    @plot_canvas.get_constraints()
    expect(@plot_canvas._get_side_constraints.callCount).to.be.equal 1
    expect(@plot_canvas._get_constant_constraints.callCount).to.be.equal 1

  it "should call _get_constraints on children", sinon.test () ->
    children = @plot_canvas.get_layoutable_children()
    for child in children
      child.get_constraints = this.spy()
      expect(child.get_constraints.callCount).to.be.equal 0
    @plot_canvas.get_all_constraints()
    for child in children
      expect(child.get_constraints.callCount).to.be.equal 1

describe "PlotCanvasView render", ->

  beforeEach ->
    doc = new Document()
    plot = new Plot({
      x_range: new Range1d({start: 0, end: 1})
      y_range: new Range1d({start: 0, end: 1})
      toolbar: new Toolbar()
    })
    doc.add_root(plot)
    plot_view = new plot.default_view({model: plot, parent: null})
    plot_view.layout()
    @plot_canvas_view = plot_view.plot_canvas_view

  it "should call own update_constraints method", sinon.test () ->
    spy = this.spy(@plot_canvas_view, 'update_constraints')
    @plot_canvas_view.render()
    expect(spy.calledOnce).to.be.true

describe "PlotCanvasView resize", ->
  dom_left = 12
  dom_top = 13
  width = 44
  height = 99
  wl = 5
  wr = 10
  wt = 22
  wb = 33

  beforeEach ->
    doc = new Document()
    plot = new Plot({
      x_range: new Range1d({start: 0, end: 1})
      y_range: new Range1d({start: 0, end: 1})
      toolbar: new Toolbar()
    })
    doc.add_root(plot)
    @plot_view = new plot.default_view({model: plot, parent: null})
    @plot_view.layout()
    @plot_canvas = plot.plot_canvas
    @plot_canvas.attach_document(doc)
    @plot_canvas._dom_left.setValue(dom_left)
    @plot_canvas._dom_top.setValue(dom_top)
    @plot_canvas._width.setValue(width)
    @plot_canvas._height.setValue(height)
    @plot_canvas._whitespace_left.setValue(wl)
    @plot_canvas._whitespace_right.setValue(wr)
    @plot_canvas._whitespace_top.setValue(wt)
    @plot_canvas._whitespace_bottom.setValue(wb)
    @plot_canvas_view = @plot_view.plot_canvas_view

  """
  it "should set the appropriate positions and paddings on the element", sinon.test () ->
    @plot_canvas.sizing_mode = 'stretch_both'
    @plot_canvas_view._on_resize()
    expected_style = "position: absolute; left: #{dom_left}px; top: #{dom_top}px; width: #{width}px; height: #{height}px;"
    expect(@plot_canvas_view.el.style.cssText).to.be.equal expected_style

  it "should call canvas.set_dims with width & height if sizing_mode is box, and trigger true", sinon.test () ->
    spy = this.spy(@plot_canvas_view.canvas_view, 'set_dims')
    @plot_canvas.sizing_mode = 'stretch_both'
    @plot_canvas_view._on_resize()
    expect(spy.calledOnce).to.be.true
    expect(spy.calledWith([width, height], true)).to.be.true

  it "should call canvas.set_dims and trigger if plot is_root", sinon.test () ->
    spy = this.spy(@plot_canvas_view.canvas_view, 'set_dims')
    @plot_canvas._is_root = true
    @plot_canvas.sizing_mode = 'stretch_both'
    @plot_canvas_view._on_resize()
    expect(spy.calledOnce).to.be.true
    expect(spy.calledWith([width, height], true)).to.be.true

  it "should call solver.suggest_value for width and height if sizing_mode is fixed", sinon.test () ->
    spy = this.spy(@plot_canvas_view.canvas_view, 'set_dims')
    @plot_canvas.sizing_mode = 'fixed'
    @plot_canvas_view._on_resize()
    expect(spy.calledOnce, 'set_dims was not called').to.be.true
    expect(spy.calledWith([width, height], true)).to.be.true

  it "should throw an error if height is 0", sinon.test () ->
    @plot_canvas._height.setValue(0)
    @plot_canvas.sizing_mode = 'stretch_both'
    expect(@plot_canvas_view._on_resize).to.throw Error
  """


describe "PlotCanvasView update_constraints", ->

  beforeEach ->
    doc = new Document()
    plot = new Plot({
      x_range: new Range1d({start: 0, end: 1})
      y_range: new Range1d({start: 0, end: 1})
      toolbar: new Toolbar()
    })
    doc.add_root(plot)
    @plot_view = new plot.default_view({model: plot, parent: null})
    @plot_view.layout()
    @plot_canvas = plot.plot_canvas

  #it "should call SidePanel update_constraints with axis view as argument", ->
  #  ticker = new BasicTicker()
  #  formatter = new BasicTickFormatter()
  #  axis = new Axis({ ticker: ticker, formatter: formatter })
  #  @test_plot.add_layout(axis, 'below')
  #  test_plot_view = new @test_plot.default_view({ 'model': @test_plot })
  #  axis_view = new axis.default_view({ model: axis, plot_view: test_plot_view })

  #  spy = sinon.spy(update_constraints)
  #  test_plot_view.update_constraints()
  #  expect(spy.calledOnce).to.be.true

  ###
  it "should call solver suggest twice for frame sizing", sinon.test () ->
    test_plot_canvas_view = new @plot_canvas.default_view({model: @plot_canvas, parent: @plot_view})

    initial_count = @solver_suggest_stub.callCount
    test_plot_canvas_view.update_constraints()
    expect(@solver_suggest_stub.callCount).to.be.equal initial_count + 2
  ###

  """
  it "should call solver update_variables with false for trigger", sinon.test () ->
    test_plot_canvas_view = new @plot_canvas.default_view({model: @plot_canvas, parent: @plot_view})

    initial_count = @solver_update_stub.callCount
    test_plot_canvas_view.update_constraints()
    expect(@solver_update_stub.calledWith(false)).to.be.true
    expect(@solver_update_stub.callCount).to.be.equal initial_count + 1
  """


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
    @plot_view.layout()
    @plot_canvas_view = @plot_view.plot_canvas_view

  it "should exist because get_canvas_element depends on it", sinon.test () ->
    expect(@plot_canvas_view.canvas_view.ctx).to.exist

  it "should exist to grab the canvas DOM element using canvas_view.ctx", sinon.test () ->
    expect(@plot_canvas_view.canvas_view.get_canvas_element).to.exist
