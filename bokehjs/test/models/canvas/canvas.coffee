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
    c._doc_attached()
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
    c._doc_attached()
    expect(c.get_constraints().length).to.be.equal 8

describe "Canvas.View", ->

  afterEach ->
    utils.unstub_canvas()
    utils.unstub_solver()

  beforeEach ->
    utils.stub_canvas()
    utils.stub_solver()
    @c = new Canvas()
    @c.document = new Document()
    @c._doc_attached()

  it "should call set_dims on initialization", ->
    spy = sinon.spy(CanvasView.prototype, 'set_dims')
    c_view = new @c.default_view({'model': @c})
    expect(spy.calledOnce).to.be.true
