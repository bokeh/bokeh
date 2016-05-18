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

  it "render should call update_constraints", ->
    tb_view = new @test_tb.default_view({ model: @test_tb })
    spy = sinon.spy(tb_view, 'update_constraints')
    tb_view.render()
    expect(spy.calledOnce).is.true
    
  it "render should set the appropriate positions and paddings on the element", ->
    dom_left = 12
    dom_top = 13
    width = 100
    height = 100
    wl = 5
    wr = 10
    wt = 22
    wb = 33
    @test_tb.set('dom_left', dom_left)
    @test_tb.set('dom_top', dom_top)
    @test_tb._width = {_value: width}
    @test_tb._height = {_value: height}
    @test_tb._whitespace_left = {_value: wl}
    @test_tb._whitespace_right = {_value: wr}
    @test_tb._whitespace_top = {_value: wt}
    @test_tb._whitespace_bottom = {_value: wb}

    tb_view = new @test_tb.default_view({ model: @test_tb })
    expect(tb_view.$el.attr('style')).to.be.undefined
    tb_view.render()
    
    expected_style = "position: absolute; left: #{dom_left}px; top: #{dom_top}px; width: #{width}px; margin: #{wt}px #{wr}px #{wb}px #{wl}px;"
    expect(tb_view.$el.attr('style')).to.be.equal expected_style

  it "update_constraints should suggest _height of 30 if responsive_mode is width and location is above", ->
    @test_tb.location = 'above'
    tb_view = new @test_tb.default_view({ model: @test_tb })
    expect(@solver_suggest.callCount).is.equal 0
    tb_view.update_constraints()
    expect(@solver_suggest.callCount).is.equal 1
    expect(@solver_suggest.args[0]).to.be.deep.equal [@test_tb._height, 30]

  it "update_constraints should suggest _height of 30 if responsive_mode is width and location is below", ->
    @test_tb.location = 'below'
    tb_view = new @test_tb.default_view({ model: @test_tb })
    expect(@solver_suggest.callCount).is.equal 0
    tb_view.update_constraints()
    expect(@solver_suggest.callCount).is.equal 1
    expect(@solver_suggest.args[0]).to.be.deep.equal [@test_tb._height, 30]

  it "update_constraints should suggest _width of 30 if responsive_mode is width and location is left", ->
    @test_tb.location = 'left'
    tb_view = new @test_tb.default_view({ model: @test_tb })
    expect(@solver_suggest.callCount).is.equal 0
    tb_view.update_constraints()
    expect(@solver_suggest.callCount).is.equal 1
    expect(@solver_suggest.args[0]).to.be.deep.equal [@test_tb._width, 30]

  it "update_constraints should suggest _width of 30 if responsive_mode is width and location is right", ->
    @test_tb.location = 'right'
    tb_view = new @test_tb.default_view({ model: @test_tb })
    expect(@solver_suggest.callCount).is.equal 0
    tb_view.update_constraints()
    expect(@solver_suggest.callCount).is.equal 1
    expect(@solver_suggest.args[0]).to.be.deep.equal [@test_tb._width, 30]

  it "update_constraints should call suggest value with the model height and width if responsive_mode is fixed", ->
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

  it "should should return 8 constraints", ->
    tb = new Toolbar()
    expect(tb.get_constraints().length).to.be.equal 8

  it "should should have default dom_left and dom_top", ->
    tb = new Toolbar()
    expect(tb.dom_left).to.be.equal 0
    expect(tb.dom_top).to.be.equal 0

  it "should not return box equal constrained_variables", ->
    tb = new Toolbar()
    expected_constrainted_variables = {
      'width': tb._width
      'height': tb._height
      # edges
      'on-top-edge-align' : tb._top
      'on-bottom-edge-align' : tb._height_minus_bottom
      'on-left-edge-align' : tb._left
      'on-right-edge-align' : tb._width_minus_right
      # align between cells
      'box-cell-align-top' : tb._top
      'box-cell-align-bottom' : tb._height_minus_bottom
      'box-cell-align-left' : tb._left
      'box-cell-align-right' : tb._width_minus_right
      # whitespace
      'whitespace-top' : tb._whitespace_top
      'whitespace-bottom' : tb._whitespace_bottom
      'whitespace-left' : tb._whitespace_left
      'whitespace-right' : tb._whitespace_right
    }
    tb.responsive = 'fixed'
    constrained_variables = tb.get_constrained_variables()
    expect(constrained_variables).to.be.deep.equal expected_constrainted_variables

  it "should set edit_variable height if responsive mode is width and location is above", ->
    tb = new Toolbar()
    tb.responsive = 'width'
    tb.location = 'above'
    ev = tb.get_edit_variables()
    expect(ev.length).to.be.equal 1
    expect(ev[0].edit_variable).to.be.equal tb._height
    expect(ev[0].strength._strength).to.be.equal Strength.strong._strength

  it "should set edit_variable height if responsive mode is width and location is below", ->
    tb = new Toolbar()
    tb.responsive = 'width'
    tb.location = 'below'
    ev = tb.get_edit_variables()
    expect(ev.length).to.be.equal 1
    expect(ev[0].edit_variable).to.be.equal tb._height
    expect(ev[0].strength._strength).to.be.equal Strength.strong._strength

  it "should set edit_variable width if responsive mode is width and location is left", ->
    tb = new Toolbar()
    tb.responsive = 'width'
    tb.location = 'left'
    ev = tb.get_edit_variables()
    expect(ev.length).to.be.equal 1
    expect(ev[0].edit_variable).to.be.equal tb._width
    expect(ev[0].strength._strength).to.be.equal Strength.strong._strength

  it "should set edit_variable width if responsive mode is width and location is right", ->
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

  it "should set edit_variable height and width if responsive mode is fixed", ->
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
