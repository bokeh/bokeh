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
    sinon.stub(CanvasView.prototype, 'get_ctx', () -> utils.MockCanvasContext)
    sinon.stub(Solver.prototype, 'suggest_value')
    @solver_add_constraint = sinon.stub(Solver.prototype, 'add_constraint')
    @solver_remove_constraint = sinon.stub(Solver.prototype, 'remove_constraint')
    sinon.stub(PlotView.prototype, '_paint_empty')

  beforeEach ->
    @test_doc = new Document()
    @test_plot = new Plot({x_range: new Range1d({start: 0, end: 1}), y_range: new Range1d({start: 0, end: 1})})
    @test_plot.document = @test_doc
    @test_plot._doc_attached()
    @ticker = new BasicTicker()
    @formatter = new BasicTickFormatter()

  it "_tick_extent should return the major_tick_out property", ->
    x = new Axis({ 'major_tick_out': 12, 'ticker': @ticker, 'formatter': @formatter })
    @test_plot.add_layout(x, 'below')
    # Must create the test_plot_view after adding the axis to the plot
    test_plot_view = new @test_plot.default_view({ 'model': @test_plot })
    x_view = new x.default_view({ 'model': x, 'plot_model': @test_plot, 'plot_view': test_plot_view })
    expect(x_view._tick_extent()).to.be.equal x.major_tick_out

  it "_tick_label_extent should be greater than major_label_standoff", ->
    x = new Axis({
      'major_label_standoff': 11
      'ticker': @ticker
      'formatter': @formatter
    })
    @test_plot.add_layout(x, 'left')
    test_plot_view = new @test_plot.default_view({ 'model': @test_plot })
    x_view = new x.default_view({ 'model': x, 'plot_model': @test_plot, 'plot_view': test_plot_view })
    expect(x_view._tick_label_extent()).to.be.above x.major_label_standoff

  it "_axis_label_extent should be greater than axis_label_standoff", ->
    x = new Axis({
      'axis_label_standoff': 11
      'ticker': @ticker
      'formatter': @formatter
      'axis_label': 'Left axis label'
    })
    @test_plot.add_layout(x, 'left')
    test_plot_view = new @test_plot.default_view({ 'model': @test_plot })
    x_view = new x.default_view({ 'model': x, 'plot_model': @test_plot, 'plot_view': test_plot_view })
    expect(x_view._axis_label_extent()).to.be.above x.axis_label_standoff

  it "_axis_label_extent should be greater than the font_size", ->
    x = new Axis({ 'ticker': @ticker, 'formatter': @formatter, 'axis_label': 'Left axis label' })
    @test_plot.add_layout(x, 'left')
    test_plot_view = new @test_plot.default_view({ 'model': @test_plot })
    x_view = new x.default_view({ 'model': x, 'plot_model': @test_plot, 'plot_view': test_plot_view })
    expect(x_view._axis_label_extent()).to.be.above 0
    expect(x_view._axis_label_extent()).to.be.below 10

  it "_axis_label_extent should be 0 if no axis_label", ->
    x = new Axis({ 'ticker': @ticker, 'formatter': @formatter })
    @test_plot.add_layout(x, 'left')
    test_plot_view = new @test_plot.default_view({ 'model': @test_plot })
    x_view = new x.default_view({ 'model': x, 'plot_model': @test_plot, 'plot_view': test_plot_view })
    expect(x_view._axis_label_extent()).to.be.equal 0

  it "_get_size should return sum of _tick_extent, _axis_label_extent, and _tick_label_extent", ->
    x = new Axis({ 'ticker': @ticker, 'formatter': @formatter })
    @test_plot.add_layout(x, 'left')
    test_plot_view = new @test_plot.default_view({ 'model': @test_plot })
    x_view = new x.default_view({ 'model': x, 'plot_model': @test_plot, 'plot_view': test_plot_view })
    sinon.stub(x_view, '_tick_extent', () -> 0.11)
    sinon.stub(x_view, '_axis_label_extent', () -> 0.11)
    sinon.stub(x_view, '_tick_label_extent', () -> 0.11)
    expect(x_view._get_size()).to.be.equal 0.33

  it "_update_constraints should not set _size_constraint if visible is false", ->
    x = new Axis({ 'ticker': @ticker, 'formatter': @formatter, 'visible': false })
    @test_plot.add_layout(x, 'left')
    test_plot_view = new @test_plot.default_view({ 'model': @test_plot })
    x_view = new x.default_view({ 'model': x, 'plot_model': @test_plot, 'plot_view': test_plot_view })
    expect(x_view._size_constraint).to.be.undefined
    x_view.update_constraints()
    # Should still be undefined because visible is false
    expect(x_view._size_constraint).to.be.undefined

  it "_update_constraints should set last_size", ->
    x = new Axis({ 'ticker': @ticker, 'formatter': @formatter })
    @test_plot.add_layout(x, 'left')
    test_plot_view = new @test_plot.default_view({ 'model': @test_plot })
    x_view = new x.default_view({ 'model': x, 'plot_model': @test_plot, 'plot_view': test_plot_view })
    sinon.stub(x_view, '_tick_extent', () -> 0.11)
    sinon.stub(x_view, '_axis_label_extent', () -> 0.11)
    sinon.stub(x_view, '_tick_label_extent', () -> 0.11)
    expect(x_view._last_size).to.be.undefined
    x_view.update_constraints()
    expect(x_view._last_size).to.be.equal 0.33

  it "_update_constraints should add a constraint", ->
    x = new Axis({ 'ticker': @ticker, 'formatter': @formatter })
    @test_plot.add_layout(x, 'left')
    test_plot_view = new @test_plot.default_view({ 'model': @test_plot })
    x_view = new x.default_view({ 'model': x, 'plot_model': @test_plot, 'plot_view': test_plot_view })
    add_constraint_call_count = @solver_add_constraint.callCount
    x_view.update_constraints()
    expect(@solver_add_constraint.callCount).to.be.equal add_constraint_call_count + 1

  it "_update_constraints should add and remove a constraint if the size changes", ->
    x = new Axis({ 'ticker': @ticker, 'formatter': @formatter })
    @test_plot.add_layout(x, 'left')
    test_plot_view = new @test_plot.default_view({ 'model': @test_plot })
    x_view = new x.default_view({ 'model': x, 'plot_model': @test_plot, 'plot_view': test_plot_view })

    x_view._tick_extent = sinon.stub()
    x_view._tick_extent.onCall(0).returns(0.11)
    x_view._tick_extent.onCall(1).returns(0.22)

    x_view.update_constraints()
    add_constraint_call_count = @solver_add_constraint.callCount
    remove_constraint_call_count = @solver_remove_constraint.callCount
    x_view.update_constraints()
    expect(@solver_add_constraint.callCount).to.be.equal add_constraint_call_count + 1
    expect(@solver_remove_constraint.callCount).to.be.equal remove_constraint_call_count + 1

  it "_update_constraints should not add and remove a constraint if the size is the same", ->
    x = new Axis({ 'ticker': @ticker, 'formatter': @formatter })
    @test_plot.add_layout(x, 'left')
    test_plot_view = new @test_plot.default_view({ 'model': @test_plot })
    x_view = new x.default_view({ 'model': x, 'plot_model': @test_plot, 'plot_view': test_plot_view })

    x_view._tick_extent = sinon.stub()
    x_view._tick_extent.onCall(0).returns(0.11)
    x_view._tick_extent.onCall(1).returns(0.11)

    x_view.update_constraints()
    add_constraint_call_count = @solver_add_constraint.callCount
    remove_constraint_call_count = @solver_remove_constraint.callCount
    x_view.update_constraints()
    expect(@solver_add_constraint.callCount).to.be.equal add_constraint_call_count
    expect(@solver_remove_constraint.callCount).to.be.equal remove_constraint_call_count
