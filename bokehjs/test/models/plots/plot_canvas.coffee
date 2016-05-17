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
PlotCanvas = utils.require("models/plots/plot_canvas").Model
PlotCanvasView = utils.require("models/plots/plot_canvas").View
Range1d = utils.require("models/ranges/range1d").Model
Toolbar = utils.require("models/tools/toolbar").Model

describe "PlotCanvas.Model", ->

  it "should set the responsive mode to box by default", ->
    p = new PlotCanvas({x_range: new DataRange1d(), y_range: new DataRange1d()})
    expect(p.responsive).to.be.equal 'box'

  it "should have a four LayoutCanvases after document is attached is called", ->
    p = new PlotCanvas({x_range: new DataRange1d(), y_range: new DataRange1d()})
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
    p = new PlotCanvas({x_range: new DataRange1d(), y_range: new DataRange1d()})
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
    p = new PlotCanvas({x_range: new DataRange1d(), y_range: new DataRange1d()})
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
    p = new PlotCanvas({x_range: new DataRange1d(), y_range: new DataRange1d()})
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
    p = new PlotCanvas({x_range: new DataRange1d(), y_range: new DataRange1d(), min_border: 33.33})
    p.attach_document(new Document())
    expect(p.min_border_top).to.be.equal 33.33
    expect(p.min_border_bottom).to.be.equal 33.33
    expect(p.min_border_left).to.be.equal 33.33
    expect(p.min_border_right).to.be.equal 33.33

  it "should set min_border_x to value of specified, and others to value of min_border", ->
    p = new PlotCanvas({x_range: new DataRange1d(), y_range: new DataRange1d(), min_border: 33.33, min_border_left: 66.66})
    p.attach_document(new Document())
    expect(p.min_border_top).to.be.equal 33.33
    expect(p.min_border_bottom).to.be.equal 33.33
    expect(p.min_border_left).to.be.equal 66.66
    expect(p.min_border_right).to.be.equal 33.33

  it "should set min_border_x to value of specified, and others to default min_border", ->
    p = new PlotCanvas({x_range: new DataRange1d(), y_range: new DataRange1d(), min_border_left: 4})
    p.attach_document(new Document())
    expect(p.min_border_top).to.be.equal 50
    expect(p.min_border_bottom).to.be.equal 50
    expect(p.min_border_left).to.be.equal 4
    expect(p.min_border_right).to.be.equal 50

describe "PlotCanvas.Model constraints", ->

  beforeEach ->
    @test_doc = new Document()
    @test_plot = new PlotCanvas({x_range: new DataRange1d(), y_range: new DataRange1d()})
    @test_plot.attach_document(@test_doc)

  it "should return 20 constraints from _get_constant_constraints", ->
    expect(@test_plot._get_constant_constraints().length).to.be.equal 20

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

  it "should return correct constrained_variables", ->
    p = @test_plot
    expected_constrainted_variables = {
      'width': p._width
      'height': p._height
      # edges
      'on-top-edge-align' : p._top
      'on-bottom-edge-align' : p._height_minus_bottom
      'on-left-edge-align' : p._left
      'on-right-edge-align' : p._width_minus_right
      # sizing
      'box-equal-size-top' : p._top
      'box-equal-size-bottom' : p._height_minus_bottom
      'box-equal-size-left' : p._left
      'box-equal-size-right' : p._width_minus_right
      # align between cells
      'box-cell-align-top' : p._top
      'box-cell-align-bottom' : p._height_minus_bottom
      'box-cell-align-left' : p._left
      'box-cell-align-right' : p._width_minus_right
      # whitespace
      'whitespace-top' : p._whitespace_top
      'whitespace-bottom' : p._whitespace_bottom
      'whitespace-left' : p._whitespace_left
      'whitespace-right' : p._whitespace_right
    }
    constrained_variables = p.get_constrained_variables()
    expect(constrained_variables).to.be.deep.equal expected_constrainted_variables

describe "PlotCanvas.View render", ->

  afterEach ->
    utils.unstub_canvas()
    utils.unstub_solver()

  beforeEach ->
    utils.stub_canvas()
    utils.stub_solver()

    @test_doc = new Document()
    @test_plot = new PlotCanvas({
      x_range: new Range1d({start: 0, end: 1})
      y_range: new Range1d({start: 0, end: 1})
      toolbar: new Toolbar()
    })
    @test_plot.document = @test_doc
    @test_plot._doc_attached()
    @test_plot_view = new @test_plot.default_view({ 'model': @test_plot })

  it "should call own update_constraints method", ->
    spy = sinon.spy(@test_plot_view, 'update_constraints')
    @test_plot_view.render()
    expect(spy.calledOnce).to.be.true

