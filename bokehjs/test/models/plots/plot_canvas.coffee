_ = require "underscore"
{expect} = require "chai"
utils = require "../../utils"
sinon = require 'sinon'

{Solver, Variable} = utils.require("core/layout/solver")
update_constraints = utils.require("core/layout/side_panel").update_constraints

{Document} = utils.require("document")

Axis = utils.require("models/axes/axis").Model
AxisView = utils.require("models/axes/axis").View
BasicTicker = utils.require("models/tickers/basic_ticker").Model
BasicTickFormatter = utils.require("models/formatters/basic_tick_formatter").Model
CanvasView = utils.require("models/canvas/canvas").View
DataRange1d = utils.require("models/ranges/data_range1d").Model
LayoutCanvas = utils.require("core/layout/layout_canvas").Model
LinearAxis = utils.require("models/axes/linear_axis").Model
Plot = utils.require("models/plots/plot").Model
PlotCanvas = utils.require("models/plots/plot_canvas").Model
PlotCanvasView = utils.require("models/plots/plot_canvas").View
Range1d = utils.require("models/ranges/range1d").Model
Toolbar = utils.require("models/tools/toolbar").Model

# Note: Throughout these tests we've chosen to make a new PlotCanvas, when one
# has already been made on plot. So we could just as easily have said
# plot_canvas = plot.plot_canvas.  My thinking is that this better isolates the
# tests to just be working with a new PlotCanvas instead of having the greater
# surface area of what happened during Plot initialization.

describe "PlotCanvas.Model", ->

  afterEach ->
    utils.unstub_canvas()
    utils.unstub_solver()

  beforeEach ->
    utils.stub_canvas()
    utils.stub_solver()
    @doc = new Document()
    @plot = new Plot({
      x_range: new Range1d({start: 0, end: 1})
      y_range: new Range1d({start: 0, end: 1})
      toolbar: new Toolbar()
      title: null
    })
    @doc.add_root(@plot)
    @plot_canvas = new PlotCanvas({ 'plot': @plot })
    @plot_canvas.attach_document(@doc)

  it "should set the sizing_mode to box by default", ->
    expect(@plot_canvas.sizing_mode).to.be.equal 'stretch_both'

  it "should have a four LayoutCanvases", ->
    expect(@plot_canvas.above_panel).to.be.an.instanceOf(LayoutCanvas)
    expect(@plot_canvas.below_panel).to.be.an.instanceOf(LayoutCanvas)
    expect(@plot_canvas.left_panel).to.be.an.instanceOf(LayoutCanvas)
    expect(@plot_canvas.right_panel).to.be.an.instanceOf(LayoutCanvas)

  it "should have panels, frame, and canvas returned in get_layoutable_children", ->
    layoutable_children = @plot_canvas.get_layoutable_children()
    expect(layoutable_children.length).to.be.equal 6
    expect(_.contains(layoutable_children, @plot_canvas.above_panel)).to.be.true
    expect(_.contains(layoutable_children, @plot_canvas.below_panel)).to.be.true
    expect(_.contains(layoutable_children, @plot_canvas.left_panel)).to.be.true
    expect(_.contains(layoutable_children, @plot_canvas.right_panel)).to.be.true
    expect(_.contains(layoutable_children, @plot_canvas.frame)).to.be.true
    expect(_.contains(layoutable_children, @plot_canvas.canvas)).to.be.true

  it "should have axis panels in get_layoutable_children if axes added", ->
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
    expect(layoutable_children.length).to.be.equal 10
    expect(_.contains(layoutable_children, above_axis.panel)).to.be.true
    expect(_.contains(layoutable_children, below_axis.panel)).to.be.true
    expect(_.contains(layoutable_children, left_axis.panel)).to.be.true
    expect(_.contains(layoutable_children, right_axis.panel)).to.be.true

  it "should call get_edit_variables on layoutable children", ->
    plot = new Plot({x_range: new DataRange1d(), y_range: new DataRange1d(), title: null})
    @doc.add_root(plot)
    plot_canvas = plot.plot_canvas
    children = plot_canvas.get_layoutable_children()
    expect(children.length).to.be.equal 6
    for child in children
      child.get_edit_variables = sinon.spy()
      expect(child.get_edit_variables.callCount).to.be.equal 0
    plot_canvas.get_edit_variables()
    for child in children
      expect(child.get_edit_variables.callCount).to.be.equal 1


