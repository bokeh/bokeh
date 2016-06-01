{expect} = require "chai"
utils = require "../../utils"
sinon = require 'sinon'

Canvas = utils.require("models/canvas/canvas.coffee").Model
CanvasView = utils.require("models/canvas/canvas.coffee").View
{Document} = utils.require "document"
{Variable}  = utils.require("core/layout/solver")

describe "Canvas.Model", ->

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

  it "should should return 8 constraints", ->
    c = new Canvas()
    c.document = new Document()
    expect(c.get_constraints().length).to.be.equal 8

describe "Canvas.View", ->

  afterEach ->
    utils.unstub_canvas()
    utils.unstub_solver()

  beforeEach ->
    utils.stub_canvas()
    solver_stubs = utils.stub_solver()
    @solver_add_stub = solver_stubs['add']
    @solver_remove_stub = solver_stubs['remove']

    @c = new Canvas()
    @c.document = new Document()

  it "initialize should call set_dims", ->
    spy = sinon.spy(CanvasView.prototype, 'set_dims')
    c_view = new @c.default_view({'model': @c})
    expect(spy.calledOnce).to.be.true
    spy.restore()

  it "set_dims should call update_constraints", ->
    canvas_view = new @c.default_view({'model': @c})
    spy = sinon.spy(canvas_view, 'update_constraints')
    canvas_view.set_dims([1, 2])
    expect(spy.calledOnce).to.be.true

  it "set_dims should set requested_width and requested_height on canvas_view", ->
    c_view = new @c.default_view({'model': @c})
    c_view.set_dims([1, 2])
    expect(c_view.requested_width).to.be.equal 1
    expect(c_view.requested_height).to.be.equal 2

  it "update_constraints should add two constraints to solver", ->
    c_view = new @c.default_view({'model': @c})
    initial_add_count = @solver_add_stub.callCount
    initial_remove_count = @solver_remove_stub.callCount
    c_view.requested_width = 54
    c_view.requested_height = 54
    c_view.update_constraints()
    expect(@solver_add_stub.callCount).to.be.equal initial_add_count + 2
    expect(@solver_remove_stub.callCount).to.be.equal initial_remove_count + 0 # No constraint removal on first update

  it "update_constraints should add no constraints if height < MIN_SIZE (50)", ->
    c_view = new @c.default_view({'model': @c})
    initial_add_count = @solver_add_stub.callCount
    c_view.requested_width = 54
    c_view.requested_height = 49
    c_view.update_constraints()
    expect(@solver_add_stub.callCount).to.be.equal initial_add_count

  it "update_constraints should add no constraints if width < MIN_SIZE (50)", ->
    c_view = new @c.default_view({'model': @c})
    initial_add_count = @solver_add_stub.callCount
    c_view.requested_width = 49
    c_view.requested_height = 54
    c_view.update_constraints()
    expect(@solver_add_stub.callCount).to.be.equal initial_add_count

  it "update_constraints should remove two constraints from solver if update_constraints has already been called once", ->
    c_view = new @c.default_view({'model': @c})
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
    c_view = new @c.default_view({'model': @c})
    initial_add_count = @solver_add_stub.callCount
    initial_remove_count = @solver_remove_stub.callCount
    c_view.update_constraints()
    expect(c_view.requested_width).is.null
    expect(c_view.requested_height).is.null
    expect(@solver_add_stub.callCount).to.be.equal initial_add_count
    expect(@solver_remove_stub.callCount).to.be.equal initial_remove_count

  it "update_constraints should not alter solver if requested_width and requested_height haven't changed", ->
    c_view = new @c.default_view({'model': @c})
    c_view.requested_width = 4
    c_view.requested_height = 4
    # Call once to get _width_constraint and _height_constraint set on solver
    c_view.update_constraints()
    initial_add_count = @solver_add_stub.callCount
    initial_remove_count = @solver_remove_stub.callCount
    c_view.update_constraints()
    expect(@solver_add_stub.callCount).to.be.equal initial_add_count
    expect(@solver_remove_stub.callCount).to.be.equal initial_remove_count
