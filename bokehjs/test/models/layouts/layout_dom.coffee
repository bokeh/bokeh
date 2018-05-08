{expect} = require "chai"
sinon = require "sinon"

{Strength, Variable}  = require("core/layout/solver")

{Document} = require("document")
{LayoutDOM} = require("models/layouts/layout_dom")
{LayoutDOMView} = require("models/layouts/layout_dom")

dom_left = 12
dom_top = 13
width = 111
height = 443

describe "LayoutDOMView", ->

  describe "initialize", ->
    beforeEach ->
      @test_layout = new LayoutDOM()
      @doc = new Document()
      @doc.add_root(@test_layout)

    ###
    it "should set a class of 'bk-layout-fixed' is sizing_mode is fixed", ->
      @test_layout.sizing_mode = 'fixed'
      layout_view = new LayoutDOMView({model: @test_layout, parent: null})
      layout_view.layout()
      expect(layout_view.el.className).to.be.equal 'bk-layout-fixed'

    it "should set a class of 'bk-layout-stretch_both' is sizing_mode is stretch_both", ->
      @test_layout.sizing_mode = 'stretch_both'
      layout_view = new LayoutDOMView({model: @test_layout, parent: null})
      layout_view.layout()
      expect(layout_view.el.className).to.be.equal 'bk-layout-stretch_both'

    it "should set a class of 'bk-layout-scale_width' if sizing_mode is scale_width", ->
      @test_layout.sizing_mode = 'scale_width'
      layout_view = new LayoutDOMView({model: @test_layout, parent: null})
      layout_view.layout()
      expect(layout_view.el.className).to.be.equal 'bk-layout-scale_width'

    it "should set a class of 'bk-layout-scale_height' if sizing_mode is scale_height", ->
      @test_layout.sizing_mode = 'scale_height'
      layout_view = new LayoutDOMView({model: @test_layout, parent: null})
      layout_view.layout()
      expect(layout_view.el.className).to.be.equal 'bk-layout-scale_height'

    it "should set classes from css_classes", ->
      @test_layout.sizing_mode = 'fixed'
      @test_layout.css_classes = ['FOO', 'BAR']
      layout_view = new LayoutDOMView({model: @test_layout, parent: null})
      layout_view.layout()
      expect(layout_view.el.className).to.be.equal 'bk-layout-fixed FOO BAR'
    ###

    it.skip "should build the child views", ->
      # needs a test
      null

    it.skip "should trigger a resize event", ->
      # needs a test
      null

  describe "render", ->

    make_layout = (attrs) ->
      layout = new LayoutDOM(attrs)
      doc = new Document()
      doc.add_root(layout)
      return layout

    it "should set the appropriate style on the element if sizing_mode is 'fixed'", ->
      layout = make_layout({sizing_mode: 'fixed', width: 88, height: 11})
      layout_view = new LayoutDOMView({ model: layout, parent: null })
      layout_view.layout()
      expected_style = "position: relative; width: 88px; height: 11px;"
      expect(layout_view.el.style.cssText).to.be.equal expected_style

    it "should not call solver suggest_value if the sizing_mode is 'stretch_both'", ->
      layout = make_layout({sizing_mode: 'stretch_both'})
      layout_view = new LayoutDOMView({ model: layout, parent: null })
      suggest_value = sinon.spy(layout_view.solver, 'suggest_value')
      layout_view.layout()
      expect(suggest_value.called).is.false

    ###
    it "should call get_height if sizing_mode is 'scale_width'", ->
      layout = make_layout({sizing_mode: 'scale_width'})
      layout_view = new LayoutDOMView({ model: layout, parent: null })
      spy = sinon.spy(layout_view, 'get_height')
      expect(spy.called).is.false
      layout_view.layout()
      expect(spy.callCount).is.equal(3)

    it "should call get_width if sizing_mode is 'scale_height'", ->
      layout = make_layout({sizing_mode: 'scale_height'})
      layout_view = new LayoutDOMView({ model: layout, parent: null })
      spy = sinon.spy(layout_view, 'get_width')
      expect(spy.called).is.false
      layout_view.layout()
      expect(spy.callCount).is.equal(3)

    it "should call suggest value with the model height and width if sizing_mode is fixed", ->
      layout = make_layout({sizing_mode: 'fixed', width: 22, height: 33})
      layout_view = new LayoutDOMView({ model: layout, parent: null })
      suggest_value = sinon.spy(layout_view.solver, 'suggest_value')
      layout_view.layout()
      expect(suggest_value.callCount).is.equal(6)
      expect(suggest_value.args[0]).to.be.deep.equal [layout._width, 22]
      expect(suggest_value.args[1]).to.be.deep.equal [layout._height, 33]

    it "should call suggest value with the value from get_height if sizing_mode is scale_width", ->
      layout = make_layout({sizing_mode: 'scale_width'})
      layout_view = new LayoutDOMView({ model: layout, parent: null })
      suggest_value = sinon.spy(layout_view.solver, 'suggest_value')
      sinon.stub(layout_view, 'get_height').returns(89)
      layout_view.layout()
      expect(suggest_value.callCount).is.equal(3)
      expect(suggest_value.args[0]).to.be.deep.equal [layout._height, 89]

    it "should call suggest value with the value from get_width if sizing_mode is scale_height", ->
      layout = make_layout({sizing_mode: 'scale_height'})
      layout_view = new LayoutDOMView({ model: layout, parent: null })
      suggest_value = sinon.spy(layout_view.solver, 'suggest_value')
      sinon.stub(layout_view, 'get_width').returns(222)
      layout_view.layout()
      expect(suggest_value.callCount).is.equal(3)
      expect(suggest_value.args[0]).to.be.deep.equal [layout._width, 222]

    it "should set the value of model.width from get_width if mode is fixed and if model.width is null", ->
      layout = make_layout({sizing_mode: 'fixed', width: null})
      layout_view = new LayoutDOMView({ model: layout, parent: null })
      sinon.stub(layout_view, 'get_width').returns(123)
      expect(layout.width).to.be.null
      layout_view.layout()
      expect(layout.width).to.be.equal 123

    it "should set the value of model.height from get_height if mode is fixed and if model.height is null", ->
      layout = make_layout({sizing_mode: 'fixed', height: null})
      layout_view = new LayoutDOMView({ model: layout, parent: null })
      sinon.stub(layout_view, 'get_height').returns(123)
      expect(layout.height).to.be.null
      layout_view.layout()
      expect(layout.height).to.be.equal 123
    ###

  describe "build_child_views", ->

    make_layout = (attrs) ->
      layout = new LayoutDOM(attrs)
      doc = new Document()
      doc.add_root(layout)
      return layout

    it "should be called once on initialization", ->
      layout = make_layout({})
      spy = sinon.spy(LayoutDOMView.prototype, 'build_child_views')
      expect(spy.called).to.be.false
      layout_view = new LayoutDOMView({ model: layout, parent: null })
      LayoutDOMView.prototype.build_child_views.restore()
      expect(spy.callCount).is.equal 1

    it.skip "should only init the solver if requested and should invalidate all the models", ->
      # Write this test
      null

  describe "disconnect_signals", ->

    it.skip "should have tests", ->
      # Check that listening actually stops on model and its descendents
      null


