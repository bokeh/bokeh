{expect} = require "chai"
utils = require "../../utils"
sinon = require "sinon"

{Strength, Variable}  = utils.require("core/layout/solver")

{Document} = utils.require("document")
Widget = utils.require("models/widgets/widget").Model


describe "Widget.View", ->

  afterEach ->
    utils.unstub_solver()

  beforeEach ->
    solver_stubs = utils.stub_solver()
    @solver_suggest = solver_stubs['suggest']

    @test_doc = new Document()
    @test_widget = new Widget()
    @test_widget.attach_document(@test_doc)

  it "render should call update_constraints if the responsive mode is 'width'", ->
    widget_view = new @test_widget.default_view({ model: @test_widget })
    spy = sinon.spy(widget_view, 'update_constraints')
    widget_view.render()
    expect(spy.calledOnce).is.true
    
  it "render should not call update_constraints if the responsive mode is 'box'", ->
    @test_widget.set('responsive', 'box')
    widget_view = new @test_widget.default_view({ model: @test_widget })
    spy = sinon.spy(widget_view, 'update_constraints')
    widget_view.render()
    expect(spy.callCount).is.equal 0

  it "render should set the appropriate positions and paddings on the element", ->
    dom_left = 12
    dom_top = 13
    width = 100
    height = 100
    wl = 5
    wr = 10
    wt = 22
    wb = 33
    @test_widget.set('dom_left', dom_left)
    @test_widget.set('dom_top', dom_top)
    @test_widget._width = {_value: width}
    @test_widget._height = {_value: height}
    @test_widget._whitespace_left = {_value: wl}
    @test_widget._whitespace_right = {_value: wr}
    @test_widget._whitespace_top = {_value: wt}
    @test_widget._whitespace_bottom = {_value: wb}

    widget_view = new @test_widget.default_view({ model: @test_widget })
    expect(widget_view.$el.attr('style')).to.be.undefined
    widget_view.render()
    
    expected_style = "position: absolute; left: #{dom_left}px; top: #{dom_top}px; width: #{width - wl - wr}px; padding: #{wt}px #{wr}px #{wb}px #{wl}px;"
    expect(widget_view.$el.attr('style')).to.be.equal expected_style

  it "update_constraints should call suggest value with the elements scrollHeight", ->
    widget_view = new @test_widget.default_view({ model: @test_widget })
    
    # scrollHeight isn't available in test so setting manually
    widget_view.el.scrollHeight = 222

    expect(@solver_suggest.callCount).is.equal 0
    widget_view.update_constraints()
    expect(@solver_suggest.callCount).is.equal 1
    expect(@solver_suggest.args[0]).to.be.deep.equal [@test_widget._height, 222]


describe "Widget.Model", ->
  it "should set edit_variable height if responsive mode is width", ->
    widget = new Widget()
    ev = widget.get_edit_variables()
    expect(ev.length).to.be.equal 1

    expected_height_ev = ev[0]
    expect(expected_height_ev.edit_variable).to.be.equal widget._height
    expect(expected_height_ev.strength._strength).to.be.equal Strength.strong._strength

  it "should not set edit_variable height if responsive mode is fixed", ->
    widget = new Widget({responsive: 'box'})
    ev = widget.get_edit_variables()
    expect(ev.length).to.be.equal 0

  it "should not set edit_variable height if responsive mode is fixed", ->
    widget = new Widget({responsive: 'fixed'})
    ev = widget.get_edit_variables()
    expect(ev.length).to.be.equal 0
