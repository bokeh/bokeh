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

  it "render should call update_constraints", ->
    widget_view = new @test_widget.default_view({ model: @test_widget })
    spy = sinon.spy(widget_view, 'update_constraints')
    widget_view.render()
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

  it "update_constraints should call suggest value with the elements scrollHeight if responsive_mode is width", ->
    widget_view = new @test_widget.default_view({ model: @test_widget })
    
    # scrollHeight isn't available in test so setting manually
    widget_view.el.scrollHeight = 222

    expect(@solver_suggest.callCount).is.equal 0
    widget_view.update_constraints()
    expect(@solver_suggest.callCount).is.equal 1
    expect(@solver_suggest.args[0]).to.be.deep.equal [@test_widget._height, 222]

  it "update_constraints should call suggest value with the model height and width if responsive_mode is fixed", ->
    @test_widget.responsive = 'fixed'
    @test_widget.width = 22
    @test_widget.height = 33
    widget_view = new @test_widget.default_view({ model: @test_widget })
    expect(@solver_suggest.callCount).is.equal 0
    widget_view.update_constraints()
    expect(@solver_suggest.callCount).is.equal 2
    expect(@solver_suggest.args[0]).to.be.deep.equal [@test_widget._width, 22]
    expect(@solver_suggest.args[1]).to.be.deep.equal [@test_widget._height, 33]


describe "Widget.Model", ->

  it "should should return 8 constraints", ->
    w = new Widget()
    # This is two more than LayoutDOM - we moved some constraints out of
    # LayoutDOM specifically onto Widget.
    expect(w.get_constraints().length).to.be.equal 8
