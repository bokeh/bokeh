{expect} = require "chai"
utils = require "../../utils"
sinon = require 'sinon'

{SidePanel} = utils.require("core/layout/side_panel")
{update_panel_constraints} = utils.require("core/layout/side_panel")

{Document} = utils.require("document")

{Annotation} = utils.require("models/annotations/annotation")
{Axis} = utils.require("models/axes/axis")
{BasicTicker} = utils.require("models/tickers/basic_ticker")
{BasicTickFormatter} = utils.require("models/formatters/basic_tick_formatter")
{Plot} = utils.require("models/plots/plot")
{PlotCanvas} = utils.require("models/plots/plot_canvas")
{PlotView} = utils.require("models/plots/plot")
{Range1d} = utils.require("models/ranges/range1d")
{Toolbar} = utils.require("models/tools/toolbar")

describe "SidePanel", ->

  it "should should return 8 constraints", ->
    p = new SidePanel({side: "left"})
    expect(p.get_constraints().length).to.be.equal 8
    # TODO (bird) - it would be good if we could actually assert about the
    # constraints, but this is hard (impossible?) at the moment, so will have to do some
    # visual testing to make sure things line up.

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

      doc = new Document()
      plot = new Plot({
        x_range: new Range1d({start: 0, end: 1})
        y_range: new Range1d({start: 0, end: 1})
        toolbar: new Toolbar()
      })
      @axis = new Axis({ ticker: new BasicTicker(), formatter: new BasicTickFormatter() })
      plot.add_layout(@axis, 'below')
      doc.add_root(plot)
      plot_view = new plot.default_view({model: plot, parent: null})
      @plot_canvas = new PlotCanvas({plot: plot})
      @plot_canvas.attach_document(doc)
      @plot_canvas_view = new @plot_canvas.default_view({model: @plot_canvas, parent: plot_view})
      @axis_view = new @axis.default_view({model: @axis, plot_view: @plot_canvas_view, parent: @plot_canvas_view})

    it "should not set _size_constraint if visible is false", ->
      @axis.visible = false
      expect(@axis_view._size_constraint).to.be.undefined
      update_panel_constraints(@axis_view)
      # Should still be undefined because visible is false
      expect(@axis_view._size_constraint).to.be.undefined

    it "should set last_size", ->
      sinon.stub(@axis_view, '_tick_extent', () -> 0.11)
      sinon.stub(@axis_view, '_axis_label_extent', () -> 0.11)
      sinon.stub(@axis_view, '_tick_label_extent', () -> 0.11)
      expect(@axis_view._size_constraint).to.be.undefined
      update_panel_constraints(@axis_view)
      expect(@axis_view._size_constraint.expression.constant).to.be.equal(-0.33)

    it "should add two constraints on first call (one for size, one for full)", ->
      add_constraint_call_count = @solver_add_constraint.callCount
      update_panel_constraints(@axis_view)
      expect(@solver_add_constraint.callCount).to.be.equal add_constraint_call_count + 2

    it "should add and remove a constraint if the size changes", ->
      @axis_view._tick_extent = sinon.stub()
      @axis_view._tick_extent.onCall(0).returns(0.11)
      @axis_view._tick_extent.onCall(1).returns(0.22)

      add_constraint_call_count = @solver_add_constraint.callCount
      remove_constraint_call_count = @solver_remove_constraint.callCount

      update_panel_constraints(@axis_view)

      expect(@solver_add_constraint.callCount).to.be.equal(add_constraint_call_count + 2)
      expect(@solver_remove_constraint.callCount).to.be.equal(remove_constraint_call_count + 0)

      update_panel_constraints(@axis_view)

      expect(@solver_add_constraint.callCount).to.be.equal(add_constraint_call_count + 4)
      expect(@solver_remove_constraint.callCount).to.be.equal(remove_constraint_call_count + 0)
