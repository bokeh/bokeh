{expect} = require "chai"
sinon = require "sinon"
utils = require "../../utils"

{Strength, Variable}  = utils.require("core/layout/solver")

{Document} = utils.require("document")
{LayoutDOM} = utils.require("models/layouts/layout_dom")
{LayoutDOMView} = utils.require("models/layouts/layout_dom")

dom_left = 12
dom_top = 13
width = 111
height = 443

describe "LayoutDOMView", ->

  describe "initialize", ->
    afterEach ->
      utils.unstub_solver()

    beforeEach ->
      utils.stub_solver()
      @test_layout = new LayoutDOM()
      @doc = new Document()
      @doc.add_root(@test_layout)

    it "should set a class of 'bk-layout-fixed' is sizing_mode is fixed", ->
      @test_layout.sizing_mode = 'fixed'
      layout_view = new LayoutDOMView({ model: @test_layout })
      expect(layout_view.el.className).to.be.equal 'bk-layout-fixed'

    it "should set a class of 'bk-layout-stretch_both' is sizing_mode is stretch_both", ->
      @test_layout.sizing_mode = 'stretch_both'
      layout_view = new LayoutDOMView({ model: @test_layout })
      expect(layout_view.el.className).to.be.equal 'bk-layout-stretch_both'

    it "should set a class of 'bk-layout-scale_width' if sizing_mode is scale_width", ->
      @test_layout.sizing_mode = 'scale_width'
      layout_view = new LayoutDOMView({ model: @test_layout })
      expect(layout_view.el.className).to.be.equal 'bk-layout-scale_width'

    it "should set a class of 'bk-layout-scale_height' if sizing_mode is scale_height", ->
      @test_layout.sizing_mode = 'scale_height'
      layout_view = new LayoutDOMView({ model: @test_layout })
      expect(layout_view.el.className).to.be.equal 'bk-layout-scale_height'

    it "should set classes from css_classes", ->
      @test_layout.sizing_mode = 'fixed'
      @test_layout.css_classes = ['FOO', 'BAR']
      layout_view = new LayoutDOMView({ model: @test_layout })
      expect(layout_view.el.className).to.be.equal 'bk-layout-fixed FOO BAR'

    it "should set an id matching the model.id", ->
      # This is used by document to find the model and its parents on resize events
      layout_view = new LayoutDOMView({ model: @test_layout })
      expect(layout_view.el.id).to.equal "modelid_#{@test_layout.id}"

    it.skip "should build the child views", ->
      # needs a test
      null

    it.skip "should trigger a resize event", ->
      # needs a test
      null

  describe "render", ->
    afterEach ->
      utils.unstub_solver()

    beforeEach ->
      solver_stubs = utils.stub_solver()
      @solver_suggest = solver_stubs['suggest']
      @layout = new LayoutDOM()
      @doc = new Document()
      @doc.add_root(@layout)
      @layout._dom_left = {_value: dom_left}
      @layout._dom_top = {_value: dom_top}
      @layout._width = {_value: width}
      @layout._height = {_value: height}

    it "should set the appropriate style on the element if sizing_mode is 'stretch_both'", ->
      @layout.sizing_mode = 'stretch_both'
      layout_view = new LayoutDOMView({ model: @layout })
      layout_view.render()
      expected_style = "position: absolute; left: #{dom_left}px; top: #{dom_top}px; width: #{width}px; height: #{height}px;"
      expect(layout_view.el.style.cssText).to.be.equal expected_style

    it "should set the appropriate style on the element if sizing_mode is 'fixed'", ->
      @layout.sizing_mode = 'fixed'
      @layout.width = 88
      @layout.height = 11
      layout_view = new LayoutDOMView({ model: @layout })
      layout_view.render()
      expected_style = "width: 88px; height: 11px;"
      expect(layout_view.el.style.cssText).to.be.equal expected_style

    it "should not call solver suggest_value if the sizing_mode is 'stretch_both'", ->
      @layout.sizing_mode = 'stretch_both'
      layout_view = new LayoutDOMView({ model: @layout })
      layout_view.render()
      expect(@solver_suggest.called).is.false

    it "should call get_height if sizing_mode is 'scale_width'", ->
      @layout.sizing_mode = 'scale_width'
      layout_view = new LayoutDOMView({ model: @layout })
      spy = sinon.spy(layout_view, 'get_height')
      expect(spy.called).is.false
      layout_view.render()
      expect(spy.calledOnce).is.true

    it "should call get_width if sizing_mode is 'scale_height'", ->
      @layout.sizing_mode = 'scale_height'
      layout_view = new LayoutDOMView({ model: @layout })
      spy = sinon.spy(layout_view, 'get_width')
      expect(spy.called).is.false
      layout_view.render()
      expect(spy.calledOnce).is.true

    it "should call suggest value with the model height and width if sizing_mode is fixed", ->
      @layout.sizing_mode = 'fixed'
      @layout.width = 22
      @layout.height = 33
      layout_view = new LayoutDOMView({ model: @layout })
      layout_view.render()
      expect(@solver_suggest.callCount).is.equal 2
      expect(@solver_suggest.args[0]).to.be.deep.equal [@layout._width, 22]
      expect(@solver_suggest.args[1]).to.be.deep.equal [@layout._height, 33]

    it "should only listen to resize event once if sizing_mode is fixed", ->
      @layout.sizing_mode = 'fixed'
      render_spy = sinon.spy(LayoutDOMView.prototype, 'render')
      layout_view = new LayoutDOMView({ model: @layout })
      @doc.solver().trigger('resize')
      @doc.solver().trigger('resize')
      @doc.solver().trigger('resize')
      LayoutDOMView.prototype.render.restore()
      expect(render_spy.callCount).is.equal 1

    it "should keep listening to resize event if sizing_mode is not fixed", ->
      @layout.sizing_mode = 'scale_both'
      render_spy = sinon.spy(LayoutDOMView.prototype, 'render')
      layout_view = new LayoutDOMView({ model: @layout })
      @doc.solver().trigger('resize')
      @doc.solver().trigger('resize')
      @doc.solver().trigger('resize')
      LayoutDOMView.prototype.render.restore()
      expect(render_spy.callCount).is.equal 3

    it "should call suggest value with the value from get_height if sizing_mode is scale_width", ->
      @layout.sizing_mode = 'scale_width'
      layout_view = new LayoutDOMView({ model: @layout })
      sinon.stub(layout_view, 'get_height').returns(89)
      layout_view.render()
      expect(@solver_suggest.callCount).is.equal 1
      expect(@solver_suggest.args[0]).to.be.deep.equal [@layout._height, 89]

    it "should call suggest value with the value from get_width if sizing_mode is scale_height", ->
      @layout.sizing_mode = 'scale_height'
      layout_view = new LayoutDOMView({ model: @layout })
      sinon.stub(layout_view, 'get_width').returns(222)
      layout_view.render()
      expect(@solver_suggest.callCount).is.equal 1
      expect(@solver_suggest.args[0]).to.be.deep.equal [@layout._width, 222]

    it "should set the value of model.width from get_width if mode is fixed and if model.width is null", ->
      @layout.sizing_mode = 'fixed'
      @layout.width = null
      layout_view = new LayoutDOMView({ model: @layout })
      sinon.stub(layout_view, 'get_width').returns(123)
      expect(@layout.width).to.be.null
      layout_view.render()
      expect(@layout.width).to.be.equal 123

    it "should set the value of model.height from get_height if mode is fixed and if model.height is null", ->
      @layout.sizing_mode = 'fixed'
      @layout.height = null
      layout_view = new LayoutDOMView({ model: @layout })
      sinon.stub(layout_view, 'get_height').returns(123)
      expect(@layout.height).to.be.null
      layout_view.render()
      expect(@layout.height).to.be.equal 123

  describe "build_child_views", ->
    afterEach ->
      utils.unstub_solver()

    beforeEach ->
      solver_stubs = utils.stub_solver()
      @layout = new LayoutDOM()
      @doc = new Document()
      @doc.add_root(@layout)

    it "should be called once on initialization", ->
      spy = sinon.spy(LayoutDOMView.prototype, 'build_child_views')
      expect(spy.called).to.be.false
      layout_view = new LayoutDOMView({ model: @layout })
      LayoutDOMView.prototype.build_child_views.restore()
      expect(spy.callCount).is.equal 1

    it.skip "should only init the solver if requested and should invalidate all the models", ->
      # Write this test
      null

  describe "unbind_bokeh_events", ->

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
    expect(l.get_edit_variables).is.a 'function'
    expect(l.get_constrained_variables).is.a 'function'
    expect(l.get_layoutable_children).is.a 'function'

  it "should return all default constrained_variables in stretch_both sizing_mode", ->
    l = new LayoutDOM()
    expected_constrainted_variables = {
      'width': l._width
      'height': l._height
      'origin-x': l._dom_left
      'origin-y': l._dom_top
      # whitespace
      'whitespace-top' : l._whitespace_top
      'whitespace-bottom' : l._whitespace_bottom
      'whitespace-left' : l._whitespace_left
      'whitespace-right' : l._whitespace_right
    }
    l.sizing_mode = 'stretch_both'
    constrained_variables = l.get_constrained_variables()
    expect(constrained_variables).to.be.deep.equal expected_constrainted_variables

  it "should not return height constraints in fixed sizing_mode", ->
    l = new LayoutDOM()
    expected_constrainted_variables = {
      'origin-x': l._dom_left
      'origin-y': l._dom_top
      'whitespace-top' : l._whitespace_top
      'whitespace-bottom' : l._whitespace_bottom
      'whitespace-left' : l._whitespace_left
      'whitespace-right' : l._whitespace_right
    }
    l.sizing_mode = 'fixed'
    constrained_variables = l.get_constrained_variables()
    expect(constrained_variables).to.be.deep.equal expected_constrainted_variables

  it "should not return height constraint in scale_width sizing_modes", ->
    l = new LayoutDOM()
    l.sizing_mode = 'scale_width'
    expected_constrainted_variables = {
      'width': l._width
      'origin-x': l._dom_left
      'origin-y': l._dom_top
      # whitespace
      'whitespace-top' : l._whitespace_top
      'whitespace-bottom' : l._whitespace_bottom
      'whitespace-left' : l._whitespace_left
      'whitespace-right' : l._whitespace_right
    }
    constrained_variables = l.get_constrained_variables()
    expect(constrained_variables).to.be.deep.equal expected_constrainted_variables

  it "should not return width constraint in scale_height sizing_modes", ->
    l = new LayoutDOM()
    l.sizing_mode = 'scale_height'
    expected_constrainted_variables = {
      'height': l._height
      'origin-x': l._dom_left
      'origin-y': l._dom_top
      # whitespace
      'whitespace-top' : l._whitespace_top
      'whitespace-bottom' : l._whitespace_bottom
      'whitespace-left' : l._whitespace_left
      'whitespace-right' : l._whitespace_right
    }
    constrained_variables = l.get_constrained_variables()
    expect(constrained_variables).to.be.deep.equal expected_constrainted_variables

  it "should set edit_variable height if sizing_mode is scale_width", ->
    l = new LayoutDOM()
    l.sizing_mode = 'scale_width'
    ev = l.get_edit_variables()
    expect(ev.length).to.be.equal 1
    expect(ev[0].edit_variable).to.be.equal l._height
    expect(ev[0].strength._strength).to.be.equal Strength.strong._strength

  it "should set edit_variable width if sizing_mode is scale_height", ->
    l = new LayoutDOM()
    l.sizing_mode = 'scale_height'
    ev = l.get_edit_variables()
    expect(ev.length).to.be.equal 1
    expect(ev[0].edit_variable).to.be.equal l._width
    expect(ev[0].strength._strength).to.be.equal Strength.strong._strength

  it "should not set edit_variables if sizing_mode is box", ->
    l = new LayoutDOM()
    l.sizing_mode = 'stretch_both'
    ev = l.get_edit_variables()
    expect(ev.length).to.be.equal 0

  it "should set edit_variable height and width if sizing_mode is fixed", ->
    l = new LayoutDOM()
    l.sizing_mode = 'fixed'
    ev = l.get_edit_variables()
    expect(ev.length).to.be.equal 2
    expect(ev[0].edit_variable).to.be.equal l._height
    expect(ev[0].strength._strength).to.be.equal Strength.strong._strength
    expect(ev[1].edit_variable).to.be.equal l._width
    expect(ev[1].strength._strength).to.be.equal Strength.strong._strength
