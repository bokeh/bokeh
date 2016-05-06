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
PlotView = utils.require("models/plots/plot").View
Range1d = utils.require("models/ranges/range1d").Model


describe "Plot.Model", ->

  it "should have a four LayoutCanvases after document is attached is called", ->
    p = new Plot({x_range: new DataRange1d(), y_range: new DataRange1d()})
    expect(p.above_panel).to.be.undefined
    expect(p.below_panel).to.be.undefined
    expect(p.left_panel).to.be.undefined
    expect(p.right_panel).to.be.undefined
    p.attach_document(new Document())
    expect(p.above_panel).to.be.an.instanceOf(LayoutCanvas)
    expect(p.below_panel).to.be.an.instanceOf(LayoutCanvas)
    expect(p.left_panel).to.be.an.instanceOf(LayoutCanvas)
    expect(p.right_panel).to.be.an.instanceOf(LayoutCanvas)

  it "should have panels, frame, and canvas returned in get_layoutable_children", ->
    p = new Plot({x_range: new DataRange1d(), y_range: new DataRange1d()})
    p.attach_document(new Document())
    layoutable_children = p.get_layoutable_children()
    expect(layoutable_children.length).to.be.equal 6
    expect(_.contains(layoutable_children, p.above_panel)).to.be.true
    expect(_.contains(layoutable_children, p.below_panel)).to.be.true
    expect(_.contains(layoutable_children, p.left_panel)).to.be.true
    expect(_.contains(layoutable_children, p.right_panel)).to.be.true
    expect(_.contains(layoutable_children, p.frame)).to.be.true
    expect(_.contains(layoutable_children, p.canvas)).to.be.true

  it "should have axis panels in get_layoutable_children if axes added", ->
    p = new Plot({x_range: new DataRange1d(), y_range: new DataRange1d()})
    p.attach_document(new Document())
    above_axis = new LinearAxis()
    below_axis = new LinearAxis()
    left_axis = new LinearAxis()
    right_axis = new LinearAxis()
    p.add_layout(above_axis, 'above')
    p.add_layout(below_axis, 'below')
    p.add_layout(left_axis, 'left')
    p.add_layout(right_axis, 'right')
    layoutable_children = p.get_layoutable_children()
    expect(layoutable_children.length).to.be.equal 10
    expect(_.contains(layoutable_children, above_axis.panel)).to.be.true
    expect(_.contains(layoutable_children, below_axis.panel)).to.be.true
    expect(_.contains(layoutable_children, left_axis.panel)).to.be.true
    expect(_.contains(layoutable_children, right_axis.panel)).to.be.true

  it "should call get_edit_variables on layoutable children", ->
    p = new Plot({x_range: new DataRange1d(), y_range: new DataRange1d()})
    p.attach_document(new Document())
    children = p.get_layoutable_children()
    expect(children.length).to.be.equal 6
    for child in children
      child.get_edit_variables = sinon.spy()
      expect(child.get_edit_variables.callCount).to.be.equal 0
    p.get_edit_variables()
    for child in children
      expect(child.get_edit_variables.callCount).to.be.equal 1

  it "should set min_border_x to value of min_border if min_border_x is not specified", ->
    p = new Plot({x_range: new DataRange1d(), y_range: new DataRange1d(), min_border: 33.33})
    p.attach_document(new Document())
    expect(p.min_border_top).to.be.equal 33.33
    expect(p.min_border_bottom).to.be.equal 33.33
    expect(p.min_border_left).to.be.equal 33.33
    expect(p.min_border_right).to.be.equal 33.33

  it "should set min_border_x to value of specified, and others to value of min_border", ->
    p = new Plot({x_range: new DataRange1d(), y_range: new DataRange1d(), min_border: 33.33, min_border_left: 66.66})
    p.attach_document(new Document())
    expect(p.min_border_top).to.be.equal 33.33
    expect(p.min_border_bottom).to.be.equal 33.33
    expect(p.min_border_left).to.be.equal 66.66
    expect(p.min_border_right).to.be.equal 33.33

  it "should set min_border_x to value of specified, and others to default min_border", ->
    p = new Plot({x_range: new DataRange1d(), y_range: new DataRange1d(), min_border_left: 4})
    p.attach_document(new Document())
    expect(p.min_border_top).to.be.equal 50
    expect(p.min_border_bottom).to.be.equal 50
    expect(p.min_border_left).to.be.equal 4
    expect(p.min_border_right).to.be.equal 50