describe "PlotCanvas.Model constraints", ->

  afterEach ->
    utils.unstub_canvas()
    utils.unstub_solver()

  beforeEach ->
    utils.stub_canvas()
    utils.stub_solver()
    doc = new Document()
    plot = new Plot({
      x_range: new Range1d({start: 0, end: 1})
      y_range: new Range1d({start: 0, end: 1})
      toolbar: new Toolbar()
      title: null
    })
    doc.add_root(plot)
    @plot_canvas = new PlotCanvas({ 'plot': plot })
    @plot_canvas.attach_document(doc)

  it "should return 20 constraints from _get_constant_constraints", ->
    expect(@plot_canvas._get_constant_constraints().length).to.be.equal 20

  it "should return 0 constraints from _get_side_constraints if there are no side renderers", ->
    expect(@plot_canvas._get_side_constraints().length).to.be.equal 0

  it "should call _get_side_constraints, _get_constant_constraints", ->
    @plot_canvas._get_side_constraints = sinon.spy()
    @plot_canvas._get_constant_constraints = sinon.spy()
    expect(@plot_canvas._get_side_constraints.callCount).to.be.equal 0
    expect(@plot_canvas._get_constant_constraints.callCount).to.be.equal 0
    @plot_canvas.get_constraints()
    expect(@plot_canvas._get_side_constraints.callCount).to.be.equal 1
    expect(@plot_canvas._get_constant_constraints.callCount).to.be.equal 1

  it "should call _get_constraints on children", ->
    children = @plot_canvas.get_layoutable_children()
    expect(children.length).to.be.equal 6
    for child in children
      child.get_constraints = sinon.spy()
      expect(child.get_constraints.callCount).to.be.equal 0
    @plot_canvas.get_constraints()
    for child in children
      expect(child.get_constraints.callCount).to.be.equal 1

describe "PlotCanvas.Model constraints with different layouts", ->

  beforeEach ->
    @doc = new Document()
    @plot = new Plot({
      x_range: new Range1d({start: 0, end: 1})
      y_range: new Range1d({start: 0, end: 1})
      toolbar: new Toolbar()
      title: null
    })

  it "should return 2 constraints from _get_side_constraints if there is one side renderer on above", ->
    @plot.add_layout(new LinearAxis(), 'above')
    @plot.attach_document(@doc)
    plot_canvas = new PlotCanvas({ 'plot': @plot })
    expect(plot_canvas._get_side_constraints().length).to.be.equal 2

  it "should return 3 constraints from _get_side_constraints if there are two side renderers on one side", ->
    @plot.add_layout(new LinearAxis(), 'left')
    @plot.add_layout(new LinearAxis(), 'left')
    @plot.attach_document(@doc)
    plot_canvas = new PlotCanvas({ 'plot': @plot })
    expect(plot_canvas._get_side_constraints().length).to.be.equal 3

  it "should return 2 constraints from _get_side_constraints if there is one side renderer on below", ->
    @plot.add_layout(new LinearAxis(), 'below')
    @plot.attach_document(@doc)
    plot_canvas = new PlotCanvas({ 'plot': @plot })
    expect(plot_canvas._get_side_constraints().length).to.be.equal 2

  it "should return 2 constraints from _get_side_constraints if there is one side renderer on left", ->
    @plot.add_layout(new LinearAxis(), 'left')
    @plot.attach_document(@doc)
    plot_canvas = new PlotCanvas({ 'plot': @plot })
    expect(plot_canvas._get_side_constraints().length).to.be.equal 2

  it "should return 2 constraints from _get_side_constraints if there is one side renderer on right", ->
    @plot.add_layout(new LinearAxis(), 'right')
    @plot.attach_document(@doc)
    plot_canvas = new PlotCanvas({ 'plot': @plot })
    expect(plot_canvas._get_side_constraints().length).to.be.equal 2

  it "should return 4 constraints from _get_side_constraints if there are two side renderers", ->
    @plot.add_layout(new LinearAxis(), 'left')
    @plot.add_layout(new LinearAxis(), 'right')
    @plot.attach_document(@doc)
    plot_canvas = new PlotCanvas({ 'plot': @plot })
    expect(plot_canvas._get_side_constraints().length).to.be.equal 4


