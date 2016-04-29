{expect} = require "chai"
utils = require "../../utils"
sinon = require 'sinon'

Axis = utils.require("models/axes/axis").Model
BasicTicker = utils.require("models/tickers/basic_ticker").Model
BasicTickFormatter = utils.require("models/formatters/basic_tick_formatter").Model
CanvasView = utils.require("models/canvas/canvas").View
Plot = utils.require("models/plots/plot").Model
PlotView = utils.require("models/plots/plot").View
Range1d = utils.require("models/ranges/range1d").Model
SidePanel = utils.require("core/layout/side_panel").Model
{Solver} = utils.require("core/layout/solver")
{Document} = utils.require "document"
{Variable}  = utils.require("core/layout/solver")

describe "Axis.Model", ->

  it "should have a SidePanel after _doc_attached is called", ->
    a = new Axis()
    a.document = new Document()
    expect(a.panel).to.be.undefined
    a._doc_attached()
    expect(a.panel).to.be.an.instanceOf(SidePanel)

describe "Axis.View", ->

  before ->
    # Stub the canvas context
    sinon.stub(CanvasView.prototype, 'get_ctx', () -> utils.MockCanvasContext)
    # Stub solver methods
    sinon.stub(Solver.prototype, 'suggest_value')
    @solver_add_constraint = sinon.stub(Solver.prototype, 'add_constraint')
    @solver_remove_constraint = sinon.stub(Solver.prototype, 'remove_constraint')

  beforeEach ->
    @test_doc = new Document()
    @test_plot = new Plot({
      x_range: new Range1d({start: 0, end: 1})
      y_range: new Range1d({start: 0, end: 1})
    })
    @test_plot.document = @test_doc
    @test_plot._doc_attached()
    @ticker = new BasicTicker()
    @formatter = new BasicTickFormatter()
    @axis = new Axis({
      major_label_standoff: 11
      major_tick_out: 12
      ticker: @ticker
      formatter: @formatter
    })
    @test_plot.add_layout(@axis, 'below')
    # Must create the test_plot_view after adding the axis to the plot
    @test_plot_view = new @test_plot.default_view({ 'model': @test_plot })
    @axis_view = new @axis.default_view({
      model: @axis
      plot_model: @test_plot
      plot_view: @test_plot_view
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

  it "_update_constraints should not set _size_constraint if visible is false", ->
    @axis.set('visible', false)
    expect(@axis_view._size_constraint).to.be.undefined
    @axis_view.update_constraints()
    # Should still be undefined because visible is false
    expect(@axis_view._size_constraint).to.be.undefined

  it "_update_constraints should set last_size", ->
    sinon.stub(@axis_view, '_tick_extent', () -> 0.11)
    sinon.stub(@axis_view, '_axis_label_extent', () -> 0.11)
    sinon.stub(@axis_view, '_tick_label_extent', () -> 0.11)
    expect(@axis_view._size_constraint).to.be.undefined
    @axis_view.update_constraints()
    expect(@axis_view._last_size).to.be.equal 0.33

  it "_update_constraints should add a constraint", ->
    add_constraint_call_count = @solver_add_constraint.callCount
    @axis_view.update_constraints()
    expect(@solver_add_constraint.callCount).to.be.equal add_constraint_call_count + 1

  it "_update_constraints should add and remove a constraint if the size changes", ->
    @axis_view._tick_extent = sinon.stub()
    @axis_view._tick_extent.onCall(0).returns(0.11)
    @axis_view._tick_extent.onCall(1).returns(0.22)

    @axis_view.update_constraints()
    add_constraint_call_count = @solver_add_constraint.callCount
    remove_constraint_call_count = @solver_remove_constraint.callCount
    @axis_view.update_constraints()
    expect(@solver_add_constraint.callCount).to.be.equal add_constraint_call_count + 1
    expect(@solver_remove_constraint.callCount).to.be.equal remove_constraint_call_count + 1

  it "_update_constraints should not add and remove a constraint if the size is the same", ->
    @axis_view._tick_extent = sinon.stub()
    @axis_view._tick_extent.returns(0.11)

    @axis_view.update_constraints()
    add_constraint_call_count = @solver_add_constraint.callCount
    remove_constraint_call_count = @solver_remove_constraint.callCount
    @axis_view.update_constraints()
    expect(@solver_add_constraint.callCount).to.be.equal add_constraint_call_count
    expect(@solver_remove_constraint.callCount).to.be.equal remove_constraint_call_count