describe "Plot.Model constraints", ->

  beforeEach ->
    @test_doc = new Document()
    @test_plot = new Plot({x_range: new DataRange1d(), y_range: new DataRange1d()})
    @test_plot.attach_document(@test_doc)

  it "should return 22 constraints from _get_constant_constraints", ->
    expect(@test_plot._get_constant_constraints().length).to.be.equal 22

  it "should return 0 constraints from _get_side_constraints if there are no side renderers", ->
    expect(@test_plot._get_side_constraints().length).to.be.equal 0

  it "should return 2 constraints from _get_side_constraints if there is one side renderer on above", ->
    expect(@test_plot._get_side_constraints().length).to.be.equal 0
    @test_plot.add_layout(new LinearAxis(), 'above')
    expect(@test_plot._get_side_constraints().length).to.be.equal 2

  it "should return 2 constraints from _get_side_constraints if there is one side renderer on below", ->
    expect(@test_plot._get_side_constraints().length).to.be.equal 0
    @test_plot.add_layout(new LinearAxis(), 'below')
    expect(@test_plot._get_side_constraints().length).to.be.equal 2

  it "should return 2 constraints from _get_side_constraints if there is one side renderer on left", ->
    expect(@test_plot._get_side_constraints().length).to.be.equal 0
    @test_plot.add_layout(new LinearAxis(), 'left')
    expect(@test_plot._get_side_constraints().length).to.be.equal 2

  it "should return 2 constraints from _get_side_constraints if there is one side renderer on right", ->
    expect(@test_plot._get_side_constraints().length).to.be.equal 0
    @test_plot.add_layout(new LinearAxis(), 'right')
    expect(@test_plot._get_side_constraints().length).to.be.equal 2

  it "should return 4 constraints from _get_side_constraints if there are two side renderers", ->
    expect(@test_plot._get_side_constraints().length).to.be.equal 0
    @test_plot.add_layout(new LinearAxis(), 'left')
    @test_plot.add_layout(new LinearAxis(), 'right')
    expect(@test_plot._get_side_constraints().length).to.be.equal 4

  it "should return 3 constraints from _get_side_constraints if there are two side renderers on one side", ->
    expect(@test_plot._get_side_constraints().length).to.be.equal 0
    @test_plot.add_layout(new LinearAxis(), 'left')
    @test_plot.add_layout(new LinearAxis(), 'left')
    expect(@test_plot._get_side_constraints().length).to.be.equal 3

  it "should call _get_side_constraints, _get_constant_constraints", ->
    @test_plot._get_side_constraints = sinon.spy()
    @test_plot._get_constant_constraints = sinon.spy()
    expect(@test_plot._get_side_constraints.callCount).to.be.equal 0
    expect(@test_plot._get_constant_constraints.callCount).to.be.equal 0
    @test_plot.get_constraints()
    expect(@test_plot._get_side_constraints.callCount).to.be.equal 1
    expect(@test_plot._get_constant_constraints.callCount).to.be.equal 1

  it "should call _get_constraints on children", ->
    children = @test_plot.get_layoutable_children()
    expect(children.length).to.be.equal 6
    for child in children
      child.get_constraints = sinon.spy()
      expect(child.get_constraints.callCount).to.be.equal 0
    @test_plot.get_constraints()
    for child in children
      expect(child.get_constraints.callCount).to.be.equal 1


describe "Plot.View render", ->

  afterEach ->
    utils.unstub_canvas()
    utils.unstub_solver()

  beforeEach ->
    utils.stub_canvas()
    utils.stub_solver()

    @test_doc = new Document()
    @test_plot = new Plot({
      x_range: new Range1d({start: 0, end: 1})
      y_range: new Range1d({start: 0, end: 1})
    })
    @test_plot.document = @test_doc
    @test_plot._doc_attached()
    @test_plot_view = new @test_plot.default_view({ 'model': @test_plot })

  it "should call own :update_constraints method", ->
    spy = sinon.spy(PlotView.prototype, 'update_constraints')  # Setup
    @test_plot_view.render()
    expect(spy.calledOnce).to.be.true


describe "Plot.View update_constraints", ->

  afterEach ->
    utils.unstub_canvas()
    utils.unstub_solver()

  beforeEach ->
    utils.stub_canvas()
    solver_stubs = utils.stub_solver()
    @solver_suggest_stub = solver_stubs['suggest']
    @solver_update_stub = solver_stubs['update']

    @test_doc = new Document()
    @test_plot = new Plot({
      x_range: new Range1d({start: 0, end: 1})
      y_range: new Range1d({start: 0, end: 1})
    })
    @test_plot.document = @test_doc
    @test_plot._doc_attached()

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

  it "should call solver suggest twice for frame size", ->
    test_plot_view = new @test_plot.default_view({ 'model': @test_plot })

    initial_count = @solver_suggest_stub.callCount
    test_plot_view.update_constraints()
    expect(@solver_suggest_stub.callCount).to.be.equal initial_count + 2

  it "should call solver update_variables with false for trigger", ->
    test_plot_view = new @test_plot.default_view({ 'model': @test_plot })

    initial_count = @solver_update_stub.callCount
    test_plot_view.update_constraints()
    expect(@solver_update_stub.calledWith(false)).to.be.true
    expect(@solver_update_stub.callCount).to.be.equal initial_count + 1
