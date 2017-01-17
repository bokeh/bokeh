{expect} = require "chai"
utils = require "../../utils"
sinon = require "sinon"

{Strength, Variable}  = utils.require("core/layout/solver")

{Document} = utils.require("document")
{Toolbar} = utils.require("models/tools/toolbar")

describe "ToolbarView", ->

  afterEach ->
    utils.unstub_solver()

  beforeEach ->
    solver_stubs = utils.stub_solver()
    @solver_suggest = solver_stubs['suggest']
    doc = new Document()
    @test_tb = new Toolbar()
    @test_tb.attach_document(doc)

  it "render should call template with toolbar_location", ->
    @test_tb.toolbar_location = 'below'
    tb_view = new @test_tb.default_view({ model: @test_tb })
    spy = sinon.spy(tb_view, 'template')
    tb_view.render()
    expect(spy.calledOnce).is.true
    expect(spy.args[0][0]['location']).is.equal 'below'

  it "render should set the appropriate positions and paddings on the element in box mode", ->
    dom_left = 12
    dom_top = 44
    width = 111
    height = 123
    @test_tb._dom_left = {_value: dom_left}
    @test_tb._dom_top = {_value: dom_top}
    @test_tb._width = {_value: width}
    @test_tb._height = {_value: height}
    @test_tb.sizing_mode = 'stretch_both'

    tb_view = new @test_tb.default_view({ model: @test_tb })
    tb_view.render()
    expected_style = "left: #{dom_left}px; top: #{dom_top}px; width: #{width}px; height: #{height}px;"
    expect(tb_view.el.style.cssText).to.be.equal expected_style

  it "render should not render any styling in fixed mode", ->
    dom_left = 12
    dom_top = 44
    width = 111
    height = 123
    @test_tb._dom_left = {_value: dom_left}
    @test_tb._dom_top = {_value: dom_top}
    @test_tb._width = {_value: width}
    @test_tb._height = {_value: height}
    @test_tb.sizing_mode = 'fixed'

    tb_view = new @test_tb.default_view({ model: @test_tb })
    tb_view.render()
    expect(tb_view.el.style.cssText).to.be.equal("")


describe "Toolbar", ->

  it "should have 6 variables", ->
    tb = new Toolbar()
    expect(tb._top).to.be.an.instanceOf(Variable)
    expect(tb._bottom).to.be.an.instanceOf(Variable)
    expect(tb._left).to.be.an.instanceOf(Variable)
    expect(tb._right).to.be.an.instanceOf(Variable)
    expect(tb._width).to.be.an.instanceOf(Variable)
    expect(tb._height).to.be.an.instanceOf(Variable)

  it "should should return 9 constraints", ->
    # 9 constraints - 8 from LayoutDOM + 1 for sizeable
    tb = new Toolbar()
    tb._sizeable = tb._width
    expect(tb.get_constraints().length).to.be.equal 9

  it "should not set edit_variables", ->
    tb = new Toolbar()
    ev = tb.get_edit_variables()
    expect(ev.length).to.be.equal 0
