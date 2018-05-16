{expect} = require "chai"
sinon = require 'sinon'

{Canvas, CanvasView} = require("models/canvas/canvas")
{Plot} = require("models/plots/plot")
{Range1d} = require("models/ranges/range1d")
{Document} = require("document")
{Variable}  = require("core/layout/solver")

describe "Canvas", ->

  it "should have 6 variables", ->
    c = new Canvas()
    c.document = new Document()
    # These are inherited from LayoutDOM
    expect(c._top).to.be.an.instanceOf(Variable)
    expect(c._bottom).to.be.an.instanceOf(Variable)
    expect(c._left).to.be.an.instanceOf(Variable)
    expect(c._right).to.be.an.instanceOf(Variable)
    expect(c._width).to.be.an.instanceOf(Variable)
    expect(c._height).to.be.an.instanceOf(Variable)

describe "CanvasView", ->

  beforeEach ->
    doc = new Document()
    plot = new Plot({
      x_range: new Range1d({start: 0, end: 1})
      y_range: new Range1d({start: 0, end: 1})
    })
    plot_view = new plot.default_view({model: plot, parent: null})
    doc.add_root(plot)
    @plot_canvas_view = new plot.plot_canvas.default_view({model: plot.plot_canvas, parent: plot_view})

    @c = new Canvas()
    @c.attach_document(doc)

  it "initialize should call set_dims", sinon.test ->
    spy = this.spy(CanvasView.prototype, 'set_dims')
    c_view = new @c.default_view({model: @c, parent: @plot_canvas_view})
    expect(spy.calledOnce).to.be.false

  ###
  it "set_dims should call update_constraints", sinon.test ->
    canvas_view = new @c.default_view({model: @c, parent: @plot_canvas_view})
    spy = this.spy(canvas_view, 'update_constraints')
    canvas_view.set_dims([1, 2])
    expect(spy.calledOnce).to.be.true

  it "set_dims should set requested_width and requested_height on canvas_view", ->
    c_view = new @c.default_view({model: @c, parent: @plot_canvas_view})
    c_view.set_dims([1, 2])
    expect(c_view.requested_width).to.be.equal 1
    expect(c_view.requested_height).to.be.equal 2

  it "update_constraints should add two constraints to solver", ->
    c_view = new @c.default_view({model: @c, parent: @plot_canvas_view})
    initial_add_count = @solver_add_stub.callCount
    initial_remove_count = @solver_remove_stub.callCount
    c_view.requested_width = 54
    c_view.requested_height = 54
    c_view.update_constraints()
    expect(@solver_add_stub.callCount).to.be.equal initial_add_count + 2
    expect(@solver_remove_stub.callCount).to.be.equal initial_remove_count + 0 # No constraint removal on first update

  it "update_constraints should add no constraints if height < MIN_SIZE (50)", ->
    c_view = new @c.default_view({model: @c, parent: @plot_canvas_view})
    initial_add_count = @solver_add_stub.callCount
    c_view.requested_width = 54
    c_view.requested_height = 49
    c_view.update_constraints()
    expect(@solver_add_stub.callCount).to.be.equal initial_add_count

  it "update_constraints should add no constraints if width < MIN_SIZE (50)", ->
    c_view = new @c.default_view({model: @c, parent: @plot_canvas_view})
    initial_add_count = @solver_add_stub.callCount
    c_view.requested_width = 49
    c_view.requested_height = 54
    c_view.update_constraints()
    expect(@solver_add_stub.callCount).to.be.equal initial_add_count

  it "update_constraints should remove two constraints from solver if update_constraints has already been called once", ->
    c_view = new @c.default_view({model: @c, parent: @plot_canvas_view})
    c_view.requested_width = 54
    c_view.requested_height = 54
    c_view.update_constraints()
    c_view.requested_width = 52
    c_view.requested_height = 52
    initial_add_count = @solver_add_stub.callCount
    initial_remove_count = @solver_remove_stub.callCount
    c_view.update_constraints()
    expect(@solver_add_stub.callCount).to.be.equal initial_add_count + 2
    expect(@solver_remove_stub.callCount).to.be.equal initial_remove_count + 2

  it "update_constraints should not alter solver if requested_width and requested_height are null", ->
    c_view = new @c.default_view({model: @c, parent: @plot_canvas_view})
    initial_add_count = @solver_add_stub.callCount
    initial_remove_count = @solver_remove_stub.callCount
    c_view.update_constraints()
    expect(c_view.requested_width).is.null
    expect(c_view.requested_height).is.null
    expect(@solver_add_stub.callCount).to.be.equal initial_add_count
    expect(@solver_remove_stub.callCount).to.be.equal initial_remove_count

  it "update_constraints should not alter solver if requested_width and requested_height haven't changed", ->
    c_view = new @c.default_view({model: @c, parent: @plot_canvas_view})
    c_view.requested_width = 4
    c_view.requested_height = 4
    # Call once to get _width_constraint and _height_constraint set on solver
    c_view.update_constraints()
    initial_add_count = @solver_add_stub.callCount
    initial_remove_count = @solver_remove_stub.callCount
    c_view.update_constraints()
    expect(@solver_add_stub.callCount).to.be.equal initial_add_count
    expect(@solver_remove_stub.callCount).to.be.equal initial_remove_count
  ###