describe "PlotCanvas.View render", ->

  afterEach ->
    utils.unstub_canvas()
    utils.unstub_solver()

  beforeEach ->
    utils.stub_canvas()
    utils.stub_solver()

    doc = new Document()
    plot = new Plot({
      x_range: new Range1d({start: 0, end: 1})
      y_range: new Range1d({start: 0, end: 1})
      toolbar: new Toolbar()
    })
    doc.add_root(plot)
    plot_canvas = new PlotCanvas({ 'plot': plot })
    plot_canvas.attach_document(doc)
    @plot_canvas_view = new plot_canvas.default_view({ 'model': plot_canvas })

  it "should call own update_constraints method", ->
    spy = sinon.spy(@plot_canvas_view, 'update_constraints')
    @plot_canvas_view.render()
    expect(spy.calledOnce).to.be.true

describe "PlotCanvas.View resize", ->
  dom_left = 12
  dom_top = 13
  width = 44
  height = 99
  wl = 5
  wr = 10
  wt = 22
  wb = 33

  afterEach ->
    utils.unstub_canvas()
    utils.unstub_solver()

  beforeEach ->
    utils.stub_canvas()
    solver_stubs = utils.stub_solver()
    @solver_suggest = solver_stubs['suggest']

    doc = new Document()
    plot = new Plot({
      x_range: new Range1d({start: 0, end: 1})
      y_range: new Range1d({start: 0, end: 1})
      toolbar: new Toolbar()
    })
    doc.add_root(plot)
    @plot_canvas = new PlotCanvas({ 'plot': plot })
    @plot_canvas.attach_document(doc)
    @plot_canvas._dom_left = {_value: dom_left}
    @plot_canvas._dom_top = {_value: dom_top}
    @plot_canvas._width = {_value: width}
    @plot_canvas._height = {_value: height}
    @plot_canvas._whitespace_left = {_value: wl}
    @plot_canvas._whitespace_right = {_value: wr}
    @plot_canvas._whitespace_top = {_value: wt}
    @plot_canvas._whitespace_bottom = {_value: wb}
    @plot_canvas_view = new @plot_canvas.default_view({ 'model': @plot_canvas })

  it "should set the appropriate positions and paddings on the element", ->
    @plot_canvas.sizing_mode = 'stretch_both'
    @plot_canvas_view.resize()
    expected_style = "position: absolute; left: #{dom_left}px; top: #{dom_top}px; width: #{width}px; height: #{height}px;"
    expect(@plot_canvas_view.$el.attr('style')).to.be.equal expected_style

  it "should call canvas.set_dims with width & height if sizing_mode is box, and trigger true", ->
    spy = sinon.spy(@plot_canvas_view.canvas_view, 'set_dims')
    @plot_canvas.sizing_mode = 'stretch_both'
    @plot_canvas_view.resize()
    expect(spy.calledOnce).to.be.true
    expect(spy.calledWith([width, height], true)).to.be.true

  it "should call canvas.set_dims and trigger if plot is_root", ->
    spy = sinon.spy(@plot_canvas_view.canvas_view, 'set_dims')
    @plot_canvas._is_root = true
    @plot_canvas.sizing_mode = 'stretch_both'
    @plot_canvas_view.resize()
    expect(spy.calledOnce).to.be.true
    expect(spy.calledWith([width, height], true)).to.be.true

  it "should call solver.suggest_value for width and height if sizing_mode is fixed", ->
    spy = sinon.spy(@plot_canvas_view.canvas_view, 'set_dims')
    @plot_canvas.sizing_mode = 'fixed'
    @plot_canvas_view.resize()
    expect(spy.calledOnce, 'set_dims was not called').to.be.true
    expect(spy.calledWith([width, height], true)).to.be.true

  it "should throw an error if height is 0", ->
    @plot_canvas._height = {_value: 0}
    @plot_canvas.sizing_mode = 'stretch_both'
    expect(@plot_canvas_view.resize).to.throw Error


