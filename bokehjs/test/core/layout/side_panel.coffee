_ = require "underscore"
{expect} = require "chai"
utils = require "../../utils"
sinon = require 'sinon'

SidePanel = utils.require("core/layout/side_panel").Model
update_constraints = utils.require("core/layout/side_panel").update_constraints

{Document} = utils.require("document")

Annotation = utils.require("models/annotations/annotation").Model
Axis = utils.require("models/axes/axis").Model
BasicTicker = utils.require("models/tickers/basic_ticker").Model
BasicTickFormatter = utils.require("models/formatters/basic_tick_formatter").Model
Plot = utils.require("models/plots/plot").Model
PlotView = utils.require("models/plots/plot").View
Range1d = utils.require("models/ranges/range1d").Model

describe "SidePanel.Model", ->

  it "should should return 8 constraints", ->
    p = new SidePanel()
    expect(p.get_constraints().length).to.be.equal 8
    # TODO (bird) - it would be good if we could actually assert about the
    # constraints, but this is hard (impossible?) at the moment, so will have to do some
    # visual testing to make sure things line up.


describe "SidePanel update_constraints", ->
  # Using axis_view as the view to pass into update_constraints
  
  afterEach ->
    utils.unstub_canvas()
    utils.unstub_solver()

  beforeEach ->
    utils.stub_canvas()
    solver_stubs = utils.stub_solver()
    @solver_add_constraint = solver_stubs['add']
    @solver_remove_constraint = solver_stubs['remove']

    @test_plot = new Plot({ x_range: new Range1d({start: 0, end: 1}), y_range: new Range1d({start: 0, end: 1}) })
    @test_plot.attach_document(new Document())
    @axis = new Axis({ ticker: new BasicTicker(), formatter: new BasicTickFormatter() })
    @test_plot.add_layout(@axis, 'below')
    @test_plot_view = new @test_plot.default_view({ 'model': @test_plot })
    @axis_view = new @axis.default_view({ model: @axis, plot_model: @test_plot, plot_view: @test_plot_view })

  it "update_constraints should not fail if visible is not on model", ->
    an = new Annotation()
    an_view = new an.default_view({model: an, plot_model: @test_plot, plot_view: @test_plot_view})
    expect(an_view._size_constraint).to.be.undefined
    update_constraints(an_view)
    # Should still be undefined because visible is false
    expect(an_view._size_constraint).to.be.undefined

  it "update_constraints should not set _size_constraint if visible is false", ->
    @axis.set('visible', false)
    expect(@axis_view._size_constraint).to.be.undefined
    update_constraints(@axis_view)
    # Should still be undefined because visible is false
    expect(@axis_view._size_constraint).to.be.undefined

  it "update_constraints should set last_size", ->
    sinon.stub(@axis_view, '_tick_extent', () -> 0.11)
    sinon.stub(@axis_view, '_axis_label_extent', () -> 0.11)
    sinon.stub(@axis_view, '_tick_label_extent', () -> 0.11)
    expect(@axis_view._size_constraint).to.be.undefined
    update_constraints(@axis_view)
    expect(@axis_view._last_size).to.be.equal 0.33

  it "update_constraints should add a constraint", ->
    add_constraint_call_count = @solver_add_constraint.callCount
    update_constraints(@axis_view)
    expect(@solver_add_constraint.callCount).to.be.equal add_constraint_call_count + 1

  it "update_constraints should add and remove a constraint if the size changes", ->
    @axis_view._tick_extent = sinon.stub()
    @axis_view._tick_extent.onCall(0).returns(0.11)
    @axis_view._tick_extent.onCall(1).returns(0.22)

    update_constraints(@axis_view)
    add_constraint_call_count = @solver_add_constraint.callCount
    remove_constraint_call_count = @solver_remove_constraint.callCount
    update_constraints(@axis_view)
    expect(@solver_add_constraint.callCount).to.be.equal add_constraint_call_count + 1
    expect(@solver_remove_constraint.callCount).to.be.equal remove_constraint_call_count + 1

  it "update_constraints should not add and remove a constraint if the size is the same", ->
    @axis_view._tick_extent = sinon.stub()
    @axis_view._tick_extent.returns(0.11)

    update_constraints(@axis_view)
    add_constraint_call_count = @solver_add_constraint.callCount
    remove_constraint_call_count = @solver_remove_constraint.callCount
    update_constraints(@axis_view)
    expect(@solver_add_constraint.callCount).to.be.equal add_constraint_call_count
    expect(@solver_remove_constraint.callCount).to.be.equal remove_constraint_call_count
