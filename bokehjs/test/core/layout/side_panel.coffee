{expect} = require "chai"
utils = require "../../utils"
sinon = require 'sinon'

{SidePanel} = utils.require("core/layout/side_panel")
{update_panel_constraints} = utils.require("core/layout/side_panel")

{Annotation} = utils.require("models/annotations/annotation")
{Axis} = utils.require("models/axes/axis")
{BasicTicker} = utils.require("models/tickers/basic_ticker")
{BasicTickFormatter} = utils.require("models/formatters/basic_tick_formatter")
{Plot} = utils.require("models/plots/plot")
{PlotView} = utils.require("models/plots/plot")
{Range1d} = utils.require("models/ranges/range1d")
{Toolbar} = utils.require("models/tools/toolbar")

describe "SidePanel", ->

  describe "apply_location_heuristics", ->

    it "should calculate appropriate axis_label text properties based on location", ->
      p = new SidePanel({side: 'left'})
      ctx = {}
      p.apply_label_text_heuristics(ctx, 'parallel')
      expect(ctx.textBaseline).to.be.equal "alphabetic"
      expect(ctx.textAlign).to.be.equal "center"

      p2 = new SidePanel({side: 'below'})
      ctx = {}
      p2.apply_label_text_heuristics(ctx, Math.PI/2)
      expect(ctx.textBaseline).to.be.equal "middle"
      expect(ctx.textAlign).to.be.equal "right"

  describe "get_label_angle_heuristic", ->

    it "should calculate appropriate axis_label angle rotation based on location", ->
      p = new SidePanel({side: 'left'})
      angle = p.get_label_angle_heuristic('parallel')
      expect(angle).to.be.equal -Math.PI/2

      p2 = new SidePanel({side: 'below'})
      angle = p.get_label_angle_heuristic('horizontal')
      expect(angle).to.be.equal 0

  describe "update_panel_constraints", ->
    # Using axis_view as the view to pass into update_panel_constraints

    afterEach ->
      utils.unstub_canvas()
      utils.unstub_solver()

    beforeEach ->
      utils.stub_canvas()
      solver_stubs = utils.stub_solver()
      @solver_add_constraint = solver_stubs['add']
      @solver_remove_constraint = solver_stubs['remove']

      plot = new Plot({
        x_range: new Range1d({start: 0, end: 1})
        y_range: new Range1d({start: 0, end: 1})
      })
      axis = new Axis({
        ticker: new BasicTicker(),
        formatter: new BasicTickFormatter(),
      })
      plot.add_layout(axis, 'below')
      plot_view = new plot.default_view({model: plot, parent: null})
      @axis_view = plot_view.plot_canvas_view.renderer_views[axis.id]

    ### XXX: no more _size_constraint
    it "should set last_size", ->
      sinon.stub(@axis_view, '_tick_extent', () -> 10)
      sinon.stub(@axis_view, '_axis_label_extent', () -> 15)
      sinon.stub(@axis_view, '_tick_label_extent', () -> 5)
      expect(@axis_view._size_constraint).to.be.undefined
      update_panel_constraints(@axis_view)
      expect(@axis_view._size_constraint.expression.constant).to.be.equal(-30)
    ###

    it "should add two constraints on first call (one for size, one for full)", ->
      add_constraint_call_count = @solver_add_constraint.callCount
      update_panel_constraints(@axis_view)
      expect(@solver_add_constraint.callCount).to.be.equal add_constraint_call_count + 1

    it "should add and remove a constraint if the size changes", ->
      @axis_view._tick_extent = sinon.stub()
      @axis_view._tick_extent.onCall(0).returns(10)
      @axis_view._tick_extent.onCall(1).returns(20)

      add_constraint_call_count = @solver_add_constraint.callCount
      remove_constraint_call_count = @solver_remove_constraint.callCount

      update_panel_constraints(@axis_view)

      expect(@solver_add_constraint.callCount).to.be.equal(add_constraint_call_count + 1)
      expect(@solver_remove_constraint.callCount).to.be.equal(remove_constraint_call_count + 0)

      update_panel_constraints(@axis_view)

      expect(@solver_add_constraint.callCount).to.be.equal(add_constraint_call_count + 2)
      expect(@solver_remove_constraint.callCount).to.be.equal(remove_constraint_call_count + 0)