describe "PlotCanvas.View update_constraints", ->

  afterEach ->
    utils.unstub_canvas()
    utils.unstub_solver()

  beforeEach ->
    utils.stub_canvas()
    solver_stubs = utils.stub_solver()
    @solver_suggest_stub = solver_stubs['suggest']
    @solver_update_stub = solver_stubs['update']

    doc = new Document()
    plot = new Plot({
      x_range: new Range1d({start: 0, end: 1})
      y_range: new Range1d({start: 0, end: 1})
      toolbar: new Toolbar()
    })
    doc.add_root(plot)
    @plot_canvas = new PlotCanvas({ 'plot': plot })
    @plot_canvas.attach_document(doc)

  #it "should call SidePanel update_constraints with axis view as argument", ->
  #  ticker = new BasicTicker()
  #  formatter = new BasicTickFormatter()
  #  axis = new Axis({ ticker: ticker, formatter: formatter })
  #  @test_plot.add_layout(axis, 'below')
  #  test_plot_view = new @test_plot.default_view({ 'model': @test_plot })
  #  axis_view = new axis.default_view({ model: axis, plot_model: @test_plot, plot_view: test_plot_view })

  #  spy = sinon.spy(update_constraints)
  #  test_plot_view.update_constraints()
  #  expect(spy.calledOnce).to.be.true

  # Skipping due to solver causing failures
  it.skip "should call solver suggest twice for frame sizing", ->
    test_plot_canvas_view = new @plot_canvas.default_view({ 'model': @plot_canvas })

    initial_count = @solver_suggest_stub.callCount
    test_plot_canvas_view.update_constraints()
    expect(@solver_suggest_stub.callCount).to.be.equal initial_count + 2

  # Skipping due to solver causing failures
  it.skip "should call solver update_variables with false for trigger", ->
    test_plot_canvas_view = new @plot_canvas.default_view({ 'model': @plot_canvas })

    initial_count = @solver_update_stub.callCount
    test_plot_canvas_view.update_constraints()
    expect(@solver_update_stub.calledWith(false)).to.be.true
    expect(@solver_update_stub.callCount).to.be.equal initial_count + 1


describe "PlotCanvas.View get_canvas_element", ->

  afterEach ->
    utils.unstub_canvas()
    utils.unstub_solver()

  beforeEach ->
    utils.stub_canvas()
    solver_stubs = utils.stub_solver()
    @solver_suggest_stub = solver_stubs['suggest']  # This isn't necessary but an attempt to make tests more robust

    doc = new Document()
    plot = new Plot({
      x_range: new Range1d({start: 0, end: 1})
      y_range: new Range1d({start: 0, end: 1})
      toolbar: new Toolbar()
    })
    doc.add_root(plot)
    plot_canvas = new PlotCanvas({ 'plot': plot })
    plot_canvas.attach_document(doc)
    @plot_canvas_view = new plot_canvas.default_view({ 'model': plot_canvas })

  it "should exist because get_canvas_element depends on it", ->
    expect(@plot_canvas_view.canvas_view.ctx).to.exist

  it "should exist to grab the canvas DOM element using canvas_view.ctx", ->
    expect(@plot_canvas_view.canvas_view.get_canvas_element).to.exist