describe "LayoutDOM", ->

  it "should have default sizing_mode of fixed", ->
    l = new LayoutDOM()
    expect(l.sizing_mode).to.be.equal 'fixed'


  it "should have default variables", ->
    l = new LayoutDOM()
    expect(l._top).to.be.an.instanceOf(Variable)
    expect(l._bottom).to.be.an.instanceOf(Variable)
    expect(l._left).to.be.an.instanceOf(Variable)
    expect(l._right).to.be.an.instanceOf(Variable)
    expect(l._width).to.be.an.instanceOf(Variable)
    expect(l._height).to.be.an.instanceOf(Variable)
    expect(l._dom_top).to.be.an.instanceOf(Variable)
    expect(l._dom_left).to.be.an.instanceOf(Variable)
    expect(l._whitespace_left).to.be.an.instanceOf(Variable)
    expect(l._whitespace_right).to.be.an.instanceOf(Variable)
    expect(l._whitespace_top).to.be.an.instanceOf(Variable)
    expect(l._whitespace_bottom).to.be.an.instanceOf(Variable)

  it "should return 8 constraints", ->
    l = new LayoutDOM()
    expect(l.get_constraints().length).to.be.equal 8

  it "should have have layoutable methods", ->
    l = new LayoutDOM()
    expect(l.get_constraints).is.a 'function'
    expect(l.get_editables).is.a 'function'
    expect(l.get_constrained_variables).is.a 'function'
    expect(l.get_layoutable_children).is.a 'function'

  it "should return all default constrained_variables in stretch_both sizing_mode", ->
    l = new LayoutDOM()
    expected_constrainted_variables = {
      width: l._width
      height: l._height
      origin_x: l._dom_left
      origin_y: l._dom_top
      # whitespace
      whitespace_top : l._whitespace_top
      whitespace_bottom : l._whitespace_bottom
      whitespace_left : l._whitespace_left
      whitespace_right : l._whitespace_right
    }
    l.sizing_mode = 'stretch_both'
    constrained_variables = l.get_constrained_variables()
    expect(constrained_variables).to.be.deep.equal expected_constrainted_variables

  it "should not return height constraints in fixed sizing_mode", ->
    l = new LayoutDOM()
    expected_constrainted_variables = {
      origin_x: l._dom_left
      origin_y: l._dom_top
      whitespace_top : l._whitespace_top
      whitespace_bottom : l._whitespace_bottom
      whitespace_left : l._whitespace_left
      whitespace_right : l._whitespace_right
    }
    l.sizing_mode = 'fixed'
    constrained_variables = l.get_constrained_variables()
    expect(constrained_variables).to.be.deep.equal expected_constrainted_variables

  it "should not return height constraint in scale_width sizing_modes", ->
    l = new LayoutDOM()
    l.sizing_mode = 'scale_width'
    expected_constrainted_variables = {
      width: l._width
      origin_x: l._dom_left
      origin_y: l._dom_top
      # whitespace
      whitespace_top : l._whitespace_top
      whitespace_bottom : l._whitespace_bottom
      whitespace_left : l._whitespace_left
      whitespace_right : l._whitespace_right
    }
    constrained_variables = l.get_constrained_variables()
    expect(constrained_variables).to.be.deep.equal expected_constrainted_variables

  it "should not return width constraint in scale_height sizing_modes", ->
    l = new LayoutDOM()
    l.sizing_mode = 'scale_height'
    expected_constrainted_variables = {
      height: l._height
      origin_x: l._dom_left
      origin_y: l._dom_top
      # whitespace
      whitespace_top : l._whitespace_top
      whitespace_bottom : l._whitespace_bottom
      whitespace_left : l._whitespace_left
      whitespace_right : l._whitespace_right
    }
    constrained_variables = l.get_constrained_variables()
    expect(constrained_variables).to.be.deep.equal expected_constrainted_variables

  it "should set edit_variable height if sizing_mode is scale_width", ->
    l = new LayoutDOM()
    l.sizing_mode = 'scale_width'
    ev = l.get_editables()
    expect(ev.length).to.be.equal 1
    expect(ev[0]).to.be.equal l._height

  it "should set edit_variable width if sizing_mode is scale_height", ->
    l = new LayoutDOM()
    l.sizing_mode = 'scale_height'
    ev = l.get_editables()
    expect(ev.length).to.be.equal 1
    expect(ev[0]).to.be.equal l._width

  it "should not set edit_variables if sizing_mode is box", ->
    l = new LayoutDOM()
    l.sizing_mode = 'stretch_both'
    ev = l.get_editables()
    expect(ev.length).to.be.equal 0

  it "should set edit_variable height and width if sizing_mode is fixed", ->
    l = new LayoutDOM()
    l.sizing_mode = 'fixed'
    ev = l.get_editables()
    expect(ev.length).to.be.equal 2
    expect(ev[0]).to.be.equal l._height
    expect(ev[1]).to.be.equal l._width
