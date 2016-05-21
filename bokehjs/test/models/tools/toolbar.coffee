_ = require "underscore"
{expect} = require "chai"
utils = require "../../utils"
sinon = require "sinon"

{Strength, Variable}  = utils.require("core/layout/solver")

{Document} = utils.require("document")
Toolbar = utils.require("models/tools/toolbar").Model

describe "Toolbar.View", ->

  afterEach ->
    utils.unstub_solver()

  beforeEach ->
    solver_stubs = utils.stub_solver()
    @solver_suggest = solver_stubs['suggest']
    doc = new Document()
    @test_tb = new Toolbar()
    @test_tb.attach_document(doc)

  # TODO(bird) - still working on responsive 
  it.skip "render should call update_constraints", ->
    tb_view = new @test_tb.default_view({ model: @test_tb })
    spy = sinon.spy(tb_view, 'update_constraints')
    tb_view.render()
    expect(spy.calledOnce).is.true

  it "render should call template with location", ->
    @test_tb.location = 'below'
    tb_view = new @test_tb.default_view({ model: @test_tb })
    spy = sinon.spy(tb_view, 'template')
    tb_view.render()
    expect(spy.calledOnce).is.true
    expect(spy.args[0][0]['location']).is.equal 'below'

  it "render should call template with above location if location is None", ->
    # We need to set above so toolbar looks nice
    @test_tb.location = null
    tb_view = new @test_tb.default_view({ model: @test_tb })
    spy = sinon.spy(tb_view, 'template')
    tb_view.render()
    expect(spy.calledOnce).is.true
    expect(spy.args[0][0]['location']).is.equal 'above'
    
  it "render should set the appropriate positions and paddings on the element", ->
    dom_left = 12
    dom_top = 44
    width = 111
    height = 123
    @test_tb._dom_left = {_value: dom_left}
    @test_tb._dom_top = {_value: dom_top}
    @test_tb._width = {_value: width}
    @test_tb._height = {_value: height}

    tb_view = new @test_tb.default_view({ model: @test_tb })
    tb_view.render()
    expected_style = "left: #{dom_left}px; top: #{dom_top}px; width: #{width}px; height: #{height}px;"
    expect(tb_view.$el.attr('style')).to.be.equal expected_style

  # TODO(bird) - Still implementing responsive
  it.skip "update_constraints should suggest _height of 30 if responsive_mode is width and location is above", ->
    @test_tb.location = 'above'
    tb_view = new @test_tb.default_view({ model: @test_tb })
    expect(@solver_suggest.callCount).is.equal 0
    tb_view.update_constraints()
    expect(@solver_suggest.callCount).is.equal 1
    expect(@solver_suggest.args[0]).to.be.deep.equal [@test_tb._height, 30]

  # TODO(bird) - Still implementing responsive
  it.skip "update_constraints should suggest _height of 30 if responsive_mode is width and location is below", ->
    @test_tb.location = 'below'
    tb_view = new @test_tb.default_view({ model: @test_tb })
    expect(@solver_suggest.callCount).is.equal 0
    tb_view.update_constraints()
    expect(@solver_suggest.callCount).is.equal 1
    expect(@solver_suggest.args[0]).to.be.deep.equal [@test_tb._height, 30]

  # TODO(bird) - Still implementing responsive
  it.skip "update_constraints should suggest _width of 30 if responsive_mode is width and location is left", ->
    @test_tb.location = 'left'
    tb_view = new @test_tb.default_view({ model: @test_tb })
    expect(@solver_suggest.callCount).is.equal 0
    tb_view.update_constraints()
    expect(@solver_suggest.callCount).is.equal 1
    expect(@solver_suggest.args[0]).to.be.deep.equal [@test_tb._width, 30]

  # TODO(bird) - Still implementing responsive
  it.skip "update_constraints should suggest _width of 30 if responsive_mode is width and location is right", ->
    @test_tb.location = 'right'
    tb_view = new @test_tb.default_view({ model: @test_tb })
    expect(@solver_suggest.callCount).is.equal 0
    tb_view.update_constraints()
    expect(@solver_suggest.callCount).is.equal 1
    expect(@solver_suggest.args[0]).to.be.deep.equal [@test_tb._width, 30]

  # TODO(bird) - Still implementing responsive
  it.skip "update_constraints should call suggest value with the model height and width if responsive_mode is fixed", ->
    @test_tb.responsive = 'fixed'
    @test_tb.width = 22
    @test_tb.height = 33
    tb_view = new @test_tb.default_view({ model: @test_tb })
    expect(@solver_suggest.callCount).is.equal 0
    tb_view.update_constraints()
    expect(@solver_suggest.callCount).is.equal 2
    expect(@solver_suggest.args[0]).to.be.deep.equal [@test_tb._width, 22]
    expect(@solver_suggest.args[1]).to.be.deep.equal [@test_tb._height, 33]


describe "Toolbar.Model", ->

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

  # TODO(bird) - Still implementing responsive
  it.skip "should set edit_variable height if responsive mode is width and location is above", ->
    tb = new Toolbar()
    tb.responsive = 'width'
    tb.location = 'above'
    ev = tb.get_edit_variables()
    expect(ev.length).to.be.equal 1
    expect(ev[0].edit_variable).to.be.equal tb._height
    expect(ev[0].strength._strength).to.be.equal Strength.strong._strength

  # TODO(bird) - Still implementing responsive
  it.skip "should set edit_variable height if responsive mode is width and location is below", ->
    tb = new Toolbar()
    tb.responsive = 'width'
    tb.location = 'below'
    ev = tb.get_edit_variables()
    expect(ev.length).to.be.equal 1
    expect(ev[0].edit_variable).to.be.equal tb._height
    expect(ev[0].strength._strength).to.be.equal Strength.strong._strength

  # TODO(bird) - Still implementing responsive
  it.skip "should set edit_variable width if responsive mode is width and location is left", ->
    tb = new Toolbar()
    tb.responsive = 'width'
    tb.location = 'left'
    ev = tb.get_edit_variables()
    expect(ev.length).to.be.equal 1
    expect(ev[0].edit_variable).to.be.equal tb._width
    expect(ev[0].strength._strength).to.be.equal Strength.strong._strength

  # TODO(bird) - Still implementing responsive
  it.skip "should set edit_variable width if responsive mode is width and location is right", ->
    tb = new Toolbar()
    tb.responsive = 'width'
    tb.location = 'right'
    ev = tb.get_edit_variables()
    expect(ev.length).to.be.equal 1
    expect(ev[0].edit_variable).to.be.equal tb._width
    expect(ev[0].strength._strength).to.be.equal Strength.strong._strength

  it "should not set edit_variables if responsive mode is box", ->
    tb = new Toolbar()
    tb.responsive = 'box'
    ev = tb.get_edit_variables()
    expect(ev.length).to.be.equal 0

  # TODO(bird) - Still implementing responsive
  it.skip "should set edit_variable height and width if responsive mode is fixed", ->
    tb = new Toolbar()
    tb.responsive = 'fixed'
    ev = tb.get_edit_variables()
    expect(ev.length).to.be.equal 2
    # This is a bit bad, if you changed the order of the get_edit_variables,
    # you'd have to change the test :(
    expect(ev[0].edit_variable).to.be.equal tb._width
    expect(ev[0].strength._strength).to.be.equal Strength.strong._strength
    expect(ev[1].edit_variable).to.be.equal tb._height
    expect(ev[1].strength._strength).to.be.equal Strength.strong._strength