describe "PlotCanvas.View resize", ->
  dom_left = 12
  dom_top = 13
  width = 100
  height = 100
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

    @test_doc = new Document()
    @test_plot = new PlotCanvas({
      x_range: new Range1d({start: 0, end: 1})
      y_range: new Range1d({start: 0, end: 1})
      toolbar: new Toolbar()
    })
    @test_plot.document = @test_doc
    @test_plot._doc_attached()
    @test_plot.set('dom_left', dom_left)
    @test_plot.set('dom_top', dom_top)
    @test_plot._width = {_value: width}
    @test_plot._height = {_value: height}
    @test_plot._whitespace_left = {_value: wl}
    @test_plot._whitespace_right = {_value: wr}
    @test_plot._whitespace_top = {_value: wt}
    @test_plot._whitespace_bottom = {_value: wb}
    @test_plot_view = new @test_plot.default_view({ 'model': @test_plot })

  it "should set the appropriate positions and paddings on the element", ->
    @test_plot.responsive = 'box'
    @test_plot_view.resize()
    expected_style = "position: absolute; left: #{dom_left}px; top: #{dom_top}px; width: #{width}px; height: #{height}px; margin: #{wt}px #{wr}px #{wb}px #{wl}px;"
    expect(@test_plot_view.$el.attr('style')).to.be.equal expected_style

  # TODO Not sure why this is failing
  #it "should set the left to 25px greater, and top 10px greater if model _is_root", ->
  #  @test_plot._is_root == true
  #  @test_plot_view.resize()
  #  expected_style = "position: absolute; left: #{dom_left + 25}px; top: #{dom_top + 15}px; width: #{width}px; height: #{height}px; margin: #{wt}px #{wr}px #{wb}px #{wl}px;"
  #  console.log(@test_plot_view.$el)
  #  expect(@test_plot_view.$el.attr('style')).to.be.equal expected_style
  
  it "should call canvas.set_dims with width & height if responsive_mode is box, and not trigger", ->
    spy = sinon.spy(@test_plot_view.canvas_view, 'set_dims')
    @test_plot.responsive = 'box'
    @test_plot_view.resize()
    expect(spy.calledOnce).to.be.true
    expect(spy.calledWith([width, height], false)).to.be.true

  it "should call canvas.set_dims and trigger if plot is_root", ->
    spy = sinon.spy(@test_plot_view.canvas_view, 'set_dims')
    @test_plot._is_root = true
    @test_plot.responsive = 'box'
    @test_plot_view.resize()
    expect(spy.calledOnce).to.be.true
    expect(spy.calledWith([width, height], true)).to.be.true

  it "should call canvas.set_dims with height that is proportional to width by aspect ratio if responsive_mode is width", ->
    spy = sinon.spy(@test_plot_view.canvas_view, 'set_dims')
    @test_plot.responsive = 'width'
    @test_plot.plot_width = 100
    @test_plot.plot_height = 1
    @test_plot_view.resize()
    expect(spy.calledOnce).to.be.true
    # The aspect ratio is 100:1
    expect(spy.calledWith([width, width / 100], false)).to.be.true

  it "should call solver.suggest_value for width and height if responsive_mode is fixed", ->
    spy = sinon.spy(@test_plot_view.canvas_view, 'set_dims')
    @test_plot.responsive = 'fixed'
    @test_plot.width = 111
    @test_plot.height = 222
    @test_plot_view.resize()
    expect(spy.calledOnce).to.be.true
    expect(spy.calledWith([111, 222], false)).to.be.true

  it "should throw an error if height is 0", ->
    @test_plot._height = {_value: 0}
    @test_plot.responsive = 'box'
    expect(@test_plot_view.resize).to.throw Error


describe "PlotCanvas.View update_constraints", ->

  afterEach ->
    utils.unstub_canvas()
    utils.unstub_solver()

  beforeEach ->
    utils.stub_canvas()
    solver_stubs = utils.stub_solver()
    @solver_suggest_stub = solver_stubs['suggest']
    @solver_update_stub = solver_stubs['update']

    @test_doc = new Document()
    @test_plot = new PlotCanvas({
      x_range: new Range1d({start: 0, end: 1})
      y_range: new Range1d({start: 0, end: 1})
      toolbar: new Toolbar()
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
